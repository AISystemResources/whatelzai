import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thanks — testimonial received",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <main className="flex min-h-[70vh] items-center px-6 sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Received
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Thank you.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600">
          I&rsquo;ll review it in the next day or two. If anything needs
          clarifying I&rsquo;ll email you first — otherwise you&rsquo;ll see it
          land on the site.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
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
            See testimonials
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
