import type { Metadata } from "next";
import Link from "next/link";
import { listInvites } from "@/lib/testimonial-invites";
import { CATEGORY_LABELS } from "@/lib/testimonials";
import { InviteRow } from "./InviteRow";

export const metadata: Metadata = {
  title: "Invites — Testimonials Admin",
};

export const dynamic = "force-dynamic";

export default async function InvitesListPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  const invites = await listInvites();

  const justCreatedToken = params.created;
  const justCreated = justCreatedToken
    ? invites.find((i) => i.token === justCreatedToken)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Testimonials
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Invites
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create a semi-filled testimonial invite link for a specific person.
            They open the link and only fill what&rsquo;s missing.
          </p>
        </div>
        <Link
          href="/admin/testimonials/invites/new"
          className="inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)]"
        >
          + New invite
        </Link>
      </div>

      {justCreated && (
        <div className="border-l-2 border-emerald-500 bg-emerald-50/50 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-700">
            Invite created
          </p>
          <p className="mt-2 text-sm text-zinc-800">
            Send this link to <strong>{justCreated.prefill.author_name ?? "them"}</strong>:
          </p>
          <p className="mt-2 break-all font-mono text-xs text-zinc-700">
            https://whatelz.ai/testimonials/new?t={justCreated.token}
          </p>
        </div>
      )}

      {invites.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-200 px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No invites yet.</p>
          <Link
            href="/admin/testimonials/invites/new"
            className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
          >
            Create the first →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 rounded border border-zinc-200">
          {invites.map((inv) => (
            <InviteRow
              key={inv.id}
              inv={inv}
              categoryLabel={
                inv.prefill.category
                  ? CATEGORY_LABELS[inv.prefill.category]
                  : "—"
              }
            />
          ))}
        </div>
      )}

      <div className="pt-4">
        <Link
          href="/admin/testimonials"
          className="font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back to testimonials
        </Link>
      </div>
    </div>
  );
}
