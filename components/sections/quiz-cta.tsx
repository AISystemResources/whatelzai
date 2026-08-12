import Link from "next/link";

// Lightweight CTA strip between Hero and Intro. Copy is intentionally hardcoded
// (single link, ~1 line) — if it grows into a full-fledged section, migrate to
// the landing_content system per ARC-004.
export function QuizCTA() {
  return (
    <section className="border-y border-zinc-200 bg-zinc-50 px-6 py-6 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-700">
          Not sure where you fit yet?{" "}
          <span className="font-semibold text-zinc-900">
            Take the 90-second archetype quiz
          </span>{" "}
          — no email required to see your result.
        </p>
        <Link
          href="/quiz/what-kind-of-solopreneur"
          className="shrink-0 border border-zinc-900 bg-zinc-900 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-zinc-700"
        >
          Take the quiz →
        </Link>
      </div>
    </section>
  );
}
