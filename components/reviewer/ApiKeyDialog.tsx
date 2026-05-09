"use client";

import * as React from "react";
import { Key, X } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export function ApiKeyDialog({ open, onClose, onSave }: Props) {
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Anthropic API key"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 shadow-2xl shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-[var(--color-accent)]" />
            <h2 className="text-[14px] font-medium tracking-tight">Bring your own API key</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-[var(--color-fg-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-[12.5px] leading-relaxed text-[var(--color-fg-muted)]">
          Paste your Anthropic API key to run live extractions on the &quot;paste your own&quot; flow.
          The key is stored only in <code className="font-mono">sessionStorage</code> for this tab —
          never sent to my server, never persisted. Closing the tab clears it.
        </p>
        <input
          ref={inputRef}
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (value.startsWith("sk-")) onSave(value);
            }
          }}
          placeholder="sk-ant-..."
          className="mb-3 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 py-2 font-mono text-[12px] focus:border-[var(--color-accent)] focus:outline-none"
          aria-label="Anthropic API key"
        />
        <div className="flex items-center justify-between gap-2">
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="text-[11.5px] text-[var(--color-fg-dim)] underline-offset-2 hover:text-[var(--color-fg-muted)] hover:underline"
          >
            Get a key →
          </a>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!value.startsWith("sk-")}
              onClick={() => onSave(value)}
            >
              Save key
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
