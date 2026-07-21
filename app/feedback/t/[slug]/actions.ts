"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  canAcceptSubmission,
  getTemplateBySlug,
  incrementSubmissionCount,
} from "@/lib/testimonial-templates";
import { createIncompleteTestimonial } from "@/lib/testimonials";
import { checkRateLimit } from "@/lib/rate-limit";

async function requireRateLimit(): Promise<void> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.allowed) throw new Error("rate-limited");
}

function clean(v: FormDataEntryValue | null, max: number): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max).trim();
}

function bad(error: string): { error: string } {
  return { error };
}

// Start a template-backed submission. Loads the template, checks the gate,
// creates an incomplete testimonial with template prefills applied, bumps
// submissions_count, redirects to the standard token-based feedback form.
export async function startFromTemplate(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  // Honeypot
  if (clean(formData.get("website"), 200)) {
    redirect("/feedback/thank-you");
  }

  try {
    await requireRateLimit();
  } catch {
    return bad("Too many attempts. Please try again later.");
  }

  const slug = clean(formData.get("template_slug"), 100);
  if (!slug) return bad("Missing template.");

  const email = clean(formData.get("author_email"), 200);
  if (!email) return bad("Please share your email to get started.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("That doesn't look like a valid email.");
  }

  const template = await getTemplateBySlug(slug);
  if (!template) return bad("This template no longer exists.");

  const gate = canAcceptSubmission(template);
  if (!gate.ok) {
    // Should not normally happen — the /feedback/t/[slug] page also
    // renders a closed state — but a race is possible between page render
    // and submit. Refuse gracefully.
    return bad(
      gate.reason === "expired"
        ? "This link has expired."
        : gate.reason === "full"
          ? "This template is now full."
          : "This link is currently paused.",
    );
  }

  const seed = await createIncompleteTestimonial({
    category: template.category,
    author_email: email,
    suggested_question_ids: template.suggested_question_ids.length
      ? template.suggested_question_ids
      : undefined,
    service_event_id: template.service_event_id ?? undefined,
    author_affiliations:
      template.company_name || template.default_role
        ? [
            {
              role: template.default_role ?? "",
              company: template.company_name ?? "",
            },
          ]
        : undefined,
    template_id: template.id,
  });

  // Increment count. Not transactional with the insert — if the
  // increment fails, the testimonial row still exists and can be counted
  // manually. The pill is a soft cap, not a strict quota.
  try {
    await incrementSubmissionCount(template.id);
  } catch (err) {
    console.warn("[template] incrementSubmissionCount failed", err);
  }

  redirect(`/feedback?t=${seed.completion_token}`);
}
