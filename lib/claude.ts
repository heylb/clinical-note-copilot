import Anthropic from "@anthropic-ai/sdk";
import {
  EXTRACT_SOAP_SYSTEM,
  EXTRACT_SOAP_TOOL_NAME,
  EXTRACT_SOAP_TOOL_DESCRIPTION,
} from "./prompts/extractSOAP";
import {
  SUGGEST_ICD_SYSTEM,
  SUGGEST_ICD_TOOL_NAME,
  SUGGEST_ICD_TOOL_DESCRIPTION,
} from "./prompts/suggestICD";
import {
  REDACT_PHI_SYSTEM,
  REDACT_PHI_TOOL_NAME,
  REDACT_PHI_TOOL_DESCRIPTION,
} from "./prompts/redactPHI";
import {
  SOAPNoteJsonSchema,
  ICDSuggestionsJsonSchema,
  PHISpansJsonSchema,
  SOAPNote,
  ICDSuggestion,
  PHISpan,
} from "./schemas";

/**
 * Model rules (from cost discipline):
 *   - Sonnet only for extraction + ICD. Never Opus.
 *   - Haiku acceptable for PHI verification (small schema, cheap pass).
 *   - max_tokens hard caps from the spec.
 *   - Prompt caching on the system prompt.
 */
export const SONNET_MODEL = "claude-sonnet-4-6";
export const HAIKU_MODEL = "claude-haiku-4-5-20251001";

export const EXTRACT_MAX_TOKENS = 2048;
export const ICD_MAX_TOKENS = 1024;
export const PHI_MAX_TOKENS = 1024;

export function makeClient(apiKey: string) {
  if (!apiKey || !apiKey.startsWith("sk-")) {
    throw new Error("Anthropic API key required (must start with 'sk-').");
  }
  return new Anthropic({ apiKey });
}

function logUsage(label: string, model: string, usage: Anthropic.Usage | null | undefined) {
  if (!usage) return;
  // [CLAUDE-BILL] prefix per cost discipline rule.
  console.log(
    `[CLAUDE-BILL] ${label} model=${model} input=${usage.input_tokens} output=${usage.output_tokens} cache_create=${
      usage.cache_creation_input_tokens ?? 0
    } cache_read=${usage.cache_read_input_tokens ?? 0}`
  );
}

/**
 * Approximate USD cost using Sonnet 4.6 / Haiku 4.5 list prices.
 * Used by the in-app cost badge — round numbers for display only.
 */
export function estimateCostUsd(
  model: string,
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
  }
): number {
  const isSonnet = model.includes("sonnet");
  const inputRate = isSonnet ? 3 / 1_000_000 : 1 / 1_000_000;
  const outputRate = isSonnet ? 15 / 1_000_000 : 5 / 1_000_000;
  const cacheReadRate = inputRate * 0.1;
  const cacheWriteRate = inputRate * 1.25;
  return (
    usage.input_tokens * inputRate +
    usage.output_tokens * outputRate +
    (usage.cache_read_input_tokens ?? 0) * cacheReadRate +
    (usage.cache_creation_input_tokens ?? 0) * cacheWriteRate
  );
}

export type StreamEvent =
  | { type: "section_start"; section: keyof SOAPNote }
  | { type: "section_delta"; section: keyof SOAPNote; partial: string }
  | { type: "section_complete"; section: keyof SOAPNote }
  | { type: "soap_done"; soap: SOAPNote }
  | { type: "icd_done"; codes: ICDSuggestion[] }
  | { type: "phi_done"; spans: PHISpan[] }
  | { type: "usage"; label: string; model: string; usage: Anthropic.Usage; costUsd: number }
  | { type: "error"; message: string }
  | { type: "done" };

/**
 * Stream a SOAP extraction. We use tool-use forcing for structured output.
 * Streaming gives partial JSON deltas; we surface section-level events to
 * the UI so each section can fade in as it arrives. Final SOAPNote is
 * yielded as soap_done once tool_use input_json finalizes.
 */
