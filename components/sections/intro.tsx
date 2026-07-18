'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

const PORTRAIT_URL =
  'https://lzibjuqtfptogzwmxbcu.supabase.co/storage/v1/object/public/vault-images/user_3DbybqEDdQdhvmvBFTmpZEAcQLS/2026-06-09T12-36-27.jpg';

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

export function Intro() {
  const reduced = useReducedMotion();

  return (
    <motion.section
      variants={sectionVariants}
      initial={reduced ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      id="intro"
      data-section="Intro"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-20">
          {/* Portrait — amber accent block behind, drop shadow, signature look */}
          <motion.div
            variants={scaleInVariants}
            className="relative w-full shrink-0 sm:w-80 lg:w-[420px]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-4 translate-y-4 bg-[var(--accent)]"
            />
            <div className="relative aspect-[3/4] overflow-hidden border border-zinc-200 shadow-xl">
              <Image
                src={PORTRAIT_URL}
                alt="Edmund Lin Zhenming"
                fill
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 100vw"
                className="object-cover"
              />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div variants={slideUpVariants} className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              Hello
            </p>

            <h2 className="mt-4 font-display text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
              <div>
                <span style={{ color: 'var(--accent-text)' }}>E</span>dmund
              </div>
              <div>
                <span style={{ color: 'var(--accent-text)' }}>L</span>in
              </div>
              <div>
                <span style={{ color: 'var(--accent-text)' }}>Z</span>henming
              </div>
            </h2>

            <p className="mt-8 text-lg text-zinc-700 sm:text-xl">
              The domain is a wordplay.{' '}
              <span className="font-mono">
                what<span style={{ color: 'var(--accent-text)' }}>ELZ</span>.ai
              </span>{' '}
              — <em>what else with AI</em>, and the letters that make it a question are the letters that spell my name.
            </p>

            <p className="mt-4 font-mono text-xs tracking-wide text-zinc-500 sm:text-sm">
              Co-founder at AI System Resources · Singapore.
              <br />
              Final-year Applied Computing (Fintech) at SIT · graduating October 2026.
            </p>

            <p className="mt-6 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
              4 products shipped
              <span className="mx-2 text-zinc-300">·</span>
              6 hackathon podiums
              <span className="mx-2 text-zinc-300">·</span>
              2× AI Engineering intern @ Prudential
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
              >
                About me
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href="/edmund-lin-resume.pdf"
                download
                className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
              >
                Download CV
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
