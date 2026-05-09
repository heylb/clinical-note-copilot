import type { PHISpan, PHIType } from "../schemas";

/**
 * Regex pre-pass for PII redaction.
 *
 * Cheap and high-precision for structured patterns (phone, email, MRN, DOB).
 * Deliberately conservative — false positives here are corrected by the LLM
 * verification pass; false negatives on names/addresses are caught by the LLM.
 */

interface Pattern {
  type: PHIType;
  re: RegExp;
}

const PATTERNS: Pattern[] = [
  {
    type: "email",
    re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  },
  {
    type: "phone",
    // (123) 456-7890 | 123-456-7890 | 123.456.7890 | +1 123 456 7890
    re: /(?:\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  },
  {
    type: "mrn",
    // "MRN 12345" or "MRN: 000-12-3456" or "Chart # 4421"
    re: /\b(?:MRN|mrn|Medical Record(?:\s*Number)?|Chart\s*#?)\s*[:#]?\s*[\w-]{3,}/g,
  },
  {
    type: "dob",
    // "DOB 01/01/1980" / "DOB: 1/1/19XX" / "born 1962"
    re: /\b(?:DOB|D\.O\.B\.|Date of Birth|dob|born)\s*[:]?\s*(?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|(?:\d{2}\/\d{2}\/\d{2,4})|\d{4}|(?:\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2}X{2}))/gi,
  },
];

/**
 * Apply spans to text by replacing each PHI substring with `[REDACTED:type]`.
 * Lives here (not in hybridRedact.ts) so the MCP server can use it without
 * pulling the web-app Anthropic streaming code into its build.
 */
export function applyRedaction(text: string, spans: PHISpan[]): string {
  if (spans.length === 0) return text;
  const sorted = [...spans].sort((a, b) => a.span.start - b.span.start);
  let out = "";
  let cursor = 0;
  for (const s of sorted) {
    if (s.span.start < cursor) continue;
    out += text.slice(cursor, s.span.start);
    out += `[REDACTED:${s.type}]`;
    cursor = s.span.end;
  }
  out += text.slice(cursor);
  return out;
}

export function regexRedact(text: string): PHISpan[] {
  const spans: PHISpan[] = [];
  for (const { type, re } of PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      spans.push({
        type,
        span: { start: m.index, end: m.index + m[0].length, text: m[0] },
      });
    }
  }
  // Dedupe overlapping spans, keep the longest.
  spans.sort((a, b) => a.span.start - b.span.start || b.span.end - a.span.end);
  const out: PHISpan[] = [];
  for (const s of spans) {
    const last = out[out.length - 1];
    if (last && s.span.start < last.span.end) {
      if (s.span.end - s.span.start > last.span.end - last.span.start) out[out.length - 1] = s;
      continue;
    }
    out.push(s);
  }
  return out;
}
