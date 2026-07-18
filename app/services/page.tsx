import type { Metadata } from "next";
import { listServices, type Service, type PricingTier } from "@/lib/services";
import { getSiteIdentity } from "@/lib/site-identity";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteIdentity();
  return {
    title: `Services — ${s.owner_name}`,
    description: `AI training, mentorship, digital courses, and system-building by ${s.owner_name}.`,
  };
}

export const dynamic = "force-dynamic";

const PROCESS = [
  {
    n: "1",
    title: "Email with a brief",
    body: "What you're building, rough timeline, budget range. One paragraph is enough to get started.",
  },
  {
    n: "2",
    title: "20-min call",
    body: "No pitch. A quick conversation to see if this is a good fit for both of us.",
  },
  {
    n: "3",
    title: "Proposal & timeline",
    body: "Scope, deliverables, and a realistic schedule — in writing before anything starts.",
  },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  training: "AI Training",
  mentor: "Mentorship",
  course: "Digital Course",
  speak: "Speaking",
  build: "AI Systems",
};

function formatAmount(amount: number | null, currency: string): string {
  if (amount === null || amount === undefined) return "By enquiry";
  return `${currency} ${amount.toLocaleString("en-SG")}`;
}

function PricingTable({
  tiers,
  currency,
}: {
  tiers: PricingTier[];
  currency: string;
}) {
  return (
    <ul className="space-y-2">
      {tiers.map((t) => (
        <li
          key={t.id}
          className="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-2"
        >
          <div>
            <p className="text-sm text-zinc-800">{t.label}</p>
            {t.note && (
              <p className="mt-0.5 font-mono text-[10px] tracking-wide text-zinc-400">
                {t.note}
              </p>
            )}
          </div>
          <p className="font-mono text-sm tabular-nums text-zinc-900">
            {formatAmount(t.amount, currency)}
            {t.amount !== null && t.unit && (
              <span className="ml-1 text-zinc-400">/{t.unit}</span>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ServiceBlock({
  s,
  index,
  fallbackEmail,
}: {
  s: Service;
  index: number;
  fallbackEmail: string;
}) {
  const num = String(index + 1).padStart(2, "0");
  const typeLabel = CATEGORY_LABELS[s.category] ?? s.category;
  const comingSoon = s.status === "coming_soon";
  const showFounding =
    s.pricing?.founding && s.pricing.founding.public !== false;

  return (
    <section className="border-b border-zinc-200 px-6 py-20 transition-colors duration-300 hover:bg-zinc-50/60 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs tracking-widest text-zinc-300">
            {num}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            {typeLabel}
          </span>
          {comingSoon && (
            <span
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: "var(--accent-text)" }}
            >
              Coming soon
            </span>
          )}
          <div className="flex-1 border-t border-zinc-100" />
        </div>

        <h2 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          {s.name}
        </h2>
        {s.tagline && (
          <p className="mt-3 max-w-2xl font-mono text-xs tracking-wide text-zinc-500 sm:text-sm">
            {s.tagline}
          </p>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            {s.description && (
              <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
                {s.description}
              </p>
            )}
            {s.audience && (
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                For: {s.audience}
              </p>
            )}
            {s.proof && (
              <p className="mt-6 font-mono text-[10px] tracking-wide text-zinc-400">
                {s.proof}
              </p>
            )}

            {s.pricing && (
              <div className="mt-8">
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  Pricing
                </p>
                <div className="mt-3">
                  <PricingTable
                    tiers={s.pricing.tiers}
                    currency={s.pricing.currency}
                  />
                </div>

                {showFounding && s.pricing.founding && (
                  <div
                    className="mt-6 border-l-2 p-4"
                    style={{
                      borderColor: "var(--accent)",
                      background:
                        "color-mix(in srgb, var(--accent) 8%, transparent)",
                    }}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-700">
                      Founding client rate
                      {s.pricing.founding.expires_after_engagements &&
                        ` · first ${s.pricing.founding.expires_after_engagements} only`}
                    </p>
                    {s.pricing.founding.trade && (
                      <p className="mt-1 text-xs text-zinc-600">
                        Traded for {s.pricing.founding.trade}.
                      </p>
                    )}
                    <div className="mt-3">
                      <PricingTable
                        tiers={s.pricing.founding.tiers}
                        currency={s.pricing.currency}
                      />
                    </div>
                  </div>
                )}

                {s.terms && (
                  <ul className="mt-5 space-y-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    {s.terms.deposit_pct !== undefined && (
                      <li>· {s.terms.deposit_pct}% deposit confirms booking</li>
                    )}
                    {s.terms.cap_pax !== undefined && (
                      <li>· Capped at {s.terms.cap_pax} pax (add-ons above)</li>
                    )}
                    {s.terms.notes?.map((n) => (
                      <li key={n}>· {n}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {(s.cta_label || s.cta_url) && (
              <div className="mt-10">
                <a
                  href={s.cta_url ?? `mailto:${fallbackEmail}`}
                  className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
                >
                  {s.cta_label ?? "Get in touch"}
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            )}
          </div>

          {s.deliverables && s.deliverables.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                What you get
              </p>
              <ul className="mt-4 space-y-3">
                {s.deliverables.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-zinc-700"
                  >
                    <span
                      className="mt-[3px] shrink-0 text-xs"
                      style={{ color: "var(--accent-text)" }}
                      aria-hidden="true"
                    >
                      ▸
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default async function ServicesPage() {
  const [services, site] = await Promise.all([
    listServices(true),
    getSiteIdentity(),
  ]);

  return (
    <main>
      <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Services · By enquiry
          </p>
          <h1 className="font-display-hero mt-6 text-5xl leading-[1.05] sm:text-7xl">
            Work
            <br />
            <span style={{ color: "var(--accent-text)" }}>with me.</span>
          </h1>
          <p className="mt-8 max-w-lg text-base text-zinc-600 sm:text-lg">
            Training, mentorship, and digital courses — plus a small number of
            client builds alongside my own systems. Everything below is what I
            actually do; nothing is a placeholder.
          </p>
        </div>
      </section>

      {services.length === 0 ? (
        <section className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="font-mono text-sm text-zinc-500">
              Catalogue is being updated. Email me directly at{" "}
              <a className="underline" href={`mailto:${site.email}`}>
                {site.email}
              </a>
              .
            </p>
          </div>
        </section>
      ) : (
        services.map((s, i) => (
          <ServiceBlock key={s.id} s={s} index={i} fallbackEmail={site.email} />
        ))
      )}

      <section className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              How it works
            </span>
            <div className="flex-1 border-t border-zinc-100" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple process
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {PROCESS.map(({ n, title, body }) => (
              <li key={n} className="flex gap-5">
                <span
                  className="shrink-0 font-mono text-2xl font-semibold leading-none"
                  style={{ color: "var(--accent-text)" }}
                >
                  {n}
                </span>
                <div>
                  <p className="font-semibold text-zinc-900">{title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Get started
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Ready to build?
          </h2>
          <p className="mt-5 max-w-md text-base text-zinc-600">
            I&apos;m selective — I take work where I can do my best. If
            it&apos;s not a fit, I&apos;ll say so early.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`mailto:${site.email}`}
              className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
            >
              Start with an email <span aria-hidden="true">→</span>
            </a>
            {site.linkedin_url && (
              <a
                href={site.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
              >
                LinkedIn <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
