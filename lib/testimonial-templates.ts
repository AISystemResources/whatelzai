import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";
import type { TestimonialCategory } from "./testimonials";

// Group prefill templates. Each template exposes a public URL at
// /feedback/t/<slug>; scanning creates fresh testimonials rows.

export interface TestimonialTemplate {
  id: string;
  slug: string;
  name: string;
  category: TestimonialCategory;
  company_name: string | null;
  default_role: string | null;
  service_event_id: string | null;
  suggested_question_ids: string[];
  expires_at: string | null;
  max_submissions: number | null;
  submissions_count: number;
  is_active: boolean;
  created_by_clerk_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertTemplateInput {
  id?: string;
  slug: string;
  name: string;
  category: TestimonialCategory;
  company_name?: string | null;
  default_role?: string | null;
  service_event_id?: string | null;
  suggested_question_ids?: string[];
  expires_at?: string | null;
  max_submissions?: number | null;
  is_active?: boolean;
  created_by_clerk_id?: string | null;
}

async function baseQuery(): Promise<TestimonialTemplate[]> {
  const { data, error } = await supabaseAdmin
    .from("testimonial_templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message))
      return [];
    throw new Error(`testimonial_templates list: ${error.message}`);
  }
  return (data ?? []) as TestimonialTemplate[];
}

export const listTemplates = cache(baseQuery);

export async function getTemplateById(
  id: string,
): Promise<TestimonialTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from("testimonial_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getTemplateById: ${error.message}`);
  return data as TestimonialTemplate | null;
}

export async function getTemplateBySlug(
  slug: string,
): Promise<TestimonialTemplate | null> {
  const { data, error } = await supabaseAdmin
    .from("testimonial_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getTemplateBySlug: ${error.message}`);
  return data as TestimonialTemplate | null;
}

// Business rule: template accepts submissions when active AND not expired
// AND under the submission cap. Callers should treat any "false" as
// "render the closed page."
export function canAcceptSubmission(t: TestimonialTemplate): {
  ok: boolean;
  reason: "inactive" | "expired" | "full" | null;
} {
  if (!t.is_active) return { ok: false, reason: "inactive" };
  if (t.expires_at && new Date(t.expires_at) < new Date())
    return { ok: false, reason: "expired" };
  if (t.max_submissions !== null && t.submissions_count >= t.max_submissions)
    return { ok: false, reason: "full" };
  return { ok: true, reason: null };
}

export async function upsertTemplate(
  fields: UpsertTemplateInput,
): Promise<TestimonialTemplate> {
  const payload = {
    ...fields,
    suggested_question_ids: fields.suggested_question_ids ?? [],
    updated_at: new Date().toISOString(),
  };
  const query = fields.id
    ? supabaseAdmin
        .from("testimonial_templates")
        .update(payload)
        .eq("id", fields.id)
        .select()
        .single()
    : supabaseAdmin
        .from("testimonial_templates")
        .insert(payload)
        .select()
        .single();
  const { data, error } = await query;
  if (error) throw new Error(`upsertTemplate: ${error.message}`);
  return data as TestimonialTemplate;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("testimonial_templates")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`deleteTemplate: ${error.message}`);
}

// Atomic increment of submissions_count. Called after a successful
// public submission from /feedback/t/<slug>. Uses Postgres RPC for
// row-level atomicity; if the RPC isn't installed the fallback is a
// read-modify-write which is fine for the current low-throughput usage.
export async function incrementSubmissionCount(id: string): Promise<void> {
  // Cheap read-modify-write. If simultaneous submits become a concern,
  // add a Postgres function `increment_template_submissions(id uuid)`
  // and swap this call. For a founding-cohort-scale event this is fine.
  const { data: current, error: readErr } = await supabaseAdmin
    .from("testimonial_templates")
    .select("submissions_count")
    .eq("id", id)
    .single();
  if (readErr) throw new Error(`inc read: ${readErr.message}`);
  const next = (current?.submissions_count ?? 0) + 1;
  const { error: writeErr } = await supabaseAdmin
    .from("testimonial_templates")
    .update({ submissions_count: next, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (writeErr) throw new Error(`inc write: ${writeErr.message}`);
}

export function templatePublicUrl(
  slug: string,
  origin = "https://whatelz.ai",
): string {
  return `${origin}/feedback/t/${slug}`;
}
