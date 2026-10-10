import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { loadLeads } from "@/lib/leads/server";
import { regions, stages, todayUtc8, dateLabel } from "@/lib/leads/model";
import { MemberNav } from "@/components/culture/MemberNav";
import { NewLead } from "@/components/leads/LeadForms";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Leads",
  robots: { index: false, follow: false },
};
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    region?: string;
    stage?: string;
    page?: string;
  }>;
}) {
  if (!(await ensureUserRow())) redirect("/sign-in?redirect_url=/leads");
  const data = await loadLeads(await searchParams);
  const today = todayUtc8();
  const pageLink = (page: number) =>
    `/leads?${new URLSearchParams({ q: data.q, region: data.region, stage: data.stage, page: String(page) })}`;
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-10 sm:px-8">
      <MemberNav current="/leads" />
      <header>
        <p className="text-sm text-zinc-500">
          Network Marketing · Private to you
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Leads</h1>
        <p className="mt-3 text-zinc-600">
          Keep their story, remember your conversations and choose a thoughtful
          next step toward ABO or APC.
        </p>
      </header>
      <NewLead />
      <form className="grid gap-3 sm:grid-cols-4">
        <label>
          Search names
          <input
            name="q"
            defaultValue={data.q}
            className="mt-1 w-full rounded-lg border p-2"
          />
        </label>
        <label>
          Community
          <select
            name="region"
            defaultValue={data.region}
            className="mt-1 w-full rounded-lg border p-2"
          >
            <option value="">All communities</option>
            {regions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Stage
          <select
            name="stage"
            defaultValue={data.stage}
            className="mt-1 w-full rounded-lg border p-2"
          >
            <option value="">All stages</option>
            {stages.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <button className="self-end rounded-lg bg-zinc-900 p-2 text-white">
          Filter
        </button>
      </form>
      <p className="text-sm text-zinc-500">
        {data.count} {data.count === 1 ? "lead" : "leads"}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className="rounded-xl border p-5 transition hover:border-zinc-500"
          >
            <div className="flex justify-between gap-3">
              <h2 className="text-lg font-semibold">{lead.name}</h2>
              <span className="text-sm text-zinc-500">{lead.stage}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              {lead.region} ·{" "}
              {lead.membership === "Unknown"
                ? "Membership unknown"
                : lead.membership}
            </p>
            <p className="mt-2 text-sm">Goal: {lead.goal}</p>
            {lead.next_action && <p className="mt-4">{lead.next_action}</p>}
            {lead.follow_up_on && (
              <p
                className={`mt-2 text-sm ${lead.follow_up_on <= today && !["ABO", "APC", "Not now"].includes(lead.stage) ? "font-semibold text-amber-800" : "text-zinc-500"}`}
              >
                {lead.follow_up_on < today
                  ? "Past follow-up date · "
                  : lead.follow_up_on === today
                    ? "Due today · "
                    : "Follow up · "}
                {dateLabel(lead.follow_up_on)}
              </p>
            )}
          </Link>
        ))}
      </div>
      {!data.leads.length && (
        <p>No leads match. Try another filter or add your first profile.</p>
      )}
      <nav aria-label="Leads pages" className="flex gap-4">
        {data.page > 1 && (
          <Link href={pageLink(data.page - 1)}>← Previous</Link>
        )}
        {data.page * 50 < data.count && (
          <Link href={pageLink(data.page + 1)}>Next →</Link>
        )}
      </nav>
    </main>
  );
}
