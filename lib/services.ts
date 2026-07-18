import { supabaseAdmin } from "./supabase-server";

export type ServiceStatus = "live" | "coming_soon" | "private" | "retired";
export type ServiceCategory =
  | "training"
  | "mentor"
  | "course"
  | "speak"
  | "build"
  | string;
export type PricingModel =
  | "per_session"
  | "per_hour"
  | "per_seat"
  | "package"
  | "custom"
  | string;

export interface PricingTier {
  id: string;
  label: string;
  amount: number | null;
  unit: string;
  note?: string;
}

export interface FoundingBlock {
  expires_after_engagements?: number;
  trade?: string;
  public?: boolean;
  tiers: PricingTier[];
}

export interface Pricing {
  currency: string;
  tiers: PricingTier[];
  founding?: FoundingBlock;
}

export interface ServiceTerms {
  deposit_pct?: number;
  cap_pax?: number;
  notes?: string[];
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  tagline: string | null;
  description: string | null;
  audience: string | null;
  pricing_model: PricingModel | null;
  pricing: Pricing | null;
  deliverables: string[] | null;
  terms: ServiceTerms | null;
  cta_label: string | null;
  cta_url: string | null;
  proof: string | null;
  status: ServiceStatus;
  featured: boolean;
  content: string | null;
  published: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export async function listServices(publishedOnly = false): Promise<Service[]> {
  let q = supabaseAdmin.from("services").select("*");
  if (publishedOnly) q = q.eq("published", true);
  const { data, error } = await q.order("sort_order", {
    ascending: true,
    nullsFirst: false,
  });
  if (error) {
    // Table not yet applied → treat as empty so /services still renders.
    if (error.code === "42P01" || /schema cache/i.test(error.message)) return [];
    throw new Error(`listServices: ${error.message}`);
  }
  return (data ?? []) as Service[];
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getServiceBySlug: ${error.message}`);
  return data as Service | null;
}

export async function upsertService(
  fields: Partial<Service> & { slug: string; name: string; category: string },
): Promise<Service> {
  const payload = { ...fields, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin
    .from("services")
    .upsert(payload, { onConflict: "slug" })
    .select()
    .single();
  if (error) throw new Error(`upsertService: ${error.message}`);
  return data as Service;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("services").delete().eq("id", id);
  if (error) throw new Error(`deleteService: ${error.message}`);
}
