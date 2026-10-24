import { briefPreview } from "@/lib/admin-overview/preview";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { BriefMarkdown } from "@/components/admin/BriefMarkdown";
import Link from "@/components/admin/AdminLink";
import { Suspense } from "react";
import type { Metadata } from "next";
import { dailyOwner } from "@/lib/daily/server";
import { adminUrl } from "@/lib/admin-url";
import {
  loadAdminOverviewSources,
  collectAdminOverview,
  type OverviewSources,
} from "@/lib/admin-overview/server";
import { AdminSectionLoading } from "@/components/admin/AdminSectionLoading";
import {
  briefStatus,
  productSignal,
  type Source,
} from "@/lib/admin-overview/model";
import type { Brief } from "@/lib/daily/model";
import { ProductSummary } from "@/components/admin/ProductSummary";
export const metadata: Metadata = {
  title: "Overview — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function OverviewPage() {
  await dailyOwner();
  return (
    <div className="space-y-8 text-zinc-950">
      <header className="admin-overview-intro rounded-3xl bg-yellow-300 px-6 py-7 sm:px-8 lg:rounded-none lg:border-b lg:border-zinc-200 lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em]">
          Your AI business · Whatelzai + EMDEE
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-4xl">
          Your command centre.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6">
          What needs your attention today, and what would move your AI business
          forward?
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={adminUrl("/admin/today")}
            className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white"
          >
            Open Today →
          </Link>
          <Link
            href={adminUrl("/admin/ai-business")}
            className="rounded-xl border border-zinc-950/25 px-4 py-3 text-sm font-semibold"
          >
            AI business tools
          </Link>
        </div>
      </header>
      <Suspense
        fallback={
          <AdminLoading title="Checking your commitments, briefs and business signals…" />
        }
      >
        <DecisionWorkspace />
      </Suspense>
    </div>
  );
}
async function DecisionWorkspace() {
  const sources = await loadAdminOverviewSources();
  const now = new Date(sources.loadedAt);
  return (
    <div className="admin-overview-grid">
      <p className="admin-overview-timestamp text-xs text-zinc-500">
        {now.toLocaleString("en-SG", {
          timeZone: "Asia/Singapore",
          dateStyle: "full",
          timeStyle: "short",
        })}{" "}
        · Refresh this page to check for changes.
      </p>

      <Suspense
        fallback={
          <AdminSectionLoading
            label="Checking commitments…"
            className="admin-overview-focus"
          />
        }
      >
        <FocusSection sources={sources} />
      </Suspense>
      <Suspense
        fallback={
          <AdminSectionLoading
            label="Checking attention items…"
            className="admin-overview-attention"
          />
        }
      >
        <AttentionSection sources={sources} />
      </Suspense>
      <DailySection sources={sources} />
      <Suspense
        fallback={
          <AdminSectionLoading
            label="Checking work in progress…"
            className="admin-overview-growth"
          />
        }
      >
        <GrowthSection sources={sources} />
      </Suspense>
      <ProductsSection sources={sources} />
    </div>
  );
}
async function FocusSection({ sources }: { sources: OverviewSources }) {
  const overview = { day: sources.day, focus: await sources.focus };
  const focus = overview.focus.status === "ready" ? overview.focus.data : null;
  const todayHref = adminUrl("/admin/today#commitments");
  return (
    <section
      aria-labelledby="focus-heading"
      className="admin-overview-focus rounded-2xl border border-zinc-200 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="focus-heading" className="text-2xl font-semibold">
          Your AI-business focus
        </h2>
        <Link href={todayHref} className="text-sm underline underline-offset-4">
          Review commitments →
        </Link>
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Accepted, open commitments due today or earlier. You choose what to
        commit to.
      </p>
      {focus?.focus.length ? (
        <ol className="mt-5 space-y-3">
          {focus.focus.map((task, i) => (
            <li
              key={task.id}
              className="flex gap-4 rounded-xl bg-yellow-50 p-4"
            >
              <span className="text-xl font-semibold text-yellow-700">
                0{i + 1}
              </span>
              <div className="min-w-0">
                <p className="break-words font-medium">{task.title}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {task.due_on < overview.day
                    ? `Overdue · ${task.due_on}`
                    : "Due today"}{" "}
                  · Accepted
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 rounded-xl bg-yellow-50 p-4 text-sm leading-6">
          {focus
            ? "No accepted, open AI-business commitment is due. Choose one useful outcome in Today, or review anything blocked or waiting below."
            : "Your commitments could not be loaded. Existing priorities have not been changed."}
        </p>
      )}
      {focus && (
        <p className="mt-4 text-xs text-zinc-500">
          {focus.completed} explicitly completed today · Showing{" "}
          {focus.focus.length} of {focus.actionable} actionable commitments in
          the loaded set (up to 100 unfinished records across your lanes).
        </p>
      )}
      {!!focus?.upcoming.length && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer">Coming up</summary>
          <ul className="mt-2 space-y-2 text-zinc-600">
            {focus.upcoming.map((task) => (
              <li key={task.id}>
                {task.due_on} · {task.title}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
async function AttentionSection({ sources }: { sources: OverviewSources }) {
  const overview = await collectAdminOverview(sources);
  const now = new Date(overview.loadedAt);
  const focus = overview.focus.status === "ready" ? overview.focus.data : null;
  const todayHref = adminUrl("/admin/today#commitments");
  const attention: { title: string; detail: string; href: string }[] = [];
  if (!focus)
    attention.push({
      title: "Commitments unavailable",
      detail:
        "Your priorities could not be checked. Refresh before deciding what is due.",
      href: todayHref,
    });
  else {
    if (focus.overdue)
      attention.push({
        title: `${focus.overdue} overdue AI-business commitment${focus.overdue === 1 ? "" : "s"}`,
        detail:
          "Review the next step or explicitly move the date. Overdue does not mean failed.",
        href: todayHref,
      });
    if (focus.blocked || focus.waiting)
      attention.push({
        title: `${focus.blocked} blocked · ${focus.waiting} waiting`,
        detail:
          "Due commitments need a decision, missing input or a follow-up.",
        href: todayHref,
      });
    if (focus.proposals)
      attention.push({
        title: `${focus.proposals} AI-business proposal${focus.proposals === 1 ? "" : "s"} to review`,
        detail: "Choose what to accept. Proposals are not commitments.",
        href: todayHref,
      });
  }
  const morningStatus = briefStatus(overview.morning, "morning", now);
  if (["Unavailable", "No saved entry found"].includes(morningStatus))
    attention.push({
      title:
        morningStatus === "Unavailable"
          ? "Morning brief could not be checked"
          : "No morning brief found for today",
      detail:
        "Open Today to check your saved EMDEE entry. This dashboard does not verify that a scheduled task ran.",
      href: adminUrl("/admin/today#morning"),
    });
  if (briefStatus(overview.evening, "evening", now) === "No saved entry found")
    attention.push({
      title: "Evening closeout is still open",
      detail: "Capture what happened and make tomorrow's handoff explicit.",
      href: adminUrl("/admin/today#evening"),
    });
  for (const [key, label] of [
    ["whatelz", "Whatelzai"],
    ["emdee", "EMDEE"],
  ] as const) {
    const signal = productSignal(overview.products[key], now);
    if (signal !== "available")
      attention.push({
        title: `${label} metrics ${signal === "stale" ? "need a fresh update" : "are unavailable"}`,
        detail:
          "Treat missing or old metrics as unknown. Check the product connection before drawing conclusions.",
        href: adminUrl("/admin/settings"),
      });
  }
  return (
    <section
      aria-labelledby="attention-heading"
      className="admin-overview-attention min-w-0"
    >
      <h2 id="attention-heading" className="text-2xl font-semibold">
        Needs your attention
      </h2>
      <div className="mt-4 grid gap-3">
        {attention.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 transition-colors hover:bg-amber-50"
          >
            <h3 className="font-semibold">{item.title} →</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {item.detail}
            </p>
          </Link>
        ))}
      </div>
      {!attention.length && (
        <p className="mt-3 text-sm text-zinc-500">
          No attention items found in the checked sources. This does not include
          email, sales conversations or untracked work.
        </p>
      )}
    </section>
  );
}
function DailySection({ sources }: { sources: OverviewSources }) {
  const now = new Date(sources.loadedAt);
  return (
    <section
      aria-labelledby="daily-heading"
      className="admin-overview-daily min-w-0"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <h2 id="daily-heading" className="text-2xl font-semibold">
          Prepare. Follow through. Reflect.
        </h2>
        <Link
          href={adminUrl("/admin/today/weekly")}
          className="text-sm underline"
        >
          Weekly reflection →
        </Link>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Suspense
          fallback={<AdminSectionLoading label="Reading morning brief…" />}
        >
          <StreamedBrief source={sources.morning} kind="morning" now={now} />
        </Suspense>
        <Suspense
          fallback={<AdminSectionLoading label="Reading evening closeout…" />}
        >
          <StreamedBrief source={sources.evening} kind="evening" now={now} />
        </Suspense>
      </div>
      <Suspense
        fallback={<AdminSectionLoading label="Reading yesterday’s handoff…" />}
      >
        <HandoffPreview source={sources.handoff} />
      </Suspense>
      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Daily entries are read from EMDEE. Morning 4:30am · evening 9pm · weekly
        Monday 3am, Singapore. Entry availability is not proof of unattended
        schedule execution. No AI API calls run on this page.
      </p>
    </section>
  );
}
async function StreamedBrief({
  source,
  kind,
  now,
}: {
  source: OverviewSources["morning"];
  kind: "morning" | "evening";
  now: Date;
}) {
  const saved = await source;
  return (
    <BriefPreview
      title={kind === "morning" ? "Morning preparation" : "Evening closeout"}
      status={briefStatus(saved, kind, now)}
      source={saved}
      href={adminUrl(`/admin/today#${kind}`)}
    />
  );
}
async function HandoffPreview({
  source,
}: {
  source: OverviewSources["handoff"];
}) {
  const overview = { handoff: await source };
  return (
    <details className="mt-4 rounded-2xl border p-5">
      <summary className="cursor-pointer text-sm font-medium">
        Yesterday’s handoff
      </summary>
      <div className="mt-3 max-h-64 overflow-y-auto">
        {overview.handoff.status !== "ready" ? (
          "EMDEE could not be checked."
        ) : overview.handoff.data.exists ? (
          <BriefMarkdown
            body={
              briefPreview(overview.handoff.data.body) ||
              "The saved entry has no Notes content."
            }
          />
        ) : (
          "No saved evening entry was found for yesterday."
        )}
      </div>
      <Link
        href={adminUrl("/admin/today")}
        className="mt-3 inline-block text-sm underline"
      >
        Read the full handoff →
      </Link>
    </details>
  );
}
async function GrowthSection({ sources }: { sources: OverviewSources }) {
  const overview = { growth: await sources.growth };
  const todayHref = adminUrl("/admin/today#commitments");
  return (
    <section
      aria-labelledby="growth-heading"
      className="admin-overview-growth min-w-0"
    >
      <h2 id="growth-heading" className="text-2xl font-semibold">
        Build trust. Start conversations.
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Work already in progress, ready for your review. Nothing is published or
        sent from this overview.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <GrowthCard
          title="Blog drafts"
          source={overview.growth.blog}
          href="/admin/blog"
          detail="Turn an experience or useful AI learning into something people can use."
        />
        <GrowthCard
          title="Newsletter drafts"
          source={overview.growth.newsletter}
          href="/admin/newsletter"
          detail="Review your next issue and keep showing up for your audience."
        />
        <GrowthCard
          title="Testimonials to review"
          source={overview.growth.testimonials}
          href="/admin/testimonials"
          detail="Review submitted feedback. Incomplete requests are not counted as submissions."
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link
          href={adminUrl("/admin/events")}
          className="rounded-xl border px-4 py-3"
        >
          Plan an activity →
        </Link>
        <Link
          href={adminUrl("/admin/services")}
          className="rounded-xl border px-4 py-3"
        >
          Review your offers →
        </Link>
        <Link href={todayHref} className="rounded-xl border px-4 py-3">
          Choose a relationship-building action →
        </Link>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Customer conversations and sales opportunities are not connected here
        yet. Member leads belong to the separate app workspace.
      </p>
    </section>
  );
}
function ProductsSection({ sources }: { sources: OverviewSources }) {
  return (
    <section
      aria-labelledby="products-heading"
      className="admin-overview-products min-w-0"
    >
      <h2 id="products-heading" className="text-2xl font-semibold">
        Your products
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        Check activity and connection health. Unmeasured values stay unknown.
      </p>
      <div className="mt-4 grid gap-4">
        <Suspense
          fallback={<AdminSectionLoading label="Checking Whatelzai metrics…" />}
        >
          <StreamedProduct
            product="whatelz"
            label="whatelz.ai"
            source={sources.whatelz}
            adminHref={adminUrl("/admin/site-dashboard")}
          />
        </Suspense>
        <Suspense
          fallback={<AdminSectionLoading label="Checking EMDEE metrics…" />}
        >
          <StreamedProduct
            product="emdee"
            label="EMDEE"
            source={sources.emdee}
            adminHref="https://emdee.tech/admin"
          />
        </Suspense>
      </div>
    </section>
  );
}
async function StreamedProduct({
  source,
  ...props
}: {
  source: OverviewSources["whatelz"];
  product: string;
  label: string;
  adminHref: string;
}) {
  return <ProductSummary {...props} state={await source} />;
}
function BriefPreview({
  title,
  status,
  source,
  href,
}: {
  title: string;
  status: string;
  source: Source<Brief>;
  href: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
          {status}
        </span>
      </div>
      <div className="mt-3 max-h-64 overflow-y-auto">
        {source.status === "ready" && source.data.exists ? (
          <BriefMarkdown
            body={
              briefPreview(source.data.body) ||
              "The saved entry has no Notes content."
            }
          />
        ) : (
          "Open Today to read, prepare or check the entry."
        )}
      </div>
      <Link href={href} className="mt-4 inline-block text-sm underline">
        Read full entry in Today →
      </Link>
    </article>
  );
}
function GrowthCard({
  title,
  source,
  href,
  detail,
}: {
  title: string;
  source: Source<number>;
  href: string;
  detail: string;
}) {
  return (
    <Link
      href={adminUrl(href)}
      className="rounded-2xl border p-5 transition-colors hover:border-yellow-500"
    >
      <p className="text-3xl font-semibold">
        {source.status === "ready" ? source.data : "—"}
      </p>
      <h3 className="mt-2 font-medium">{title} →</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {source.status === "ready"
          ? detail
          : "This source could not be checked. Refresh or open its workspace."}
      </p>
    </Link>
  );
}
