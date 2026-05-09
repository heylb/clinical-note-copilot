import Anthropic from "@anthropic-ai/sdk";
import {
  EXTRACT_SOAP_SYSTEM,
  EXTRACT_SOAP_TOOL_NAME,
  EXTRACT_SOAP_TOOL_DESCRIPTION,
} from "../../lib/prompts/extractSOAP.js";
import {
  SUGGEST_ICD_SYSTEM,
  SUGGEST_ICD_TOOL_NAME,
  SUGGEST_ICD_TOOL_DESCRIPTION,
} from "../../lib/prompts/suggestICD.js";
import {
  REDACT_PHI_SYSTEM,
  REDACT_PHI_TOOL_NAME,
  REDACT_PHI_TOOL_DESCRIPTION,
} from "../../lib/prompts/redactPHI.js";
import {
  SOAPNote,
  SOAPNoteJsonSchema,
  ICDSuggestionsJsonSchema,
  PHISpansJsonSchema,
  ExtractionResult,
  UncertaintyFlag,
  ICDSuggestion,
  PHISpan,
} from "../../lib/schemas.js";
import { regexRedact, applyRedaction } from "../../lib/pii/regex.js";

/**
 * Server-side Anthropic calls used by the MCP tools. Same prompt + schema
 * contracts as the web app — single source of truth.
 *
 * Cost discipline (mirrored from the web app):
 *   - Sonnet for extraction + ICD; Haiku for PHI verification.
 *   - max_tokens: 2048 / 1024 / 1024.
 *   - System prompt cache_control on every call.
 */
const SONNET = "claude-sonnet-4-6";
const HAIKU = "claude-haiku-4-5-20251001";

function client() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY required");
  return new Anthropic({ apiKey: key });
}

export async function extractSoapNote(text: string): Promise<SOAPNote> {
  const c = client();
  const res = await c.messages.create({
    model: SONNET,
    max_tokens: 2048,
    system: [
      { type: "text", text: EXTRACT_SOAP_SYSTEM, cache_control: { type: "ephemeral" } },
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
        content: `Extract a SOAP note from the following clinical text. Use character offsets relative to the start of this text.\n\n---\n${text}`,
      },
    ],
  });
  const tool = res.content.find((c) => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("No tool_use in extract response");
  return SOAPNote.parse(tool.input);
}

export async function suggestIcdCodes(soap: SOAPNote): Promise<ICDSuggestion[]> {
  const c = client();
  const res = await c.messages.create({
    model: SONNET,
    max_tokens: 1024,
    system: [
      { type: "text", text: SUGGEST_ICD_SYSTEM, cache_control: { type: "ephemeral" } },
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
      { role: "user", content: `Suggest ICD-10 codes for this SOAP note:\n\n${JSON.stringify(soap, null, 2)}` },
    ],
  });
  const tool = res.content.find((c) => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("No tool_use in ICD response");
  const input = tool.input as { codes: ICDSuggestion[] };
  return input.codes ?? [];
}

export async function redactPhi(text: string): Promise<{ redactedText: string; spans: PHISpan[] }> {
  const candidates = regexRedact(text);
  const c = client();
  const res = await c.messages.create({
    model: HAIKU,
    max_tokens: 1024,
    system: [
      { type: "text", text: REDACT_PHI_SYSTEM, cache_control: { type: "ephemeral" } },
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
  if (!tool || tool.type !== "tool_use") throw new Error("No tool_use in PHI response");
  const input = tool.input as { spans: PHISpan[] };
  const spans = input.spans ?? [];
  return { redactedText: applyRedaction(text, spans), spans };
}

export async function extractFull(text: string): Promise<ExtractionResult> {
  const soap = await extractSoapNote(text);
  const codes = await suggestIcdCodes(soap);
  const { spans } = await redactPhi(text);
  const flags: UncertaintyFlag[] = [];
  for (const [name, sec] of Object.entries(soap)) {
    if (sec.confidence === "low") {
      flags.push({
        field: name,
        reason: sec.reasoning,
        severity: sec.content.length === 0 ? "high" : "medium",
        suggestedAction:
          sec.content.length === 0
            ? "No source content found. Verify with the original record."
            : "Section is sparse or ambiguous. Review against source.",
      });
    }
  }
  return { soap, icdCodes: codes, flags, redactedSpans: spans };
}
