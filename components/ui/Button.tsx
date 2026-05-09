"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[#062018] hover:opacity-90 disabled:opacity-50 font-medium",
  secondary:
    "border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]",
  ghost:
    "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]",
  danger:
    "border border-[color:var(--color-confidence-low)]/40 text-[var(--color-confidence-low)] hover:bg-[color-mix(in_oklab,var(--color-confidence-low)_10%,transparent)]",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs rounded-md",
  md: "h-9 px-3.5 text-sm rounded-md",
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "secondary", size = "md", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
});
