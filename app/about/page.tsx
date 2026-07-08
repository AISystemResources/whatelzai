import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://whatelz.ai";
const TITLE = "What is whatelz.ai?";
const DESCRIPTION =
  "whatelz.ai is Edmund Lin Zhenming — a Singapore-based AI engineer building production AI systems. The name is a play on 'what else can you build with AI?'";

export const metadata: Metadata = {
  title: `${TITLE} — About whatelz.ai`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: "profile",
    url: `${SITE_URL}/about`,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/api/og?eyebrow=${encodeURIComponent("About")}&title=${encodeURIComponent(TITLE)}&subtitle=${encodeURIComponent("Edmund Lin Zhenming — AI engineer & founder")}`,
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
};

const FAQS = [
  {
    q: "What is whatelz.ai?",
    a: "whatelz.ai is the personal site of Edmund Lin Zhenming, a Singapore-based AI engineer and founder. The name comes from the question that drives the work — what else can you build with AI?",
  },
  {
    q: "Who runs whatelz.ai?",
    a: "Edmund Lin Zhenming (also known as whatelz, ELZ, or Zhenming Lin). He builds ATLAS (autonomous trading), DoubleLead (AI CRM used by 5,000+ Prudential financial advisors), and EMDEE (knowledge graph).",
  },
  {
    q: "How do you say 'whatelz'?",
    a: "'What ELZ' — like 'what else', with ELZ being Edmund's initials (Edmund Lin Zhenming). It reads both ways on purpose.",
  },
  {
    q: "What does whatelz.ai do?",
    a: "Three things: landing pages and sites in Next.js, production AI systems (RAG, agents, MCP servers, dashboards), and AI training for individuals and teams.",
  },
  {
    q: "Where can I find whatelz online?",
    a: "Instagram @whatelz.ai, YouTube @whatelzai, LinkedIn @whatelzai, Medium @whatelz.ai, GitHub @whatelzai, X @whatelz_ai. All the links point back to whatelz.ai.",
  },
];

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${SITE_URL}/about#page`,
      url: `${SITE_URL}/about`,
      name: TITLE,
      description: DESCRIPTION,
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
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function AboutPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <section className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            About
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            What is whatelz.ai?
          </h1>
          <p className="speakable-answer mt-6 text-lg leading-relaxed text-zinc-700">
            <strong className="text-zinc-900">whatelz.ai</strong> is the
            personal site of{" "}
            <strong className="text-zinc-900">Edmund Lin Zhenming</strong> — a
            Singapore-based AI engineer and founder. The name is a play on{" "}
            <em>&ldquo;what else can you build with AI?&rdquo;</em> — read it as{" "}
            <em>what ELZ</em>, where <em>ELZ</em> are Edmund&rsquo;s initials.
          </p>
          <p className="mt-5 text-base leading-relaxed text-zinc-600">
            Edmund builds production AI systems and ships them:{" "}
            <strong className="text-zinc-900">ATLAS</strong> (autonomous
            trading), <strong className="text-zinc-900">DoubleLead</strong> (AI
            CRM used by 5,000+ Prudential financial advisors), and{" "}
            <strong className="text-zinc-900">EMDEE</strong> (knowledge graph).
            He is available for landing pages, production AI systems, and AI
            training.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/services"
              className="border border-zinc-900 bg-zinc-900 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-zinc-800"
            >
              Services
            </Link>
            <Link
              href="/projects"
              className="border border-zinc-300 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
              Projects
            </Link>
            <Link
              href="/contact"
              className="border border-zinc-300 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Frequently asked
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Questions people search for
          </h2>

          <dl className="mt-10 space-y-8">
            {FAQS.map((f) => (
              <div key={f.q} className="border-t border-zinc-100 pt-6">
                <dt className="text-lg font-semibold text-zinc-900">{f.q}</dt>
                <dd className="mt-2 text-zinc-600">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Elsewhere
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
            Where to find whatelz online
          </h2>
          <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              [
                "Instagram",
                "https://www.instagram.com/whatelz.ai/",
                "@whatelz.ai",
              ],
              [
                "LinkedIn",
                "https://www.linkedin.com/in/whatelzai/",
                "@whatelzai",
              ],
              ["YouTube", "https://www.youtube.com/@whatelzai", "@whatelzai"],
              ["Medium", "https://medium.com/@whatelz.ai", "@whatelz.ai"],
              ["GitHub", "https://github.com/whatelzai", "@whatelzai"],
              ["X (Twitter)", "https://x.com/whatelz_ai", "@whatelz_ai"],
            ].map(([name, href, handle]) => (
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
