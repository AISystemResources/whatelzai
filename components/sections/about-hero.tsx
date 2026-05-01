import Link from "next/link";

export function AboutHero() {
  return (
    <section
      id="about-hero"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
          About
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Edmund Lin{" "}
          <span style={{ color: "var(--accent-text)" }}>Zhenming</span>
        </h1>

        <p className="mt-6 font-mono text-xs tracking-wide text-zinc-500 uppercase">
          AI Engineering Intern · Prudential
          <span className="mx-2 text-zinc-400">·</span>
          Singapore Institute of Technology
          <span className="mx-2 text-zinc-400">·</span>
          Graduating Oct 2026
        </p>

        <p className="mt-8 max-w-2xl text-base text-zinc-700 sm:text-lg">
          AI engineer who can read a balance sheet and write a product spec. 4
          years across data science, product management, and AI engineering —
          converging into one thing: shipping AI that works in the real world.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="mailto:elz.work22@gmail.com"
            className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
          >
            Email
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href="https://www.linkedin.com/in/elz-fintech/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:border-zinc-900"
          >
            LinkedIn
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
