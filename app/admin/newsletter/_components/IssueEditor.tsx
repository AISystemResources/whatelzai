"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface IssueEditorProps {
  initial?: {
    id?: string;
    slug?: string;
    title?: string;
    subtitle?: string | null;
    summary?: string | null;
    content?: string;
    status?: "draft" | "sent";
    issue_number?: number;
  };
}

export function IssueEditor({ initial = {} }: IssueEditorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? "");
  const [summary, setSummary] = useState(initial.summary ?? "");
  const [content, setContent] = useState(initial.content ?? "");

  const isEdit = Boolean(initial.id);
  const isSent = initial.status === "sent";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const url = isEdit
        ? `/api/admin/newsletter/${initial.id}`
        : "/api/admin/newsletter";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, title, subtitle, summary, content }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Save failed (${res.status})`);
        return;
      }
      if (!isEdit) {
        const body = (await res.json()) as { issue: { id: string } };
        router.push(`/admin/newsletter/${body.issue.id}`);
      } else {
        router.refresh();
      }
    });
  }

  async function handleSend() {
    if (!initial.id) return;
    if (
      !confirm(
        `Send issue "${title}" to all confirmed subscribers now? This cannot be undone.`,
      )
    )
      return;

    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/newsletter/${initial.id}/send`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Send failed (${res.status})`);
        return;
      }
      const body = (await res.json()) as { sent: number; skipped: number };
      alert(`Sent to ${body.sent} subscriber(s), ${body.skipped} skipped.`);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!initial.id) return;
    if (
      !confirm(
        "Delete this draft permanently? Distributions and any published archive won't be affected.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/newsletter/${initial.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError(`Delete failed (${res.status})`);
        return;
      }
      router.push("/admin/newsletter");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEdit && initial.issue_number && (
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Issue #{String(initial.issue_number).padStart(3, "0")} ·{" "}
          {initial.status}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isSent}
            className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-500"
          />
        </label>
        <label className="space-y-1.5">
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Slug
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            disabled={isSent}
            placeholder="hiring-my-own-c-suite"
            className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 disabled:bg-zinc-50"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Subtitle (optional — appears under the title)
        </span>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          disabled={isSent}
          className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 disabled:bg-zinc-50"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Summary (optional — meta description + archive card blurb)
        </span>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          disabled={isSent}
          className="w-full border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 disabled:bg-zinc-50 resize-y"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Content (Markdown/MDX)
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          required
          disabled={isSent}
          className="w-full border border-zinc-200 rounded px-3 py-2 text-sm font-mono text-zinc-900 focus:outline-none focus:border-zinc-900 disabled:bg-zinc-50 resize-y"
        />
      </label>

      {error && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        {!isSent && (
          <button
            type="submit"
            disabled={pending}
            className="border border-zinc-900 px-5 py-2 font-mono text-xs uppercase tracking-widest text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-40"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create draft"}
          </button>
        )}
        {isEdit && !isSent && (
          <>
            <button
              type="button"
              onClick={handleSend}
              disabled={pending}
              className="border border-emerald-700 bg-emerald-700 px-5 py-2 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-emerald-800 disabled:opacity-40"
            >
              Send to subscribers
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="font-mono text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
            >
              Delete draft
            </button>
          </>
        )}
        {isSent && (
          <p className="font-mono text-xs text-zinc-500">
            This issue has been sent — content is locked. Log distribution URLs
            below.
          </p>
        )}
      </div>
    </form>
  );
}
