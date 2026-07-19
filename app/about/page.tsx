import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getSiteIdentity } from "@/lib/site-identity";
import { listHackathons } from "@/lib/hackathons";

const SITE_URL = "https://whatelz.ai";
const TITLE = "About Edmund";

// Curated: the hackathons Edmund thinks are worth mentioning publicly —
// champions or AI-themed finalist placements. Everything else stays on the
// /hackathons page for SEO/GEO but doesn't clutter /about.
const FEATURED_HACKATHON_SLUGS: readonly string[] = [
  "hackomania-2026",
  "ai-engineer-hackathon-2026",
  "asmi-2025",
  "youth-finance-2025",
  "singhacks-2025",
  "pan-sea-ai-2025",
  "sdg-open-hack-2024",
];

// Products Edmund runs today — verb-framed, not sell-framed. Order matters:
// whatelz.ai first because it's the operator hub; the rest are the systems
// that prove the thesis.
const PRODUCTS: {
  name: string;
  role: string;
  href?: string;
}[] = [
  {
    name: "whatelz.ai",
    role: "Where I write in public, train teams, and share the systems that run me.",
  },
  {
    name: "EMDEE",
    role: "The knowledge graph I built to think in. Now being productised for other operators.",
  },
  {
    name: "DoubleLead",
    role: "The AI CRM I helped build — in daily use by 5,000+ Prudential financial advisors.",
  },
  {
    name: "ATLAS",
    role: "The autonomous trading system I run privately. First proof that automation compounds.",
  },
];

const SOCIALS: readonly [string, string, string][] = [
  ["Instagram", "https://www.instagram.com/whatelz.ai/", "@whatelz.ai"],
  ["LinkedIn", "https://www.linkedin.com/in/whatelzai/", "@whatelzai"],
  ["YouTube", "https://www.youtube.com/@whatelzai", "@whatelzai"],
  ["Medium", "https://medium.com/@whatelz.ai", "@whatelz.ai"],
  ["GitHub", "https://github.com/whatelzai", "@whatelzai"],
  ["X (Twitter)", "https://x.com/whatelz_ai", "@whatelz_ai"],
];

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteIdentity();
  const description = `${s.owner_name} is a Singapore-based AI engineer and co-founder at AI System Resources. He builds AI systems that replace his own effort — so ambitious founders can own their AI, not be owned by it.`;
  return {
    title: `${TITLE} — whatelz.ai`,
    description,
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: {
      type: "profile",
      url: `${SITE_URL}/about`,
      title: TITLE,
      description,
      images: [
        {
          url: `${SITE_URL}/api/og?eyebrow=${encodeURIComponent("About")}&title=${encodeURIComponent(s.owner_name)}&subtitle=${encodeURIComponent("AI engineer · founder · infrastructure evangelist")}`,
          width: 1200,
          height: 630,
          alt: TITLE,
        },
      ],
    },
  };
}

