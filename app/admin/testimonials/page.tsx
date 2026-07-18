import type { Metadata } from "next";
import Link from "next/link";
import {
  listAllTestimonials,
  CATEGORY_LABELS,
} from "@/lib/testimonials";
import { ListRow } from "./ListRow";

export const metadata: Metadata = {
  title: "Testimonials — whatelz.ai Admin",
};

export const dynamic = "force-dynamic";

const STATUS_ORDER = { pending: 0, approved: 1, rejected: 2 } as const;

export default async function AdminTestimonialsPage() {
  const items = await listAllTestimonials();

  // Pending first, then approved (featured first), then rejected.
  const sorted = [...items].sort((a, b) => {
    const sa = STATUS_ORDER[a.moderation_status];
    const sb = STATUS_ORDER[b.moderation_status];
    if (sa !== sb) return sa - sb;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });

  const pending = sorted.filter((t) => t.moderation_status === "pending");
  const others = sorted.filter((t) => t.moderation_status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Landing
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Testimonials
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Public submissions land in <strong>Pending</strong>. Approve to
            publish, or edit before publishing. Only featured + approved show on
            the homepage.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Link
              href="/admin/testimonials/invites"
              className="inline-flex items-center gap-1.5 border border-zinc-300 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
              Invites →
            </Link>
            <Link
              href="/admin/testimonials/new"
              className="inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)]"
            >
              + Add manually
            </Link>
          </div>
          <Link
            href="/testimonials/new"
            target="_blank"
            className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Public form ↗
          </Link>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-widest text-amber-600">
              Pending review
            </p>
            <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-[10px] text-amber-800">
              {pending.length}
            </span>
          </div>
          <div className="divide-y divide-zinc-100 rounded border border-amber-200 bg-amber-50/30">
            {pending.map((t) => (
              <ListRow key={t.id} t={t} categoryLabel={CATEGORY_LABELS[t.category]} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Library
        </p>
        {others.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-200 px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">No approved or rejected testimonials yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 rounded border border-zinc-200">
            {others.map((t) => (
              <ListRow key={t.id} t={t} categoryLabel={CATEGORY_LABELS[t.category]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
