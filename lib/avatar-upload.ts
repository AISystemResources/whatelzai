import { supabaseAdmin } from "./supabase-server";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const ALLOWED_AVATAR_MIME: ReadonlyArray<string> = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED = new Set(ALLOWED_AVATAR_MIME);

export async function uploadTestimonialAvatar(
  file: File,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Avatar exceeds 5MB");
  if (!ALLOWED.has(file.type))
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
