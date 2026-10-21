"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage } from "@/lib/member-ai/model";
import { acceptCommitment } from "./actions";
const starters = [
  "Help me choose one meaningful outcome today.",
  "Help me reflect on today without assuming what I completed.",
  "What have I committed to, and what needs following up?",
];
export function Chat({
  messages,
  conversationId,
  enabled,
}: {
  messages: ChatMessage[];
  conversationId: string;
  enabled: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const pending = useRef<{ text: string; id: string } | null>(null);
  const router = useRouter();
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !text.trim()) return;
    setBusy(true);
    setNotice("");
    const requestId =
      pending.current?.text === text ? pending.current.id : crypto.randomUUID();
    pending.current = { text, id: requestId };
    try {
      const response = await fetch("/api/member/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, conversationId, text }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error ?? "Your reply could not be prepared.");
      if (result.duplicate && result.status === "running")
        setNotice("Your reply is still being prepared. Refresh shortly.");
      else {
        setText("");
        pending.current = null;
      }
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Connection interrupted. Reload to check the reply before retrying.",
      );
    } finally {
      setBusy(false);
      router.refresh();
    }
  }
  async function accept(message: string, proposal: string) {
    setBusy(true);
    try {
      const result = await acceptCommitment({ message, proposal });
      setNotice(result.error ?? result.success ?? "");
      router.refresh();
    } catch {
      setNotice("Could not save. Please reload and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="space-y-5" aria-label="Conversation" aria-busy={busy}>
        {!messages.length && (
          <div className="rounded-2xl bg-yellow-50 p-5">
            <h2 className="font-semibold">A little clarity. A next step.</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Start with what is on your mind. Your assistant can read your
              commitments and suggest a plan for you to accept.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {starters.map((prompt) => (
                <button
                  key={prompt}
                  disabled={busy}
                  onClick={() => setText(prompt)}
                  className="rounded-xl border border-yellow-300 bg-white p-3 text-left text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <article
            key={message.id}
            className={`min-w-0 rounded-2xl p-4 sm:p-5 ${message.role === "user" ? "ml-6 bg-zinc-100" : "border border-zinc-200 bg-white"}`}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {message.role === "user" ? "You" : "Your assistant"}
            </p>
            <div className="whitespace-pre-wrap break-words text-sm leading-7">
              {message.body}
            </div>
            {message.proposals?.map((proposal) => (
              <div
                key={proposal.id}
                className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4"
              >
                <p className="font-medium">{proposal.title}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {proposal.due_on} · {proposal.lane}
                </p>
                <button
                  disabled={busy}
                  onClick={() => accept(message.id, proposal.id)}
                  className="mt-3 rounded-lg bg-yellow-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Accept commitment
                </button>
              </div>
            ))}
          </article>
        ))}
      </div>
      <form
        onSubmit={send}
        className="sticky bottom-0 mt-6 border-t border-zinc-200 bg-white py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="member-message" className="text-sm font-medium">
          What would help right now?
        </label>
        <textarea
          id="member-message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={6000}
          rows={3}
          disabled={busy || !enabled}
          className="mt-2 w-full resize-y rounded-xl border border-zinc-300 p-3 text-base"
          placeholder="Think out loud…"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Suggestions are drafts. You choose what to commit to.
          </p>
          <button
            disabled={busy || !enabled || !text.trim()}
            className="min-h-11 shrink-0 rounded-xl bg-yellow-300 px-5 font-semibold text-zinc-950 disabled:opacity-50"
          >
            {busy ? "Thinking…" : "Send"}
          </button>
        </div>
        <p role="status" className="mt-2 text-sm text-zinc-700">
          {notice || (!enabled ? "Member AI is currently paused." : "")}
        </p>
      </form>
    </>
  );
}
