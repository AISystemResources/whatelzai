import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTestimonialBySlug,
  listPublicTestimonials,
  testimonialSlug,
  CATEGORY_LABELS,
} from "@/lib/testimonials";
import { mergeSocials } from "@/lib/social-link";
import { AvatarFallback } from "@/components/sections/avatar-fallback";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTestimonialBySlug(slug);
  if (!t) return { title: "Testimonial not found" };

  const affiliation = (t.author_affiliations ?? [])
    .map((a) => [a.role, a.company].filter(Boolean).join(", "))
    .find(Boolean);
  const title = `${t.author_name} on working with Edmund — ${CATEGORY_LABELS[t.category]}`;
  const description = t.quote.slice(0, 200);
  const url = `https://whatelz.ai/testimonials/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      authors: [t.author_name],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: affiliation ? { "profile:role": affiliation } : undefined,
  };
}

export default async function TestimonialDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const t = await getTestimonialBySlug(slug);
  if (!t) notFound();

  const affiliations = (t.author_affiliations ?? [])
    .map((a) => [a.role, a.company].filter(Boolean).join(", "))
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Person",
      name: "Edmund Lin Zhenming",
      url: "https://whatelz.ai",
      jobTitle: "AI Engineer",
    },
    reviewBody: t.quote,
    author: {
      "@type": "Person",
      name: t.author_name,
      ...(() => {
        const urls = mergeSocials(t.author_linkedin_url, t.author_socials).map(
          (s) => s.url,
        );
        return urls.length ? { sameAs: urls } : {};
      })(),
      ...(affiliations[0] && { jobTitle: affiliations[0] }),
    },
    datePublished: t.submitted_at ?? t.created_at,
    publisher: {
      "@type": "Person",
      name: "Edmund Lin Zhenming",
      url: "https://whatelz.ai",
    },
  };

  return (
    <main className="px-6 py-16 sm:px-8 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-2xl">
        <nav className="mb-16 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          <Link href="/testimonials" className="hover:text-zinc-900">
            ← All testimonials
          </Link>
        </nav>

        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          {CATEGORY_LABELS[t.category]}
        </p>

        {t.headline && (
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
            {t.headline}
          </h1>
        )}

        {t.keywords && t.keywords.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {t.keywords.slice(0, 5).map((k) => (
              <li
                key={k}
                className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-900"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {k}
              </li>
            ))}
          </ul>
        )}

        <blockquote className="mt-10 border-l-2 border-zinc-200 pl-6 text-lg leading-relaxed text-zinc-700 sm:text-xl">
          &ldquo;{t.quote}&rdquo;
        </blockquote>

        {t.outcome_tag && (
          <p
            className="mt-8 font-mono text-xs tracking-wide"
            style={{ color: "var(--accent-text)" }}
          >
            {t.outcome_tag}
          </p>
        )}

        <div className="mt-14 flex items-center gap-4 border-t border-zinc-200 pt-8">
          {t.author_avatar_url ? (
            <Image
              src={t.author_avatar_url}
              alt={t.author_name}
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <AvatarFallback
              className="h-14 w-14"
              ariaLabel={`${t.author_name} avatar placeholder`}
            />
          )}
          <div className="min-w-0">
            <p className="text-base font-semibold text-zinc-900">
              {t.author_name}
              {mergeSocials(t.author_linkedin_url, t.author_socials).map(
                (s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="ml-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 underline underline-offset-4 hover:text-zinc-900"
                  >
                    {s.platform} ↗
                  </a>
                ),
              )}
            </p>
            {affiliations.map((a) => (
              <p key={a} className="font-mono text-xs text-zinc-500">
                {a}
              </p>
            ))}
          </div>
        </div>

        {t.quote_answers && t.quote_answers.length > 1 && (
          <section className="mt-20 space-y-10 border-t border-zinc-200 pt-12">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              More from {t.author_name.split(" ")[0]}
            </p>
            {t.quote_answers.slice(1).map((qa, i) => (
              <div key={i} className="space-y-3">
                <p className="text-sm font-semibold text-zinc-900">
                  {qa.question_text}
                </p>
                <p className="text-base leading-relaxed text-zinc-700">
                  {qa.answer}
                </p>
              </div>
            ))}
          </section>
        )}

        <section className="mt-20 border-t border-zinc-200 pt-10">
          <p className="text-sm text-zinc-600">
            Worked, trained, or shipped something with Edmund?{" "}
            <Link
              href="/feedback"
              className="underline underline-offset-4 hover:text-zinc-900"
            >
              Add your voice →
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  try {
    const items = await listPublicTestimonials();
    return items.map((t) => ({ slug: testimonialSlug(t) }));
  } catch {
    return [];
  }
}
