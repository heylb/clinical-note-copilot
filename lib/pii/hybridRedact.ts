import Anthropic from "@anthropic-ai/sdk";
import type { PHISpan } from "../schemas";
import { regexRedact } from "./regex";
import { detectPHISpans } from "../claude";

export { applyRedaction } from "./regex";

/**
 * Hybrid PII redaction: regex first, LLM verifies + extends.
 *
 * Why both:
 *   - Regex is precise and free for structured patterns (phone/email/MRN/DOB).
 *   - LLM is needed for names and addresses, where regex has terrible recall
 *     and worse precision. The LLM sees the regex hits as candidates and
 *     either keeps, drops, or fixes their offsets, then adds anything else.
 *
 * If no API client is provided we return regex-only results — used by the
 * MCP server's regex-only mode and by the static fixture path.
 */
export async function hybridRedact(
  text: string,
  client?: Anthropic
): Promise<{ spans: PHISpan[]; usedLLM: boolean }> {
  const candidates = regexRedact(text);
  if (!client) return { spans: candidates, usedLLM: false };

  try {
    const { spans } = await detectPHISpans(client, text, candidates);
    return { spans, usedLLM: true };
  } catch {
    // Fail open — better to return regex-only than nothing on a redaction call.
    return { spans: candidates, usedLLM: false };
  }
}

