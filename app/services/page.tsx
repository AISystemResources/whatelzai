import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services — Edmund Lin Zhenming",
  description:
    "Landing pages, AI systems, and AI training by Edmund Lin Zhenming. Build fast, ship real.",
};

const SERVICES = [
  {
    num: "01",
    type: "Web Development",
    name: "Landing Pages & Sites",
    description:
      "Next.js sites that look like this one — fast, SEO-ready, and deployable in days. Full-stack web apps with clean design, not templates. If you want something that stands out, this is where we start.",
    deliverables: [
      "Next.js with App Router — fast, SEO-ready",
      "Supabase backend or integration with your existing stack",
      "Auth, payments, email, and analytics",
      "Deployed to Vercel — live in days, not weeks",
      "Mobile-responsive from day one",
    ],
    proof: "This site was built in a day on the same stack I'd use for yours.",
  },
  {
    num: "02",
    type: "AI Systems",
    name: "Production AI",
    description:
      "I've shipped AI to 5,000+ Financial Advisors at Prudential. I build systems that hold up under real usage — not polished demos that break when actual users arrive. ATLAS, DoubleLead, and EMDEE are three systems I built and run myself.",
    deliverables: [
      "RAG chatbots grounded in your own data",
      "AI-powered dashboards and internal tools",
      "Model integration — OpenAI, Groq, Anthropic, local models",
      "MCP servers for Claude agent workflows",
      "Agentic pipelines built for production reliability",
    ],
    proof: "If it can break in production, I've already broken it on my own systems.",
  },
  {
    num: "03",
    type: "AI Training",
    name: "Individuals & Teams",
    description:
      "Practical AI workshops for people who want to use AI effectively — not just understand it in theory. Tailored to your tools, your workflow, and your pace. Available for one-off sessions or ongoing coaching.",
    deliverables: [
      "Prompt engineering for your specific use cases",
      "AI workflow design and automation",
      "Tool selection — what to use and why",
      "1:1 sessions or group workshops",
      "Follow-up resources and templates included",
    ],
    proof: "For individuals looking to level up, or teams rolling out AI internally.",
  },
] as const;

const PROCESS = [
  {
    n: "1",
    title: "Email with a brief",
    body: "What you're building, rough timeline, budget range. One paragraph is enough to get started.",
  },
  {
    n: "2",
    title: "20-min call",
    body: "No pitch. A quick conversation to see if this is a good fit for both of us.",
  },
  {
    n: "3",
    title: "Proposal & timeline",
    body: "Scope, deliverables, and a realistic schedule — in writing before anything starts.",
  },
] as const;

export default function ServicesPage() {
  return (
    <main>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Freelance Services · By Inquiry
          </p>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
            Build something
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              worth shipping.
            </span>
          </h1>
          <p className="mt-8 max-w-lg text-base text-zinc-600 sm:text-lg">
            I take on a small number of client projects alongside building my own
            systems. Three things I do well — below.
          </p>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────────── */}
      {SERVICES.map((s) => (
        <section
          key={s.num}
          className="border-b border-zinc-200 px-6 py-20 transition-colors duration-300 hover:bg-zinc-50/60 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-6xl">

            {/* Number + type rule */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs tracking-widest text-zinc-300">
                {s.num}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                {s.type}
              </span>
              <div className="flex-1 border-t border-zinc-100" />
            </div>

            {/* Service heading */}
            <h2 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {s.name}
            </h2>

            {/* Description + deliverables */}
            <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-20">
              <div>
                <p className="text-base leading-relaxed text-zinc-600 sm:text-lg">
                  {s.description}
                </p>
                <p className="mt-6 font-mono text-[10px] tracking-wide text-zinc-400">
                  {s.proof}
                </p>
              </div>

              <ul className="space-y-3">
                {s.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-zinc-700">
                    <span
                      className="mt-[3px] shrink-0 text-xs"
                      style={{ color: "var(--accent-text)" }}
                      aria-hidden="true"
                    >
                      ▸
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>
      ))}

      {/* ── Process ─────────────────────────────────────────────────── */}
      <section className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              How it works
            </span>
            <div className="flex-1 border-t border-zinc-100" />
          </div>

          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Simple process
          </h2>

          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {PROCESS.map(({ n, title, body }) => (
              <li key={n} className="flex gap-5">
                <span
                  className="shrink-0 font-mono text-2xl font-semibold leading-none"
                  style={{ color: "var(--accent-text)" }}
                >
                  {n}
                </span>
                <div>
                  <p className="font-semibold text-zinc-900">{title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{body}</p>
                </div>
              </li>
            ))}
          </ol>

        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Get started
          </p>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to build?
          </h2>
          <p className="mt-5 max-w-md text-base text-zinc-600">
            I&apos;m selective — I take projects where I can do my best work.
            If it&apos;s not a fit, I&apos;ll say so early.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="mailto:elz.work22@gmail.com"
              className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
            >
              Start with an email <span aria-hidden="true">→</span>
            </a>
            <a
              href="https://www.linkedin.com/in/edmund-lin-zhenming/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
              LinkedIn <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
