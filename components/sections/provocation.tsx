import { AccentText } from "@/components/shell/AccentText";
import { getProvocationContent } from "@/lib/landing-content";

export async function Provocation() {
  const c = await getProvocationContent();

  return (
    <section
      id="provocation"
      data-section="The Gap"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-24">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              {c.eyebrow}
            </p>

            <h2 className="font-display-hero mt-8 text-4xl leading-[1.1] text-zinc-900 sm:text-6xl">
              <AccentText text={c.heading} />
            </h2>

            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-zinc-700 sm:text-xl">
              <AccentText text={c.body} />
            </p>
          </div>

          {/* Gap visual: "have" vs "don't have" — two offset stamps. */}
          <div
            aria-hidden
            className="relative mx-auto flex w-full max-w-sm items-center justify-center gap-4 sm:max-w-md lg:mx-0 lg:w-[360px]"
          >
            <div
              className="flex aspect-square flex-1 flex-col items-center justify-center gap-3 border-2 shadow-lg"
              style={{
                backgroundColor: "var(--accent)",
                borderColor: "var(--accent-text)",
              }}
            >
              <span className="font-mono text-4xl leading-none sm:text-5xl">
                ✓
              </span>
              <span className="font-mono text-[10px] tracking-widest text-zinc-900 uppercase">
                Accounts
              </span>
            </div>
            <div className="flex aspect-square flex-1 flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-300 bg-white">
              <span className="font-mono text-4xl leading-none text-zinc-300 sm:text-5xl">
                ✗
              </span>
              <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                Workflows
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
