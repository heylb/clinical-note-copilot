"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import type { UncertaintyFlag } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface Props {
  flags: UncertaintyFlag[];
  onJump: (field: string) => void;
}

const SEVERITY_STYLE: Record<UncertaintyFlag["severity"], string> = {
  high: "border-[var(--color-confidence-low)]/50 bg-[color-mix(in_oklab,var(--color-confidence-low)_10%,transparent)] text-[var(--color-confidence-low)]",
  medium: "border-[var(--color-confidence-medium)]/40 bg-[var(--color-warn-bg)] text-[var(--color-confidence-medium)]",
  low: "border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]",
};

export function UncertaintyFlagStrip({ flags, onJump }: Props) {
  if (flags.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 scrollbar-thin">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[var(--color-confidence-medium)]" />
      <span className="mr-1 shrink-0 text-[11px] uppercase tracking-wider text-[var(--color-fg-dim)]">
        {flags.length} flag{flags.length === 1 ? "" : "s"}
      </span>
      {flags.map((f, i) => (
        <button
          key={i}
          onClick={() => onJump(f.field)}
          title={`${f.reason}\n\n${f.suggestedAction}`}
          className={cn(
            "shrink-0 max-w-[260px] truncate rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight",
            SEVERITY_STYLE[f.severity]
          )}
        >
          <span className="font-mono text-[10.5px] opacity-80">{f.field}</span>
          <span className="mx-1 opacity-50">·</span>
          {truncate(f.reason, 50)}
        </button>
      ))}
    </div>
  );
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
