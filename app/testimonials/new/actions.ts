"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createPublicSubmission,
  TESTIMONIAL_CATEGORIES,
  type TestimonialCategory,
  type QuoteAnswer,
} from "@/lib/testimonials";
import { TESTIMONIAL_QUESTIONS } from "@/lib/testimonial-questions";
import { getInviteByToken, markInviteUsed } from "@/lib/testimonial-invites";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function bad(msg: string): { error: string } {
  return { error: msg };
}

function clean(v: FormDataEntryValue | null, max = 1000): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

async function uploadAvatar(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Avatar exceeds 5MB");
  if (!ALLOWED_MIME.has(file.type))
    throw new Error("Avatar must be JPG, PNG, WebP, or GIF");

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("testimonial-avatars")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Avatar upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage
    .from("testimonial-avatars")
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function submitPublicTestimonial(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  // Honeypot
  if (clean(formData.get("website"), 200)) {
    redirect("/testimonials/thank-you");
  }

  // Rate limit
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return bad("Too many submissions from this network. Please try again later.");
  }

  const author_name = clean(formData.get("author_name"), 200);
  const author_role = clean(formData.get("author_role"), 200) || null;
  const author_company = clean(formData.get("author_company"), 200) || null;
  const author_email = clean(formData.get("author_email"), 200);
  const author_linkedin_url =
    clean(formData.get("author_linkedin_url"), 500) || null;
  const categoryRaw = clean(formData.get("category"), 50);
  const inviteToken = clean(formData.get("invite_token"), 40) || null;

  const category = (TESTIMONIAL_CATEGORIES as readonly string[]).includes(
    categoryRaw,
  )
    ? (categoryRaw as TestimonialCategory)
    : "friend";

  // Collect answered questions.
  const questions = TESTIMONIAL_QUESTIONS[category] ?? [];
  const quote_answers: QuoteAnswer[] = [];
  for (const q of questions) {
    const answer = clean(formData.get(`answer_${q.id}`), 2000);
    if (answer.length >= 15) {
      quote_answers.push({
        question_id: q.id,
        question_text: q.text,
        answer,
      });
    }
  }

  // Validate
  if (!author_name) return bad("Please tell me your name.");
  if (!author_email) return bad("Please share your email — it stays private.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email)) {
    return bad("That doesn't look like a valid email.");
  }
  if (author_linkedin_url && !/^https?:\/\//i.test(author_linkedin_url)) {
    return bad("LinkedIn URL must start with https://");
  }
  if (quote_answers.length === 0) {
    return bad("Please answer at least one question — 15+ characters.");
  }

  // Optional avatar
  let author_avatar_url: string | null = null;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    try {
      author_avatar_url = await uploadAvatar(file);
    } catch (e) {
      return bad(e instanceof Error ? e.message : "Avatar upload failed");
    }
  }

  // The primary "quote" for card display: the first answer.
  const quote = quote_answers[0].answer;

  try {
    const submission = await createPublicSubmission({
      quote,
      quote_answers,
      author_name,
      author_role,
      author_company,
      author_avatar_url,
      author_email,
      author_linkedin_url,
      category,
    });

    // Mark invite consumed if this came from one.
    if (inviteToken) {
      const invite = await getInviteByToken(inviteToken);
      if (invite && !invite.used_at) {
        await markInviteUsed(inviteToken, submission.id);
      }
    }
  } catch {
    return bad("Something went wrong saving your testimonial. Please try again.");
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/admin/testimonials/invites");
  redirect("/testimonials/thank-you");
}
