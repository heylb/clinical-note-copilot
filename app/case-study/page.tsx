import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { ArchitectureDiagram } from "@/components/case-study/ArchitectureDiagram";
import { EvalChart } from "@/components/case-study/EvalChart";

export const metadata = {
  title: "Case study — Clinical Note Co-pilot",
  description: "Engineering and design writeup of the clinical note co-pilot.",
};

export default function CaseStudy() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <Nav />
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-16">
        <header className="mb-12">
          <Link
            href="/"
            className="text-[12px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            ← Home
          </Link>
          <h1 className="mt-3 text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.02em]">
            Clinical Note Co-pilot — case study
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-fg-muted)]">
            A reviewer-first interface for turning messy clinical text into structured SOAP notes
            with ICD-10 suggestions, plus a standalone MCP server. Notes on the architecture,
            prompt engineering, hard UX problems, PHI handling, and evals.
          </p>
        </header>

        <Section title="The problem">
          <p>
            Clinical notes are messy — abbreviations, dictation disfluencies, semi-structured forms,
            consult letters that ignore SOAP entirely. Coders and reviewers spend disproportionate
            time on extraction tasks that look mechanical but require judgment.
          </p>
          <p>
            LLM structured outputs are tempting and unreliable. Free-text JSON parsing breaks; the
            model invents codes it shouldn&rsquo;t; confidence is opaque. The fix is not &ldquo;trust the model&rdquo;
            but a tight loop: forced-tool-use schema, source-span citations, visible confidence,
            and a UI that treats reviewer edits as the point — not an afterthought.
          </p>
        </Section>

        <Section title="The architecture">
          <ArchitectureDiagram />
          <p className="mt-4">
            One Next.js app, one MCP server, shared <code>lib/</code>: Zod schemas, prompts, and the
            Anthropic client. The schemas compile to JSON Schema for tool-use forced output; the
            same Zod types validate the result before it reaches React. The MCP server imports the
            same module so Claude Desktop / Cursor / Code get an identical contract.
          </p>
          <p>
            For the deployed demo, sample extractions are pre-computed and shipped as static
            fixtures in <code>data/precomputed/</code>. The headline path costs zero API tokens.
            &ldquo;Paste your own&rdquo; is gated behind a user-supplied API key (sessionStorage only, never
            sent to the server) with rate-limit + cache + cost-badge wrappers.
          </p>
        </Section>

        <Section title="Prompt engineering">
          <p>
            The extraction prompt forces a single tool call against the SOAPNote schema. The system
            prompt is short, with two non-negotiable rules at the top:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
{`1. GROUND EVERYTHING. Every section's content must be derivable from
   literal text in the source. Inventing findings is the worst possible
   failure mode.

2. PREFER LOW CONFIDENCE OVER INVENTION. If the source is ambiguous, set
   the section's confidence to "low" and explain in reasoning. "Low
   confidence" is a feature, not a defect.`}
          </pre>
          <p className="mt-4">
            <strong>One concrete iteration.</strong> The first pass had Claude returning &ldquo;medium&rdquo;
            confidence on phone-consult notes that contained no objective exam, simply because the
            section was non-empty (it would say &ldquo;no exam performed&rdquo;). That&rsquo;s wrong — the absence of
            an exam is a real limitation, not a medium-confidence finding. The fix was to add an
            explicit calibration rubric (high / medium / low examples) to the system prompt and to
            require the reasoning field to address &ldquo;source quality.&rdquo; After the change, phone
            consults correctly mark Objective as low-confidence with reasoning that names the
            absence as the issue.
          </p>
        </Section>

        <Section title="The hard UX problems">
          <Subsection title="Confidence visualization">
            <p>
              Three levels — high / medium / low — encoded as a single dot per section. Color-only
              fails accessibility checks; the dot has an <code>aria-label</code> with the level.
              Each section has a &ldquo;Reasoning&rdquo; toggle that surfaces the model&rsquo;s explanation in a
              popover, so the reviewer can interrogate &ldquo;why low?&rdquo; without leaving the surface.
            </p>
          </Subsection>
          <Subsection title="Source attribution">
            <p>
              Every extracted section returns character offsets into the original note. Hover any
              field on the right pane and the supporting span glows on the left. Built by
              segmenting the raw text once per render against the union of hover-spans + PHI spans;
              cheaper than building real connecting lines and reads better at small text sizes.
            </p>
          </Subsection>
          <Subsection title="Ambiguous-field editing">
            <p>
              Inline edit on every section, with cmd+enter to save and a subtle &ldquo;edited&rdquo; pill plus
              revert button. The original Claude output is never lost — edits are stored separately
              and merged on export, so the reviewer can compare or revert.
            </p>
          </Subsection>
          <Subsection title="Streaming as you think">
            <p>
              Tool-use streams partial JSON deltas. We sniff which section the model is currently
              writing by scanning the trailing partial JSON for the last-mentioned key, then drive
              a fade-in skeleton-to-content transition section by section. Avoids the &ldquo;watch a
              spinner for 6 seconds&rdquo; failure mode.
            </p>
          </Subsection>
        </Section>

        <Section title="PHI handling">
          <p>
            The redaction layer is hybrid. Regex catches structured patterns (phone, email, MRN,
            DOB) cheaply and deterministically. The LLM (Haiku, small schema) sees the regex hits
            as candidates, then verifies, drops false positives, and adds names + addresses that
            regex would never get right.
          </p>
          <p>
            <strong>Why neither alone works.</strong> Regex on names is hopeless — too much variance
            and proper-noun overlap with non-PHI (&ldquo;the patient lives in New York&rdquo; vs.
            &ldquo;New York-Presbyterian&rdquo;). LLM-only would re-discover phone formats from scratch on
            every call and cost more. Hybrid runs Haiku once, gets the LLM&rsquo;s judgment on the hard
            cases, and accepts that synthetic PHI placeholders (&ldquo;Jane D.&rdquo;, &ldquo;DOB 01/01/19XX&rdquo;) are
            still PHI for the redaction layer&rsquo;s purposes.
          </p>
        </Section>

        <Section title="Evals">
          <p>
            10-note golden set (the 5 fixtures + 5 variants — pediatric ED, atrial fib, empty
            non-clinical input, psych follow-up, diabetes intake). The runner runs the entire
            extraction pipeline live and scores against hand-written expectations.
          </p>
          <ul className="my-3 list-disc space-y-1 pl-5 text-[14px] text-[var(--color-fg-muted)]">
            <li>
              <strong>Section overlap:</strong> fraction of expected keywords present in the
              extracted section (case-insensitive substring match).
            </li>
            <li>
              <strong>ICD precision/recall:</strong> matched against an &ldquo;acceptable&rdquo; code list with
              fuzzy root-3 matching to forgive unspecified-vs-specific variation.
            </li>
            <li>
              <strong>PHI type recall:</strong> what fraction of the expected PHI categories were
              detected.
            </li>
            <li>
              <strong>Calibration:</strong> for each (section, confidence) pair, did high-confidence
              sections actually score &gt;= 0.5 overlap?
            </li>
          </ul>
          <EvalChart />
          <p className="mt-4 text-[13px] text-[var(--color-fg-dim)]">
            Numbers shown are from a representative run on the 10-note set. Results vary across
            model versions; the runner is at <code>/api/eval</code> behind a typed-confirmation
            gate.
          </p>
        </Section>

        <Section title="What I'd do next">
          <ul className="my-3 list-disc space-y-1.5 pl-5 text-[14px] text-[var(--color-fg-muted)]">
            <li>
              <strong>Better calibration evals.</strong> The current &ldquo;correct&rdquo; threshold is
              keyword overlap; a real evaluation would use rubric-graded LLM judging or human
              labels.
            </li>
            <li>
              <strong>Coder-in-the-loop UX research.</strong> The reviewer surface is informed by
              looking at coding tools, not by sitting with coders. Real users would change the
              field hierarchy.
            </li>
            <li>
              <strong>Multi-pass extraction.</strong> One pass is enough for clean notes; messy
              dictations would benefit from a normalization pass before SOAP extraction.
            </li>
            <li>
              <strong>Diff-aware editing.</strong> A &ldquo;what did I change vs. the model&rdquo; export view
              would help with audit and with iterating on the prompt.
            </li>
            <li>
              <strong>Evaluation against retired ICD codes</strong>, not just current. The current
              eval set rewards modern ICD-10; legacy notes would punish it.
            </li>
          </ul>
        </Section>

        <footer className="mt-16 flex items-center justify-between border-t border-[var(--color-border)] pt-6 text-[12.5px] text-[var(--color-fg-muted)]">
          <Link href="/playground" className="inline-flex items-center gap-1 hover:text-[var(--color-fg)]">
            Open the playground <ArrowRight className="h-3 w-3" />
          </Link>
          <a
            href="https://github.com/heylb/clinical-note-copilot"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-[var(--color-fg)]"
          >
            <Github className="h-3 w-3" /> GitHub
          </a>
        </footer>
      </article>
    </main>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_80%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-3 px-5">
        <Link href="/" className="flex items-center gap-2 text-[13px] font-medium tracking-tight">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-accent)] text-[10px] font-semibold text-[#062018]">
            CN
          </span>
          <span>Clinical Note Co-pilot</span>
        </Link>
        <Link
          href="/playground"
          className="rounded-md bg-[var(--color-accent)] px-3 py-1 text-[12.5px] font-medium text-[#062018] hover:opacity-90"
        >
          Open playground
        </Link>
      </div>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-[24px] font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-[14.5px] leading-[1.7] text-[var(--color-fg)]">{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-[15px] font-medium tracking-tight text-[var(--color-fg)]">
        {title}
      </h3>
      <div className="space-y-2 text-[14px] leading-[1.7] text-[var(--color-fg-muted)]">
        {children}
      </div>
    </div>
  );
}
