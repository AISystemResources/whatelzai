import type { Metadata } from "next";
import Link from "next/link";
import { AboutHero } from "@/components/sections/about-hero";
import { AboutArc } from "@/components/sections/about-arc";
import { AboutHackathons } from "@/components/sections/about-hackathons";

export const metadata: Metadata = {
  title: "About — Edmund Lin Zhenming",
  description:
    "AI Engineer graduating Oct 2026. 4 years across data science, product management, and AI engineering. Tier-1 coding hackathon champion.",
};

export default function AboutPage() {
  return (
    <main>
      <AboutHero />
      <AboutArc />
      <AboutHackathons />

      {/* Contact CTA */}
      <section
        id="about-contact"
        className="px-6 py-24 sm:px-8 sm:py-32"
      >
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
            Contact
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Let&apos;s talk.
          </h2>
          <p className="mt-6 max-w-xl text-base text-zinc-700 dark:text-zinc-300">
            Hiring, collaborating, or just curious — email is fastest.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="mailto:elz.work22@gmail.com"
              className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 dark:border-zinc-100 dark:hover:text-zinc-900"
            >
              Email
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href="https://www.linkedin.com/in/elz-fintech/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:border-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-100"
            >
              LinkedIn
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
