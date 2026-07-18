"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { SiteIdentity } from "@/lib/site-identity";

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

const slideUpVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// Splits a name into parts and colors each part's first letter accent.
// Works with 1..N name parts; the initials line up with owner_initials naturally.
function NameLines({ name }: { name: string }) {
  const parts = name.split(/\s+/).filter(Boolean);
  return (
    <>
      {parts.map((part) => (
        <div key={part}>
          <span style={{ color: "var(--accent-text)" }}>{part[0]}</span>
          {part.slice(1)}
        </div>
      ))}
    </>
  );
}

export function Intro({ site }: { site: SiteIdentity }) {
  const reduced = useReducedMotion();

  return (
    <motion.section
      variants={sectionVariants}
      initial={reduced ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      id="intro"
      data-section="Intro"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-20">
          <motion.div
            variants={scaleInVariants}
            className="relative w-full shrink-0 sm:w-80 lg:w-[420px]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-4 translate-y-4 bg-[var(--accent)]"
            />
            <div className="relative aspect-[3/4] overflow-hidden border border-zinc-200 shadow-xl">
              {site.portrait_url && (
                <Image
                  src={site.portrait_url}
                  alt={site.owner_name}
                  fill
                  sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 100vw"
                  className="object-cover"
                />
              )}
            </div>
          </motion.div>

          <motion.div variants={slideUpVariants} className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              Hello
            </p>

            <h2 className="font-display-hero mt-4 text-5xl leading-[1.05] sm:text-6xl">
              <NameLines name={site.owner_name} />
            </h2>

            {site.owner_initials && (
              <p className="mt-8 text-lg text-zinc-700 sm:text-xl">
                The domain is a wordplay.{" "}
                <span className="font-mono">
                  what
                  <span style={{ color: "var(--accent-text)" }}>
                    {site.owner_initials}
                  </span>
                  .ai
                </span>{" "}
                — <em>what else with AI</em>, and the letters that make it a
                question are the letters that spell my name.
              </p>
            )}

            {site.bio && (
              <p className="mt-4 font-mono text-xs tracking-wide text-zinc-500 sm:text-sm whitespace-pre-line">
                {site.bio}
              </p>
            )}

            <p className="mt-6 text-base leading-relaxed text-zinc-700 sm:text-lg">
              I build production AI systems, and I train teams to build the
              same kind of thing. Same person, both jobs.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
              >
                About me
                <span aria-hidden="true">→</span>
              </Link>
              {site.resume_url && (
                <a
                  href={site.resume_url}
                  download
                  className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                  Download CV
                  <span aria-hidden="true">↓</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
