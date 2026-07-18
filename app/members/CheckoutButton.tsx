"use client";

import { useState, useTransition } from "react";

export function CheckoutButton({
  offerId,
  label = "Subscribe →",
}: {
  offerId: string;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onClick() {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ offer_id: offerId }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Checkout unavailable");
        }
        window.location.href = data.url;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Checkout unavailable");
      }
    });
  }

  return (
    <div>
      <button
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)] disabled:opacity-50"
      >
        {pending ? "Opening Stripe…" : label}
      </button>
      {error && (
        <p className="mt-3 font-mono text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
