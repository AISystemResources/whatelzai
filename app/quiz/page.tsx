import type { Metadata } from "next";
import Link from "next/link";
import { FieldHero } from "@/components/editorial/FieldElements";
import { listQuizzes } from "@/lib/quizzes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quizzes",
  description:
    "Short diagnostic quizzes for solopreneurs building with AI. Find your archetype in 90 seconds.",
};

export default async function QuizIndexPage() {
  const quizzes = await listQuizzes(true);

  return (
    <main className="editorial-index">
      <FieldHero
        label="Your starting point"
        title="Every builder starts somewhere."
        description="Find your solopreneur archetype. A short reflection on where you are now, and what could help you move forward. No email required to see your result."
        number="00"
      />
      <section className="field-wrap field-section">
        {quizzes.length === 0 ? (
          <p className="mt-12 text-sm text-zinc-500">
            No quizzes published yet — check back soon.
          </p>
        ) : (
          <ul className="mt-12 grid gap-4">
            {quizzes.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/quiz/${q.slug}`}
                  className="block border border-zinc-200 bg-white p-6 transition hover:border-zinc-400"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    Take the quiz
                  </p>
                  <p className="mt-3 text-xl font-semibold text-zinc-900">
                    {q.title}
                  </p>
                  {q.subtitle && (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      {q.subtitle}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
