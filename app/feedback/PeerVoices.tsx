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

function VoiceCard({ t }: { t: Testimonial }) {
  const href = `/testimonials/${testimonialSlug(t)}`;
  const title = t.headline || t.quote.slice(0, 90);
  return (
    <article className="group relative flex flex-col gap-4 border border-zinc-200 p-5 transition-colors hover:border-zinc-400">
      <Link
        href={href}
        aria-label={`Read ${t.author_name}'s testimonial`}
        className="absolute inset-0 z-10"
      >
        <span className="sr-only">
          Read {t.author_name}&rsquo;s testimonial
        </span>
      </Link>
      <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
        {CATEGORY_LABELS[t.category]}
      </p>
      <p className="text-sm leading-relaxed text-zinc-800">
        &ldquo;{title}&rdquo;
      </p>
      <div className="mt-auto flex items-center gap-3 border-t border-zinc-100 pt-4">
        {t.author_avatar_url ? (
          <Image
            src={t.author_avatar_url}
            alt={t.author_name}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-mono text-[10px] text-zinc-500">
            {t.author_name.slice(0, 1)}
          </div>
        )}
        <p className="min-w-0 truncate text-xs font-semibold text-zinc-900">
          {t.author_name}
        </p>
      </div>
    </article>
  );
}

export async function PeerVoices({
  viewerCategory,
}: {
  viewerCategory: TestimonialCategory | null;
}) {
  const rows = await listPublicTestimonials();
  if (rows.length === 0) return null;

  // Group by category, pick best per bucket.
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
      <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
        Others who&rsquo;ve shared
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((t) => (
          <VoiceCard key={t.id} t={t} />
        ))}
      </div>
      <div className="mt-8">
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
