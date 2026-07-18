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
} from "@/lib/testimonials";

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

// Simple sanity: strip trailing whitespace, enforce max length.
function clean(v: FormDataEntryValue | null, max = 1000): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

async function uploadAvatar(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Avatar exceeds 5MB");
  if (!ALLOWED_MIME.has(file.type)) throw new Error("Avatar must be a JPEG, PNG, WebP, or GIF");

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

  const { data } = supabaseAdmin.storage.from("testimonial-avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function submitPublicTestimonial(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  // Honeypot — real users can't fill this hidden field.
  if (clean(formData.get("website"), 200)) {
    // Silently succeed so bots don't retry.
    redirect("/testimonials/thank-you");
  }

  // Rate limit by IP.
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return bad("Too many submissions from this network. Please try again later.");
  }

  const quote = clean(formData.get("quote"), 2000);
  const author_name = clean(formData.get("author_name"), 200);
  const author_role = clean(formData.get("author_role"), 200) || null;
  const author_company = clean(formData.get("author_company"), 200) || null;
  const author_email = clean(formData.get("author_email"), 200);
  const author_linkedin_url = clean(formData.get("author_linkedin_url"), 500) || null;
  const context = clean(formData.get("context"), 500) || null;
  const tagsRaw = clean(formData.get("tags"), 500);
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : null;
  const categoryRaw = clean(formData.get("category"), 50);

  // Validate.
  if (!quote) return bad("Please write something in the testimonial.");
  if (quote.length < 20) return bad("Testimonial is too short — aim for at least a sentence.");
  if (!author_name) return bad("Please tell me your name.");
  if (!author_email) return bad("Please share your email — it stays private.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email)) {
    return bad("That doesn't look like a valid email.");
  }
  if (author_linkedin_url && !/^https?:\/\//i.test(author_linkedin_url)) {
    return bad("LinkedIn URL must start with https://");
  }
  const category = (
    TESTIMONIAL_CATEGORIES as readonly string[]
  ).includes(categoryRaw)
    ? (categoryRaw as TestimonialCategory)
    : "friend";

  // Optional avatar upload.
  let author_avatar_url: string | null = null;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    try {
      author_avatar_url = await uploadAvatar(file);
    } catch (e) {
      return bad(e instanceof Error ? e.message : "Avatar upload failed");
    }
  }

  try {
    await createPublicSubmission({
      quote,
      author_name,
      author_role,
      author_company,
      author_avatar_url,
      author_email,
      author_linkedin_url,
      category,
      tags,
      context,
    });
  } catch {
    return bad("Something went wrong saving your testimonial. Please try again.");
  }

  revalidatePath("/admin/testimonials");
  redirect("/testimonials/thank-you");
}
