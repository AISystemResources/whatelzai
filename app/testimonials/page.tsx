import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  listPublicTestimonials,
  testimonialSlug,
  CATEGORY_LABELS,
  TESTIMONIAL_CATEGORIES,
  type Testimonial,
  type TestimonialCategory,
} from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What people who've worked, trained, mentored, hacked, or studied with Edmund have to say.",
};

export const dynamic = "force-dynamic";

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function Card({ t }: { t: Testimonial }) {
  const affiliations = (t.author_affiliations ?? [])
    .map((a) => [a.role, a.company].filter(Boolean).join(", "))
    .filter(Boolean);
  const href = `/testimonials/${testimonialSlug(t)}`;
  return (
    <article className="group relative flex flex-col gap-5 border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400">
      <Link
        href={href}
        aria-label={`Read ${t.author_name}'s full testimonial`}
        className="absolute inset-0 z-0"
      />
      <p className="relative z-10 text-base leading-relaxed text-zinc-800 sm:text-lg">
        &ldquo;{t.quote}&rdquo;
      </p>

      {t.outcome_tag && (
        <p
          className="relative z-10 font-mono text-xs tracking-wide"
          style={{ color: "var(--accent-text)" }}
        >
          {t.outcome_tag}
        </p>
      )}

      <div className="relative z-10 mt-auto flex items-center gap-3 border-t border-zinc-100 pt-4">
        {t.author_avatar_url ? (
          <Image
            src={t.author_avatar_url}
            alt={t.author_name}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-mono text-xs text-zinc-500">
            {t.author_name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            {t.author_name}
            {t.author_linkedin_url && (
              <a
                href={t.author_linkedin_url}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`${t.author_name} on LinkedIn`}
                className="relative z-20 text-zinc-400 transition-colors hover:text-zinc-900"
              >
                <LinkedInIcon />
              </a>
            )}
          </p>
          {affiliations.map((a) => (
            <p key={a} className="font-mono text-[10px] text-zinc-500">
              {a}
            </p>
          ))}
        </div>
        <span className="relative z-10 shrink-0 self-start font-mono text-[10px] uppercase tracking-widest text-zinc-300 transition-colors group-hover:text-zinc-900">
          Read →
        </span>
      </div>
    </article>
  );
}

export default async function TestimonialsPage() {
  const items = await listPublicTestimonials();
  const byCategory = new Map<TestimonialCategory, Testimonial[]>();
  for (const t of items) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category)!.push(t);
  }

  return (
    <main className="px-6 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <section className="border-b border-zinc-200 pb-12">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Testimonials
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-zinc-900 sm:text-7xl">
            What people say.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-600">
            Words from training clients, mentees, peers, professors, hackathon
            teammates, and friends. If you&rsquo;ve got something to add,{" "}
            <Link
              href="/feedback"
              className="underline underline-offset-4 hover:text-zinc-900"
            >
              share it here
            </Link>
            .
          </p>
        </section>

        {items.length === 0 ? (
          <section className="py-20 text-center">
            <p className="text-zinc-500">No testimonials yet.</p>
            <Link
              href="/feedback"
              className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
            >
              Be the first →
            </Link>
          </section>
        ) : (
          TESTIMONIAL_CATEGORIES.map((cat) => {
            const rows = byCategory.get(cat) ?? [];
            if (rows.length === 0) return null;
            return (
              <section key={cat} className="border-b border-zinc-100 py-14">
                <div className="mb-8 flex items-baseline justify-between">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    {rows.length} {rows.length === 1 ? "voice" : "voices"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {rows.map((t) => (
                    <Card key={t.id} t={t} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
