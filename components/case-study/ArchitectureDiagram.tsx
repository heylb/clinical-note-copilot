"use client";

import * as React from "react";

/**
 * Responsive architecture diagram.
 *
 * - Mobile: stacked CSS boxes with semantic flow.
 * - sm+: SVG with the same nodes laid out horizontally.
 *
 * The SVG and the CSS version describe the same graph; we don't try to share
 * geometry between them — readability beats DRY here.
 */
export function ArchitectureDiagram() {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
      <div className="block sm:hidden">
        <StackedDiagram />
      </div>
      <div className="hidden sm:block">
        <SvgDiagram />
      </div>
    </div>
  );
}

function StackedDiagram() {
  return (
    <div className="flex flex-col items-center gap-2.5 text-[12px]">
      <div className="grid w-full grid-cols-2 gap-2">
        <Tile tone="accent" title="Web app" sub="Next.js · /playground" />
        <Tile tone="accent" title="MCP server" sub="stdio · Claude Desktop" />
      </div>
      <Down />
      <Tile
        tone="surface"
        title="lib/ shared"
        sub="Zod schemas · prompts · client"
        className="w-full"
      />
      <Down />
      <div className="grid w-full grid-cols-2 gap-2">
        <Tile tone="surface" title="Anthropic API" sub="sonnet-4-6 · tool use" />
        <Tile tone="surface" title="Anthropic API" sub="haiku-4-5 · PHI" />
      </div>
      <div className="my-1 h-px w-full bg-[var(--color-border)]" />
      <Tile
        tone="warn"
        title="data/precomputed"
        sub="static fixtures · zero spend on demo"
        className="w-full"
      />
    </div>
  );
}

function Tile({
  tone,
  title,
  sub,
  className,
}: {
  tone: "accent" | "surface" | "warn";
  title: string;
  sub: string;
  className?: string;
}) {
  const tones = {
    accent:
      "border-[color:var(--color-accent)]/40 bg-[color-mix(in_oklab,var(--color-accent)_12%,var(--color-surface-2))]",
    surface: "border-[var(--color-border-strong)] bg-[var(--color-surface-2)]",
    warn: "border-[color:var(--color-warn-fg)]/40 bg-[var(--color-warn-bg)]",
  }[tone];
  return (
    <div className={`rounded-md border px-3 py-2 ${tones} ${className ?? ""}`}>
      <div className="text-[12.5px] font-medium tracking-tight">{title}</div>
      <div className="font-mono text-[10.5px] text-[var(--color-fg-muted)]">{sub}</div>
    </div>
  );
}

function Down() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="var(--color-fg-dim)"
      strokeWidth="1.2"
      aria-hidden
    >
      <path d="M7 1v10m-3-3 3 3 3-3" />
    </svg>
  );
}

function SvgDiagram() {
  return (
    <svg
      viewBox="0 0 720 320"
      className="mx-auto block w-full max-w-3xl"
      role="img"
      aria-label="Architecture diagram showing web app and MCP server sharing extraction logic and Zod schemas"
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-fg-muted)" />
        </marker>
      </defs>

      <Box x={20} y={20} w={180} h={70} title="Web app (Next.js)" sub="Reviewer UI · /playground" tone="accent" />
      <Box x={20} y={120} w={180} h={70} title="MCP server" sub="stdio · Claude Desktop" tone="accent" />

      <Box x={260} y={70} w={200} h={70} title="lib/ shared" sub="Zod schemas · prompts · client" tone="surface" />

      <Box x={520} y={20} w={180} h={70} title="Anthropic API" sub="sonnet-4-6 · tool use" tone="surface" />
      <Box x={520} y={120} w={180} h={70} title="Anthropic API" sub="haiku-4-5 · PHI" tone="surface" />

      <Box x={260} y={230} w={200} h={70} title="data/precomputed" sub="static fixtures · zero spend" tone="warn" />

      <Edge x1={200} y1={55} x2={260} y2={90} />
      <Edge x1={200} y1={155} x2={260} y2={120} />
      <Edge x1={460} y1={90} x2={520} y2={55} />
      <Edge x1={460} y1={120} x2={520} y2={155} />
      <Edge x1={110} y1={90} x2={310} y2={230} dashed />
      <text
        x={155}
        y={210}
        fill="var(--color-fg-dim)"
        fontSize={10}
        fontFamily="ui-monospace"
      >
        headline demo path
      </text>
    </svg>
  );
}

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  tone,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  tone: "accent" | "surface" | "warn";
}) {
  const fill = {
    accent: "color-mix(in oklab, var(--color-accent) 12%, var(--color-surface-2))",
    surface: "var(--color-surface-2)",
    warn: "var(--color-warn-bg)",
  }[tone];
  const stroke = {
    accent: "color-mix(in oklab, var(--color-accent) 50%, var(--color-border-strong))",
    surface: "var(--color-border-strong)",
    warn: "color-mix(in oklab, var(--color-warn-fg) 40%, var(--color-border-strong))",
  }[tone];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />
      <text x={x + 12} y={y + 26} fill="var(--color-fg)" fontSize={13} fontWeight="500">
        {title}
      </text>
      <text x={x + 12} y={y + 46} fill="var(--color-fg-muted)" fontSize={11} fontFamily="ui-monospace">
        {sub}
      </text>
    </g>
  );
}

function Edge({
  x1,
  y1,
  x2,
  y2,
  dashed,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="var(--color-fg-muted)"
      strokeWidth={1.2}
      strokeDasharray={dashed ? "4 3" : undefined}
      markerEnd="url(#arrow)"
    />
  );
}
