"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  toggleFeatured,
  togglePublished,
  setModerationStatus,
} from "./actions";
import type { Testimonial } from "@/lib/testimonials";

export function ListRow({
  t,
  categoryLabel,
}: {
  t: Testimonial;
  categoryLabel: string;
}) {
  const [pending, start] = useTransition();
  const isPending = t.moderation_status === "pending";
  const isRejected = t.moderation_status === "rejected";

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-zinc-900">{t.author_name}</p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            {categoryLabel}
          </span>
          {t.moderation_status === "pending" && (
            <span className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest bg-amber-500 text-white">
              pending
            </span>
          )}
          {t.moderation_status === "rejected" && (
            <span className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest bg-red-100 text-red-700">
              rejected
            </span>
          )}
          {t.featured && (
            <span className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest bg-amber-100 text-amber-800">
              featured
            </span>
          )}
          {t.published ? (
            <span className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest bg-zinc-900 text-white">
              live
            </span>
          ) : (
            <span className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest bg-zinc-100 text-zinc-500">
              draft
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{t.quote}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-400">
          {(t.author_role || t.author_company) && (
            <span>
              {[t.author_role, t.author_company].filter(Boolean).join(" · ")}
            </span>
          )}
          {t.author_email && <span>{t.author_email}</span>}
          {t.author_linkedin_url && (
            <a
              href={t.author_linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-zinc-700"
            >
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {isPending && (
          <>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => setModerationStatus(t.id, "approved"))
              }
              className="font-mono text-[10px] uppercase tracking-widest text-emerald-700 transition-colors hover:text-emerald-900 disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => setModerationStatus(t.id, "rejected"))
              }
              className="font-mono text-[10px] uppercase tracking-widest text-red-600 transition-colors hover:text-red-800 disabled:opacity-50"
            >
              ✗ Reject
            </button>
          </>
        )}
        {isRejected && (
          <button
            disabled={pending}
            onClick={() =>
              start(async () => setModerationStatus(t.id, "pending"))
            }
            className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-amber-600 disabled:opacity-50"
          >
            ↺ Re-queue
          </button>
        )}
        {!isPending && !isRejected && (
          <>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => toggleFeatured(t.id, !t.featured))
              }
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-amber-600 disabled:opacity-50"
            >
              {t.featured ? "Unfeature" : "Feature"}
            </button>
            <button
              disabled={pending}
              onClick={() =>
                start(async () => togglePublished(t.id, !t.published))
              }
              className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50"
            >
              {t.published ? "Unpublish" : "Publish"}
            </button>
          </>
        )}
        <Link
          href={`/admin/testimonials/${t.id}`}
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Edit →
        </Link>
      </div>
    </div>
  );
}
