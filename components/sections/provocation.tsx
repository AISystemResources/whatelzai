export function Provocation() {
  return (
    <section
      id="provocation"
      data-section="The Gap"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-40"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          The gap
        </p>

        <h2 className="mt-8 font-display text-4xl leading-[1.1] font-bold tracking-tight text-zinc-900 sm:text-6xl">
          Your team has{" "}
          <span className="whitespace-nowrap">AI accounts.</span>
          <br />
          Your team doesn&rsquo;t have{" "}
          <span style={{ color: "var(--accent-text)" }}>AI workflows</span>.
        </h2>

        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-zinc-700 sm:text-xl">
          That gap isn&rsquo;t a tools problem. It&rsquo;s a training problem.
          Everyone can open ChatGPT. Almost nobody knows what to point it at
          in their actual work.
        </p>
      </div>
    </section>
  );
}
