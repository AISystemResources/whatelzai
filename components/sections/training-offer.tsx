import Link from "next/link";
import { getSiteIdentity } from "@/lib/site-identity";

export async function TrainingOffer() {
  const s = await getSiteIdentity();
  const bookHref = `mailto:${s.email}?subject=AI%20Training%20enquiry`;

  return (
    <section
      id="offer"
      data-section="The offer"
      className="px-6 py-32 sm:px-8 sm:py-40"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          The ask
        </p>

        <h2 className="mt-8 font-display text-5xl leading-[1.05] font-bold tracking-tight text-zinc-900 sm:text-7xl">
          Book me to{" "}
          <span style={{ color: "var(--accent-text)" }}>
            train your team.
          </span>
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-zinc-700 sm:text-xl">
          Half-day or full-day. Tailored to your team&rsquo;s stack and workflow.
          You leave the room with a working use-case map for your team and a
          30-day pilot plan — not slides.
        </p>

        <p className="mt-4 max-w-2xl font-mono text-xs tracking-wide text-zinc-500 sm:text-sm">
          Corporate / team L&amp;D · SGD 3,000 half-day · SGD 5,000 full-day ·
          founding-client rate for the first three engagements.
        </p>

        <div className="mt-12 flex flex-wrap gap-4">
          <a
            href={bookHref}
            className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-6 py-4 font-mono text-xs tracking-widest uppercase text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
          >
            Book a training session
            <span aria-hidden="true">→</span>
          </a>

          <Link
            href="/services"
            className="inline-flex items-center gap-2 border border-zinc-300 px-6 py-4 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
          >
            See all offerings
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
