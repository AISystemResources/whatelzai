import type { Metadata } from "next";
import Link from "next/link";
import { PublicForm } from "./PublicForm";
import { StartForm } from "./StartForm";
import { getTestimonialByToken } from "@/lib/testimonials";

export const metadata: Metadata = {
  title: "Share a testimonial",
  description:
    "Have something to say about working, training, or building with Edmund? Share it here.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewTestimonialPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  // Path A: no token yet — email-first start
  if (!t) {
    return (
      <main className="px-6 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Testimonials
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Share a testimonial.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-zinc-600">
            Two-step form. Start with your email so I can track your progress
            and get back to you.
          </p>

          <div className="mt-14">
            <StartForm />
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

  // Path B: token present — lookup + render full form (or "already submitted" note)
  const testimonial = await getTestimonialByToken(t);

  if (!testimonial) {
    return (
      <main className="flex min-h-[60vh] items-center px-6 sm:px-8">
        <div className="mx-auto max-w-md text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Not found
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-zinc-900">
            This link is invalid.
          </h1>
          <p className="mt-4 text-zinc-600">
            The link may have been mistyped or removed.{" "}
            <Link
              href="/testimonials/new"
              className="underline underline-offset-4 hover:text-zinc-900"
            >
              Start fresh →
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const alreadySubmitted =
    testimonial.status === "pending" ||
    testimonial.status === "approved" ||
    testimonial.status === "rejected";

  if (alreadySubmitted) {
    return (
      <main className="flex min-h-[60vh] items-center px-6 sm:px-8">
        <div className="mx-auto max-w-md text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Received
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-zinc-900">
            Thanks — this one is already in.
          </h1>
          <p className="mt-4 text-zinc-600">
            Your submission is being reviewed. You&rsquo;ll see it on the site
            once approved.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
            >
              Back home →
            </Link>
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
            >
              See testimonials ↗
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const preFilled = !!(
    testimonial.author_name ||
    (testimonial.author_affiliations?.length ?? 0) > 0 ||
    testimonial.author_linkedin_url ||
    (testimonial.suggested_question_ids?.length ?? 0) > 0
  );

  return (
    <main className="px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Testimonials
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          {testimonial.author_name
            ? `Almost done, ${testimonial.author_name.split(" ")[0]}.`
            : "Almost done."}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600">
          Confirm the details, add a photo if you like, and answer whichever
          question hits you. Specifics beat superlatives.
        </p>

        {preFilled && (
          <p className="mt-4 font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            Personal invite · pre-filled for you
          </p>
        )}

        <div className="mt-14">
          <PublicForm prefill={testimonial} />
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
