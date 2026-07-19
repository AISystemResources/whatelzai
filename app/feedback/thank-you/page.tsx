import type { Metadata } from "next";
import Link from "next/link";
import { listFeaturedTestimonials } from "@/lib/testimonials";
import { TestimonialsMarquee } from "@/components/sections/testimonials-marquee";

export const metadata: Metadata = {
  title: "Thanks — testimonial received",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage() {
  const items = await listFeaturedTestimonials();

  return (
    <main className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Received
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Thank you.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600">
          I&rsquo;ll review it in the next day or two. If anything needs
          clarifying I&rsquo;ll email you first — otherwise you&rsquo;ll see it
          land on the site.
        </p>
      </div>

      {items.length > 0 && (
        <div className="mx-auto mt-16 max-w-6xl">
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            You&rsquo;re in good company
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Other people who&rsquo;ve shared their story.
          </h2>
          <TestimonialsMarquee items={items} />
        </div>
      )}

      <div className="mx-auto mt-16 flex max-w-3xl flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
        >
          Back home
          <span aria-hidden="true">→</span>
        </Link>
        <Link
          href="/testimonials"
          className="inline-flex items-center gap-2 border border-zinc-300 px-5 py-3 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
        >
          See all testimonials
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </main>
  );
}
