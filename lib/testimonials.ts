import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";

export type TestimonialCategory =
  | "trainer"
  | "mentor"
  | "peer"
  | "academic"
  | "friend"
  | "hackathon";

export type ModerationStatus = "pending" | "approved" | "rejected";

export const TESTIMONIAL_CATEGORIES: readonly TestimonialCategory[] = [
  "trainer",
  "mentor",
  "peer",
  "academic",
  "friend",
  "hackathon",
];

export const CATEGORY_LABELS: Record<TestimonialCategory, string> = {
  trainer: "Training client",
  mentor: "Mentee",
  peer: "Peer / manager",
  academic: "Professor",
  friend: "Friend",
  hackathon: "Hackathon teammate",
};

// Labels shown to the public submitter — plain-English, no "mentor" jargon.
export const SUBMITTER_ROLE_LABELS: Record<TestimonialCategory, string> = {
  trainer: "I attended a training / workshop with Edmund",
  mentor: "Edmund mentored me (junior / mentee)",
  peer: "I've worked with Edmund as a peer / colleague / manager",
  academic: "I taught Edmund (professor / TA)",
  friend: "I know Edmund personally (friend)",
  hackathon: "We hacked together (hackathon teammate)",
};

export interface QuoteAnswer {
  question_id: string;
  question_text: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  quote_answers: QuoteAnswer[] | null;
  long_quote: string | null;
  author_name: string;
  author_role: string | null;
  author_company: string | null;
  author_avatar_url: string | null;
  author_email: string | null;
  author_linkedin_url: string | null;
  context: string | null;
  outcome_tag: string | null;
  category: TestimonialCategory;
  tags: string[] | null;
  moderation_status: ModerationStatus;
  featured: boolean;
  published: boolean;
  sort_order: number | null;
  submitted_at: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
}

async function baseQuery(): Promise<Testimonial[]> {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false });
  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message)) return [];
    throw new Error(`testimonials: ${error.message}`);
  }
  return (data ?? []) as Testimonial[];
}

export const listAllTestimonials = cache(async (): Promise<Testimonial[]> => baseQuery());

export const listPublicTestimonials = cache(async (): Promise<Testimonial[]> => {
  const rows = await baseQuery();
  return rows.filter((r) => r.published && r.moderation_status === "approved");
});

export const listFeaturedTestimonials = cache(async (): Promise<Testimonial[]> => {
  const rows = await listPublicTestimonials();
  return rows.filter((r) => r.featured);
});

export const listPendingTestimonials = cache(async (): Promise<Testimonial[]> => {
  const rows = await baseQuery();
  return rows.filter((r) => r.moderation_status === "pending");
});

export async function getTestimonial(id: string): Promise<Testimonial | null> {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getTestimonial: ${error.message}`);
  return data as Testimonial | null;
}

export async function upsertTestimonial(
  fields: Partial<Testimonial> & {
    quote: string;
    author_name: string;
    category: TestimonialCategory;
  },
): Promise<Testimonial> {
  const payload = { ...fields, updated_at: new Date().toISOString() };
  const query = fields.id
    ? supabaseAdmin.from("testimonials").update(payload).eq("id", fields.id).select().single()
    : supabaseAdmin.from("testimonials").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw new Error(`upsertTestimonial: ${error.message}`);
  return data as Testimonial;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(`deleteTestimonial: ${error.message}`);
}

// Server-only: inserts a public submission with moderation_status='pending', published=false.
// Never trusts caller-supplied featured / published / moderation_status.
export async function createPublicSubmission(input: {
  quote: string;
  quote_answers: QuoteAnswer[];
  author_name: string;
  author_role: string | null;
  author_company: string | null;
  author_avatar_url: string | null;
  author_email: string;
  author_linkedin_url: string | null;
  category: TestimonialCategory;
}): Promise<Testimonial> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .insert({
      quote: input.quote,
      quote_answers: input.quote_answers,
      author_name: input.author_name,
      author_role: input.author_role,
      author_company: input.author_company,
      author_avatar_url: input.author_avatar_url,
      author_email: input.author_email,
      author_linkedin_url: input.author_linkedin_url,
      category: input.category,
      moderation_status: "pending",
      published: false,
      featured: false,
      submitted_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(`createPublicSubmission: ${error.message}`);
  return data as Testimonial;
}
