import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAttempt, getArchetype, getQuizBySlug } from "@/lib/quizzes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your result",
  robots: { index: false, follow: false },
};

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ a?: string }>;
}) {
  const { slug } = await params;
  const { a: attempt_id } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect(`/quiz/${slug}`);
  if (!attempt_id) redirect(`/quiz/${slug}`);

  const attempt = await getAttempt(attempt_id);
  if (!attempt) notFound();
  if (attempt.clerk_user_id !== userId) redirect(`/quiz/${slug}`);
  if (!attempt.archetype_key || !attempt.unlocked_at) redirect(`/quiz/${slug}`);

  const quiz = await getQuizBySlug(slug);
  if (!quiz) notFound();
  const archetype = await getArchetype(quiz.quiz.id, attempt.archetype_key);
  if (!archetype) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-24">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
        Unlocked · Your archetype
      </p>
      <h1 className="font-display-hero mt-4 text-5xl text-zinc-900 sm:text-6xl">
        {archetype.name}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-700">
        {archetype.one_line}
      </p>

      {archetype.full_report_md && (
        <article className="prose prose-zinc mt-12 max-w-none whitespace-pre-line text-base leading-relaxed text-zinc-800">
          {archetype.full_report_md}
        </article>
      )}

      <div className="mt-12 border border-zinc-200 bg-zinc-50 p-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Your playbook
        </p>
        <p className="mt-3 text-base leading-relaxed text-zinc-700">
          The {archetype.name} ebook is your next step.
        </p>
        <Link
          href={`/quiz/${slug}/ebook/${archetype.key}`}
          className="mt-6 inline-block border border-zinc-900 bg-zinc-900 px-6 py-3 font-mono text-sm uppercase tracking-widest text-white transition hover:bg-zinc-700"
        >
          {archetype.ebook_label}
        </Link>
      </div>

      <p className="mt-16 font-mono text-xs text-zinc-500">
        You&rsquo;re also subscribed to the weekly newsletter — it&rsquo;ll land
        in your inbox as new material ships.{" "}
        <Link href="/" className="underline">
          Back to whatelz.ai
        </Link>
      </p>
    </main>
  );
}
