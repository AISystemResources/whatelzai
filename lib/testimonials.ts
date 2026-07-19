import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";
import { slugify } from "./slug";

export type TestimonialCategory =
  | "trainer"
  | "mentor"
  | "peer"
  | "academic"
  | "friend"
  | "hackathon";

export type TestimonialStatus =
  | "incomplete"
  | "pending"
  | "approved"
  | "rejected";

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
  academic: "Professor / school staff",
  friend: "Friend",
  hackathon: "Hackathon teammate",
};

export const SUBMITTER_ROLE_LABELS: Record<TestimonialCategory, string> = {
  trainer: "I attended a training / workshop with Edmund",
  mentor: "Edmund mentored me (junior / mentee)",
  peer: "I've worked with Edmund as a peer / colleague / manager",
  academic:
    "I taught or supported Edmund at school (professor / career coach / staff)",
  friend: "I know Edmund personally (friend)",
  hackathon: "We hacked together (hackathon teammate)",
};

export interface QuoteAnswer {
  question_id: string;
  question_text: string;
  answer: string;
}

export interface Affiliation {
  role: string;
  company: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  quote_answers: QuoteAnswer[] | null;
  author_name: string;
  author_affiliations: Affiliation[] | null;
  author_avatar_url: string | null;
  author_email: string | null;
  author_linkedin_url: string | null;
  outcome_tag: string | null;
  category: TestimonialCategory;
  service_event_id: string | null;
  status: TestimonialStatus;
  featured: boolean;
  published: boolean;
  sort_order: number | null;
  completion_token: string | null;
  suggested_question_ids: string[] | null;
  admin_note: string | null;
  improvement_note: string | null;
  created_by_clerk_id: string | null;
  submitted_at: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
}

// URL-safe short token: 10 chars.
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

async function baseQuery(): Promise<Testimonial[]> {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false });
  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message))
      return [];
    throw new Error(`testimonials: ${error.message}`);
  }
  return (data ?? []) as Testimonial[];
}

export const listAllTestimonials = cache(
  async (): Promise<Testimonial[]> => baseQuery(),
);

export const listPublicTestimonials = cache(
  async (): Promise<Testimonial[]> => {
    const rows = await baseQuery();
    return rows.filter((r) => r.published && r.status === "approved");
  },
);

export const listFeaturedTestimonials = cache(
  async (): Promise<Testimonial[]> => {
    const rows = await listPublicTestimonials();
    return rows.filter((r) => r.featured);
  },
);

export async function getTestimonial(id: string): Promise<Testimonial | null> {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getTestimonial: ${error.message}`);
  return data as Testimonial | null;
}

// URL slug is `<kebab-name>-<first-8-of-id>`. Deterministic per row without a migration.
export function testimonialSlug(
  t: Pick<Testimonial, "id" | "author_name">,
): string {
  const name = slugify(t.author_name || "", 60) || "voice";
  return `${name}-${t.id.slice(0, 8)}`;
}

export async function getTestimonialBySlug(
  slug: string,
): Promise<Testimonial | null> {
  const m = slug.match(/-([0-9a-f]{8})$/i);
  if (!m) return null;
  const idPrefix = m[1].toLowerCase();
  // Postgres `uuid` columns don't accept LIKE/ILIKE without a text cast; fetch
  // the published set and match in memory. Dataset is small (dozens, not thousands).
  const rows = await listPublicTestimonials();
  return rows.find((r) => r.id.toLowerCase().startsWith(idPrefix)) ?? null;
}

export async function getTestimonialByToken(
  token: string,
): Promise<Testimonial | null> {
  if (!token || token.length > 20) return null;
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*")
    .eq("completion_token", token)
    .maybeSingle();
  if (error) return null;
  return data as Testimonial | null;
}

export async function upsertTestimonial(
  fields: Partial<Testimonial> & {
    author_name?: string;
    category: TestimonialCategory;
  },
): Promise<Testimonial> {
  const payload = { ...fields, updated_at: new Date().toISOString() };
  const query = fields.id
    ? supabaseAdmin
        .from("testimonials")
        .update(payload)
        .eq("id", fields.id)
        .select()
        .single()
    : supabaseAdmin.from("testimonials").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw new Error(`upsertTestimonial: ${error.message}`);
  return data as Testimonial;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("testimonials")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`deleteTestimonial: ${error.message}`);
}

// Server-only: creates a fresh incomplete testimonial. Used by both admin (pre-fill) and
// public (email-first) flows. Always starts as 'incomplete'; caller can seed known fields.
export async function createIncompleteTestimonial(input: {
  category: TestimonialCategory;
  author_name?: string;
  author_email?: string;
  author_linkedin_url?: string;
  author_affiliations?: Affiliation[];
  suggested_question_ids?: string[];
  admin_note?: string;
  service_event_id?: string;
  created_by_clerk_id?: string;
}): Promise<Testimonial> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .insert({
      category: input.category,
      author_name: input.author_name ?? "",
      author_email: input.author_email ?? null,
      author_linkedin_url: input.author_linkedin_url ?? null,
      author_affiliations: input.author_affiliations ?? null,
      suggested_question_ids: input.suggested_question_ids ?? null,
      admin_note: input.admin_note ?? null,
      service_event_id: input.service_event_id ?? null,
      created_by_clerk_id: input.created_by_clerk_id ?? null,
      quote: "",
      status: "incomplete",
      published: false,
      featured: false,
      completion_token: generateToken(),
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(`createIncompleteTestimonial: ${error.message}`);
  return data as Testimonial;
}

// Server-only: marks an incomplete testimonial as pending with the completed data.
export async function completeTestimonial(
  id: string,
  input: {
    quote: string;
    quote_answers: QuoteAnswer[];
    author_name: string;
    author_affiliations: Affiliation[] | null;
    author_avatar_url: string | null;
    author_email: string;
    author_linkedin_url: string | null;
    category: TestimonialCategory;
    improvement_note: string | null;
    service_event_id: string | null;
  },
): Promise<Testimonial> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .update({
      quote: input.quote,
      quote_answers: input.quote_answers,
      author_name: input.author_name,
      author_affiliations: input.author_affiliations,
      author_avatar_url: input.author_avatar_url,
      author_email: input.author_email,
      author_linkedin_url: input.author_linkedin_url,
      category: input.category,
      improvement_note: input.improvement_note,
      service_event_id: input.service_event_id,
      status: "pending",
      submitted_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`completeTestimonial: ${error.message}`);
  return data as Testimonial;
}
