"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Key, Moon, ShieldAlert, Sun } from "lucide-react";
import { Button } from "../ui/Button";
import { SAMPLES } from "@/lib/samples";

interface Props {
  selectedSampleId: string | null;
  hasUserKey: boolean;
  mode: "sample" | "custom";
  modelLabel: string;
  onSelectSample: (id: string) => void;
  onTogglePasteOwn: () => void;
  onOpenKeyDialog: () => void;
}

export function TopBar({
  selectedSampleId,
  hasUserKey,
  mode,
  modelLabel,
  onSelectSample,
  onTogglePasteOwn,
  onOpenKeyDialog,
}: Props) {
  const [dropOpen, setDropOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    try {
      const t = localStorage.getItem("theme") === "light" ? "light" : "dark";
      setTheme(t);
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  const selected = SAMPLES.find((s) => s.id === selectedSampleId);

  return (
    <header className="flex h-12 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-[13px] font-medium tracking-tight"
          aria-label="Home"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-accent)] text-[10px] font-semibold text-[#062018]">
            CN
          </span>
          <span className="hidden sm:inline">Clinical Note Co-pilot</span>
        </Link>
        <span className="hidden text-[var(--color-fg-dim)] sm:inline">/</span>
        <span className="hidden text-[12.5px] text-[var(--color-fg-muted)] sm:inline">
          Playground
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-full border border-[color:var(--color-warn-fg)]/40 bg-[var(--color-warn-bg)] px-2 py-0.5 text-[10.5px] uppercase tracking-wider text-[var(--color-warn-fg)] md:inline-flex"
          title="All notes shown are synthetic. No real PHI is processed by this app."
        >
          <ShieldAlert className="h-3 w-3" /> Synthetic only
        </span>

        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDropOpen((o) => !o)}
            aria-expanded={dropOpen}
            aria-haspopup="menu"
          >
            {mode === "custom" ? (
              <span className="text-[var(--color-fg-muted)]">Custom note</span>
            ) : selected ? (
              <>
                <span className="font-mono text-[10.5px] text-[var(--color-fg-dim)]">
                  {selected.id}
                </span>
                <span>{selected.label}</span>
              </>
            ) : (
              "Try a sample"
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
          {dropOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDropOpen(false)}
                aria-hidden
              />
              <div
                role="menu"
                className="absolute right-0 top-9 z-30 w-72 overflow-hidden rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-1 shadow-xl shadow-black/40 animate-fade-in-up"
              >
                {SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    role="menuitem"
                    onClick={() => {
                      onSelectSample(s.id);
                      setDropOpen(false);
                    }}
                    className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[var(--color-surface-2)]"
                  >
                    <span className="text-[12.5px] font-medium">{s.label}</span>
                    <span className="text-[11px] text-[var(--color-fg-dim)]">{s.shape}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-[var(--color-border)]" />
                <button
                  role="menuitem"
                  onClick={() => {
                    onTogglePasteOwn();
                    setDropOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-surface-2)]"
                >
                  <span className="text-[12.5px] font-medium">Paste your own</span>
                  <span className="text-[11px] text-[var(--color-fg-dim)]">requires API key</span>
                </button>
              </div>
            </>
          )}
        </div>

        <Button
          variant={hasUserKey ? "secondary" : "ghost"}
          size="sm"
          onClick={onOpenKeyDialog}
          title={hasUserKey ? "API key set (sessionStorage)" : "Bring your own API key"}
        >
          <Key className="h-3 w-3" />
          <span className="hidden md:inline">{hasUserKey ? "Key set" : "Add key"}</span>
        </Button>

        <span
          className="hidden rounded-md border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--color-fg-muted)] sm:inline-block"
          title="Model used for live extraction"
        >
          {modelLabel}
        </span>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded p-1.5 text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
}
