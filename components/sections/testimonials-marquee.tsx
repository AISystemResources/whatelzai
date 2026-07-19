"use client";

import Image from "next/image";
import Link from "next/link";
import {
  testimonialSlug,
  CATEGORY_LABELS,
  type Testimonial,
} from "@/lib/testimonials";

function formatAffiliations(t: Testimonial): string[] {
  return (t.author_affiliations ?? [])
    .map((a) => [a.role, a.company].filter(Boolean).join(", "))
    .filter(Boolean);
}

function Card({ t }: { t: Testimonial }) {
  const affiliations = formatAffiliations(t);
  const href = `/testimonials/${testimonialSlug(t)}`;

  return (
    <article className="group relative flex w-[340px] shrink-0 flex-col gap-6 border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400 sm:w-[420px] sm:p-8">
      <Link
        href={href}
        aria-label={`Read ${t.author_name}'s full testimonial`}
        className="absolute inset-0 z-10"
      >
        <span className="sr-only">
          Read {t.author_name}&rsquo;s testimonial
        </span>
      </Link>
      <p className="line-clamp-6 text-base leading-relaxed text-zinc-800 sm:text-lg">
        &ldquo;{t.quote}&rdquo;
      </p>

      {t.outcome_tag && (
        <p
          className="font-mono text-xs tracking-wide"
          style={{ color: "var(--accent-text)" }}
        >
          {t.outcome_tag}
        </p>
      )}

      <div className="mt-auto flex items-center gap-4 border-t border-zinc-100 pt-5">
        {t.author_avatar_url ? (
          <Image
            src={t.author_avatar_url}
            alt={t.author_name}
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-mono text-xs text-zinc-500">
            {t.author_name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{t.author_name}</p>
          {affiliations.map((a) => (
            <p key={a} className="truncate font-mono text-xs text-zinc-500">
              {a}
            </p>
          ))}
        </div>
        <span className="ml-auto shrink-0 self-start font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          {CATEGORY_LABELS[t.category]}
        </span>
      </div>
    </article>
  );
}

export function TestimonialsMarquee({ items }: { items: Testimonial[] }) {
  // Duplicate the list so the translate loop appears seamless.
  const track = [...items, ...items];

  return (
    <div
      className="relative mt-14 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="marquee-track flex gap-6 will-change-transform">
        {track.map((t, i) => (
          <Card key={`${t.id}-${i}`} t={t} />
        ))}
      </div>
      <style>{`
        .marquee-track {
          animation: marquee-scroll 60s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
        }
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
