const BELIEFS = [
  {
    n: "01",
    title: "Slideware isn't training.",
    body: "If nobody leaves the room with something they can run on Monday morning, nothing happened. Every session I run ends with a working artifact — not a deck.",
  },
  {
    n: "02",
    title: "The best AI teachers are still shipping.",
    body: "The moment you stop building, your teaching goes stale. I train the same week I ship. What you learn from me is what I just used yesterday.",
  },
  {
    n: "03",
    title: "Teams don't need more prompts.",
    body: "They need to see AI think alongside them on their real work. Prompt libraries collect dust. Watching AI solve your problem sticks.",
  },
] as const;

export function POV() {
  return (
    <section
      id="pov"
      data-section="What I think"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          What I think
        </p>

        <h2 className="mt-8 font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Three things about AI training
          <br />
          you don&rsquo;t hear enough.
        </h2>

        <ol className="mt-16 space-y-14">
          {BELIEFS.map((b) => (
            <li key={b.n} className="grid gap-6 sm:grid-cols-[80px_1fr] sm:gap-10">
              <span
                className="font-mono text-xs tracking-widest"
                style={{ color: "var(--accent-text)" }}
              >
                {b.n}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                  {b.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-zinc-600 sm:text-lg">
                  {b.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
