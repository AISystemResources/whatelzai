import Image from "next/image";
import {
  listFeaturedTestimonials,
  CATEGORY_LABELS,
  type Testimonial,
} from "@/lib/testimonials";

function formatAffiliations(t: Testimonial): string[] {
  return (t.author_affiliations ?? [])
    .map((a) => [a.role, a.company].filter(Boolean).join(", "))
    .filter(Boolean);
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const affiliations = formatAffiliations(t);

  return (
    <article className="flex flex-col gap-6 border border-zinc-200 p-6 sm:p-8">
      <p className="text-lg leading-relaxed text-zinc-800 sm:text-xl">
        &ldquo;{t.quote}&rdquo;
      </p>

      {t.outcome_tag && (
        <p
          className="font-mono text-xs tracking-wide"
          style={{ color: "var(--accent-text)" }}
        >
          {t.outcome_tag}
        </p>
      )}

      <div className="mt-auto flex items-center gap-4 border-t border-zinc-100 pt-5">
        {t.author_avatar_url ? (
          <Image
            src={t.author_avatar_url}
            alt={t.author_name}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-mono text-xs text-zinc-500">
            {t.author_name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{t.author_name}</p>
          {affiliations.map((a) => (
            <p key={a} className="font-mono text-xs text-zinc-500">
              {a}
            </p>
          ))}
        </div>
        <span className="ml-auto shrink-0 self-start font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          {CATEGORY_LABELS[t.category]}
        </span>
      </div>
    </article>
  );
}

export async function Testimonials() {
  const items = await listFeaturedTestimonials();
  if (items.length === 0) return null;

  return (
    <section
      id="testimonials"
      data-section="What people say"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          What people say
        </p>

        <h2 className="mt-8 max-w-3xl pb-2 font-display text-3xl font-bold leading-[1.15] tracking-tight text-zinc-900 sm:text-5xl">
          The people I&rsquo;ve trained, taught, or shipped with.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
