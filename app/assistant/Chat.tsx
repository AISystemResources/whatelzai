"use client";
import Link from "next/link";
import { useState, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, LoaderCircle } from "lucide-react";
import type { ChatMessage } from "@/lib/member-ai/model";
import { acceptCommitment, createConversation } from "./actions";
export function Chat({
  messages,
  conversationId,
  enabled,
  initialPrompt = "",
  name = "",
}: {
  messages: ChatMessage[];
  conversationId: string | null;
  enabled: boolean;
  initialPrompt?: string;
  name?: string;
}) {
  const [text, setText] = useState(initialPrompt);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const sending = useRef(false);
  const pending = useRef<{ text: string; id: string } | null>(null);
  const activeConversation = useRef(conversationId);
  const transcript = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const lastMessage = messages.at(-1)?.id;
  useLayoutEffect(() => {
    if (transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [lastMessage, busy]);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || busy || !enabled || !text.trim()) return;
    sending.current = true;
    setBusy(true);
    setNotice("");
    setSubmitted(text);
    const requestId =
      pending.current?.text === text ? pending.current.id : crypto.randomUUID();
    pending.current = { text, id: requestId };
    try {
      // A blank slate stays ephemeral until the first send. Keep this ID for
      // retrying an interrupted request; never create a new chat on each retry.
      if (!activeConversation.current)
        activeConversation.current = (await createConversation()).id;
      const response = await fetch("/api/member/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          conversationId: activeConversation.current,
          text,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.error ?? "Your reply could not be prepared.");
      if (result.duplicate && result.status === "running")
        setNotice("Your reply is still being prepared. Refresh shortly.");
      else {
        setText("");
        pending.current = null;
        if (textarea.current) textarea.current.style.height = "auto";
      }
      if (activeConversation.current !== conversationId)
        router.replace(`/assistant?chat=${activeConversation.current}`);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Connection interrupted. Check the reply before retrying.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
      setSubmitted(null);
      if (conversationId) router.refresh();
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
    <section
      className="flex min-h-0 flex-1 flex-col"
      aria-label="Chat workspace"
    >
      <div
        ref={transcript}
        role="log"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-5 md:px-5"
        aria-label="Conversation"
        aria-live="polite"
        aria-busy={busy}
      >
        {!messages.length && !submitted && (
          <div className="grid min-h-full place-items-center">
            <div className="max-w-xs pb-10 text-center">
              <span
                className="mx-auto mb-5 block h-3 w-3 rounded-full bg-yellow-300"
                aria-hidden="true"
              />
              <h2 className="text-2xl font-medium leading-snug tracking-tight">
                What’s on your mind{name ? `, ${name}` : ""}?
              </h2>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`min-w-0 ${message.role === "user" ? "ml-10 rounded-3xl bg-zinc-100 px-4 py-3" : "px-1 py-2"}`}
            >
              <p className="sr-only">
                {message.role === "user" ? "You" : "fcOS"}
              </p>
              <div className="whitespace-pre-wrap break-words text-[15px] leading-7">
                {message.body}
              </div>
              {message.role === "assistant" && (
                <details className="mt-2 text-xs text-zinc-500">
                  <summary className="w-fit cursor-pointer py-2">
                    Save as a note
                  </summary>
                  <div className="mt-1 flex gap-4">
                    <Link
                      className="min-h-9 py-2 underline"
                      href={`/briefings/new?kind=HQH&message=${message.id}`}
                    >
                      Review as HQH
                    </Link>
                    <Link
                      className="min-h-9 py-2 underline"
                      href={`/briefings/new?kind=HHH&message=${message.id}`}
                    >
                      Review as HHH
                    </Link>
                  </div>
                </details>
              )}
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
                    className="mt-3 min-h-11 rounded-lg bg-yellow-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Accept commitment
                  </button>
                </div>
              ))}
            </article>
          ))}
          {submitted && (
            <article className="ml-10 rounded-3xl bg-zinc-100 px-4 py-3">
              <p className="sr-only">You</p>
              <p className="whitespace-pre-wrap break-words text-[15px] leading-7">
                {submitted}
              </p>
            </article>
          )}
          {busy && (
            <p className="flex items-center gap-2 px-1 text-sm text-zinc-500">
              <LoaderCircle
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
              Thinking…
            </p>
          )}
        </div>
      </div>
      <form
        onSubmit={send}
        className="fcos-chat-composer shrink-0 bg-white px-1 pt-3 md:px-5"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-[28px] border border-zinc-300 bg-white p-2 shadow-sm focus-within:border-zinc-500">
          <label htmlFor="member-message" className="sr-only">
            Message fcOS
          </label>
          <textarea
            ref={textarea}
            id="member-message"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                window.matchMedia("(min-width:768px)").matches
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            maxLength={6000}
            rows={1}
            disabled={busy || !enabled}
            className="max-h-36 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-6 outline-none disabled:opacity-60"
            placeholder="Message fcOS…"
          />
          <button
            aria-label={busy ? "Preparing reply" : "Send message"}
            title="Send message"
            disabled={busy || !enabled || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-zinc-950 disabled:bg-zinc-100 disabled:text-zinc-400"
          >
            {busy ? (
              <LoaderCircle
                size={20}
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <ArrowUp size={22} aria-hidden="true" />
            )}
          </button>
        </div>
        <p
          role="status"
          className="mx-auto max-w-3xl px-2 pt-2 text-xs leading-5 text-zinc-600"
        >
          {notice || (!enabled ? "Chat is currently paused." : "")}
        </p>
      </form>
    </section>
  );
}
