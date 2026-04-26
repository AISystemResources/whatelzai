"use client";

import { useState } from "react";

type Intent = "hire" | "collab" | "service" | "other";

const INTENTS: { value: Intent; label: string }[] = [
  { value: "hire", label: "Hire" },
  { value: "collab", label: "Collaborate" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

export function ContactForm() {
  const [intent, setIntent] = useState<Intent>("hire");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, intent, message }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Request failed");
      }

      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-10 border border-zinc-200 px-6 py-8 dark:border-zinc-800">
        <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">Sent</p>
        <p className="mt-2 text-base text-zinc-700 dark:text-zinc-300">
          Got it — I&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6 max-w-xl">
      {/* Intent selector */}
      <div className="flex flex-wrap gap-2">
        {INTENTS.map((i) => (
          <button
            key={i.value}
            type="button"
            onClick={() => setIntent(i.value)}
            className={`px-4 py-2 font-mono text-xs tracking-widest uppercase border transition-colors ${
              intent === i.value
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-100"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="block font-mono text-xs tracking-widest text-zinc-500 uppercase mb-1">
            Name
          </label>
          <input
            id="cf-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-100"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="cf-email" className="block font-mono text-xs tracking-widest text-zinc-500 uppercase mb-1">
            Email
          </label>
          <input
            id="cf-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-100"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-message" className="block font-mono text-xs tracking-widest text-zinc-500 uppercase mb-1">
          Message
        </label>
        <textarea
          id="cf-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:text-zinc-100 dark:focus:border-zinc-100 resize-none"
          placeholder="What's on your mind?"
        />
      </div>

      {status === "error" && (
        <p className="font-mono text-xs text-red-500">
          Something went wrong — try emailing directly at elz.work22@gmail.com
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-100 dark:hover:text-zinc-900"
      >
        {status === "sending" ? "Sending…" : "Send message"}
        <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
