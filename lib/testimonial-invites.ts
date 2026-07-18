import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";
import type { TestimonialCategory } from "./testimonials";

export interface InvitePrefill {
  author_name?: string;
  author_role?: string;
  author_company?: string;
  author_email?: string;
  author_linkedin_url?: string;
  category?: TestimonialCategory;
  question_ids?: string[];
}

export interface TestimonialInvite {
  id: string;
  token: string;
  prefill: InvitePrefill;
  note: string | null;
  created_by_clerk_id: string | null;
  used_at: string | null;
  submission_id: string | null;
  created_at: string;
}

// URL-safe short token: 10 chars from base62-ish alphabet.
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export async function createInvite(
  prefill: InvitePrefill,
  note: string | null,
  clerkId: string | null,
): Promise<TestimonialInvite> {
  const token = generateToken();
  const { data, error } = await supabaseAdmin
    .from("testimonial_invites")
    .insert({
      token,
      prefill,
      note,
      created_by_clerk_id: clerkId,
    })
    .select()
    .single();
  if (error) throw new Error(`createInvite: ${error.message}`);
  return data as TestimonialInvite;
}

export const getInviteByToken = cache(
  async (token: string): Promise<TestimonialInvite | null> => {
    if (!token || token.length > 20) return null;
    const { data, error } = await supabaseAdmin
      .from("testimonial_invites")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) return null;
    return data as TestimonialInvite | null;
  },
);

export const listInvites = cache(async (): Promise<TestimonialInvite[]> => {
  const { data, error } = await supabaseAdmin
    .from("testimonial_invites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listInvites: ${error.message}`);
  return (data ?? []) as TestimonialInvite[];
});

export async function markInviteUsed(
  token: string,
  submissionId: string,
): Promise<void> {
  await supabaseAdmin
    .from("testimonial_invites")
    .update({
      used_at: new Date().toISOString(),
      submission_id: submissionId,
    })
    .eq("token", token);
}

export async function deleteInvite(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("testimonial_invites")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`deleteInvite: ${error.message}`);
}
