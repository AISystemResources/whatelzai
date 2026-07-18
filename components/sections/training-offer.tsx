import Link from "next/link";
import { AccentText } from "@/components/shell/AccentText";
import { getSiteIdentity } from "@/lib/site-identity";
import { getTrainingOfferContent } from "@/lib/landing-content";

export async function TrainingOffer() {
  const [site, c] = await Promise.all([
    getSiteIdentity(),
    getTrainingOfferContent(),
  ]);

  const primaryHref =
    c.primary_cta_type === "email"
      ? `mailto:${site.email}${c.primary_cta_subject ? `?subject=${encodeURIComponent(c.primary_cta_subject)}` : ""}`
      : (c.primary_cta_url ?? `mailto:${site.email}`);

  return (
    <section
      id="offer"
      data-section="The offer"
      className="px-6 py-32 sm:px-8 sm:py-40"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          {c.eyebrow}
        </p>

        <h2 className="mt-8 font-display text-5xl leading-[1.05] font-bold tracking-tight text-zinc-900 sm:text-7xl">
          <AccentText text={c.heading} />
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-zinc-700 sm:text-xl">
          <AccentText text={c.body} />
        </p>

        {c.pricing_note && (
          <p className="mt-4 max-w-2xl font-mono text-xs tracking-wide text-zinc-500 sm:text-sm">
            {c.pricing_note}
          </p>
        )}

        <div className="mt-12 flex flex-wrap gap-4">
          <a
            href={primaryHref}
            className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-6 py-4 font-mono text-xs tracking-widest uppercase text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
          >
            {c.primary_cta_label}
            <span aria-hidden="true">→</span>
          </a>

          {c.secondary_cta_label && c.secondary_cta_url && (
            <Link
              href={c.secondary_cta_url}
              className="inline-flex items-center gap-2 border border-zinc-300 px-6 py-4 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
              {c.secondary_cta_label}
              <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
