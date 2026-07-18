"use client";

import { useState, useTransition } from "react";

export function ManageBillingButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onClick() {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Portal unavailable");
        }
        window.location.href = data.url;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Portal unavailable");
      }
    });
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900 disabled:opacity-50"
      >
        {pending ? "Opening…" : "Manage billing →"}
      </button>
      {error && (
        <p className="mt-3 font-mono text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
