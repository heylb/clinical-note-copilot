"use client";

import * as React from "react";
import type { ConfidenceLevel } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const LABEL: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const COLOR_VAR: Record<ConfidenceLevel, string> = {
  high: "var(--color-confidence-high)",
  medium: "var(--color-confidence-medium)",
  low: "var(--color-confidence-low)",
};

interface Props {
  level: ConfidenceLevel;
  className?: string;
}

export function ConfidenceDot({ level, className }: Props) {
  return (
    <span
      role="img"
      aria-label={LABEL[level]}
      className={cn("inline-block h-2 w-2 rounded-full", className)}
      style={{
        background: COLOR_VAR[level],
        boxShadow: `0 0 0 1px color-mix(in oklab, ${COLOR_VAR[level]} 40%, transparent)`,
      }}
    />
  );
}
