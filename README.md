# Clinical Note Co-pilot

Turn messy clinical transcripts into structured SOAP notes with ICD-10 suggestions, confidence indicators, and human-in-the-loop review. Available as a web app and a standalone MCP server.

> **Synthetic data only.** This is a portfolio project. No real PHI is processed or stored. Sample notes are hand-written and contain placeholder PHI for demonstrating the redaction pipeline.

[Live demo](https://clinical-note-copilot.vercel.app) · [Case study](https://clinical-note-copilot.vercel.app/case-study) · [Repo](https://github.com/heylb/clinical-note-copilot)

---

## What it is

A reviewer-first interface for turning raw clinical text — ED triage notes, dictations, intake forms, consult letters — into structured SOAP notes plus ICD-10 code suggestions. The same extraction logic ships as a standalone MCP server you can plug into Claude Desktop, Cursor, or Claude Code.

**Two skill sets in one project:**
1. AI engineering — MCP, structured outputs (forced tool use), prompt design, hybrid PII handling, evals.
2. Design engineering — polished React, motion, ambiguity-state UX, source-span attribution, accessibility, keyboard.

---

## Architecture

```
app/                 Next.js 15 App Router (web UI + API routes)
  api/extract        SSE endpoint, user-key proxied
  api/eval           gated eval runner
  playground         reviewer surface
  case-study         engineering writeup
lib/                 shared logic (imported by both web app and MCP server)
  schemas.ts         Zod + JSON Schema (single source of truth)
  prompts/           extract / ICD / PHI system prompts
  claude.ts          Anthropic client, streaming, cost logging
  pii/               regex + hybrid redaction
  eval/              golden-set runner + metrics
mcp-server/          standalone Node stdio MCP server (separate package)
data/
  synthetic/notes/   5 fixture .txt + 5 variants for evals
  precomputed/       static fixtures shipped with the build (zero spend)
  golden/eval-set    ground-truth expectations
```

---

## Cost discipline

This project is built around the constraint that the user has a Claude Max subscription but no Anthropic API key for runtime spend. The deployed demo therefore must work without burning tokens.

- **Headline path is precomputed.** All 5 sample notes ship as static `data/precomputed/note-N.json` fixtures matching the `ExtractionResult` schema. Zero API calls on the demo.
- **"Paste your own" is BYO-key.** Live extractions only happen when the user pastes their Anthropic key, which lives in `sessionStorage` and is sent via a per-request header. Never persisted server-side.
- **Hard caps:**
  - Sonnet 4.6 for extraction + ICD; Haiku 4.5 for PHI verification. No Opus.
  - `max_tokens`: 2048 (extract) / 1024 (ICD) / 1024 (PHI).
  - Prompt caching (`cache_control: ephemeral`) on every system prompt.
  - Cap of 10 extractions per minute per browser session.
  - LocalStorage cache keyed by SHA-256(text + model). Cache hit short-circuits before any network request.
- **Cost badge visible** in the playground bottom-right whenever a live call has occurred. Token + USD totals.
- **Eval runner is locked.** `/api/eval` requires both an API key header and a `confirmation: "RUN EVAL"` body. Never runs automatically.

---

## Run locally

Requirements: Node 20+, pnpm 10+ (or npm).

```bash
pnpm install
pnpm dev
# → http://localhost:3001
```

The headline demo path uses precomputed fixtures. To run live extraction on the "paste your own" flow, get an [Anthropic API key](https://console.anthropic.com/settings/keys) and paste it into the playground's "Add key" dialog.

### Pre-compute fixtures (optional)

The repo ships hand-crafted fixtures that match the schema. To regenerate them from real model output:

```bash
ANTHROPIC_API_KEY=sk-ant-... pnpm precompute
```

This runs each sample through the full pipeline once and writes `data/precomputed/note-N.json`. Total spend: well under $1.

### Run evals

The eval runner is at `/api/eval`, gated. To trigger:

```bash
curl -X POST http://localhost:3001/api/eval \
  -H "x-anthropic-key: sk-ant-..." \
  -H "content-type: application/json" \
  -d '{"confirmation":"RUN EVAL"}'
```

Returns the per-note results, aggregate metrics, and an ASCII summary.

---

## Use as an MCP server

The `mcp-server/` package is a standalone Node stdio MCP server. It imports the same schemas and prompts from `../lib/`, so the contract stays in one place.

### Build

```bash
cd mcp-server
npm install
npm run build
```

### Tools exposed

| Tool | Description |
|---|---|
| `extract_soap_note(text)` | Structured SOAP note with confidence + source spans |
| `suggest_icd_codes(soap)` | ICD-10 candidates with confidence + evidence |
| `redact_phi(text)` | Hybrid regex + LLM PHI detection |
| `extract_full(text)` | Composite — the headline tool |

### Claude Desktop config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "clinical-notes": {
      "command": "node",
      "args": ["/absolute/path/to/clinical-note-copilot/mcp-server/dist/mcp-server/src/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}
```

Restart Claude Desktop. The `clinical-notes` tools should appear.

---

## Stack

- Next.js 15.1 (App Router) · React 19 · TypeScript strict
- Tailwind v4 (CSS-first config) · custom design tokens
- Zod 3 for schemas (Zod + auto-derived JSON Schema for tool-use)
- @anthropic-ai/sdk 0.65 (streaming, tool use, prompt caching)
- @modelcontextprotocol/sdk 1.29 (stdio server)
- Framer Motion 11 · Lucide icons · Recharts (eval chart)
- pnpm · Vercel

Model strings used: `claude-sonnet-4-6` (extraction + ICD), `claude-haiku-4-5-20251001` (PHI verification).

---

## Why I built this

I wanted one project that demonstrated both AI engineering and design engineering at portfolio quality, and that solved a problem deeper than "another chatbot." Clinical documentation is a domain with real ambiguity, real high-stakes failure modes (hallucinated findings, missed PHI), and real reviewer workflows worth designing for. The MCP server piece is there because shipping the same logic in a second runtime is the right test of whether the schemas, prompts, and contract are actually coherent.

The cost-discipline constraints — no API key, must look real on Vercel — pushed me toward the right design anyway: precomputed fixtures, source-of-truth schemas, BYO-key for live runs, evals you have to opt into.

---

## Limitations + roadmap

- **Synthetic data only.** Real PHI handling requires HIPAA-compliant infrastructure I haven't built. The redaction pipeline is structurally correct but only validated on synthetic placeholders.
- **No real EHR integration.** Designed as a reviewer surface, not a production app. Export-to-clipboard / JSON / Markdown is the integration story.
- **ICD code list is suggestions, not billing.** A coder still has to confirm. The chip UI is built around accept/reject, not auto-bill.
- **Evals are keyword-overlap based.** A real evaluation would use rubric LLM judges or human labels.
- **One model version pinned.** Cross-version eval would be useful but expensive.

Roadmap ideas: multi-pass extraction (normalize → SOAP), diff-aware export, calibration eval with rubric LLM judges, retired-ICD-code stress test.

---

## License

MIT. See [LICENSE](LICENSE).

## Credits

Synthetic clinical notes are hand-written by me — no real or scraped patient data. Sonnet and Haiku model strings reflect the latest stable Claude versions at time of build. Built with [Claude Code](https://claude.com/claude-code).
