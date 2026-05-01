interface HackathonEntry {
  date: string;
  event: string;
  placement: string;
  team: string;
  notes?: string;
}

const tier1: HackathonEntry[] = [
  {
    date: "Mar 2026",
    event: "Hackomania 2026",
    placement: "Champion (1st)",
    team: "Shaun Liew, Fan Xinyu, Jasbir Kaur, Natalene Khoo",
    notes: "First actual coding-hackathon championship",
  },
  {
    date: "Nov 2025",
    event: "SingHacks",
    placement: "3rd Place",
    team: "Jasbir Kaur, Yeo Sim Yee, Chye Zhi Hao",
    notes: "Web3 solution on Hedera",
  },
  {
    date: "Aug 2025",
    event: "PAN-SEA AI Developer Challenge",
    placement: "2nd Place",
    team: "Shaun Liew",
    notes: "AI developer challenge, regional SE Asia",
  },
];

const tier2: HackathonEntry[] = [
  {
    date: "Oct 2025",
    event: "ASMI Hackathon",
    placement: "1st",
    team: "Toh Zhen Wei, Cody, Htet, Xavier",
    notes: "Popularity vote format",
  },
  {
    date: "Jun 2025",
    event: "Youth Finance Hackathon",
    placement: "1st",
    team: "Sheila Loo, Ashley Hsu",
    notes: "Finance case study",
  },
  {
    date: "Oct 2024",
    event: "Ideathon",
    placement: "1st",
    team: "Toh Zhen Wei, Koh Yao Hao, Sie Choon Hong",
    notes: "Ideation only",
  },
];

function HackathonRow({ h }: { h: HackathonEntry }) {
  return (
    <li className="grid grid-cols-12 items-baseline gap-x-4 gap-y-1 py-5">
      <span className="col-span-3 font-mono text-[10px] tracking-widest text-zinc-500 uppercase sm:text-xs">
        {h.date}
      </span>
      <span className="col-span-6 text-sm font-medium sm:col-span-5 sm:text-base">
        {h.event}
      </span>
      <span
        className="col-span-3 col-start-10 text-right font-mono text-xs tracking-wide uppercase sm:col-span-4 sm:col-start-9"
        style={{ color: "var(--accent-text)" }}
      >
        {h.placement}
      </span>
      <span className="col-span-12 text-xs text-zinc-500 sm:col-span-8 sm:col-start-4">
        Team: {h.team}
      </span>
      {h.notes && (
        <span className="col-span-12 text-xs text-zinc-400 sm:col-span-8 sm:col-start-4">
          {h.notes}
        </span>
      )}
    </li>
  );
}

export function AboutHackathons() {
  return (
    <section
      id="about-hackathons"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
          Hackathons & Wins
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Competition record
        </h2>
        <p className="mt-6 max-w-2xl text-sm text-zinc-700">
          A clean upward arc: ideathons → case studies → coding hackathons →
          coding-hackathon champion. Each step required more technical skin in
          the game.
        </p>

        <div className="mt-12">
          <h3 className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
            Tier 1 — Coding hackathons
          </h3>
          <ul className="mt-4 divide-y divide-zinc-200 border-y border-zinc-200">
            {tier1.map((h) => (
              <HackathonRow key={h.event} h={h} />
            ))}
          </ul>
        </div>

        <div className="mt-12">
          <h3 className="font-mono text-xs tracking-widest text-zinc-500 uppercase">
            Tier 2 — Case studies / ideathons / popularity votes
          </h3>
          <p className="mt-2 font-mono text-[10px] tracking-wide text-zinc-400 uppercase">
            Listed honestly — different format, different bar
          </p>
          <ul className="mt-4 divide-y divide-zinc-200 border-y border-zinc-200">
            {tier2.map((h) => (
              <HackathonRow key={h.event} h={h} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
