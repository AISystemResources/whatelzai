"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { uploadTestimonialAvatar } from "@/lib/avatar-upload";
import {
  completeTestimonial,
  createIncompleteTestimonial,
  getTestimonialByToken,
  TESTIMONIAL_CATEGORIES,
  type Affiliation,
  type TestimonialCategory,
  type QuoteAnswer,
} from "@/lib/testimonials";
import { TESTIMONIAL_QUESTIONS } from "@/lib/testimonial-questions";

function bad(msg: string): { error: string } {
  return { error: msg };
}

function clean(v: FormDataEntryValue | null, max = 1000): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

async function requireRateLimit(): Promise<void> {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.allowed) throw new Error("rate-limited");
}

function parseAffiliations(formData: FormData): Affiliation[] {
  // Inputs named affiliation_role_0, affiliation_company_0, affiliation_role_1, ...
  const out: Affiliation[] = [];
  for (let i = 0; i < 10; i++) {
    const role = clean(formData.get(`affiliation_role_${i}`), 200);
    const company = clean(formData.get(`affiliation_company_${i}`), 200);
    if (role || company) out.push({ role, company });
  }
  return out;
}

// STAGE 1: user-initiated email-first entry
export async function startTestimonial(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  if (clean(formData.get("website"), 200)) {
    redirect("/feedback/thank-you");
  }

  try {
    await requireRateLimit();
  } catch {
    return bad("Too many attempts. Please try again later.");
  }

  const email = clean(formData.get("author_email"), 200);
  if (!email) return bad("Please share your email to get started.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("That doesn't look like a valid email.");
  }

  const t = await createIncompleteTestimonial({
    category: "friend",
    author_email: email,
  });

  redirect(`/feedback?t=${t.completion_token}`);
}

// STAGE 2: final submission
export async function submitPublicTestimonial(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  if (clean(formData.get("website"), 200)) {
    redirect("/feedback/thank-you");
  }

  try {
    await requireRateLimit();
  } catch {
    return bad(
      "Too many submissions from this network. Please try again later.",
    );
  }

  const author_name = clean(formData.get("author_name"), 200);
  const author_email = clean(formData.get("author_email"), 200);

  // Collect all social URLs from the repeatable rows. First non-empty entry
  // populates the legacy author_linkedin_url column (kept for backward compat
  // + so the existing display code still finds a URL); the full deduped list
  // goes into author_socials as { url }[].
  const rawSocials = formData
    .getAll("author_socials[]")
    .map((v) => clean(v, 500))
    .filter((s) => s.length > 0);
  const seen = new Set<string>();
  const author_socials: { url: string }[] = [];
  for (const url of rawSocials) {
    const key = url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    author_socials.push({ url });
  }
  const author_linkedin_url = author_socials[0]?.url ?? null;
  const categoryRaw = clean(formData.get("category"), 50);
  const token = clean(formData.get("completion_token"), 40) || null;
  const author_affiliations = parseAffiliations(formData);
  const improvement_note =
    clean(formData.get("improvement_note"), 2000) || null;
  const service_event_id = clean(formData.get("service_event_id"), 40) || null;

  const category = (TESTIMONIAL_CATEGORIES as readonly string[]).includes(
    categoryRaw,
  )
    ? (categoryRaw as TestimonialCategory)
    : "friend";

  const questions = TESTIMONIAL_QUESTIONS[category] ?? [];
  const quote_answers: QuoteAnswer[] = [];
  for (const q of questions) {
    const a = clean(formData.get(`answer_${q.id}`), 2000);
    if (a.length >= 5) {
      quote_answers.push({
        question_id: q.id,
        question_text: q.text,
        answer: a,
      });
    }
  }

  if (!author_name) return bad("Please tell me your display name.");
  if (!author_email) return bad("Please share your email — it stays private.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email)) {
    return bad("That doesn't look like a valid email.");
  }
  for (const s of author_socials) {
    if (!/^https?:\/\//i.test(s.url)) {
      return bad("Social profile URLs must start with https://");
    }
  }
  if (quote_answers.length === 0) {
    return bad("Please write at least a sentence in one of the questions.");
  }

  let author_avatar_url: string | null = null;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    try {
      author_avatar_url = await uploadTestimonialAvatar(file);
    } catch (e) {
      return bad(e instanceof Error ? e.message : "Avatar upload failed");
    }
  }

  const quote = quote_answers[0].answer;

  try {
    let targetId: string | null = null;
    if (token) {
      const existing = await getTestimonialByToken(token);
      if (existing) {
        targetId = existing.id;
        // If no new avatar uploaded but existing had one, keep it
        if (!author_avatar_url) author_avatar_url = existing.author_avatar_url;
      }
    }

    const affiliations = author_affiliations.length
      ? author_affiliations
      : null;

    if (targetId) {
      await completeTestimonial(targetId, {
        quote,
        quote_answers,
        author_name,
        author_affiliations: affiliations,
        author_avatar_url,
        author_email,
        author_linkedin_url,
        author_socials: author_socials.length ? author_socials : null,
        category,
        improvement_note,
        service_event_id,
      });
    } else {
      const fresh = await createIncompleteTestimonial({
        category,
        author_name,
        author_email,
        author_linkedin_url: author_linkedin_url ?? undefined,
        author_affiliations: affiliations ?? undefined,
      });
      await completeTestimonial(fresh.id, {
        quote,
        quote_answers,
        author_name,
        author_affiliations: affiliations,
        author_avatar_url,
        author_email,
        author_linkedin_url,
        author_socials: author_socials.length ? author_socials : null,
        category,
        improvement_note,
        service_event_id,
      });
    }
  } catch {
    return bad(
      "Something went wrong saving your testimonial. Please try again.",
    );
  }

  revalidatePath("/admin/testimonials");
  redirect("/feedback/thank-you");
}
