"use client";

import * as React from "react";

/**
 * Drag-divisible split pane. Horizontal layout on >=1024px, stacked below.
 * Persists ratio in localStorage so the reviewer keeps the user's preferred
 * layout across visits.
 */
interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  storageKey?: string;
  initialRatio?: number;
}

export function SplitPane({ left, right, storageKey = "split.ratio", initialRatio = 0.5 }: Props) {
  const [ratio, setRatio] = React.useState(initialRatio);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v) setRatio(Math.min(0.85, Math.max(0.15, parseFloat(v))));
    } catch {}
  }, [storageKey]);

  const onMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  React.useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const r = (e.clientX - rect.left) / rect.width;
      const clamped = Math.min(0.85, Math.max(0.15, r));
      setRatio(clamped);
    }
    function onUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem(storageKey, String(ratio));
      } catch {}
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [ratio, storageKey]);

  return (
    <div
      ref={containerRef}
      className="grid h-full w-full grid-cols-1 lg:grid-cols-[1fr_auto_1fr]"
      style={
        typeof window !== "undefined" && window.innerWidth >= 1024
          ? ({
              gridTemplateColumns: `${ratio * 100}% 6px ${(1 - ratio) * 100}%`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="min-w-0 min-h-0 overflow-hidden">{left}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        tabIndex={0}
        onMouseDown={onMouseDown}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setRatio((r) => Math.max(0.15, r - 0.02));
          if (e.key === "ArrowRight") setRatio((r) => Math.min(0.85, r + 0.02));
        }}
        className="hidden lg:block group cursor-col-resize bg-transparent transition-colors hover:bg-[var(--color-border-strong)] focus-visible:bg-[var(--color-accent)]/40"
      >
        <div className="mx-auto h-full w-px bg-[var(--color-border)] transition-colors group-hover:bg-[var(--color-border-strong)]" />
      </div>
      <div className="min-w-0 min-h-0 overflow-hidden">{right}</div>
    </div>
  );
}
