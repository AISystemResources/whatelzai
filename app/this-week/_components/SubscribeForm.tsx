"use client";

import { useState } from "react";

export function SubscribeForm({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, source }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? `Subscribe failed (${res.status})`);
        setState("error");
        return;
      }
      setState("ok");
      setEmail("");
      setName("");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  if (state === "ok") {
    return (
      <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        You&apos;re on the list. First issue lands in your inbox as soon as
        it&apos;s ready.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@work.com"
          className="flex-1 border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          disabled={state === "submitting"}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name (optional)"
          className="flex-1 border border-zinc-300 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          disabled={state === "submitting"}
        />
      </div>
      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full border border-zinc-900 bg-zinc-900 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
      >
        {state === "submitting" ? "Subscribing…" : "Subscribe"}
      </button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
        One email per week. Unsubscribe with one click.
      </p>
    </form>
  );
}
