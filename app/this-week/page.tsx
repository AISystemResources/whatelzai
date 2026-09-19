import type { Metadata } from "next";
import Link from "next/link";
import { listIssues } from "@/lib/newsletter";
import { getSiteIdentity } from "@/lib/site-identity";
import { FieldHero } from "@/components/editorial/FieldElements";
import { SubscribeForm } from "./_components/SubscribeForm";

export const dynamic = "force-dynamic";

const SITE_URL = "https://whatelz.ai";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteIdentity();
  const title = `What ELZ This Week? — ${s.owner_name}`;
  const description =
    "Weekly dispatch on how solopreneurs run big operations with AI as the team. From the trenches of whatelz.ai.";
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/this-week` },
    openGraph: {
      type: "website",
      url: `${SITE_URL}/this-week`,
      title,
      description,
      siteName: "whatelz.ai",
    },
  };
}

export default async function ThisWeekLandingPage() {
  const issues = await listIssues(false);
  const latest = issues[0];

  return (
    <main>
      <FieldHero
        label="The weekly dispatch"
        title="A letter from the middle of it."
        description="What ELZ This Week? The experiments, lessons and useful discoveries from my solopreneur journey. Follow along as I put Money Mindset and AI Skillset into practice."
        number="06"
      >
        <div className="mt-8 max-w-md">
          <SubscribeForm source="this-week-hero" />
        </div>
      </FieldHero>

      {/* ── Latest issue ──────────────────────────────────────────────── */}
      {latest && (
        <section className="border-b border-zinc-200 px-6 py-16 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              Latest issue
            </p>
            <Link
              href={`/this-week/${latest.slug}`}
              className="group mt-4 block"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    #{String(latest.issue_number).padStart(3, "0")} ·{" "}
                    {latest.published_at
                      ? new Date(latest.published_at).toLocaleDateString(
                          "en-SG",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : ""}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-amber-500 sm:text-3xl">
                    {latest.title}
                  </h2>
                  {latest.subtitle && (
                    <p className="mt-2 text-zinc-600">{latest.subtitle}</p>
                  )}
                  {latest.summary && (
                    <p className="mt-3 text-zinc-500">{latest.summary}</p>
                  )}
                </div>
                <span
                  className="mt-3 shrink-0 text-zinc-300 transition-colors group-hover:text-amber-400"
                  aria-hidden="true"
                >
                  →
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Archive ───────────────────────────────────────────────────── */}
      <section className="px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Archive
          </p>
          {issues.length === 0 ? (
            <p className="mt-6 text-zinc-500">
              Issue #001 dropping soon. Subscribe above to get it in your inbox.
            </p>
          ) : issues.length === 1 ? (
            <p className="mt-6 text-zinc-500">
              This is the first one. Grab it, subscribe, and see you next week.
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-zinc-100">
              {issues.slice(1).map((issue) => (
                <li key={issue.id} className="group py-8">
                  <Link href={`/this-week/${issue.slug}`} className="block">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                          #{String(issue.issue_number).padStart(3, "0")} ·{" "}
                          {issue.published_at
                            ? new Date(issue.published_at).toLocaleDateString(
                                "en-SG",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : ""}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-amber-500">
                          {issue.title}
                        </h3>
                        {issue.summary && (
                          <p className="mt-1 text-sm text-zinc-500">
                            {issue.summary}
                          </p>
                        )}
                      </div>
                      <span
                        className="mt-2 shrink-0 text-zinc-300 transition-colors group-hover:text-amber-400"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