export async function* streamExtractSOAP(
  client: Anthropic,
  noteText: string
): AsyncGenerator<StreamEvent> {
  const stream = client.messages.stream({
    model: SONNET_MODEL,
    max_tokens: EXTRACT_MAX_TOKENS,
    system: [
      {
        type: "text",
        text: EXTRACT_SOAP_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: EXTRACT_SOAP_TOOL_NAME,
        description: EXTRACT_SOAP_TOOL_DESCRIPTION,
        input_schema: SOAPNoteJsonSchema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: EXTRACT_SOAP_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `Extract a SOAP note from the following clinical text. Use character offsets relative to the start of this text (the first character after this line is offset 0).\n\n---\n${noteText}`,
      },
    ],
  });

  let lastSection: keyof SOAPNote | null = null;
  let partialJson = "";

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "input_json_delta") {
      partialJson += event.delta.partial_json;
      const section = sniffCurrentSection(partialJson);
      if (section && section !== lastSection) {
        if (lastSection) yield { type: "section_complete", section: lastSection };
        yield { type: "section_start", section };
        lastSection = section;
      }
      if (section) {
        yield { type: "section_delta", section, partial: partialJson };
      }
    }
  }

  const final = await stream.finalMessage();
  if (lastSection) yield { type: "section_complete", section: lastSection };

  const tool = final.content.find((c) => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") {
    yield { type: "error", message: "No tool_use block in response." };
    return;
  }
  const parsed = SOAPNote.safeParse(tool.input);
  if (!parsed.success) {
    yield { type: "error", message: `Schema validation failed: ${parsed.error.message}` };
    return;
  }
  yield { type: "soap_done", soap: parsed.data };

  if (final.usage) {
    logUsage("extract_soap", SONNET_MODEL, final.usage);
    yield {
      type: "usage",
      label: "extract_soap",
      model: SONNET_MODEL,
      usage: final.usage,
      costUsd: estimateCostUsd(SONNET_MODEL, final.usage),
    };
  }
  yield { type: "done" };
}

/**
 * Sniff which SOAP section is currently being streamed by looking at the
 * trailing portion of the partial JSON. Cheap heuristic — fine because it's
 * just used to drive the UI fade-in animation.
 */
function sniffCurrentSection(partial: string): keyof SOAPNote | null {
  const order: (keyof SOAPNote)[] = ["subjective", "objective", "assessment", "plan"];
  let last: keyof SOAPNote | null = null;
  for (const k of order) {
    const idx = partial.lastIndexOf(`"${k}"`);
    if (idx >= 0) last = k;
  }
  return last;
}

export async function suggestICDCodes(
  client: Anthropic,
  soap: SOAPNote
): Promise<{ codes: ICDSuggestion[]; usage: Anthropic.Usage }> {
  const res = await client.messages.create({
    model: SONNET_MODEL,
    max_tokens: ICD_MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SUGGEST_ICD_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: SUGGEST_ICD_TOOL_NAME,
        description: SUGGEST_ICD_TOOL_DESCRIPTION,
        input_schema: ICDSuggestionsJsonSchema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: SUGGEST_ICD_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `Suggest ICD-10 codes for this SOAP note:\n\n${JSON.stringify(soap, null, 2)}`,
      },
    ],
  });

  const tool = res.content.find((c) => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("No tool_use block in ICD response.");
  const input = tool.input as { codes: unknown };
  const codes = (input.codes as ICDSuggestion[]) ?? [];
  logUsage("suggest_icd", SONNET_MODEL, res.usage);
  return { codes, usage: res.usage };
}

export async function detectPHISpans(
  client: Anthropic,
  text: string,
  candidates: PHISpan[]
): Promise<{ spans: PHISpan[]; usage: Anthropic.Usage }> {
  const res = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: PHI_MAX_TOKENS,
    system: [
      {
        type: "text",
        text: REDACT_PHI_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [
      {
        name: REDACT_PHI_TOOL_NAME,
        description: REDACT_PHI_TOOL_DESCRIPTION,
        input_schema: PHISpansJsonSchema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: REDACT_PHI_TOOL_NAME },
    messages: [
      {
        role: "user",
        content: `Source text:\n---\n${text}\n---\n\nRegex candidates (verify and extend):\n${JSON.stringify(
          candidates,
          null,
          2
        )}`,
      },
    ],
  });

  const tool = res.content.find((c) => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("No tool_use block in PHI response.");
  const input = tool.input as { spans: PHISpan[] };
  logUsage("detect_phi", HAIKU_MODEL, res.usage);
  return { spans: input.spans ?? [], usage: res.usage };
}
