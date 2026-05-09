"use client";

import * as React from "react";
import { Braces, Check, FileText, Hash } from "lucide-react";
import type { ExtractionResult } from "@/lib/schemas";
import { Button } from "../ui/Button";
import { ConfidenceDot } from "./ConfidenceDot";

interface Props {
  result: ExtractionResult | null;
  onAcceptAll: () => void;
  onExport: (format: "json" | "markdown" | "plain") => void;
}

export function ReviewToolbar({ result, onAcceptAll, onExport }: Props) {
  const summary = React.useMemo(() => {
    if (!result) return null;
    const sections = Object.values(result.soap);
    const counts = { high: 0, medium: 0, low: 0 };
    for (const s of sections) counts[s.confidence] += 1;
    return counts;
  }, [result]);

  const flagCount = result?.flags.length ?? 0;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
      <div className="flex min-w-0 items-center gap-2 text-[12px] sm:gap-3">
        {summary ? (
          <>
            <span
              className="flex items-center gap-1.5 text-[var(--color-fg-muted)]"
              title={`${summary.high} high-confidence sections`}
            >
              <ConfidenceDot level="high" />
              <span className="tabular-nums">{summary.high}</span>
              <span className="hidden md:inline">high</span>
            </span>
            <span
              className="flex items-center gap-1.5 text-[var(--color-fg-muted)]"
              title={`${summary.medium} medium-confidence sections`}
            >
              <ConfidenceDot level="medium" />
              <span className="tabular-nums">{summary.medium}</span>
              <span className="hidden md:inline">medium</span>
            </span>
            <span
              className="flex items-center gap-1.5 text-[var(--color-fg-muted)]"
              title={`${summary.low} low-confidence sections`}
            >
              <ConfidenceDot level="low" />
              <span className="tabular-nums">{summary.low}</span>
              <span className="hidden md:inline">low</span>
            </span>
            {flagCount > 0 && (
              <>
                <span className="hidden text-[var(--color-fg-dim)] sm:inline">·</span>
                <span className="text-[var(--color-confidence-medium)]">
                  <span className="tabular-nums">{flagCount}</span>
                  <span className="hidden md:inline"> flag{flagCount === 1 ? "" : "s"}</span>
                </span>
              </>
            )}
          </>
        ) : (
          <span className="text-[var(--color-fg-dim)]">Awaiting extraction…</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={!result}
          onClick={() => onExport("plain")}
          aria-label="Export as plain text"
          title="Export as plain text"
        >
          <FileText className="h-3 w-3" />
          <span className="hidden lg:inline">Plain</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!result}
          onClick={() => onExport("markdown")}
          aria-label="Export as markdown"
          title="Export as markdown"
        >
          <Hash className="h-3 w-3" />
          <span className="hidden lg:inline">Markdown</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!result}
          onClick={() => onExport("json")}
          aria-label="Export as JSON"
          title="Export as JSON"
        >
          <Braces className="h-3 w-3" />
          <span className="hidden lg:inline">JSON</span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!result}
          onClick={onAcceptAll}
          title="Accept all (a)"
        >
          <Check className="h-3 w-3" />
          <span className="hidden sm:inline">Accept all</span>
        </Button>
      </div>
    </div>
  );
}
