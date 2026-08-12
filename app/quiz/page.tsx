import type { Metadata } from "next";
import Link from "next/link";
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
    <main className="mx-auto max-w-3xl px-6 py-16 sm:px-8 sm:py-24">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
        Quizzes
      </p>
      <h1 className="font-display-hero mt-4 text-4xl text-zinc-900 sm:text-6xl">
        Find your archetype.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-zinc-600">
        Short diagnostic quizzes. No email required to see your result.
      </p>

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
    </main>
  );
}
