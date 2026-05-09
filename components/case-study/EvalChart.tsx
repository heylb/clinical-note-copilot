"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import evalReport from "@/data/precomputed/eval-report.json";

export function EvalChart() {
  const data = [
    { metric: "Subjective", value: evalReport.aggregate.avgSectionOverlap.subjective * 100 },
    { metric: "Objective", value: evalReport.aggregate.avgSectionOverlap.objective * 100 },
    { metric: "Assessment", value: evalReport.aggregate.avgSectionOverlap.assessment * 100 },
    { metric: "Plan", value: evalReport.aggregate.avgSectionOverlap.plan * 100 },
    { metric: "ICD precision", value: evalReport.aggregate.avgIcdPrecision * 100 },
    { metric: "ICD recall", value: evalReport.aggregate.avgIcdRecall * 100 },
    { metric: "PHI recall", value: evalReport.aggregate.avgPhiRecall * 100 },
  ];

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between text-[12px] text-[var(--color-fg-muted)]">
        <span>10-note golden set · Sonnet · tool-use mode</span>
        <span className="font-mono text-[10.5px] text-[var(--color-fg-dim)]">
          n={evalReport.notes.length}
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -8 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="metric"
              stroke="var(--color-fg-dim)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
            />
            <YAxis
              stroke="var(--color-fg-dim)"
              fontSize={11}
              domain={[0, 100]}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              unit="%"
            />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--color-accent) 6%, transparent)" }}
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border-strong)",
                borderRadius: 4,
                fontSize: 12,
              }}
              formatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.value >= 90 ? "var(--color-confidence-high)" : d.value >= 75 ? "var(--color-confidence-medium)" : "var(--color-confidence-low)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
        {(["high", "medium", "low"] as const).map((k) => {
          const c = evalReport.aggregate.calibrationByConfidence[k];
          return (
            <div key={k} className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5">
              <div className="text-[10.5px] uppercase tracking-wider text-[var(--color-fg-dim)]">
                {k} confidence
              </div>
              <div className="mt-0.5 font-mono text-[16px] tabular-nums">
                {(c.correctRate * 100).toFixed(0)}%
              </div>
              <div className="text-[11px] text-[var(--color-fg-dim)]">n={c.n} correct rate</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
