"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "founding-rate-deadline";
const DURATION_MS = 18 * 60 * 60 * 1000; // 18 hours

function readOrSeedDeadline(): number {
  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed) && parsed > Date.now()) return parsed;
    }
  } catch {
    // sessionStorage unavailable — fall through and use in-memory deadline.
  }
  const next = Date.now() + DURATION_MS;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}

function format(remainingMs: number): { h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export function Countdown({ label }: { label: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const deadline = readOrSeedDeadline();
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // SSR / pre-hydration: reserve space with a static "18:00:00" placeholder so
  // the layout doesn't jump when the real countdown mounts.
  const { h, m, s } = format(remaining ?? DURATION_MS);

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
        {label}
      </p>
      <div
        className="flex items-baseline gap-2 font-mono tabular-nums"
        aria-live="polite"
      >
        <Slot value={h} unit="h" />
        <span className="text-2xl text-zinc-300">:</span>
        <Slot value={m} unit="m" />
        <span className="text-2xl text-zinc-300">:</span>
        <Slot value={s} unit="s" />
      </div>
    </div>
  );
}

function Slot({ value, unit }: { value: string; unit: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="bg-zinc-900 px-2 py-1 text-2xl font-semibold text-white sm:text-3xl">
        {value}
      </span>
      <span className="text-xs text-zinc-500">{unit}</span>
    </span>
  );
}
