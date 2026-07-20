import type { Metadata } from "next";
import Link from "next/link";
import {
  listPublicTestimonials,
  getAggregateKeywords,
  CATEGORY_LABELS,
  TESTIMONIAL_CATEGORIES,
  type Testimonial,
  type TestimonialCategory,
} from "@/lib/testimonials";
import { TestimonialsMarquee } from "@/components/sections/testimonials-marquee";
import { KeywordCards } from "@/components/testimonials/keyword-cards";
import { keywordLabel } from "@/components/testimonials/keyword-meta";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What people who've worked, trained, mentored, hacked, or studied with Edmund have to say.",
};

export const dynamic = "force-dynamic";

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [items, topKeywords, { filter }] = await Promise.all([
    listPublicTestimonials(),
    getAggregateKeywords(5),
    searchParams,
  ]);

  // Filter mode: flat list of testimonials matching the keyword, no category
  // grouping. Cleared by clicking the same card again on the client side.
  const activeFilter = filter?.trim() || null;
  const filteredItems = activeFilter
    ? items.filter((t) => (t.keywords ?? []).includes(activeFilter))
    : items;

  const byCategory = new Map<TestimonialCategory, Testimonial[]>();
  for (const t of filteredItems) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category)!.push(t);
  }
  // Prioritize testimonials with real avatars — stronger social proof up front.
  for (const rows of byCategory.values()) {
    rows.sort(
      (a, b) => (b.author_avatar_url ? 1 : 0) - (a.author_avatar_url ? 1 : 0),
    );
  }

  return (
    <main className="px-6 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <section className="border-b border-zinc-200 pb-12">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Testimonials
          </p>
          <h1 className="font-display-hero mt-4 text-5xl text-zinc-900 sm:text-7xl">
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

          <KeywordCards keywords={topKeywords} />
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
        ) : activeFilter ? (
          // Filter mode: one flat marquee, no category grouping.
          <section className="border-b border-zinc-100 py-14">
            <div className="mx-6 flex items-baseline justify-between sm:mx-0">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                “{keywordLabel(activeFilter)}”
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "voice" : "voices"}
              </span>
            </div>
            {filteredItems.length === 0 ? (
              <p className="mt-8 text-sm text-zinc-500">
                No testimonials tagged with this keyword yet.
              </p>
            ) : (
              <TestimonialsMarquee items={filteredItems} />
            )}
          </section>
        ) : (
          TESTIMONIAL_CATEGORIES.map((cat) => {
            const rows = byCategory.get(cat) ?? [];
            if (rows.length === 0) return null;
            return (
              <section key={cat} className="border-b border-zinc-100 py-14">
                <div className="mx-6 flex items-baseline justify-between sm:mx-0">
                  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                    {CATEGORY_LABELS[cat]}
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    {rows.length} {rows.length === 1 ? "voice" : "voices"}
                  </span>
                </div>
                <TestimonialsMarquee items={rows} />
              </section>
            );
          })
        )}
      </div>
    </main>
  );
}
