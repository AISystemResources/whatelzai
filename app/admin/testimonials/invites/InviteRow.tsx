"use client";

import { useState, useTransition } from "react";
import { deleteInviteAction } from "./actions";
import type { TestimonialInvite } from "@/lib/testimonial-invites";

export function InviteRow({
  inv,
  categoryLabel,
}: {
  inv: TestimonialInvite;
  categoryLabel: string;
}) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const url = `https://whatelz.ai/testimonials/new?t=${inv.token}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-zinc-900">
            {inv.prefill.author_name ?? "Unnamed invite"}
          </p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            {categoryLabel}
          </span>
          {inv.used_at ? (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-800">
              used
            </span>
          ) : (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-800">
              open
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-500">
          {inv.prefill.author_role && <span>{inv.prefill.author_role}</span>}
          {inv.prefill.author_company && <span>{inv.prefill.author_company}</span>}
          {inv.prefill.author_email && <span>{inv.prefill.author_email}</span>}
        </div>
        {inv.note && (
          <p className="mt-1 text-xs italic text-zinc-500">{inv.note}</p>
        )}
        <p className="mt-2 break-all font-mono text-[10px] text-zinc-400">
          {url}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          onClick={copy}
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
        >
          {copied ? "✓ Copied" : "Copy link"}
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this invite?")) return;
            start(async () => deleteInviteAction(inv.id));
          }}
          className="font-mono text-[10px] uppercase tracking-widest text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
