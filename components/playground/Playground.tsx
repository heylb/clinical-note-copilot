"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CircleAlert,
  Pencil,
  Play,
  RotateCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { TopBar } from "../reviewer/TopBar";
import { SplitPane } from "../reviewer/SplitPane";
import { RawNotePane } from "../reviewer/RawNotePane";
import { StructuredPane } from "../reviewer/StructuredPane";
import { ReviewToolbar } from "../reviewer/ReviewToolbar";
import { ApiKeyDialog } from "../reviewer/ApiKeyDialog";
import { CostBadge } from "../reviewer/CostBadge";
import { Button } from "../ui/Button";
import { SAMPLES, getSample } from "@/lib/samples";
import type {
  ExtractionResult,
  SOAPNote,
  SourceSpan,
  ICDSuggestion,
  PHISpan,
  UncertaintyFlag,
} from "@/lib/schemas";
import { sha256Hex } from "@/lib/utils";
import { SONNET_MODEL } from "@/lib/claude";

type Mode = "sample" | "custom";

type ExtractionStatus =
  | { type: "idle" }
  | { type: "streaming"; section: keyof SOAPNote | null }
  | { type: "success"; source: "precomputed" | "live" | "cache" }
  | { type: "error"; message: string };

const SOAP_KEYS: (keyof SOAPNote)[] = ["subjective", "objective", "assessment", "plan"];

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

