import type { ExtractionResult, SOAPNote, ConfidenceLevel } from "../schemas";

export interface GoldenExpectation {
  soapKeywords: Record<keyof SOAPNote, string[]>;
  icd: { expected: string[]; acceptable: string[] };
  phi: { expectedTypes: string[]; minSpans: number };
  expectsEmpty?: boolean;
}

export interface NoteResult {
  id: string;
  label: string;
  sectionOverlap: Record<keyof SOAPNote, number>;
  icdPrecision: number;
  icdRecall: number;
  phiTypeRecall: number;
  phiSpanCount: number;
  calibration: { confidence: ConfidenceLevel; correct: boolean }[];
}

/**
 * Section overlap: fraction of expected keywords that appear (case-insensitive,
 * substring) in the section's content. Crude but cheap and explainable.
 */
export function sectionOverlap(content: string, keywords: string[]): number {
  if (keywords.length === 0) return content.trim().length === 0 ? 1 : 0.5;
  const text = content.toLowerCase();
  const hits = keywords.filter((k) => text.includes(k.toLowerCase())).length;
  return hits / keywords.length;
}

/**
 * ICD precision/recall against an "acceptable" set. We treat root-3 prefix
 * matches (e.g. "J45") as fuzzy matches to handle the unspecified-vs-specific
 * variation that's normal in clinical coding.
 */
export function icdPrecisionRecall(
  predicted: string[],
  expected: string[],
  acceptable: string[]
): { precision: number; recall: number } {
  if (expected.length === 0 && predicted.length === 0) return { precision: 1, recall: 1 };
  if (predicted.length === 0) return { precision: 1, recall: 0 };

  const accept = new Set(acceptable);
  const expectedRoots = new Set(expected.map((c) => c.split(".")[0]));

  const tp = predicted.filter(
    (p) => accept.has(p) || expectedRoots.has(p.split(".")[0])
  ).length;
  const precision = tp / predicted.length;
  const expectedHit = [...expectedRoots].filter((root) =>
    predicted.some((p) => p.split(".")[0] === root)
  ).length;
  const recall = expectedRoots.size === 0 ? 1 : expectedHit / expectedRoots.size;
  return { precision, recall };
}

export function phiTypeRecall(
  detectedTypes: string[],
  expectedTypes: string[]
): number {
  if (expectedTypes.length === 0) return 1;
  const detected = new Set(detectedTypes);
  const hits = expectedTypes.filter((t) => detected.has(t)).length;
  return hits / expectedTypes.length;
}

/**
 * Confidence calibration: did "high" confidence sections actually match well?
 * We define "correct" as >= 0.5 keyword overlap; this is rough but illustrative.
 */
export function calibrationPoint(
  confidence: ConfidenceLevel,
  overlap: number
): { confidence: ConfidenceLevel; correct: boolean } {
  return { confidence, correct: overlap >= 0.5 };
}

export function evaluateNote(
  id: string,
  label: string,
  result: ExtractionResult,
  expected: GoldenExpectation
): NoteResult {
  const overlap = {} as Record<keyof SOAPNote, number>;
  const calibration: { confidence: ConfidenceLevel; correct: boolean }[] = [];
  for (const k of ["subjective", "objective", "assessment", "plan"] as (keyof SOAPNote)[]) {
    const o = sectionOverlap(result.soap[k].content, expected.soapKeywords[k] ?? []);
    overlap[k] = o;
    calibration.push(calibrationPoint(result.soap[k].confidence, o));
  }
  const { precision: icdPrecision, recall: icdRecall } = icdPrecisionRecall(
    result.icdCodes.map((c) => c.code),
    expected.icd.expected,
    expected.icd.acceptable
  );
  const phiR = phiTypeRecall(
    result.redactedSpans.map((s) => s.type),
    expected.phi.expectedTypes
  );
  return {
    id,
    label,
    sectionOverlap: overlap,
    icdPrecision,
    icdRecall,
    phiTypeRecall: phiR,
    phiSpanCount: result.redactedSpans.length,
    calibration,
  };
}

export interface EvalReport {
  notes: NoteResult[];
  aggregate: {
    avgSectionOverlap: Record<keyof SOAPNote, number>;
    avgIcdPrecision: number;
    avgIcdRecall: number;
    avgPhiRecall: number;
    calibrationByConfidence: Record<ConfidenceLevel, { n: number; correctRate: number }>;
  };
}

export function aggregate(notes: NoteResult[]): EvalReport["aggregate"] {
  const keys: (keyof SOAPNote)[] = ["subjective", "objective", "assessment", "plan"];
  const avgSectionOverlap = keys.reduce(
    (acc, k) => {
      acc[k] = mean(notes.map((n) => n.sectionOverlap[k]));
      return acc;
    },
    {} as Record<keyof SOAPNote, number>
  );
  const calibration: Record<ConfidenceLevel, { n: number; correctRate: number }> = {
    high: { n: 0, correctRate: 0 },
    medium: { n: 0, correctRate: 0 },
    low: { n: 0, correctRate: 0 },
  };
  const totals: Record<ConfidenceLevel, { n: number; correct: number }> = {
    high: { n: 0, correct: 0 },
    medium: { n: 0, correct: 0 },
    low: { n: 0, correct: 0 },
  };
  for (const n of notes) {
    for (const c of n.calibration) {
      totals[c.confidence].n += 1;
      if (c.correct) totals[c.confidence].correct += 1;
    }
  }
  for (const k of ["high", "medium", "low"] as ConfidenceLevel[]) {
    calibration[k] = {
      n: totals[k].n,
      correctRate: totals[k].n === 0 ? 0 : totals[k].correct / totals[k].n,
    };
  }
  return {
    avgSectionOverlap,
    avgIcdPrecision: mean(notes.map((n) => n.icdPrecision)),
    avgIcdRecall: mean(notes.map((n) => n.icdRecall)),
    avgPhiRecall: mean(notes.map((n) => n.phiTypeRecall)),
    calibrationByConfidence: calibration,
  };
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}
