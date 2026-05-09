import Anthropic from "@anthropic-ai/sdk";
import { streamExtractSOAP, suggestICDCodes } from "../claude";
import { hybridRedact } from "../pii/hybridRedact";
import type { ExtractionResult, UncertaintyFlag } from "../schemas";
import { evaluateNote, aggregate, type EvalReport, type GoldenExpectation } from "./metrics";

export interface GoldenItem {
  id: string;
  label: string;
  fixture: string;
  expected: GoldenExpectation;
}

export interface FixtureLoader {
  (fixture: string): Promise<string>;
}

/**
 * Run the eval set end-to-end. Caller provides a fixture loader (server reads
 * from fs; browser-side eval would inline the texts).
 *
 * This runs ALL pipeline stages live — nothing is mocked. We deliberately
 * don't cache here so the eval reflects the actual model behavior on the day.
 */
export async function runEval(
  client: Anthropic,
  goldenSet: { notes: GoldenItem[] },
  loadFixture: FixtureLoader
): Promise<EvalReport> {
  const noteResults = [];
  for (const item of goldenSet.notes) {
    const text = await loadFixture(item.fixture);
    const result = await extractFull(client, text);
    noteResults.push(evaluateNote(item.id, item.label, result, item.expected));
  }
  return { notes: noteResults, aggregate: aggregate(noteResults) };
}

async function extractFull(client: Anthropic, text: string): Promise<ExtractionResult> {
  let soap = null;
  for await (const ev of streamExtractSOAP(client, text)) {
    if (ev.type === "soap_done") soap = ev.soap;
  }
  if (!soap) throw new Error("Eval extraction returned no SOAP");

  const { codes } = await suggestICDCodes(client, soap);
  const { spans } = await hybridRedact(text, client);

  const flags: UncertaintyFlag[] = [];
  for (const [name, sec] of Object.entries(soap)) {
    if (sec.confidence === "low") {
      flags.push({
        field: name,
        reason: sec.reasoning,
        severity: sec.content.length === 0 ? "high" : "medium",
        suggestedAction: sec.content.length === 0
          ? "No source content found."
          : "Section is sparse or ambiguous.",
      });
    }
  }
  return { soap, icdCodes: codes, flags, redactedSpans: spans };
}

export function asciiSummary(report: EvalReport): string {
  const lines: string[] = [];
  lines.push("=== EVAL REPORT ===");
  lines.push("");
  lines.push("Section overlap (avg):");
  for (const k of ["subjective", "objective", "assessment", "plan"] as const) {
    lines.push(`  ${k.padEnd(12)} ${(report.aggregate.avgSectionOverlap[k] * 100).toFixed(1)}%`);
  }
  lines.push("");
  lines.push(`ICD-10 precision: ${(report.aggregate.avgIcdPrecision * 100).toFixed(1)}%`);
  lines.push(`ICD-10 recall:    ${(report.aggregate.avgIcdRecall * 100).toFixed(1)}%`);
  lines.push(`PHI type recall:  ${(report.aggregate.avgPhiRecall * 100).toFixed(1)}%`);
  lines.push("");
  lines.push("Calibration:");
  for (const k of ["high", "medium", "low"] as const) {
    const c = report.aggregate.calibrationByConfidence[k];
    lines.push(`  ${k.padEnd(7)} n=${c.n.toString().padStart(3)} correctRate=${(c.correctRate * 100).toFixed(1)}%`);
  }
  lines.push("");
  lines.push("Per-note:");
  for (const n of report.notes) {
    lines.push(
      `  ${n.id.padEnd(18)} ${n.label.padEnd(36)} icd p=${(n.icdPrecision * 100).toFixed(0)}% r=${(n.icdRecall * 100).toFixed(0)}% phi=${(n.phiTypeRecall * 100).toFixed(0)}%`
    );
  }
  return lines.join("\n");
}
