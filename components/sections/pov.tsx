import { AccentText } from "@/components/shell/AccentText";
import { getPovContent } from "@/lib/landing-content";

export async function POV() {
  const c = await getPovContent();

  return (
    <section
      id="pov"
      data-section="What I think"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          {c.eyebrow}
        </p>

        <h2 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          <AccentText text={c.heading} />
        </h2>

        <ol className="mt-16 grid gap-6 sm:mt-20 md:grid-cols-3 md:gap-8">
          {c.beliefs.map((b) => (
            <li
              key={b.n}
              className="relative flex flex-col gap-6 border border-zinc-200 bg-white p-8 transition-colors hover:border-zinc-400 sm:p-10"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-px flex-1"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                <span
                  className="font-mono text-xs tracking-widest"
                  style={{ color: "var(--accent-text)" }}
                >
                  {b.n}
                </span>
              </div>
              <h3 className="text-xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-2xl">
                <AccentText text={b.title} />
              </h3>
              <p className="text-base leading-relaxed text-zinc-600">
                <AccentText text={b.body} />
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
