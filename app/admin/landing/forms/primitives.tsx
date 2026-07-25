"use client";

import { type ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      {hint && (
        <span className="ml-2 font-mono text-[10px] text-zinc-400">{hint}</span>
      )}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      {...props}
      className={`w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none ${props.className ?? ""}`}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50";
  const styles = {
    primary:
      "border-zinc-900 bg-zinc-900 text-white hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)]",
    ghost:
      "border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900",
    danger: "border-red-200 text-red-600 hover:border-red-500",
  };
  return (
    <button {...rest} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

export function StatusPill({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "idle") return null;
  const map = {
    saving: { label: "Saving…", cls: "bg-zinc-100 text-zinc-500" },
    saved: { label: "Saved", cls: "bg-emerald-50 text-emerald-700" },
    error: { label: "Error", cls: "bg-red-50 text-red-700" },
  } as const;
  const { label, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${cls}`}
    >
      {label}
    </span>
  );
}

export function SectionCard({
  title,
  slug,
  children,
}: {
  title: string;
  slug: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-zinc-200 p-6">
      <div className="mb-6 flex items-baseline justify-between border-b border-zinc-100 pb-3">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          {slug}
        </span>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export const ACCENT_HINT =
  "Wrap yellow words in {{accent:foo}}. Use \\n for line breaks.";
