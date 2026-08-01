import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getIssueBySlug, listDistributions } from "@/lib/newsletter";
import { getSiteIdentity } from "@/lib/site-identity";
import { SubscribeForm } from "../_components/SubscribeForm";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

const SITE_URL = "https://whatelz.ai";

const PLATFORM_LABEL: Record<string, string> = {
  linkedin: "LinkedIn",
  medium: "Medium",
  substack: "Substack",
  beehiiv: "Beehiiv",
  resend: "Email",
  whatelz: "whatelz.ai",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [issue, site] = await Promise.all([
    getIssueBySlug(slug),
    getSiteIdentity(),
  ]);
  if (!issue || issue.status !== "sent") return {};

  const url = `${SITE_URL}/this-week/${slug}`;
  const ogUrl = `${SITE_URL}/api/og?eyebrow=${encodeURIComponent(`What ELZ This Week? #${String(issue.issue_number).padStart(3, "0")}`)}&title=${encodeURIComponent(issue.title)}&subtitle=${encodeURIComponent(issue.subtitle || issue.summary || "")}`;

  return {
    title: `${issue.title} — What ELZ This Week?`,
    description: issue.summary || issue.subtitle || undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: issue.title,
      description: issue.summary || issue.subtitle || undefined,
      publishedTime: issue.published_at || undefined,
      authors: [site.owner_name],
      images: [{ url: ogUrl, width: 1200, height: 630, alt: issue.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: issue.title,
      description: issue.summary || issue.subtitle || undefined,
      images: [ogUrl],
    },
  };
}

export default async function ThisWeekIssuePage({ params }: Props) {
  const { slug } = await params;
  const [issue, site] = await Promise.all([
    getIssueBySlug(slug),
    getSiteIdentity(),
  ]);

  if (!issue || issue.status !== "sent") notFound();

  const distributions = await listDistributions(issue.id);
  const externalDist = distributions.filter(
    (d) =>
      d.external_url && d.platform !== "whatelz" && d.platform !== "resend",
  );

  const url = `${SITE_URL}/this-week/${slug}`;
  const ogUrl = `${SITE_URL}/api/og?eyebrow=${encodeURIComponent(`What ELZ This Week? #${String(issue.issue_number).padStart(3, "0")}`)}&title=${encodeURIComponent(issue.title)}&subtitle=${encodeURIComponent(issue.subtitle || issue.summary || "")}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: issue.title,
        description: issue.summary || issue.subtitle || undefined,
        image: [ogUrl],
        datePublished: issue.published_at || undefined,
        dateModified: issue.updated_at || issue.published_at || undefined,
        mainEntityOfPage: url,
        url,
        isPartOf: {
          "@type": "PublicationIssue",
          issueNumber: issue.issue_number,
          isPartOf: {
            "@type": "Periodical",
            name: "What ELZ This Week?",
            url: `${SITE_URL}/this-week`,
          },
        },
        author: {
          "@type": "Person",
          "@id": `${SITE_URL}/#person`,
          name: site.owner_name,
          url: SITE_URL,
        },
        publisher: {
          "@type": "Person",
          "@id": `${SITE_URL}/#person`,
          name: site.owner_name,
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "What ELZ This Week?",
            item: `${SITE_URL}/this-week`,
          },
          { "@type": "ListItem", position: 3, name: issue.title, item: url },
        ],
      },
    ],
  };

  return (
    <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-4xl">
        <Link
          href="/this-week"
          className="font-mono text-xs uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900"
        >
          ← What ELZ This Week?
        </Link>

        <header className="mt-8 mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            #{String(issue.issue_number).padStart(3, "0")} ·{" "}
            {issue.published_at
              ? new Date(issue.published_at).toLocaleDateString("en-SG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {issue.title}
          </h1>
          {issue.subtitle && (
            <p className="mt-3 text-lg text-zinc-600">{issue.subtitle}</p>
          )}
          {issue.summary && (
            <p className="mt-3 text-zinc-500">{issue.summary}</p>
          )}
        </header>

        <div
          className="space-y-5 text-zinc-700
          [&_a]:text-[var(--accent-text)] [&_a]:underline [&_a:hover]:no-underline
          [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500
          [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm
          [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-zinc-900
          [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-zinc-900
          [&_hr]:border-zinc-200
          [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal
          [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-100 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm
          [&_pre_code]:bg-transparent [&_pre_code]:p-0
          [&_strong]:font-semibold [&_strong]:text-zinc-900
          [&_ul]:space-y-1"
        >
          <MDXRemote source={issue.content} />
        </div>

        {externalDist.length > 0 && (
          <div className="mt-16 border-t border-zinc-100 pt-8">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              Also on
            </p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {externalDist.map((d) => (
                <li key={d.id}>
                  <a
                    href={d.external_url!}
                    target="_blank"
                    rel="noopener"
                    className="border border-zinc-200 px-3 py-1.5 font-mono text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-900"
                  >
                    {PLATFORM_LABEL[d.platform] ?? d.platform} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-16 border-t border-zinc-100 pt-8">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Subscribe to future issues
          </p>
          <div className="mt-4 max-w-md">
            <SubscribeForm source={`this-week-issue-${issue.slug}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
