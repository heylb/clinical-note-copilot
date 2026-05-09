"use client";

import * as React from "react";
import { ChevronDown, Pencil, Sparkles, Undo2 } from "lucide-react";
import type { SOAPSection as SOAPSectionType, SourceSpan } from "@/lib/schemas";
import { ConfidenceDot } from "./ConfidenceDot";
import { cn } from "@/lib/utils";

interface Props {
  id: keyof import("@/lib/schemas").SOAPNote;
  label: string;
  section: SOAPSectionType;
  edited: boolean;
  expanded: boolean;
  isFocused: boolean;
  isStreaming: boolean;
  onToggle: () => void;
  onHover: (spans: SourceSpan[] | null) => void;
  onChange: (content: string) => void;
  onResetEdit: () => void;
  onFocus: () => void;
}

const LABEL_STYLE: Record<string, string> = {
  S: "bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]",
  O: "bg-[color-mix(in_oklab,var(--color-confidence-medium)_18%,transparent)] text-[var(--color-confidence-medium)]",
  A: "bg-[color-mix(in_oklab,var(--color-confidence-high)_18%,transparent)] text-[var(--color-confidence-high)]",
  P: "bg-[color-mix(in_oklab,var(--color-fg-muted)_18%,transparent)] text-[var(--color-fg)]",
};

export function SOAPSectionView({
  id,
  label,
  section,
  edited,
  expanded,
  isFocused,
  isStreaming,
  onToggle,
  onHover,
  onChange,
  onResetEdit,
  onFocus,
}: Props) {
  const [editing, setEditing] = React.useState(false);
  const [showReason, setShowReason] = React.useState(false);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const initial = id[0].toUpperCase();

  React.useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      taRef.current.setSelectionRange(taRef.current.value.length, taRef.current.value.length);
    }
  }, [editing]);

  function handleEditCommit(value: string) {
    onChange(value);
    setEditing(false);
  }

  return (
    <section
      onMouseEnter={() => onHover(section.sourceSpans)}
      onMouseLeave={() => onHover(null)}
      onClick={onFocus}
      className={cn(
        "group relative border-b border-[var(--color-border)] transition-colors",
        isFocused && "bg-[color-mix(in_oklab,var(--color-surface-2)_70%,transparent)]"
      )}
      data-section={id}
      tabIndex={-1}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex items-center gap-2.5 text-left"
          aria-expanded={expanded}
        >
          <span
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium uppercase",
              LABEL_STYLE[initial]
            )}
          >
            {initial}
          </span>
          <span className="text-[13px] font-medium tracking-tight">{label}</span>
          <ConfidenceDot level={section.confidence} className="ml-1" />
          {edited && (
            <span className="rounded bg-[color-mix(in_oklab,var(--color-accent)_15%,transparent)] px-1.5 py-px text-[10px] uppercase tracking-wider text-[var(--color-accent)]">
              edited
            </span>
          )}
          <ChevronDown
            className={cn(
              "ml-1 h-3.5 w-3.5 text-[var(--color-fg-dim)] transition-transform",
              !expanded && "-rotate-90"
            )}
          />
        </button>
        <div className="flex items-center gap-1">
          {edited && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetEdit();
              }}
              className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
              aria-label="Revert edits"
            >
              <Undo2 className="h-3 w-3" /> Revert
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReason((s) => !s);
            }}
            className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
            aria-expanded={showReason}
            aria-label="Toggle model reasoning"
          >
            <Sparkles className="h-3 w-3" /> Reasoning
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
            aria-label="Edit section"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        </div>
      </header>

      {expanded && (
        <div className="px-4 py-3">
          {showReason && section.reasoning && (
            <div className="mb-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
              <span className="mr-1 inline-block text-[10px] uppercase tracking-wider text-[var(--color-fg-dim)]">
                Reasoning
              </span>
              {section.reasoning}
            </div>
          )}
          {editing ? (
            <textarea
              ref={taRef}
              defaultValue={section.content}
              onBlur={(e) => handleEditCommit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleEditCommit((e.target as HTMLTextAreaElement).value);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              rows={Math.max(3, Math.ceil(section.content.length / 80))}
              className="w-full resize-y rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 text-[13px] leading-relaxed focus:outline-none focus:border-[var(--color-accent)]"
              aria-label={`Edit ${label}`}
            />
          ) : (
            <p
              className={cn(
                "text-[13px] leading-relaxed text-[var(--color-fg)] animate-fade-in-up",
                isStreaming && "text-[var(--color-fg-muted)]",
                section.content.length === 0 && "italic text-[var(--color-fg-dim)]"
              )}
            >
              {section.content || "(no content extracted for this section)"}
              {isStreaming && (
                <span className="ml-1 inline-block h-3 w-1 align-middle bg-[var(--color-accent)] animate-pulse" />
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
