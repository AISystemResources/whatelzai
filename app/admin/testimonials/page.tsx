import type { Metadata } from "next";
import Link from "next/link";
import { listTestimonials, CATEGORY_LABELS } from "@/lib/testimonials";
import { ListRow } from "./ListRow";

export const metadata: Metadata = {
  title: "Testimonials — whatelz.ai Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const items = await listTestimonials(false);

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
            Featured + published testimonials show on the homepage. Others stay
            in the library.
          </p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)]"
        >
          + Add testimonial
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No testimonials yet.</p>
          <p className="mt-1 text-xs text-zinc-400">
            Add one to see it on the homepage.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 rounded border border-zinc-200">
          {items.map((t) => (
            <ListRow key={t.id} t={t} categoryLabel={CATEGORY_LABELS[t.category]} />
          ))}
        </div>
      )}
    </div>
  );
}
