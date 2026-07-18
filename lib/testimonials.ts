import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";

export type TestimonialCategory =
  | "trainer"
  | "mentor"
  | "peer"
  | "academic"
  | "friend";

export const TESTIMONIAL_CATEGORIES: readonly TestimonialCategory[] = [
  "trainer",
  "mentor",
  "peer",
  "academic",
  "friend",
];

export const CATEGORY_LABELS: Record<TestimonialCategory, string> = {
  trainer: "Training client",
  mentor: "Mentee",
  peer: "Peer / manager",
  academic: "Professor",
  friend: "Friend",
};

export interface Testimonial {
  id: string;
  quote: string;
  long_quote: string | null;
  author_name: string;
  author_role: string | null;
  author_company: string | null;
  author_avatar_url: string | null;
  context: string | null;
  outcome_tag: string | null;
  category: TestimonialCategory;
  featured: boolean;
  published: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

async function query(publishedOnly: boolean, featuredOnly: boolean): Promise<Testimonial[]> {
  let q = supabaseAdmin.from("testimonials").select("*");
  if (publishedOnly) q = q.eq("published", true);
  if (featuredOnly) q = q.eq("featured", true);
  const { data, error } = await q.order("sort_order", { ascending: true, nullsFirst: false });
  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message)) return [];
    throw new Error(`testimonials: ${error.message}`);
  }
  return (data ?? []) as Testimonial[];
}

export const listTestimonials = cache(
  async (publishedOnly = false): Promise<Testimonial[]> => query(publishedOnly, false),
);

export const listFeaturedTestimonials = cache(
  async (): Promise<Testimonial[]> => query(true, true),
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

export async function upsertTestimonial(
  fields: Partial<Testimonial> & { quote: string; author_name: string; category: TestimonialCategory },
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
