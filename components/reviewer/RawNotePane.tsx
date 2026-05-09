"use client";

import * as React from "react";
import type { SourceSpan, PHISpan } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  highlightSpans: SourceSpan[];
  phiSpans: PHISpan[];
  showPHI: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

interface Segment {
  text: string;
  highlighted: boolean;
  phiType: PHISpan["type"] | null;
  start: number;
}

/**
 * Raw clinical note rendered with line numbers + per-character segmenting
 * for source-span highlighting and PHI redaction overlays.
 *
 * We segment the text once per render based on the union of highlight spans
 * (driven by hover on a structured field) and PHI spans (always on).
 */
export function RawNotePane({ text, highlightSpans, phiSpans, showPHI, containerRef }: Props) {
  const segments = React.useMemo(
    () => buildSegments(text, highlightSpans, phiSpans),
    [text, highlightSpans, phiSpans]
  );

  // Group by line so we can render line numbers.
  const lines = React.useMemo(() => groupSegmentsByLine(segments), [segments]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto scrollbar-thin bg-[var(--color-surface)]"
      data-testid="raw-note-pane"
    >
      <div className="font-mono text-[12.5px] leading-[1.65] tracking-[-0.005em]">
        {lines.map((line, i) => (
          <div
            key={i}
            className="grid grid-cols-[44px_1fr] border-l-2 border-transparent hover:bg-[color-mix(in_oklab,var(--color-surface-2)_60%,transparent)]"
          >
            <div className="select-none px-2 py-px text-right text-[var(--color-fg-dim)]">
              {i + 1}
            </div>
            <div className="px-3 py-px whitespace-pre-wrap break-words">
              {line.map((seg, j) => (
                <SegmentSpan key={j} seg={seg} showPHI={showPHI} />
              ))}
            </div>
          </div>
        ))}
        <div className="h-24" />
      </div>
    </div>
  );
}

function SegmentSpan({ seg, showPHI }: { seg: Segment; showPHI: boolean }) {
  const isPHI = seg.phiType !== null;
  const cls = cn(
    "transition-[background-color,color] duration-200",
    seg.highlighted &&
      "bg-[color-mix(in_oklab,var(--color-accent)_24%,transparent)] text-[var(--color-fg)] rounded-[2px]",
    isPHI &&
      showPHI &&
      "bg-[color-mix(in_oklab,var(--color-warn-fg)_18%,transparent)] text-[var(--color-warn-fg)] rounded-[2px]"
  );
  return (
    <span
      className={cls}
      data-source-start={seg.start}
      title={isPHI ? `PHI: ${seg.phiType}` : undefined}
    >
      {seg.text}
    </span>
  );
}

function buildSegments(text: string, highlight: SourceSpan[], phi: PHISpan[]): Segment[] {
  const breakpoints = new Set<number>([0, text.length]);
  for (const s of highlight) {
    breakpoints.add(clamp(s.start, 0, text.length));
    breakpoints.add(clamp(s.end, 0, text.length));
  }
  for (const p of phi) {
    breakpoints.add(clamp(p.span.start, 0, text.length));
    breakpoints.add(clamp(p.span.end, 0, text.length));
  }
  const points = [...breakpoints].sort((a, b) => a - b);
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (end <= start) continue;
    const piece = text.slice(start, end);
    if (!piece) continue;
    const highlighted = highlight.some((s) => start >= s.start && end <= s.end);
    const phiHit = phi.find((p) => start >= p.span.start && end <= p.span.end);
    segments.push({
      text: piece,
      highlighted,
      phiType: phiHit ? phiHit.type : null,
      start,
    });
  }
  return segments;
}

function groupSegmentsByLine(segments: Segment[]): Segment[][] {
  const lines: Segment[][] = [[]];
  for (const seg of segments) {
    const parts = seg.text.split("\n");
    parts.forEach((p, i) => {
      if (i > 0) lines.push([]);
      if (p) {
        lines[lines.length - 1].push({
          text: p,
          highlighted: seg.highlighted,
          phiType: seg.phiType,
          start: seg.start,
        });
      }
    });
  }
  return lines;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