export default async function AboutPage() {
  const s = await getSiteIdentity();

  // Pull the featured hackathons and preserve the curated order.
  const allHackathons = await listHackathons(true);
  const featuredHackathons = FEATURED_HACKATHON_SLUGS.map((slug) =>
    allHackathons.find((h) => h.slug === slug),
  ).filter((h): h is NonNullable<typeof h> => Boolean(h));

  const description = `${s.owner_name} is a Singapore-based AI engineer and co-founder at AI System Resources. He builds AI systems that replace his own effort — so ambitious founders can own their AI, not be owned by it.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${SITE_URL}/about#page`,
        url: `${SITE_URL}/about`,
        name: TITLE,
        description,
        mainEntity: { "@id": `${SITE_URL}/#person` },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: ["h1", ".speakable-answer"],
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "About",
            item: `${SITE_URL}/about`,
          },
        ],
      },
    ],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero — portrait + name + short third-person intro. */}
      <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-20">
            {s.portrait_url && (
              <div className="relative w-full shrink-0 sm:w-80 lg:w-[420px]">
                <div
                  aria-hidden
                  className="absolute inset-0 translate-x-4 translate-y-4 bg-[var(--accent)]"
                />
                <div className="relative aspect-[3/4] overflow-hidden border border-zinc-200 shadow-xl">
                  <Image
                    src={s.portrait_url}
                    alt={s.owner_name}
                    fill
                    sizes="(min-width: 1024px) 420px, (min-width: 640px) 320px, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                About
              </p>
              <h1 className="font-display-hero mt-4 text-5xl leading-[1.05] text-zinc-900 sm:text-6xl">
                {s.owner_name}
              </h1>
              <p className="speakable-answer mt-8 text-lg leading-relaxed text-zinc-700 sm:text-xl">
                A Singapore-based AI engineer and co-founder at{" "}
                <span className="font-semibold text-zinc-900">
                  AI System Resources
                </span>
                . ASEAN Scholar, and on the Provost&rsquo;s List at SIT two
                years running.
              </p>
              <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
                He builds AI systems that replace his own effort — so ambitious
                founders can own their AI, not be owned by it. Same person,
                both jobs.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
                >
                  Services
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/testimonials"
                  className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                  Testimonials
                  <span aria-hidden>↗</span>
                </Link>
                <a
                  href={`mailto:${s.email}`}
                  className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                  Get in touch
                  <span aria-hidden>↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What I care about — ikigai-forward. */}
      <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            What I care about
          </p>
          <h2 className="font-display-hero mt-6 text-3xl leading-[1.15] text-zinc-900 sm:text-5xl">
            Systems that outlast the builder.
          </h2>

          <div className="mt-10 space-y-6 text-base leading-relaxed text-zinc-700 sm:text-lg">
            <p>
              Most people build tools and become dependent on them. Edmund
              builds systems and then walks away — and the systems keep working.
              EMDEE, DoubleLead, ATLAS aren&rsquo;t demos. They are
              production infrastructure he runs daily, and the reason he can
              spend time on the next pattern instead of the last one.
            </p>
            <p>
              The archetype behind the work is <em>The Infrastructure
              Evangelist</em> — a force multiplier who sees the repeating
              pattern before anyone else, extracts it into infrastructure, and
              installs it in the people around him. AI isn&rsquo;t the
              product. The freedom compounding from owning your own systems is
              the product.
            </p>
            <p>
              The people he builds for: ambitious solopreneurs and lean
              startup founders in Southeast Asia who know they need AI but
              can&rsquo;t figure out how to make it compound without them. If
              that&rsquo;s you, the way in is <Link href="/services" className="underline underline-offset-4 hover:text-zinc-900">Services</Link>.
            </p>
          </div>

          <figure className="mt-16 border-l-2 pl-6" style={{ borderColor: "var(--accent-text)" }}>
            <blockquote className="text-2xl leading-relaxed text-zinc-900 sm:text-3xl">
              &ldquo;I own the AI. The AI doesn&rsquo;t own me.&rdquo;
            </blockquote>
          </figure>
        </div>
      </section>

      {/* What I run today — verb-framed products. */}
      <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            What I run today
          </p>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Eat what you cook.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-zinc-600">
            Four systems in daily use. Each one started as Edmund solving his
            own problem — then got built well enough to run for other people.
          </p>

          <ul className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
            {PRODUCTS.map((p) => (
              <li
                key={p.name}
                className="border border-zinc-200 bg-white p-8 transition-colors hover:border-zinc-400"
              >
                <p
                  className="font-mono text-xs tracking-widest uppercase"
                  style={{ color: "var(--accent-text)" }}
                >
                  {p.name}
                </p>
                <p className="mt-4 text-base leading-relaxed text-zinc-700">
                  {p.role}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Selected accolades — only worth-mentioning hackathons. */}
      {featuredHackathons.length > 0 && (
        <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              Selected accolades
            </p>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Hackathon peaks.
            </h2>
            <p className="mt-6 max-w-2xl text-sm text-zinc-500 sm:text-base">
              Champions and AI-themed placements. The rest exist as a way to
              practise habits — not to prove worth.
            </p>

            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-zinc-200 text-left font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                    <th className="py-3 pr-4">Year</th>
                    <th className="py-3 pr-4">Event</th>
                    <th className="py-3 pr-4">Placement</th>
                    <th className="py-3">Project</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {featuredHackathons.map((h) => {
                    const placement =
                      h.awards
                        .map((a) =>
                          a.track && a.track !== "Overall"
                            ? `${a.title} · ${a.track}`
                            : a.title,
                        )
                        .join(", ") || "—";
                    return (
                      <tr key={h.slug}>
                        <td className="py-4 pr-4 font-mono text-xs text-zinc-500">
                          {h.date.slice(0, 4)}
                        </td>
                        <td className="py-4 pr-4 font-medium text-zinc-900">
                          {h.name}
                        </td>
                        <td className="py-4 pr-4 text-zinc-700">{placement}</td>
                        <td className="py-4 text-zinc-600">
                          {h.project_name ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Elsewhere — socials. */}
      <section className="px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Elsewhere
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Where to find whatelz online
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SOCIALS.map(([name, href, handle]) => (
              <li key={name}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="flex items-center justify-between border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-900"
                >
                  <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                    {name}
                  </span>
                  <span className="text-sm text-zinc-700">{handle}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
