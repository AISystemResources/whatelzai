import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getArchetype, getQuizBySlug } from "@/lib/quizzes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your playbook",
  robots: { index: false, follow: false },
};

// Stub route. When real PDFs land, either:
//   (a) set ebook_url on the archetype row → this route redirects there, or
//   (b) replace this file with a signed-URL handler that streams from Supabase Storage.
export default async function EbookStubPage({
  params,
}: {
  params: Promise<{ slug: string; archetype: string }>;
}) {
  const { slug, archetype: archetypeKey } = await params;
  const { userId } = await auth();
  if (!userId) redirect(`/quiz/${slug}`);

  const quiz = await getQuizBySlug(slug);
  if (!quiz) notFound();
  const archetype = await getArchetype(quiz.quiz.id, archetypeKey);
  if (!archetype) notFound();

  // If a real ebook URL exists, forward to it.
  if (archetype.ebook_url) redirect(archetype.ebook_url);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:px-8 sm:py-24">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
        {archetype.name} playbook
      </p>
      <h1 className="font-display-hero mt-4 text-4xl text-zinc-900 sm:text-5xl">
        Draft in progress.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-700">
        The full {archetype.name} playbook is being finalised. The first version
        lands in your inbox this week — you&rsquo;re already on the list from
        unlocking your result.
      </p>
      <p className="mt-6 text-base leading-relaxed text-zinc-600">
        In the meantime, the one-liner above is the shape of what&rsquo;s
        coming. If you want to reply and tell me what would make it most useful,
        I read every reply personally.
      </p>
      <Link
        href={`/quiz/${slug}/result`}
        className="mt-10 inline-block border border-zinc-300 bg-white px-6 py-3 font-mono text-sm uppercase tracking-widest text-zinc-800 transition hover:border-zinc-500"
      >
        ← Back to your result
      </Link>
    </main>
  );
}