export function Playground() {
  const [mode, setMode] = React.useState<Mode>("sample");
  const [selectedSampleId, setSelectedSampleId] = React.useState<string | null>("note-1");
  const [noteText, setNoteText] = React.useState<string>(SAMPLES[0].text);
  const [customDraft, setCustomDraft] = React.useState<string>("");

  const [status, setStatus] = React.useState<ExtractionStatus>({ type: "idle" });
  const [result, setResult] = React.useState<ExtractionResult | null>(null);
  const [streamingSoap, setStreamingSoap] = React.useState<Partial<SOAPNote> | null>(null);
  const [streamingSection, setStreamingSection] = React.useState<keyof SOAPNote | null>(null);

  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = React.useState(false);

  const [hoveredSpans, setHoveredSpans] = React.useState<SourceSpan[]>([]);
  const [edits, setEdits] = React.useState<Partial<Record<keyof SOAPNote, string>>>({});
  const [icdStatus, setIcdStatus] = React.useState<Record<string, "pending" | "accepted" | "rejected">>({});
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    subjective: true,
    objective: true,
    assessment: true,
    plan: true,
  });
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  const [costBadgeVisible, setCostBadgeVisible] = React.useState(true);
  const [totalTokens, setTotalTokens] = React.useState(0);
  const [totalCost, setTotalCost] = React.useState(0);

  const callTimestampsRef = React.useRef<number[]>([]);

  // Restore API key + cost badge preference from sessionStorage on mount.
  React.useEffect(() => {
    try {
      const k = sessionStorage.getItem("anthropic-key");
      if (k) setApiKey(k);
      const dismissed = localStorage.getItem("cost-badge-dismissed");
      if (dismissed === "1") setCostBadgeVisible(false);
    } catch {}
  }, []);

  // Load default sample on first render — show real fixture immediately.
  React.useEffect(() => {
    loadSample("note-1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadSample(id: string) {
    const sample = getSample(id);
    if (!sample) return;
    setMode("sample");
    setSelectedSampleId(id);
    setNoteText(sample.text);
    setEdits({});
    setIcdStatus({});
    setStreamingSoap(null);
    setStreamingSection(null);
    setResult(sample.precomputed);
    setStatus({ type: "success", source: "precomputed" });
  }

  function togglePasteOwn() {
    setMode("custom");
    setSelectedSampleId(null);
    setNoteText("");
    setCustomDraft("");
    setResult(null);
    setEdits({});
    setIcdStatus({});
    setStreamingSoap(null);
    setStreamingSection(null);
    setStatus({ type: "idle" });
  }

  function saveApiKey(key: string) {
    setApiKey(key);
    try {
      sessionStorage.setItem("anthropic-key", key);
    } catch {}
    setKeyDialogOpen(false);
  }

  function rateLimited(): boolean {
    const now = Date.now();
    callTimestampsRef.current = callTimestampsRef.current.filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );
    return callTimestampsRef.current.length >= RATE_LIMIT_MAX;
  }

  async function runExtraction(text: string) {
    if (!apiKey) {
      setKeyDialogOpen(true);
      return;
    }
    if (!text.trim()) {
      setStatus({ type: "error", message: "Paste a clinical note first." });
      return;
    }
    if (rateLimited()) {
      setStatus({
        type: "error",
        message: "Rate limit: max 10 extractions per minute. Wait a moment and retry.",
      });
      return;
    }

    // Cache check (SHA-256 of text + model).
    const cacheKey = `extract:${SONNET_MODEL}:${await sha256Hex(text)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as ExtractionResult;
        setResult(parsed);
        setStatus({ type: "success", source: "cache" });
        return;
      }
    } catch {}

    callTimestampsRef.current.push(Date.now());
    setResult(null);
    setStreamingSoap({});
    setStreamingSection(null);
    setEdits({});
    setIcdStatus({});
    setStatus({ type: "streaming", section: null });

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json", "x-anthropic-key": apiKey },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({
          type: "error",
          message: data.error ?? `Server returned ${res.status}.`,
        });
        return;
      }
      if (!res.body) {
        setStatus({ type: "error", message: "No response body." });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let phiSpans: PHISpan[] = [];
      let icdCodes: ICDSuggestion[] = [];
      let flags: UncertaintyFlag[] = [];
      let soap: SOAPNote | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          if (!ev.startsWith("data: ")) continue;
          let payload: { type: string; [k: string]: unknown };
          try {
            payload = JSON.parse(ev.slice(6));
          } catch {
            continue;
          }
          if (payload.type === "section_start") {
            setStreamingSection(payload.section as keyof SOAPNote);
            setStatus({ type: "streaming", section: payload.section as keyof SOAPNote });
          } else if (payload.type === "soap_done") {
            soap = payload.soap as SOAPNote;
            setStreamingSoap(soap);
          } else if (payload.type === "phi_done") {
            phiSpans = payload.spans as PHISpan[];
          } else if (payload.type === "icd_done") {
            icdCodes = payload.codes as ICDSuggestion[];
          } else if (payload.type === "flags_done") {
            flags = payload.flags as UncertaintyFlag[];
          } else if (payload.type === "usage") {
            const usage = payload.usage as {
              input_tokens: number;
              output_tokens: number;
            };
            setTotalTokens((t) => t + usage.input_tokens + usage.output_tokens);
            setTotalCost((c) => c + (payload.costUsd as number));
          } else if (payload.type === "error") {
            setStatus({ type: "error", message: payload.message as string });
            return;
          } else if (payload.type === "result") {
            const final = payload.result as ExtractionResult;
            setResult(final);
            setStreamingSection(null);
            setStreamingSoap(null);
            setStatus({ type: "success", source: "live" });
            try {
              localStorage.setItem(cacheKey, JSON.stringify(final));
            } catch {}
          }
        }
      }

      if (soap && !result) {
        // Defensive: if the result event got lost, compose locally.
        const final: ExtractionResult = {
          soap,
          icdCodes,
          flags,
          redactedSpans: phiSpans,
        };
        setResult(final);
        setStatus({ type: "success", source: "live" });
      }
    } catch (e) {
      setStatus({
        type: "error",
        message: e instanceof Error ? e.message : "Network error.",
      });
    }
  }

  function handleAcceptAll() {
    if (!result) return;
    const next: Record<string, "pending" | "accepted" | "rejected"> = { ...icdStatus };
    for (const c of result.icdCodes) if (next[c.code] !== "rejected") next[c.code] = "accepted";
    setIcdStatus(next);
  }

  function handleExport(format: "json" | "markdown" | "plain") {
    if (!result) return;
    const merged = applyEdits(result, edits);
    let blobText = "";
    let mime = "text/plain";
    let filename = "soap-note";
    if (format === "json") {
      blobText = JSON.stringify({ ...merged, icdAcceptances: icdStatus }, null, 2);
      mime = "application/json";
      filename += ".json";
    } else if (format === "markdown") {
      blobText = renderMarkdown(merged, icdStatus);
      mime = "text/markdown";
      filename += ".md";
    } else {
      blobText = renderPlain(merged);
      filename += ".txt";
    }
    const blob = new Blob([blobText], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Keyboard shortcuts: cmd+enter, j/k, e, a
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (mode === "custom") runExtraction(customDraft);
        return;
      }
      if (inEditable) return;

      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        setFocusedField((cur) => {
          const idx = cur ? SOAP_KEYS.indexOf(cur as keyof SOAPNote) : -1;
          const dir = e.key === "j" ? 1 : -1;
          const next = SOAP_KEYS[(idx + dir + SOAP_KEYS.length) % SOAP_KEYS.length];
          // Scroll the section into view.
          const el = document.querySelector(`[data-section="${next}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
      } else if (e.key === "e") {
        // Open editor on focused field.
        if (focusedField) {
          const btn = document.querySelector<HTMLButtonElement>(
            `[data-section="${focusedField}"] button[aria-label="Edit section"]`
          );
          btn?.click();
        }
      } else if (e.key === "a" && !e.metaKey && !e.ctrlKey) {
        handleAcceptAll();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, customDraft, focusedField, result, icdStatus]);

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      <TopBar
        selectedSampleId={selectedSampleId}
        hasUserKey={!!apiKey}
        mode={mode}
        modelLabel={SONNET_MODEL}
        onSelectSample={loadSample}
        onTogglePasteOwn={togglePasteOwn}
        onOpenKeyDialog={() => setKeyDialogOpen(true)}
      />

      <SourceBanner status={status} mode={mode} />

      <div className="min-h-0 flex-1">
        {mode === "custom" && !noteText ? (
          <CustomEntry
            value={customDraft}
            onChange={setCustomDraft}
            hasKey={!!apiKey}
            onRun={() => {
              setNoteText(customDraft);
              runExtraction(customDraft);
            }}
            onPickSampleInstead={() => loadSample("note-1")}
            onAddKey={() => setKeyDialogOpen(true)}
          />
        ) : status.type === "error" ? (
          <ErrorState
            message={status.message}
            onRetry={() => (mode === "custom" ? runExtraction(noteText) : loadSample(selectedSampleId ?? "note-1"))}
          />
        ) : (
          <SplitPane
            left={
              <RawNotePane
                text={noteText}
                highlightSpans={hoveredSpans}
                phiSpans={result?.redactedSpans ?? []}
                showPHI
              />
            }
            right={
              <StructuredPane
                result={result}
                streamingSoap={streamingSoap}
                streamingSection={streamingSection}
                edits={edits}
                expanded={expanded}
                focusedField={focusedField}
                icdStatus={icdStatus}
                onHover={(spans) => setHoveredSpans(spans ?? [])}
                onToggleSection={(id) =>
                  setExpanded((e) => ({ ...e, [id]: !(e[id] ?? true) }))
                }
                onEditSection={(id, content) => setEdits((e) => ({ ...e, [id]: content }))}
                onResetEdit={(id) =>
                  setEdits((e) => {
                    const n = { ...e };
                    delete n[id];
                    return n;
                  })
                }
                onFocusField={(id) => setFocusedField(id)}
                onIcdAccept={(code) =>
                  setIcdStatus((s) => ({ ...s, [code]: s[code] === "accepted" ? "pending" : "accepted" }))
                }
                onIcdReject={(code) =>
                  setIcdStatus((s) => ({ ...s, [code]: s[code] === "rejected" ? "pending" : "rejected" }))
                }
                onJumpToFlag={(field) => {
                  const id = field.startsWith("icd:") ? null : field;
                  if (id) {
                    setFocusedField(id);
                    document
                      .querySelector(`[data-section="${id}"]`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
              />
            }
          />
        )}
      </div>

      <ReviewToolbar result={result} onAcceptAll={handleAcceptAll} onExport={handleExport} />

      {totalTokens > 0 && (
        <CostBadge
          totalTokens={totalTokens}
          totalCostUsd={totalCost}
          visible={costBadgeVisible}
          onDismiss={() => {
            setCostBadgeVisible(false);
            try {
              localStorage.setItem("cost-badge-dismissed", "1");
            } catch {}
          }}
        />
      )}

      <ApiKeyDialog
        open={keyDialogOpen}
        onClose={() => setKeyDialogOpen(false)}
        onSave={saveApiKey}
      />
    </div>
  );
}

function SourceBanner({ status, mode }: { status: ExtractionStatus; mode: Mode }) {
  let label: React.ReactNode = null;
  if (status.type === "success" && status.source === "precomputed") {
    label = (
      <>
        <Sparkles className="h-3 w-3" />
        Precomputed sample · real Claude output extracted ahead of time
      </>
    );
  } else if (status.type === "success" && status.source === "cache") {
    label = (
      <>
        <RotateCw className="h-3 w-3" />
        Cached result · same input + model already extracted this session
      </>
    );
  } else if (status.type === "success" && status.source === "live") {
    label = (
      <>
        <Sparkles className="h-3 w-3 text-[var(--color-accent)]" />
        Live extraction · {SONNET_MODEL}
      </>
    );
  } else if (status.type === "streaming") {
    label = (
      <>
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]" />
        Streaming {status.section ?? "…"}
      </>
    );
  }
  if (!label) return null;
  return (
    <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-1.5 text-[11px] text-[var(--color-fg-muted)]">
      {label}
    </div>
  );
}

function CustomEntry({
  value,
  onChange,
  hasKey,
  onRun,
  onPickSampleInstead,
  onAddKey,
}: {
  value: string;
  onChange: (v: string) => void;
  hasKey: boolean;
  onRun: () => void;
  onPickSampleInstead: () => void;
  onAddKey: () => void;
}) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4 text-[var(--color-fg-muted)]" />
        <h2 className="text-[14px] font-medium tracking-tight">Paste your own note</h2>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-[color:var(--color-warn-fg)]/40 bg-[var(--color-warn-bg)] px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-[var(--color-warn-fg)]">
          <ShieldAlert className="h-3 w-3" /> Synthetic only
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
        This page sends the text to Anthropic with{" "}
        <span className="text-[var(--color-fg)]">your API key</span> for live extraction. Do not
        paste real PHI. The 5 sample notes are real Claude outputs we extracted ahead of time —
        they cost nothing and demonstrate the same pipeline.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        placeholder="Paste a synthetic clinical note here…"
        className="flex-1 resize-none rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4 font-mono text-[12.5px] leading-relaxed focus:border-[var(--color-accent)] focus:outline-none"
        aria-label="Note text"
      />
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onPickSampleInstead}>
          <ArrowRight className="h-3 w-3" /> Try a sample instead
        </Button>
        {hasKey ? (
          <Button variant="primary" size="md" onClick={onRun} disabled={!value.trim()}>
            <Play className="h-3 w-3" /> Extract <span className="hidden md:inline ml-1 text-[11px] opacity-70">⌘↵</span>
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={onAddKey}>
            Add API key to run
          </Button>
        )}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isRateLimit = /rate limit/i.test(message);
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <CircleAlert className="h-8 w-8 text-[var(--color-confidence-low)]" />
      <h2 className="text-[14px] font-medium tracking-tight">
        {isRateLimit ? "Slow down" : "Extraction failed"}
      </h2>
      <p className="max-w-sm text-[13px] leading-relaxed text-[var(--color-fg-muted)]">{message}</p>
      <Button variant="primary" size="sm" onClick={onRetry}>
        <RotateCw className="h-3 w-3" /> Retry
      </Button>
    </div>
  );
}

