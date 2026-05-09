import { z } from "zod";

export const SourceSpan = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  text: z.string(),
});
export type SourceSpan = z.infer<typeof SourceSpan>;

export const ConfidenceLevel = z.enum(["high", "medium", "low"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevel>;

export const SOAPSection = z.object({
  content: z.string(),
  confidence: ConfidenceLevel,
  sourceSpans: z.array(SourceSpan),
  reasoning: z.string().describe("Why this content was extracted from the source"),
});
export type SOAPSection = z.infer<typeof SOAPSection>;

export const SOAPNote = z.object({
  subjective: SOAPSection,
  objective: SOAPSection,
  assessment: SOAPSection,
  plan: SOAPSection,
});
export type SOAPNote = z.infer<typeof SOAPNote>;

export const ICDSuggestion = z.object({
  code: z.string(),
  description: z.string(),
  confidence: ConfidenceLevel,
  evidence: SourceSpan,
  reasoning: z.string(),
});
export type ICDSuggestion = z.infer<typeof ICDSuggestion>;

export const UncertaintyFlag = z.object({
  field: z.string(),
  reason: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  suggestedAction: z.string(),
});
export type UncertaintyFlag = z.infer<typeof UncertaintyFlag>;

export const PHIType = z.enum(["name", "dob", "mrn", "phone", "address", "email", "other"]);
export type PHIType = z.infer<typeof PHIType>;

export const PHISpan = z.object({
  type: PHIType,
  span: SourceSpan,
});
export type PHISpan = z.infer<typeof PHISpan>;

export const ExtractionResult = z.object({
  soap: SOAPNote,
  icdCodes: z.array(ICDSuggestion),
  flags: z.array(UncertaintyFlag),
  redactedSpans: z.array(PHISpan),
});
export type ExtractionResult = z.infer<typeof ExtractionResult>;

/**
 * The schemas above are mirrored as JSON Schema for Anthropic's tool-use
 * structured-output mode. Tool-use forces the model to emit JSON that matches
 * the schema, which is far more reliable than parsing free-text JSON.
 */
export const SOAPNoteJsonSchema = {
  type: "object",
  required: ["subjective", "objective", "assessment", "plan"],
  properties: {
    subjective: soapSectionJson(),
    objective: soapSectionJson(),
    assessment: soapSectionJson(),
    plan: soapSectionJson(),
  },
} as const;

export const ICDSuggestionsJsonSchema = {
  type: "object",
  required: ["codes"],
  properties: {
    codes: {
      type: "array",
      items: {
        type: "object",
        required: ["code", "description", "confidence", "evidence", "reasoning"],
        properties: {
          code: { type: "string", description: "ICD-10 code, e.g. J45.909" },
          description: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          evidence: sourceSpanJson(),
          reasoning: { type: "string" },
        },
      },
    },
  },
} as const;

export const PHISpansJsonSchema = {
  type: "object",
  required: ["spans"],
  properties: {
    spans: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "span"],
        properties: {
          type: {
            type: "string",
            enum: ["name", "dob", "mrn", "phone", "address", "email", "other"],
          },
          span: sourceSpanJson(),
        },
      },
    },
  },
} as const;

function soapSectionJson() {
  return {
    type: "object",
    required: ["content", "confidence", "sourceSpans", "reasoning"],
    properties: {
      content: { type: "string" },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      sourceSpans: { type: "array", items: sourceSpanJson() },
      reasoning: { type: "string" },
    },
  };
}

function sourceSpanJson() {
  return {
    type: "object",
    required: ["start", "end", "text"],
    properties: {
      start: { type: "integer", minimum: 0 },
      end: { type: "integer", minimum: 0 },
      text: { type: "string" },
    },
  };
}
