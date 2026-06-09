import Link from "next/link";

export function Hero() {
  return (
    <section
      id="top"
      data-section="Hero"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-20">
          {/* Text column */}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              what else can you build with{" "}
              <span style={{ color: "var(--accent-text)" }}>AI</span>?
            </h1>

            <p className="mt-8 font-mono text-xs tracking-wide text-zinc-600 sm:text-sm">
              Edmund Lin Zhenming
              <span className="mx-2 text-zinc-400">·</span>
              Co-founder, AI System Resources
            </p>

            <div className="mt-8 max-w-lg space-y-3 text-base text-zinc-700 sm:text-lg">
              <p>ATLAS. DoubleLead. EMDEE. Three AI systems — one company forming.</p>
              <p>I explore the question. The work is the answer.</p>
            </div>

            <div className="mt-10">
              <Link
                href="mailto:elz.work22@gmail.com"
                className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
              >
                Get in touch
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Photo — replace div with <Image> once Edmund supplies the file */}
          <div className="shrink-0 w-full sm:w-72 lg:w-80">
            <div className="aspect-[3/4] border border-zinc-200 bg-zinc-50 flex items-end p-6">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                Edmund Lin Zhenming
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
