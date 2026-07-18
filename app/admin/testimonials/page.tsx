import type { Metadata } from "next";
import Link from "next/link";
import { listAllTestimonials, CATEGORY_LABELS } from "@/lib/testimonials";
import { ListRow } from "./ListRow";

export const metadata: Metadata = {
  title: "Testimonials — whatelz.ai Admin",
};

export const dynamic = "force-dynamic";

type Tab = "pending" | "approved" | "archived";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "archived", label: "Archived" },
];

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab =
    tabParam === "approved" || tabParam === "archived" ? tabParam : "pending";

  const items = await listAllTestimonials();
  const incomplete = items.filter((t) => t.status === "incomplete");
  const pending = items.filter((t) => t.status === "pending");
  const approved = items.filter((t) => t.status === "approved");
  const rejected = items.filter((t) => t.status === "rejected");

  const counts: Record<Tab, number> = {
    pending: pending.length + incomplete.length,
    approved: approved.length,
    archived: rejected.length,
  };

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

      <div className="flex gap-6 border-b border-zinc-200">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={t.id === "pending" ? "?" : `?tab=${t.id}`}
              className={`-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                active
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              {t.label}
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {counts[t.id]}
              </span>
            </Link>
          );
        })}
      </div>

      {tab === "pending" && (
        <>
          {pending.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs uppercase tracking-widest text-amber-600">
                  Pending approval
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

          {pending.length === 0 && incomplete.length === 0 && (
            <EmptyState label="No pending or in-flight testimonials." />
          )}
        </>
      )}

      {tab === "approved" && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-700">
              Approved
            </p>
            <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] text-emerald-800">
              {approved.length}
            </span>
          </div>
          {approved.length === 0 ? (
            <EmptyState label="Nothing approved yet." />
          ) : (
            <div className="divide-y divide-zinc-100 rounded border border-emerald-200 bg-emerald-50/20">
              {approved.map((t) => (
                <ListRow
                  key={t.id}
                  t={t}
                  categoryLabel={CATEGORY_LABELS[t.category]}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "archived" && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              Archived (rejected)
            </p>
            <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
              {rejected.length}
            </span>
          </div>
          {rejected.length === 0 ? (
            <EmptyState label="Nothing archived." />
          ) : (
            <div className="divide-y divide-zinc-100 rounded border border-zinc-200">
              {rejected.map((t) => (
                <ListRow
                  key={t.id}
                  t={t}
                  categoryLabel={CATEGORY_LABELS[t.category]}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded border border-dashed border-zinc-200 px-6 py-12 text-center">
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}
