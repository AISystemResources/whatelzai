'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

// ── Timing (ms) ────────────────────────────────────────────────────
const TYPE_MS = 160;
const CARD_STAGGER = 320;
const IDLE_MS = 20_000;
const BS_MS = 60;

const BRAND = 'whatELZ.ai';

// ── Social results ────────────────────────────────────────────────
const SOCIALS = [
  {
    name: 'LinkedIn',
    handle: 'whatelzai',
    url: 'https://www.linkedin.com/in/whatelzai/',
    tagline: 'the professional slice',
    tilt: -3,
    color: '#0A66C2',
    Icon: LinkedInIcon,
  },
  {
    name: 'YouTube',
    handle: '@whatelzai',
    url: 'https://www.youtube.com/@whatelzai',
    tagline: 'AI systems, on camera',
    tilt: 2,
    color: '#FF0000',
    Icon: YouTubeIcon,
  },
  {
    name: 'Medium',
    handle: '@whatelz.ai',
    url: 'https://medium.com/@whatelz.ai',
    tagline: 'long-form essays + build post-mortems',
    tilt: -1,
    color: '#000000',
    Icon: MediumIcon,
  },
  {
    name: 'X',
    handle: '@whatelz_ai',
    url: 'https://x.com/whatelz_ai',
    tagline: 'shipping in public, one thought at a time',
    tilt: 4,
    color: '#000000',
    Icon: XIcon,
  },
  {
    name: 'Instagram',
    handle: 'whatelz.ai',
    url: 'https://www.instagram.com/whatelz.ai/',
    tagline: 'life outside the terminal',
    tilt: -2,
    color: '#E4405F',
    Icon: InstagramIcon,
  },
  {
    name: 'GitHub',
    handle: 'whatelzai',
    url: 'https://github.com/whatelzai',
    tagline: 'the code, uncut',
    tilt: 3,
    color: '#181717',
    Icon: GitHubIcon,
  },
] as const;

