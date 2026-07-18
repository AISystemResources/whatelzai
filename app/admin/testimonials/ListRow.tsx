"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toggleFeatured, togglePublished } from "./actions";
import type { Testimonial } from "@/lib/testimonials";

export function ListRow({
  t,
  categoryLabel,
}: {
  t: Testimonial;
  categoryLabel: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-zinc-900">
            {t.author_name}
          </p>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            {categoryLabel}
          </span>
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
        {(t.author_role || t.author_company) && (
          <p className="mt-1 font-mono text-[10px] text-zinc-400">
            {[t.author_role, t.author_company].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await toggleFeatured(t.id, !t.featured);
            })
          }
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-amber-600 disabled:opacity-50"
        >
          {t.featured ? "Unfeature" : "Feature"}
        </button>
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              await togglePublished(t.id, !t.published);
            })
          }
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50"
        >
          {t.published ? "Unpublish" : "Publish"}
        </button>
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
