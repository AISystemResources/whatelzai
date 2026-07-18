import type { Metadata } from "next";
import Link from "next/link";
import { listAllTestimonials, CATEGORY_LABELS } from "@/lib/testimonials";
import { ListRow } from "./ListRow";

export const metadata: Metadata = {
  title: "Testimonials — whatelz.ai Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const items = await listAllTestimonials();
  const incomplete = items.filter((t) => t.status === "incomplete");
  const pending = items.filter((t) => t.status === "pending");
  const library = items.filter(
    (t) => t.status === "approved" || t.status === "rejected",
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Landing
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Testimonials
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create a prefill → send the link → they complete it → approve to
            publish.
          </p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)]"
        >
          + New prefill
        </Link>
      </div>

      {/* Waiting on them */}
      {incomplete.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Waiting on them
            </p>
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
              {incomplete.length}
            </span>
          </div>
          <div className="divide-y divide-zinc-100 rounded border border-zinc-200">
            {incomplete.map((t) => (
              <ListRow
                key={t.id}
                t={t}
                categoryLabel={CATEGORY_LABELS[t.category]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pending review */}
      {pending.length > 0 && (
        <section className="space-y-3">
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
              <ListRow
                key={t.id}
                t={t}
                categoryLabel={CATEGORY_LABELS[t.category]}
              />
            ))}
          </div>
        </section>
      )}

      {/* Library */}
      <section className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Library
        </p>
        {library.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-200 px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">Nothing here yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 rounded border border-zinc-200">
            {library.map((t) => (
              <ListRow
                key={t.id}
                t={t}
                categoryLabel={CATEGORY_LABELS[t.category]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
