import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { makeClient } from "@/lib/claude";
import { runEval, asciiSummary, type GoldenItem } from "@/lib/eval/runner";
import goldenSet from "@/data/golden/eval-set.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Eval runner endpoint. Gated three ways:
 *   1. POST only.
 *   2. body must contain confirmation: "RUN EVAL" (typed by user).
 *   3. user-provided ANTHROPIC_API_KEY in x-anthropic-key header.
 *
 * Never runs accidentally. Never on GET. Never on page load.
 */
export async function POST(req: NextRequest) {
  let body: { confirmation?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }
  if (body.confirmation !== "RUN EVAL") {
    return new Response(
      JSON.stringify({ error: "Eval requires confirmation: \"RUN EVAL\"." }),
      { status: 400 }
    );
  }
  const apiKey = req.headers.get("x-anthropic-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing x-anthropic-key header." }), {
      status: 401,
    });
  }
  const client = makeClient(apiKey);

  const repoRoot = process.cwd();
  const loadFixture = async (fixture: string) =>
    readFileSync(join(repoRoot, "data/synthetic/notes", fixture), "utf-8");

  try {
    const report = await runEval(
      client,
      goldenSet as { notes: GoldenItem[] },
      loadFixture
    );
    return new Response(
      JSON.stringify({ report, summary: asciiSummary(report) }, null, 2),
      { headers: { "content-type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500 }
    );
  }
}
