import Link from "next/link";
import { ArrowRight, Github, ShieldAlert, Sparkles, Workflow, Eye, Activity, FileCheck2, Plug } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <Nav />
      <Hero />
      <HowItWorks />
      <Capabilities />
      <MCPInstall />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_80%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-[13px] font-medium tracking-tight"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--color-accent)] text-[10px] font-semibold text-[#062018]">
            CN
          </span>
          <span className="truncate">Clinical Note Co-pilot</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/case-study"
            className="rounded-md px-2 py-1 text-[12.5px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] sm:px-2.5"
          >
            Case study
          </Link>
          <Link
            href="/playground"
            className="whitespace-nowrap rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-[12.5px] font-medium text-[#062018] hover:opacity-90 sm:px-3"
          >
            Open <span className="hidden sm:inline">playground</span>
            <span className="sm:hidden">demo</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] grid-bg">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-warn-fg)]/40 bg-[var(--color-warn-bg)] px-2.5 py-0.5 text-[10.5px] uppercase tracking-wider text-[var(--color-warn-fg)]">
            <ShieldAlert className="h-3 w-3" /> Synthetic data only · portfolio demo
          </span>
          <h1 className="text-balance text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[56px]">
            Structured SOAP notes from messy clinical text — with the model&rsquo;s reasoning visible.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--color-fg-muted)]">
            A reviewer-first interface for turning transcripts and dictations into SOAP notes and ICD-10 suggestions.
            Source attribution, confidence indicators, inline edits, PHI redaction, and a streaming pipeline. The
            same logic runs as a standalone MCP server.
          </p>
          <div className="mt-7 flex items-center justify-center gap-2">
            <Link
              href="/playground"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 text-[13px] font-medium text-[#062018] hover:opacity-90"
            >
              Try the demo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <a
              href="https://github.com/heylb/clinical-note-copilot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-[13px] hover:bg-[var(--color-surface-2)]"
            >
              <Github className="h-3.5 w-3.5" /> View on GitHub
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-2xl shadow-black/40">
            <div className="flex h-7 items-center gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-3">
              <span className="h-2 w-2 rounded-full bg-[#3a3f48]" />
              <span className="h-2 w-2 rounded-full bg-[#3a3f48]" />
              <span className="h-2 w-2 rounded-full bg-[#3a3f48]" />
              <span className="ml-2 font-mono text-[10.5px] text-[var(--color-fg-dim)]">
                /playground · note-1
              </span>
            </div>
            <HeroPreview />
          </div>
          <p className="mt-3 text-center text-[11.5px] text-[var(--color-fg-dim)]">
            Stripped-down preview of the reviewer surface. The live playground streams as it extracts.
          </p>
        </div>
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="grid h-[360px] grid-cols-2 text-[12px]">
      <div className="border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono leading-relaxed text-[var(--color-fg-muted)]">
        <span className="text-[var(--color-fg-dim)]">CC:</span> SOB x 2 hrs, wheezing<br />
        <span className="text-[var(--color-fg-dim)]">HPI:</span>{" "}
        <span className="rounded-[2px] bg-[color-mix(in_oklab,var(--color-accent)_24%,transparent)] text-[var(--color-fg)]">
          32yo F w/ hx asthma, ran out of albuterol 3d ago
        </span>
        . Acute SOB after running for bus.<br />
        <span className="text-[var(--color-fg-dim)]">Vitals:</span> BP 128/82, HR 102, RR 24,{" "}
        <span className="rounded-[2px] bg-[color-mix(in_oklab,var(--color-accent)_24%,transparent)] text-[var(--color-fg)]">
          SpO2 92% RA
        </span><br />
        <span className="text-[var(--color-fg-dim)]">A:</span> Acute asthma exacerbation, moderate.
      </div>
      <div className="bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[10px] font-medium uppercase text-[var(--color-accent)]">
              S
            </span>
            <span className="font-medium tracking-tight">Subjective</span>
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-[var(--color-confidence-high)]" />
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
            32-year-old female with history of asthma, ran out of albuterol 3 days ago…
          </p>
        </div>
        <div className="px-4 py-2">
          <div className="mb-1.5 text-[10.5px] uppercase tracking-wider text-[var(--color-fg-dim)]">
            ICD-10 suggestions
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 rounded border border-[var(--color-border)] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-confidence-high)]" />
              <code className="font-mono text-[11.5px]">J45.901</code>
              <span className="truncate text-[11px] text-[var(--color-fg-muted)]">
                Asthma with acute exacerbation
              </span>
            </div>
            <div className="flex items-center gap-2 rounded border border-[var(--color-border)] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-confidence-medium)]" />
              <code className="font-mono text-[11.5px]">R06.02</code>
              <span className="truncate text-[11px] text-[var(--color-fg-muted)]">
                Shortness of breath
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Workflow,
      title: "Stream extraction",
      body: "Tool-use mode forces structured JSON output. Sections fade in as Claude generates them. The model marks confidence per section and cites source spans.",
    },
    {
      icon: Eye,
      title: "Reviewer-first UI",
      body: "Hover any field to see the supporting text on the left. Edit inline with cmd-enter. Confidence dots, reasoning popovers, and uncertainty flags surface what the model isn't sure about.",
    },
    {
      icon: FileCheck2,
      title: "ICD + PHI in one pass",
      body: "ICD-10 suggestions are derived from the SOAP and cite their evidence span. PHI redaction is hybrid: regex for structured patterns, LLM for names and addresses.",
    },
  ];
  return (
    <section className="border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-[28px] font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 text-[14px] text-[var(--color-fg-muted)]">
            Three pieces, one pipeline, shared schemas.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <s.icon className="h-4 w-4 text-[var(--color-accent)]" />
              <h3 className="mt-3 text-[14px] font-medium tracking-tight">{s.title}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--color-fg-muted)]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  const items = [
    { icon: Plug, title: "MCP server", body: "Same logic exposed as stdio MCP for Claude Desktop / Cursor / Code." },
    { icon: Sparkles, title: "Structured outputs", body: "Tool-use forced JSON; Zod-validated end-to-end." },
    { icon: ShieldAlert, title: "Hybrid PHI redaction", body: "Regex for phone/MRN/DOB; LLM for names + addresses." },
    { icon: Eye, title: "Source attribution", body: "Every section cites character offsets in the original text." },
    { icon: FileCheck2, title: "Human-in-the-loop", body: "Confidence dots, uncertainty flags, inline edits, accept/reject codes." },
    { icon: Activity, title: "Eval harness", body: "10-note golden set; per-section overlap, ICD precision/recall, calibration." },
  ];
  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/40">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-[28px] font-semibold tracking-tight">What it shows</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center gap-2">
                <it.icon className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                <span className="text-[13px] font-medium tracking-tight">{it.title}</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MCPInstall() {
  const json = `{
  "mcpServers": {
    "clinical-notes": {
      "command": "node",
      "args": ["/absolute/path/to/clinical-note-copilot/mcp-server/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-..."
      }
    }
  }
}`;
  return (
    <section className="border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-6 max-w-2xl">
          <h2 className="text-[28px] font-semibold tracking-tight">Use it as an MCP server</h2>
          <p className="mt-2 text-[14px] text-[var(--color-fg-muted)]">
            Drop into Claude Desktop, Cursor, or Claude Code. Four tools:{" "}
            <code className="font-mono text-[12.5px] text-[var(--color-fg)]">extract_soap_note</code>,{" "}
            <code className="font-mono text-[12.5px] text-[var(--color-fg)]">suggest_icd_codes</code>,{" "}
            <code className="font-mono text-[12.5px] text-[var(--color-fg)]">redact_phi</code>,{" "}
            <code className="font-mono text-[12.5px] text-[var(--color-fg)]">extract_full</code>.
          </p>
        </div>
        <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
{json}
        </pre>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-[11.5px] text-[var(--color-fg-dim)] sm:flex-row">
        <span>Clinical Note Co-pilot · synthetic data only · MIT license</span>
        <div className="flex items-center gap-3">
          <Link href="/case-study" className="hover:text-[var(--color-fg-muted)]">
            Case study
          </Link>
          <a
            href="https://github.com/heylb/clinical-note-copilot"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-fg-muted)]"
          >
            GitHub
          </a>
          <Link href="/playground" className="hover:text-[var(--color-fg-muted)]">
            Playground
          </Link>
        </div>
      </div>
    </footer>
  );
}
