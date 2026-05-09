"use client";

import * as React from "react";
import { X } from "lucide-react";

interface Props {
  totalTokens: number;
  totalCostUsd: number;
  visible: boolean;
  onDismiss: () => void;
}

export function CostBadge({ totalTokens, totalCostUsd, visible, onDismiss }: Props) {
  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[11.5px] shadow-lg shadow-black/30"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
      <span className="text-[var(--color-fg-muted)]">Live calls:</span>
      <span className="font-mono tabular-nums text-[var(--color-fg)]">
        {totalTokens.toLocaleString()} tok
      </span>
      <span className="text-[var(--color-fg-dim)]">·</span>
      <span className="font-mono tabular-nums text-[var(--color-fg)]">
        ${totalCostUsd.toFixed(4)}
      </span>
      <button
        onClick={onDismiss}
        aria-label="Hide cost badge"
        className="ml-1 rounded p-0.5 text-[var(--color-fg-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