export function Hero() {
  const reduced = useReducedMotion();
  const [text, setText] = useState('');
  const [visibleCards, setVisibleCards] = useState(0);
  const [caretOn, setCaretOn] = useState(true);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Caret blink
  useEffect(() => {
    const t = setInterval(() => setCaretOn((c) => !c), 500);
    return () => clearInterval(t);
  }, []);

  // Full cycle: type → fade cards in → idle → backspace (cards vanish instantly) → loop
  useEffect(() => {
    if (reduced) {
      setText(BRAND);
      setVisibleCards(SOCIALS.length);
      return;
    }

    const push = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      timeoutsRef.current.push(id);
    };

    const runCycle = () => {
      // Phase 1 — type
      setText('');
      setVisibleCards(0);
      for (let i = 1; i <= BRAND.length; i++) {
        push(() => setText(BRAND.slice(0, i)), i * TYPE_MS);
      }
      const typeEnd = BRAND.length * TYPE_MS;

      // Phase 2 — fade cards in, one by one
      for (let i = 1; i <= SOCIALS.length; i++) {
        push(() => setVisibleCards(i), typeEnd + i * CARD_STAGGER);
      }
      const fadeEnd = typeEnd + SOCIALS.length * CARD_STAGGER;

      // Phase 3 — idle 50s (nothing to schedule; wiggle is CSS)

      // Phase 4 — backspace at start of which cards vanish instantly
      const bsStart = fadeEnd + IDLE_MS;
      push(() => setVisibleCards(0), bsStart);
      for (let i = 1; i <= BRAND.length; i++) {
        push(() => setText(BRAND.slice(0, BRAND.length - i)), bsStart + i * BS_MS);
      }
      const cycleEnd = bsStart + BRAND.length * BS_MS;

      // Loop
      push(() => runCycle(), cycleEnd + 200);
    };

    runCycle();

    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [reduced]);

  return (
    <section
      id="top"
      data-section="Hero"
      className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden border-b border-zinc-200 px-6 py-16 sm:px-8"
    >
      {/* Ambient blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-14 sm:gap-20">
        {/* ── Search bar ─────────────────────────────────────── */}
        <div className="w-full">
          <div className="relative mx-auto flex w-full max-w-4xl items-center gap-4 rounded-full border border-zinc-200 bg-white px-8 py-7 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_6px_32px_-6px_rgba(0,0,0,0.10)] sm:gap-6 sm:px-12 sm:py-10">
            <SearchIcon className="h-6 w-6 shrink-0 text-zinc-400 sm:h-8 sm:w-8" />
            <div className="flex min-w-0 flex-1 justify-center">
              <span className="font-mono text-3xl leading-none font-bold text-zinc-900 sm:text-6xl md:text-7xl">
                {text.split('').map((ch, i) => (
                  <span
                    key={i}
                    style={/^[A-Z]$/.test(ch) ? { color: 'var(--accent-text)' } : undefined}
                  >
                    {ch}
                  </span>
                ))}
                <span
                  aria-hidden="true"
                  className={`ml-[3px] inline-block h-[0.9em] w-[4px] translate-y-[3px] bg-zinc-900 align-middle sm:w-[6px] ${
                    caretOn ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </span>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white sm:h-14 sm:w-14">
              <ArrowIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>

          {/* Tagline */}
          <p className="mt-8 text-center font-mono text-[11px] tracking-[0.24em] text-zinc-500 uppercase sm:text-xs">
            showing you what else you can do with AI
          </p>
        </div>

        {/* ── Floating social logos ─────────────────────────── */}
        <div
          className="grid w-full max-w-4xl grid-cols-3 items-start gap-y-10 gap-x-4 sm:grid-cols-6 sm:gap-x-8"
          aria-label="Find whatelz.ai across the web"
        >
          {SOCIALS.map((s, i) => (
            <SocialLogo
              key={s.name}
              social={s}
              index={i}
              visible={i < visibleCards}
              reduced={!!reduced}
            />
          ))}
        </div>

        {/* ── Scroll cue ─────────────────────────────────────── */}
        <a
          href="#projects"
          aria-label="Scroll to see projects"
          className="mt-4 flex flex-col items-center gap-2 font-mono text-[10px] tracking-widest text-zinc-400 uppercase transition-colors hover:text-zinc-700"
        >
          <span>scroll</span>
          <span aria-hidden="true" className="scroll-bounce">↓</span>
        </a>
      </div>
    </section>
  );
}

// ── Social logo (no card chrome — just logo + handle) ──────────────
type SocialItem = (typeof SOCIALS)[number];

function SocialLogo({
  social,
  index,
  visible,
  reduced,
}: {
  social: SocialItem;
  index: number;
  visible: boolean;
  reduced: boolean;
}) {
  const { Icon, name, handle, url, tagline, tilt, color } = social;

  const style: React.CSSProperties & Record<string, string | number> = {
    '--tilt': `${tilt}deg`,
    '--wiggle-dur': `${3.4 + (index % 3) * 0.6}s`,
    '--wiggle-delay': `${(index * 0.4) % 2}s`,
    '--glow': color,
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} — ${handle}`}
      style={style}
      data-reduced={reduced ? 'true' : undefined}
      data-visible={visible ? 'true' : 'false'}
      className="social-logo group relative flex flex-col items-center gap-3 text-zinc-800"
    >
      {/* Hover tooltip — yellow-bordered pill */}
      <span
        aria-hidden="true"
        className="social-tooltip pointer-events-none absolute left-1/2 -top-3 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border-2 border-[color:var(--accent)] bg-white px-4 py-2 font-mono text-[10px] tracking-wide text-zinc-800 opacity-0 shadow-sm sm:text-xs"
      >
        {tagline}
      </span>
      <Icon className="social-logo-icon relative h-14 w-14 transition-colors duration-300 sm:h-16 sm:w-16" />
      <span className="relative font-mono text-[10px] font-medium tracking-wide text-zinc-700 sm:text-xs">
        {handle}
      </span>
    </a>
  );
}

// ── Inline icons ──────────────────────────────────────────────────
type IconProps = React.SVGProps<SVGSVGElement>;

function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ArrowIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function YouTubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function MediumIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  );
}

function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}
