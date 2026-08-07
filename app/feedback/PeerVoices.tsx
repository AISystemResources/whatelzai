import Link from "next/link";
import {
  listPublicTestimonials,
  TESTIMONIAL_CATEGORIES,
  type Testimonial,
  type TestimonialCategory,
} from "@/lib/testimonials";
import { TestimonialsMarquee } from "@/components/sections/testimonials-marquee";

// Pick the "best" testimonial in a bucket: featured first, then the one with a
// headline and the longest quote (proxy for effort). Skips headline-less rows
// so cards render cleanly.
function pickBest(rows: Testimonial[]): Testimonial | null {
  const withHeadline = rows.filter((r) => r.headline && r.headline.trim());
  const pool = withHeadline.length ? withHeadline : rows;
  if (pool.length === 0) return null;
  const featured = pool.filter((r) => r.featured);
  const ranked = (featured.length ? featured : pool).slice().sort((a, b) => {
    return (b.quote?.length ?? 0) - (a.quote?.length ?? 0);
  });
  return ranked[0];
}

export async function PeerVoices({
  viewerCategory,
}: {
  viewerCategory: TestimonialCategory | null;
}) {
  const rows = await listPublicTestimonials();
  if (rows.length === 0) return null;

  const byCategory = new Map<TestimonialCategory, Testimonial>();
  for (const cat of TESTIMONIAL_CATEGORIES) {
    const best = pickBest(rows.filter((r) => r.category === cat));
    if (best) byCategory.set(cat, best);
  }

  // Order: viewer's category first (if present), then remaining in canonical order.
  const order: TestimonialCategory[] = [];
  if (viewerCategory && byCategory.has(viewerCategory))
    order.push(viewerCategory);
  for (const cat of TESTIMONIAL_CATEGORIES) {
    if (cat !== viewerCategory && byCategory.has(cat)) order.push(cat);
  }
  const picks = order.map((c) => byCategory.get(c)!).filter(Boolean);
  if (picks.length === 0) return null;

  return (
    <section className="mt-14 border-t border-zinc-200 pt-10">
      <p className="px-6 font-mono text-[10px] tracking-widest text-zinc-500 uppercase sm:px-0">
        Others who&rsquo;ve shared
      </p>
      <TestimonialsMarquee items={picks} />
      <div className="mt-8 px-6 sm:px-0">
        <Link
          href="/testimonials"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-900"
        >
          View {Math.max(rows.length - picks.length, 0)} more voices →
        </Link>
      </div>
    </section>
  );
}
