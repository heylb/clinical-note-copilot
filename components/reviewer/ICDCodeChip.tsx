"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import type { ICDSuggestion, SourceSpan } from "@/lib/schemas";
import { ConfidenceDot } from "./ConfidenceDot";
import { cn } from "@/lib/utils";

interface Props {
  code: ICDSuggestion;
  status: "pending" | "accepted" | "rejected";
  onHover: (spans: SourceSpan[] | null) => void;
  onAccept: () => void;
  onReject: () => void;
}

export function ICDCodeChip({ code, status, onHover, onAccept, onReject }: Props) {
  const [showReason, setShowReason] = React.useState(false);

  return (
    <div
      onMouseEnter={() => onHover([code.evidence])}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "group flex flex-col gap-1 rounded-md border px-3 py-2 transition-colors",
        status === "accepted"
          ? "border-[var(--color-confidence-high)]/50 bg-[color-mix(in_oklab,var(--color-confidence-high)_8%,transparent)]"
          : status === "rejected"
            ? "border-[var(--color-border)] bg-[var(--color-surface-2)] opacity-50"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]"
      )}
    >
      <div className="flex items-center gap-2">
        <ConfidenceDot level={code.confidence} />
        <code className="font-mono text-[12.5px] font-medium tracking-tight">{code.code}</code>
        <span className="flex-1 truncate text-[12.5px] text-[var(--color-fg-muted)]">
          {code.description}
        </span>
        <button
          onClick={onAccept}
          aria-label="Accept code"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition",
            status === "accepted"
              ? "bg-[var(--color-confidence-high)] text-[#062018]"
              : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-confidence-high)]"
          )}
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={onReject}
          aria-label="Reject code"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition",
            status === "rejected"
              ? "bg-[var(--color-confidence-low)]/30 text-[var(--color-confidence-low)]"
              : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-confidence-low)]"
          )}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <button
        onClick={() => setShowReason((s) => !s)}
        className="self-start text-[11px] text-[var(--color-fg-dim)] hover:text-[var(--color-fg-muted)]"
        aria-expanded={showReason}
      >
        {showReason ? "hide" : "why this code"}
      </button>
      {showReason && (
        <p className="mt-1 text-[12px] leading-snug text-[var(--color-fg-muted)] animate-fade-in-up">
          {code.reasoning}
        </p>
      )}
    </div>
  );
}
