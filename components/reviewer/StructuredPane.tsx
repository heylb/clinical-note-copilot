"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ExtractionResult,
  SOAPNote,
  SourceSpan,
  UncertaintyFlag,
} from "@/lib/schemas";
import { SOAPSectionView } from "./SOAPSection";
import { ICDCodeChip } from "./ICDCodeChip";
import { UncertaintyFlagStrip } from "./UncertaintyFlagStrip";

interface Props {
  result: ExtractionResult | null;
  streamingSoap: Partial<SOAPNote> | null;
  streamingSection: keyof SOAPNote | null;
  edits: Partial<Record<keyof SOAPNote, string>>;
  expanded: Record<string, boolean>;
  focusedField: string | null;
  icdStatus: Record<string, "pending" | "accepted" | "rejected">;
  onHover: (spans: SourceSpan[] | null) => void;
  onToggleSection: (id: keyof SOAPNote) => void;
  onEditSection: (id: keyof SOAPNote, content: string) => void;
  onResetEdit: (id: keyof SOAPNote) => void;
  onFocusField: (id: string) => void;
  onIcdAccept: (code: string) => void;
  onIcdReject: (code: string) => void;
  onJumpToFlag: (field: string) => void;
}

const SOAP_ORDER: { id: keyof SOAPNote; label: string }[] = [
  { id: "subjective", label: "Subjective" },
  { id: "objective", label: "Objective" },
  { id: "assessment", label: "Assessment" },
  { id: "plan", label: "Plan" },
];

export function StructuredPane({
  result,
  streamingSoap,
  streamingSection,
  edits,
  expanded,
  focusedField,
  icdStatus,
  onHover,
  onToggleSection,
  onEditSection,
  onResetEdit,
  onFocusField,
  onIcdAccept,
  onIcdReject,
  onJumpToFlag,
}: Props) {
  const flags: UncertaintyFlag[] = result?.flags ?? [];

  return (
    <div className="flex h-full flex-col bg-[var(--color-surface)]">
      <UncertaintyFlagStrip flags={flags} onJump={onJumpToFlag} />

      <div className="flex-1 overflow-auto scrollbar-thin">
        {SOAP_ORDER.map(({ id, label }) => {
          const live = result?.soap[id] ?? streamingSoap?.[id];
          if (!live) {
            return (
              <SectionSkeleton
                key={id}
                id={id}
                label={label}
                streaming={streamingSection === id}
              />
            );
          }
          const editedContent = edits[id];
          const display = editedContent !== undefined ? { ...live, content: editedContent } : live;
          return (
            <SOAPSectionView
              key={id}
              id={id}
              label={label}
              section={display}
              edited={editedContent !== undefined && editedContent !== live.content}
              expanded={expanded[id] ?? true}
              isFocused={focusedField === id}
              isStreaming={streamingSection === id && !result}
              onToggle={() => onToggleSection(id)}
              onHover={onHover}
              onChange={(content) => onEditSection(id, content)}
              onResetEdit={() => onResetEdit(id)}
              onFocus={() => onFocusField(id)}
            />
          );
        })}

        <section className="border-b border-[var(--color-border)] px-4 py-3">
          <header className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-fg-dim)]">
              ICD-10 suggestions
            </span>
            {result && (
              <span className="rounded bg-[var(--color-surface-2)] px-1.5 text-[10px] tabular-nums text-[var(--color-fg-muted)]">
                {result.icdCodes.length}
              </span>
            )}
          </header>
          {!result ? (
            <div className="space-y-1.5">
              <div className="skeleton h-9 rounded-md" />
              <div className="skeleton h-9 rounded-md" />
            </div>
          ) : result.icdCodes.length === 0 ? (
            <p className="text-[12px] italic text-[var(--color-fg-dim)]">
              No codes suggested. The extracted SOAP did not contain enough evidence.
            </p>
          ) : (
            <AnimatePresence initial={false}>
              <div className="space-y-1.5">
                {result.icdCodes.map((c) => (
                  <motion.div
                    key={c.code}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <ICDCodeChip
                      code={c}
                      status={icdStatus[c.code] ?? "pending"}
                      onHover={onHover}
                      onAccept={() => onIcdAccept(c.code)}
                      onReject={() => onIcdReject(c.code)}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </section>

        <section className="px-4 py-3">
          <header className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-fg-dim)]">
              PHI detected
            </span>
            {result && (
              <span className="rounded bg-[var(--color-surface-2)] px-1.5 text-[10px] tabular-nums text-[var(--color-fg-muted)]">
                {result.redactedSpans.length}
              </span>
            )}
          </header>
          {result && result.redactedSpans.length > 0 ? (
            <ul className="space-y-1">
              {result.redactedSpans.map((p, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]"
                >
                  <span className="rounded bg-[var(--color-warn-bg)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-warn-fg)]">
                    {p.type}
                  </span>
                  <code className="font-mono text-[11.5px]">{p.span.text}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] italic text-[var(--color-fg-dim)]">
              {result ? "No PHI detected." : "Detecting PHI..."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionSkeleton({
  id,
  label,
  streaming,
}: {
  id: string;
  label: string;
  streaming: boolean;
}) {
  return (
    <section className="border-b border-[var(--color-border)]" data-section={id}>
      <header className="flex items-center gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[var(--color-surface-2)] text-[10px] font-medium uppercase text-[var(--color-fg-dim)]">
          {label[0]}
        </span>
        <span className="text-[13px] font-medium tracking-tight text-[var(--color-fg-muted)]">
          {label}
        </span>
        {streaming && (
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-accent)]">
            extracting…
          </span>
        )}
      </header>
      <div className="space-y-1.5 px-4 py-3">
        <div className="skeleton h-3 w-[88%] rounded" />
        <div className="skeleton h-3 w-[72%] rounded" />
        <div className="skeleton h-3 w-[62%] rounded" />
      </div>
    </section>
  );
}
