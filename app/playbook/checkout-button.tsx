"use client";

import { useState } from "react";

export function CheckoutButton({
  offerSlug,
  priceLabel,
}: {
  offerSlug: string;
  priceLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offer_slug: offerSlug }),
      });
      const json = await res.json();
      if (!res.ok || !json?.url) {
        throw new Error(json?.error ?? "Could not start checkout.");
      }
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center rounded-full bg-zinc-900 px-8 py-4 text-base font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirecting…" : `Get the Playbook — ${priceLabel}`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
