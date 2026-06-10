'use client';

import Link from "next/link";
import Image from "next/image";
import { useMotionValue, useTransform, useSpring, motion, useReducedMotion } from "framer-motion";

const PORTRAIT_URL = "https://lzibjuqtfptogzwmxbcu.supabase.co/storage/v1/object/public/vault-images/user_3DbybqEDdQdhvmvBFTmpZEAcQLS/2026-06-09T12-36-27.jpg";

const TITLE_WORDS = ["what", "else", "can", "you", "build", "with"] as const;

const wordVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  };
}

export function Hero() {
  const reduced = useReducedMotion();

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rawRotateY = useTransform(mouseX, [0, 1], [-7, 7]);
  const rawRotateX = useTransform(mouseY, [0, 1], [5, -5]);
  const rotateY = useSpring(rawRotateY, { stiffness: 70, damping: 18 });
  const rotateX = useSpring(rawRotateX, { stiffness: 70, damping: 18 });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width);
    mouseY.set((e.clientY - r.top) / r.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return (
    <section
      id="top"
      data-section="Hero"
      className="relative overflow-hidden border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Animated gradient blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">

          {/* Text column */}
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap gap-x-[0.22em] gap-y-1 font-display text-6xl font-bold leading-[1.05] tracking-tight sm:text-8xl">
              {TITLE_WORDS.map((word, i) => (
                <motion.span
                  key={word}
                  custom={i}
                  initial={reduced ? "visible" : "hidden"}
                  animate="visible"
                  variants={wordVariants}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                custom={TITLE_WORDS.length}
                initial={reduced ? "visible" : "hidden"}
                animate="visible"
                variants={wordVariants}
                className="inline-block bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent"
              >
                AI
              </motion.span>
              <motion.span
                custom={TITLE_WORDS.length + 1}
                initial={reduced ? "visible" : "hidden"}
                animate="visible"
                variants={wordVariants}
                className="inline-block"
              >
                ?
              </motion.span>
            </h1>

            <motion.p
              {...(reduced ? {} : fadeUp(0.65))}
              className="mt-8 font-mono text-xs tracking-wide text-zinc-600 sm:text-sm"
            >
              Edmund Lin Zhenming
              <span className="mx-2 text-zinc-400">·</span>
              Co-founder, AI System Resources
            </motion.p>

            <motion.div
              {...(reduced ? {} : fadeUp(0.82))}
              className="mt-8 max-w-lg space-y-3 text-base text-zinc-700 sm:text-lg"
            >
              <p>ATLAS. DoubleLead. EMDEE. Three AI systems — one company forming.</p>
              <p>I explore the question. The work is the answer.</p>
            </motion.div>

            <motion.div
              {...(reduced ? {} : fadeUp(0.98))}
              className="mt-10"
            >
              <Link
                href="mailto:elz.work22@gmail.com"
                className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
              >
                Get in touch
                <span aria-hidden="true">→</span>
              </Link>
            </motion.div>
          </div>

          {/* Portrait — entry fade + cursor-parallax tilt */}
          <motion.div
            {...(reduced ? {} : {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: 1.0, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
            })}
            className="relative w-full shrink-0 sm:w-80 lg:w-[420px]"
          >
            {/* Amber accent block — offset behind portrait */}
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-4 translate-y-4 bg-[var(--accent)]"
            />
            <div style={{ perspective: "1000px" }} className="relative">
              <motion.div
                style={reduced ? {} : { rotateX, rotateY }}
                className="group relative aspect-[3/4] overflow-hidden border border-zinc-200 shadow-sm transition-shadow duration-500 hover:shadow-xl"
              >
                <Image
                  src={PORTRAIT_URL}
                  alt="Edmund Lin Zhenming"
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  priority
                />
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
