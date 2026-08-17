import Image from "next/image";

// PROTOTYPE placeholder: swap portrait_src with your real two-temples shot at
// /public/mindset-skillset.jpg when the photo is ready. One-line change.
const portrait_src = "/mindset-skillset-placeholder.png";

export function MindsetSkillset() {
  return (
    <section
      id="mindset-skillset"
      data-section="The Two Pillars"
      className="relative overflow-hidden bg-zinc-950 px-6 py-24 text-white sm:px-8 sm:py-32"
    >
      {/* Ambient accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-40"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, color-mix(in oklab, var(--accent) 30%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[0.28em] text-zinc-500 uppercase sm:text-xs">
            To win as a solopreneur
          </p>
          <h2 className="font-display-hero mt-6 text-4xl leading-[1.05] sm:text-6xl">
            You need <span style={{ color: "var(--accent-text)" }}>both</span>.
          </h2>
        </div>

        {/* Portrait + two overlaid labels */}
        <div className="relative mx-auto mt-16 grid max-w-5xl grid-cols-1 items-center gap-10 sm:mt-20 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          {/* Left label — Millionaire Mindset */}
          <PillarLabel
            side="left"
            eyebrow="The right mindset"
            title="MILLIONAIRE MINDSET"
            body="Think in leverage, not labour. Solopreneurs win when they stop trading hours for dollars."
          />

          {/* Portrait */}
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[360px] overflow-hidden border border-zinc-800 shadow-2xl md:w-[360px]">
            <Image
              src={portrait_src}
              alt="Two pillars — mindset and skillset"
              fill
              sizes="(min-width: 768px) 360px, 90vw"
              className="object-cover"
              priority={false}
            />
            {/* Subtle vignette so the labels breathe */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.55) 100%)",
              }}
            />
          </div>

          {/* Right label — AI Skillset */}
          <PillarLabel
            side="right"
            eyebrow="The right skillset"
            title="AI SKILLSET"
            body="Enterprises leverage headcount. You leverage AI. Same outcome — one seat."
          />
        </div>

        {/* Kicker */}
        <p className="mx-auto mt-20 max-w-2xl text-center text-lg leading-relaxed text-zinc-300 sm:text-xl">
          That&rsquo;s the whole thesis. Two pillars. One handbook.
        </p>
      </div>
    </section>
  );
}

function PillarLabel({
  side,
  eyebrow,
  title,
  body,
}: {
  side: "left" | "right";
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className={`relative flex flex-col gap-4 ${
        side === "left"
          ? "md:text-right md:items-end"
          : "md:text-left md:items-start"
      } items-center text-center`}
    >
      <span className="font-mono text-[10px] tracking-[0.28em] text-zinc-500 uppercase">
        {eyebrow}
      </span>
      <h3
        className="font-display-hero text-2xl leading-tight sm:text-3xl"
        style={{ color: "var(--accent-text)" }}
      >
        {title}
      </h3>
      <p className="max-w-xs text-sm leading-relaxed text-zinc-400 sm:text-base">
        {body}
      </p>
      {/* Connector line, points inward toward the portrait */}
      <span
        aria-hidden
        className={`hidden md:block h-px w-16 ${side === "left" ? "self-end" : "self-start"}`}
        style={{ backgroundColor: "var(--accent)" }}
      />
    </div>
  );
}
