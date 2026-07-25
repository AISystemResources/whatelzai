import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPost, getAllPosts } from "@/lib/blog";
import { getSiteIdentity } from "@/lib/site-identity";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

const SITE_URL = "https://whatelz.ai";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [result, site] = await Promise.all([getPost(slug), getSiteIdentity()]);
  if (!result) return {};
  const url = `${SITE_URL}/blog/${slug}`;
  const ogUrl = `${SITE_URL}/api/og?eyebrow=${encodeURIComponent("Blog")}&title=${encodeURIComponent(result.meta.title)}&subtitle=${encodeURIComponent(result.meta.summary || "")}`;
  return {
    title: `${result.meta.title} — ${site.owner_name}`,
    description: result.meta.summary || undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: result.meta.title,
      description: result.meta.summary || undefined,
      publishedTime: result.meta.date || undefined,
      tags: result.meta.tags,
      authors: [site.owner_name],
      images: [
        { url: ogUrl, width: 1200, height: 630, alt: result.meta.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: result.meta.title,
      description: result.meta.summary || undefined,
      images: [ogUrl],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [result, site] = await Promise.all([getPost(slug), getSiteIdentity()]);

  if (!result) notFound();

  const { meta, content } = result;
  const url = `${SITE_URL}/blog/${slug}`;
  const ogUrl = `${SITE_URL}/api/og?eyebrow=${encodeURIComponent("Blog")}&title=${encodeURIComponent(meta.title)}&subtitle=${encodeURIComponent(meta.summary || "")}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: meta.title,
        description: meta.summary || undefined,
        image: [ogUrl],
        datePublished: meta.date || undefined,
        dateModified: meta.updated || meta.date || undefined,
        keywords: meta.tags,
        mainEntityOfPage: url,
        url,
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
            name: "Blog",
            item: `${SITE_URL}/blog`,
          },
          { "@type": "ListItem", position: 3, name: meta.title, item: url },
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
          href="/blog"
          className="font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          ← Blog
        </Link>

        <header className="mt-8 mb-12">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            {meta.date ? new Date(meta.date).toLocaleDateString("en-SG", { year: "numeric", month: "short", day: "numeric" }) : ""}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {meta.title}
          </h1>
          {meta.summary && <p className="mt-3 text-zinc-500">{meta.summary}</p>}
          {meta.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-xs tracking-widest text-zinc-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
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
          <MDXRemote source={content} />
        </div>
      </div>
    </section>
  );
}
