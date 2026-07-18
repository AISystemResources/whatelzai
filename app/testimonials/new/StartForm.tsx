"use client";

import { useActionState } from "react";
import { startTestimonial } from "./actions";

export function StartForm() {
  const [state, action, pending] = useActionState(startTestimonial, null);

  const inputCls =
    "w-full border-b border-zinc-200 bg-transparent py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors";

  return (
    <form action={action} className="space-y-8">
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Your email *
        </label>
        <input
          name="author_email"
          type="email"
          required
          maxLength={200}
          className={inputCls}
          placeholder="you@example.com"
          autoFocus
        />
        <p className="mt-2 font-mono text-[10px] text-zinc-400">
          Kept private. Used to track your progress so you can come back to
          finish later, and for me to reply. Never shown publicly.
        </p>
      </div>

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website (leave blank)
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state?.error && (
        <p className="border-l-2 border-red-500 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-6 py-4 font-mono text-xs tracking-widest uppercase text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 disabled:opacity-50"
      >
        {pending ? "Continuing…" : "Continue"}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
