import { LeadSharing } from "@/components/leads/ProfileControls";
import { LeadAvatar } from "@/components/leads/LeadAvatar";
import { visibilitySettings, loadSharedLeads } from "@/lib/leads/sharing";
import Link from "next/link";
import { LeadCard } from "@/components/leads/LeadCard";
import { groupPlans } from "@/lib/leads/plans";
import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { loadLeads } from "@/lib/leads/server";
import { regions, stages, todayUtc8 } from "@/lib/leads/model";
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
  const [settings, shared] = await Promise.all([
    visibilitySettings(),
    loadSharedLeads(),
  ]);
  const today = todayUtc8();
  const plans = groupPlans(data.upcoming);
  const priority = data.leads.filter((lead) => lead.is_priority);
  const others = data.leads.filter((lead) => !lead.is_priority);
  const filtered = Boolean(data.q || data.region || data.stage);
  const cards = (leads: typeof data.leads) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          plans={plans.filter((plan) => plan.leadId === lead.id)}
          today={today}
        />
      ))}
    </div>
  );
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
          Your priority people and what’s coming up next.
        </p>
      </header>
      <LeadSharing {...settings} />
      <div className="grid items-start gap-3 sm:grid-cols-2">
        <NewLead />
        <details open={filtered} className="rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">
            Search & filter
          </summary>
          <form className="mt-4 grid gap-3 sm:grid-cols-2">
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
        </details>
      </div>
      <p className="text-sm text-zinc-500">
        {data.count} {data.count === 1 ? "lead" : "leads"}
      </p>
      {data.plansUnavailable && (
        <p
          role="status"
          className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          Upcoming plans could not be loaded. Open a profile to check its
          history or reload.
        </p>
      )}
      {priority.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">
              Priority leads{" "}
              <span className="text-sm font-normal text-zinc-400">
                {priority.length}
              </span>
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Plans are your personal record. “Maybe” means tentative;
              attendance is recorded separately.
            </p>
          </div>
          {cards(priority)}
        </section>
      )}
      {others.length > 0 && (
        <details
          open={filtered || priority.length === 0}
          className="rounded-2xl border border-zinc-200 p-4"
        >
          <summary className="cursor-pointer font-semibold">
            {priority.length ? "Other leads" : "All leads"}{" "}
            <span className="text-sm font-normal text-zinc-400">
              {others.length}
            </span>
          </summary>
          <div className="mt-4">{cards(others)}</div>
        </details>
      )}
      {!data.leads.length && (
        <p>No leads match. Try another filter or add your first profile.</p>
      )}
      {shared.length > 0 && (
        <details className="rounded-2xl border border-zinc-200 p-4">
          <summary className="cursor-pointer text-sm font-medium">
            Shared with me{" "}
            <span className="text-zinc-400">{shared.length}</span>
          </summary>
          <p className="mt-3 text-xs text-zinc-500">
            Read-only profiles shared by your team. Showing up to 50 profiles
            from the first 500 permitted leads.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {shared.map(({ photo_path, ...lead }) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center gap-4 rounded-2xl bg-zinc-50 p-4"
              >
                <LeadAvatar
                  lead={{ ...lead, has_photo: Boolean(photo_path) }}
                />
                <div>
                  <h3 className="font-semibold">{lead.name}</h3>
                  <p className="text-xs text-zinc-500">
                    {lead.region} · {lead.stage}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </details>
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
