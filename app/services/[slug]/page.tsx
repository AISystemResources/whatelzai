import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug, listServices, type Service } from "@/lib/services";
import { getSiteIdentity } from "@/lib/site-identity";
import { ComparisonTable } from "@/components/services/comparison-table";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [s, site] = await Promise.all([
    getServiceBySlug(slug),
    getSiteIdentity(),
  ]);
  if (!s) return { title: `Service not found — ${site.owner_name}` };
  return {
    title: `${s.name} — ${site.owner_name}`,
    description: s.tagline ?? s.description ?? undefined,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  training: "AI Training",
  mentor: "1-on-1 Coaching",
  course: "Digital Course",
  speak: "Speaking",
  build: "AI Systems",
};

// Bespoke rendering for the founding-tier surface. We tell the story here
// (comparison table + Reserve CTA) rather than in the generic ServiceBlock.
function FoundingSection({ s, ctaHref }: { s: Service; ctaHref: string }) {
  const f = s.pricing?.founding;
  if (!f) return null;
  const foundingTier = f.tiers[0];
  const regularTier = s.pricing?.tiers[0];
  const foundingPrice = foundingTier
    ? `${s.pricing?.currency ?? ""} ${foundingTier.amount?.toLocaleString("en-SG") ?? "—"}`
    : "By enquiry";
  const foundingAnchor = regularTier?.amount
    ? `${s.pricing?.currency ?? ""} ${regularTier.amount.toLocaleString("en-SG")}${regularTier.unit ? `/${regularTier.unit}` : ""}`
    : undefined;

  // Rows are hardcoded to match the founding vs regular story. Kept here (not
  // in the DB) because they change with the pitch, not the pricing data.
  const rows = [
    {
      label: "4-session intensive onboarding month",
      founding: true as const,
      regular: true as const,
    },
    {
      label: "1 bookable session per month — forever",
      founding: true as const,
      regular: "Ongoing paid" as const,
    },
    {
      label: "Lifetime access to all future ASR products",
      founding: true as const,
      regular: false as const,
      highlight: true,
    },
    {
      label: "Exclusive founders' group (private)",
      founding: true as const,
      regular: false as const,
    },
    {
      label: "Product roadmap input — vote on what ASR builds next",
      founding: true as const,
      regular: false as const,
    },
    {
      label: "Founder credit on whatelz.ai (with permission)",
      founding: true as const,
      regular: false as const,
    },
    {
      label: "Priority replies between sessions",
      founding: true as const,
      regular: "Standard" as const,
    },
    {
      label: "Price locked forever",
      founding: true as const,
      regular: "Subject to change" as const,
      highlight: true,
    },
  ];

  return (
    <section
      className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-28"
      style={{
        background: "color-mix(in srgb, var(--accent) 4%, transparent)",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-4">
          <span
            className="font-mono text-[10px] tracking-widest uppercase"
            style={{ color: "var(--accent-text)" }}
          >
            Founding cohort · {f.expires_after_engagements ?? 7} spots
          </span>
          <div className="flex-1 border-t border-zinc-100" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
          Be one of the first {f.expires_after_engagements ?? 7}.
        </h2>
        <p className="mt-4 max-w-2xl text-base text-zinc-600 sm:text-lg">
          Locked-in rate, lifetime access to everything I ship at ASR, and
          direct input on what gets built next. After these seats fill,
          membership opens at monthly rates — founders are grandfathered
          forever.
        </p>

        <div className="mt-12">
          <ComparisonTable
            foundingLabel="Founding · 7 spots"
            foundingSubLabel="One-time — lifetime access"
            foundingPrice={foundingPrice}
            foundingPriceAnchor={foundingAnchor}
            foundingCta={{
              label: "Reserve my spot →",
              // TODO: swap to Google Calendar Appointment Schedule URL when set up.
              href: ctaHref,
            }}
            regularLabel="Regular"
            regularSubLabel="Opens after the 7 close"
            regularPrice="Monthly"
            regularCta={{
              label: "Notify me when it opens",
              href: `mailto:${ctaHref.split(":")[1]?.split("?")[0] ?? "hello@whatelz.ai"}?subject=Notify%20me%20when%20regular%20membership%20opens`,
            }}
            rows={rows}
          />
        </div>
      </div>
    </section>
  );
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const [s, site] = await Promise.all([
    getServiceBySlug(slug),
    getSiteIdentity(),
  ]);
  if (!s || !s.published) notFound();

  const typeLabel = CATEGORY_LABELS[s.category] ?? s.category;
  const primaryCtaHref =
    s.cta_url ??
    `mailto:${site.email}?subject=${encodeURIComponent(`Reserve my ${s.name} spot`)}`;
  const hasFounding =
    s.pricing?.founding && s.pricing.founding.public !== false;

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4">
            <Link
              href="/services"
              className="font-mono text-[10px] tracking-widest uppercase text-zinc-400 transition-colors hover:text-zinc-900"
            >
              ← Services
            </Link>
            <span className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">
              /
            </span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">
              {typeLabel}
            </span>
          </div>
          <h1 className="font-display-hero mt-6 text-5xl leading-[1.05] sm:text-7xl">
            {s.name}
          </h1>
          {s.tagline && (
            <p className="mt-6 max-w-2xl text-lg text-zinc-600 sm:text-xl">
              {s.tagline}
            </p>
          )}
          {s.audience && (
            <p className="mt-6 font-mono text-[10px] tracking-widest uppercase text-zinc-400">
              For: {s.audience}
            </p>
          )}
        </div>
      </section>

      {/* Description + Deliverables */}
      {(s.description || (s.deliverables && s.deliverables.length > 0)) && (
        <section className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[3fr_2fr] lg:gap-20">
            {s.description && (
              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">
                  What it is
                </p>
                <p className="mt-5 text-base leading-relaxed text-zinc-700 sm:text-lg">
                  {s.description}
                </p>
                {s.proof && (
                  <p className="mt-6 font-mono text-[10px] tracking-wide text-zinc-500">
                    {s.proof}
                  </p>
                )}
              </div>
            )}

            {s.deliverables && s.deliverables.length > 0 && (
              <div>
                <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">
                  What you get
                </p>
                <ul className="mt-5 space-y-3">
                  {s.deliverables.map((d) => (
                    <li
                      key={d}
                      className="flex items-start gap-3 text-zinc-700"
                    >
                      <span
                        aria-hidden
                        className="mt-[3px] shrink-0 text-xs"
                        style={{ color: "var(--accent-text)" }}
                      >
                        ▸
                      </span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Founding comparison table (only if the service has a founding block) */}
      {hasFounding && <FoundingSection s={s} ctaHref={primaryCtaHref} />}

      {/* Standard CTA — fallback for services without founding block */}
      {!hasFounding && (
        <section className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">
                Get started
              </span>
              <div className="flex-1 border-t border-zinc-100" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to work together?
            </h2>
            <a
              href={primaryCtaHref}
              className="mt-8 inline-flex items-center gap-2 border border-zinc-900 px-6 py-4 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
            >
              {s.cta_label ?? "Get in touch"}
              <span aria-hidden>→</span>
            </a>
          </div>
        </section>
      )}
    </main>
  );
}

// Pre-render published services at build time.
export async function generateStaticParams() {
  const services = await listServices(true);
  return services.map((s) => ({ slug: s.slug }));
}
