import type { Metadata } from "next";
import Link from "next/link";
import { PublicForm } from "./PublicForm";
import {
  TESTIMONIAL_CATEGORIES,
  type TestimonialCategory,
} from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "Share a testimonial",
  description:
    "Have something to say about working, training, or building with Edmund? Share it here.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function resolveCategory(raw: string | undefined): TestimonialCategory {
  if (!raw) return "friend";
  const norm = raw.toLowerCase().trim();
  if ((TESTIMONIAL_CATEGORIES as readonly string[]).includes(norm)) {
    return norm as TestimonialCategory;
  }
  // Aliases to make sharable URLs friendlier
  const map: Record<string, TestimonialCategory> = {
    junior: "mentor",
    mentee: "mentor",
    student: "mentor",
    peer: "peer",
    colleague: "peer",
    coworker: "peer",
    manager: "peer",
    trainee: "trainer",
    training: "trainer",
    workshop: "trainer",
    professor: "academic",
    teacher: "academic",
    prof: "academic",
    hackmate: "hackathon",
    teammate: "hackathon",
  };
  return map[norm] ?? "friend";
}

export default async function NewTestimonialPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; as?: string }>;
}) {
  const params = await searchParams;
  const initialCategory = resolveCategory(params.category ?? params.as);

  return (
    <main className="px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Testimonials
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Share a testimonial.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600">
          If we&rsquo;ve worked, trained, hacked, or learned together and you&rsquo;ve
          got something to say — I&rsquo;d love to have it here.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          The best testimonials describe what{" "}
          <em>you</em> changed or took away — not what I&rsquo;m like. Specifics
          beat superlatives.
        </p>

        <div className="mt-14">
          <PublicForm initialCategory={initialCategory} />
        </div>

        <div className="mt-16 border-t border-zinc-200 pt-8">
          <Link
            href="/testimonials"
            className="font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
          >
            ← See other testimonials
          </Link>
        </div>
      </div>
    </main>
  );
}
