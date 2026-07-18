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
      <div className="mx-auto max-w-4xl">
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
    </section>
  );
}
