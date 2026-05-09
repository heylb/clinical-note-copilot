import { NextRequest } from "next/server";
import { makeClient, streamExtractSOAP, suggestICDCodes, estimateCostUsd, SONNET_MODEL } from "@/lib/claude";
import { hybridRedact } from "@/lib/pii/hybridRedact";
import { ExtractionResult, UncertaintyFlag } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * SSE endpoint for live extraction.
 *
 * The user pastes their Anthropic API key in the UI; it's sent in the
 * x-anthropic-key header on this single request, never persisted server-side.
 * No env var fallback. If the header is missing we 401.
 *
 * Wire format: text/event-stream with JSON-encoded events. The browser
 * consumes via ReadableStream + TextDecoder rather than EventSource so we
 * can use POST.
 */
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-anthropic-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing x-anthropic-key header." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) {
    return new Response(JSON.stringify({ error: "Empty text." }), { status: 400 });
  }
  if (text.length > 20_000) {
    return new Response(JSON.stringify({ error: "Note too long (max 20k chars)." }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const client = (() => {
    try {
      return makeClient(apiKey);
    } catch (e) {
      return null;
    }
  })();
  if (!client) {
    return new Response(JSON.stringify({ error: "Invalid API key format." }), { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // Run PHI detection in parallel — the UI doesn't block on it.
        const phiPromise = hybridRedact(text, client).then(({ spans }) => spans);

        let soap = null;
        let totalCost = 0;
        for await (const ev of streamExtractSOAP(client, text)) {
          send(ev);
          if (ev.type === "soap_done") soap = ev.soap;
          if (ev.type === "usage") totalCost += ev.costUsd;
        }
        if (!soap) {
          send({ type: "error", message: "Extraction did not produce a SOAP note." });
          controller.close();
          return;
        }

        const phiSpans = await phiPromise;
        send({ type: "phi_done", spans: phiSpans });

        // ICD suggestions after SOAP.
        const { codes, usage } = await suggestICDCodes(client, soap);
        send({ type: "icd_done", codes });
        const icdCost = estimateCostUsd(SONNET_MODEL, usage);
        totalCost += icdCost;
        send({
          type: "usage",
          label: "suggest_icd",
          model: SONNET_MODEL,
          usage,
          costUsd: icdCost,
        });

        // Compose flags from low-confidence sections.
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
        send({ type: "flags_done", flags });

        const final: ExtractionResult = {
          soap,
          icdCodes: codes,
          flags,
          redactedSpans: phiSpans,
        };
        send({ type: "result", result: final, totalCostUsd: totalCost });
        send({ type: "done" });
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Unknown error";
        send({ type: "error", message: humanizeError(raw) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

/**
 * Translate raw Anthropic SDK errors into messages the user can act on.
 * Falls through to the raw message if we don't recognize the pattern.
 */
function humanizeError(raw: string): string {
  if (/401|invalid x-api-key|authentication_error/i.test(raw)) {
    return "Anthropic rejected the API key. Double-check it on console.anthropic.com and try again.";
  }
  if (/429|rate_limit|too many requests/i.test(raw)) {
    return "Anthropic rate-limited the request. Wait a moment and retry.";
  }
  if (/insufficient_quota|credit balance|billing/i.test(raw)) {
    return "Your Anthropic account has insufficient credits. Top up the balance and retry.";
  }
  if (/overloaded|503|529/i.test(raw)) {
    return "Anthropic is temporarily overloaded. Wait a few seconds and retry.";
  }
  if (/network|fetch failed|ECONNRESET|ETIMEDOUT/i.test(raw)) {
    return "Network error reaching Anthropic. Check your connection and retry.";
  }
  if (/Schema validation failed/i.test(raw)) {
    return "The model's structured output didn't match the schema. This usually means a transient issue — try once, then switch samples.";
  }
  return raw.length > 240 ? raw.slice(0, 240) + "…" : raw;
}
