import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  canAcceptSubmission,
  getTemplateBySlug,
} from "@/lib/testimonial-templates";
import { CATEGORY_LABELS } from "@/lib/testimonials";
import { TemplateStartForm } from "./StartForm";

export const metadata: Metadata = {
  title: "Share feedback",
  description: "Share honest feedback.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Params = { slug: string };

export default async function TemplateFeedbackPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);
  if (!template) notFound();

  const gate = canAcceptSubmission(template);

  // Closed states — expired / full / paused
  if (!gate.ok) {
    const heading =
      gate.reason === "expired"
        ? "This link has closed."
        : gate.reason === "full"
          ? "This template is full."
          : "This link is paused.";
    const body =
      gate.reason === "expired"
        ? "Thank you if you already left feedback. If you'd still like to share, use the general form below."
        : gate.reason === "full"
          ? "Thank you if you already contributed. If you missed the window, use the general form below."
          : "This link isn't accepting submissions right now. Try the general form below.";

    return (
      <main className="flex min-h-[60vh] items-center px-6 sm:px-8">
        <div className="mx-auto max-w-md text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Closed
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
            {heading}
          </h1>
          <p className="mt-4 text-zinc-600">{body}</p>
          <Link
            href="/feedback"
            className="mt-6 inline-flex items-center gap-2 border border-zinc-900 px-5 py-3 font-mono text-xs uppercase tracking-widest text-zinc-900 hover:bg-[var(--accent)]"
          >
            Share feedback anyway →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          {CATEGORY_LABELS[template.category] ?? template.category}
          {template.company_name ? ` · ${template.company_name}` : ""}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          {template.name}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600">
          Thanks for taking a moment. Share what stood out — the good, the
          sharp, and anything I could do better. Start with your email so you
          can come back to finish later.
        </p>

        <div className="mt-14">
          <TemplateStartForm slug={template.slug} />
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
