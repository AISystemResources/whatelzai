import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuizBySlug } from "@/lib/quizzes";
import { QuizPlayer } from "./QuizPlayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const q = await getQuizBySlug(slug);
  if (!q) return { title: "Quiz not found" };
  return {
    title: q.quiz.title,
    description: q.quiz.subtitle ?? undefined,
  };
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getQuizBySlug(slug);
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-24">
      <QuizPlayer
        slug={slug}
        title={data.quiz.title}
        subtitle={data.quiz.subtitle}
        introMd={data.quiz.intro_md}
        ctaLabel={data.quiz.cta_label}
        questions={data.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          helper_md: q.helper_md,
          choices: q.choices.map((c) => ({ id: c.id, label: c.label })),
        }))}
        archetypes={data.archetypes.map((a) => ({
          key: a.key,
          name: a.name,
          one_line: a.one_line,
        }))}
      />
    </main>
  );
}
