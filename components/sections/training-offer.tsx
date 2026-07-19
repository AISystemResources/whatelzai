import Link from "next/link";
import { AccentText } from "@/components/shell/AccentText";
import { getSiteIdentity } from "@/lib/site-identity";
import { getTrainingOfferContent } from "@/lib/landing-content";
import { Countdown } from "./countdown";

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
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
          {/* Left: pitch */}
          <div>
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              {c.eyebrow}
            </p>

            <h2 className="font-display-hero mt-8 text-5xl leading-[1.05] text-zinc-900 sm:text-7xl">
              <AccentText text={c.heading} />
            </h2>

            <p className="mt-10 max-w-xl text-lg leading-relaxed text-zinc-700 sm:text-xl">
              <AccentText text={c.body} />
            </p>
          </div>

          {/* Right: pricing card */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 translate-x-3 translate-y-3"
              style={{ backgroundColor: "var(--accent)" }}
            />
            <div className="relative flex flex-col gap-8 border border-zinc-900 bg-white p-8 shadow-xl sm:p-10">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="inline-block px-2 py-1 font-mono text-[10px] tracking-widest uppercase"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                  }}
                >
                  Founding rate
                </span>
                <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                  Limited
                </span>
              </div>

              {c.pricing_note && (
                <div>
                  <p className="font-display-hero text-5xl leading-none text-zinc-900 sm:text-6xl">
                    {c.pricing_note}
                  </p>
                  <p className="mt-3 text-sm text-zinc-500">
                    Locked for founding clients. Rate goes up when the timer
                    hits zero.
                  </p>
                </div>
              )}

              <Countdown label="Founding rate ends in" />

              <a
                href={primaryHref}
                className="group inline-flex items-center justify-between border border-zinc-900 bg-zinc-900 px-6 py-4 font-mono text-xs tracking-widest text-white uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
              >
                <span>{c.primary_cta_label}</span>
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </a>

              {c.secondary_cta_label && c.secondary_cta_url && (
                <Link
                  href={c.secondary_cta_url}
                  className="self-start font-mono text-xs tracking-widest text-zinc-500 uppercase underline underline-offset-4 transition-colors hover:text-zinc-900"
                >
                  {c.secondary_cta_label} ↗
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
