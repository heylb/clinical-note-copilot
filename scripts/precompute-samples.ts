#!/usr/bin/env tsx
/**
 * One-time pre-computation of the 5 sample extractions.
 *
 * Why: the deployed app must not burn API tokens on the headline demo path.
 * Run this locally with an API key, commit the JSON outputs to
 * data/precomputed/, and ship them as static fixtures.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... pnpm precompute
 *
 * If no key is provided, prints the prompts to stdout for manual extraction.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { makeClient, streamExtractSOAP, suggestICDCodes, estimateCostUsd, SONNET_MODEL } from "../lib/claude";
import { hybridRedact } from "../lib/pii/hybridRedact";
import type { ExtractionResult, UncertaintyFlag } from "../lib/schemas";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const NOTES = [
  { id: "note-1", file: "data/synthetic/notes/note-1-er-triage.txt" },
  { id: "note-2", file: "data/synthetic/notes/note-2-psych-eval.txt" },
  { id: "note-3", file: "data/synthetic/notes/note-3-phone-consult.txt" },
  { id: "note-4", file: "data/synthetic/notes/note-4-specialist-letter.txt" },
  { id: "note-5", file: "data/synthetic/notes/note-5-messy-intake.txt" },
];

async function precompute(noteId: string, text: string): Promise<ExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY required");
  const client = makeClient(apiKey);

  let soap = null;
  let totalCost = 0;
  for await (const ev of streamExtractSOAP(client, text)) {
    if (ev.type === "soap_done") soap = ev.soap;
    if (ev.type === "usage") totalCost += ev.costUsd;
  }
  if (!soap) throw new Error(`No SOAP from ${noteId}`);

  const { codes, usage } = await suggestICDCodes(client, soap);
  totalCost += estimateCostUsd(SONNET_MODEL, usage);
  const { spans } = await hybridRedact(text, client);

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
  for (const code of codes) {
    if (code.confidence === "low") {
      flags.push({
        field: `icd:${code.code}`,
        reason: code.reasoning,
        severity: "low",
        suggestedAction: "Confirm this code is supported by the documentation.",
      });
    }
  }

  console.log(`[CLAUDE-BILL] ${noteId} total cost ~$${totalCost.toFixed(4)}`);
  return { soap, icdCodes: codes, flags, redactedSpans: spans };
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY not set.");
    console.error("");
    console.error("This script normally runs each sample note through the live extraction pipeline");
    console.error("and saves the JSON to data/precomputed/. The repo ships with hand-crafted fixtures");
    console.error("that match the schema, so the deployed demo works without ever running this script.");
    console.error("");
    console.error("If you have an API key and want to regenerate fixtures from real model output:");
    console.error("  ANTHROPIC_API_KEY=sk-... pnpm precompute");
    process.exit(1);
  }

  for (const note of NOTES) {
    const text = readFileSync(join(REPO_ROOT, note.file), "utf-8");
    console.log(`\n[precompute] ${note.id}`);
    const result = await precompute(note.id, text);
    const out = join(REPO_ROOT, "data/precomputed", `${note.id}.json`);
    writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
    console.log(`[precompute] wrote ${out}`);
  }
  console.log("\n[precompute] done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