function applyEdits(
  result: ExtractionResult,
  edits: Partial<Record<keyof SOAPNote, string>>
): ExtractionResult {
  const soap = { ...result.soap } as SOAPNote;
  for (const k of SOAP_KEYS) {
    if (edits[k] !== undefined && edits[k] !== soap[k].content) {
      soap[k] = { ...soap[k], content: edits[k] as string };
    }
  }
  return { ...result, soap };
}

function renderMarkdown(
  result: ExtractionResult,
  icd: Record<string, "pending" | "accepted" | "rejected">
): string {
  const lines: string[] = ["# SOAP Note", ""];
  const fields: { key: keyof SOAPNote; label: string }[] = [
    { key: "subjective", label: "Subjective" },
    { key: "objective", label: "Objective" },
    { key: "assessment", label: "Assessment" },
    { key: "plan", label: "Plan" },
  ];
  for (const { key, label } of fields) {
    lines.push(`## ${label} _(${result.soap[key].confidence})_`);
    lines.push(result.soap[key].content || "_(empty)_");
    lines.push("");
  }
  lines.push("## ICD-10 codes");
  for (const c of result.icdCodes) {
    const status = icd[c.code] ?? "pending";
    const mark = status === "accepted" ? "✓" : status === "rejected" ? "✗" : "·";
    lines.push(`- ${mark} \`${c.code}\` — ${c.description} _(${c.confidence})_`);
  }
  if (result.flags.length > 0) {
    lines.push("", "## Flags");
    for (const f of result.flags) lines.push(`- **${f.field}** (${f.severity}): ${f.reason}`);
  }
  return lines.join("\n");
}

function renderPlain(result: ExtractionResult): string {
  return [
    `SUBJECTIVE: ${result.soap.subjective.content}`,
    `OBJECTIVE: ${result.soap.objective.content}`,
    `ASSESSMENT: ${result.soap.assessment.content}`,
    `PLAN: ${result.soap.plan.content}`,
    `ICD: ${result.icdCodes.map((c) => c.code).join(", ")}`,
  ].join("\n\n");
}
