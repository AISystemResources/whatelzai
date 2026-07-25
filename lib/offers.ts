import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";

export type BillingPeriod = "recurring" | "one_off";

export interface StripeOffer {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  stripe_price_id: string | null;
  price_display: string;
  billing_period: BillingPeriod;
  features: string[] | null;
  highlight: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const listActiveOffers = cache(async (): Promise<StripeOffer[]> => {
  const { data, error } = await supabaseAdmin
    .from("stripe_offers")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message))
      return [];
    throw new Error(`listActiveOffers: ${error.message}`);
  }
  return (data ?? []) as StripeOffer[];
});

export async function getOfferBySlug(
  slug: string,
): Promise<StripeOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("stripe_offers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data as StripeOffer | null;
}

export async function getOfferById(id: string): Promise<StripeOffer | null> {
  const { data, error } = await supabaseAdmin
    .from("stripe_offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data as StripeOffer | null;
}
