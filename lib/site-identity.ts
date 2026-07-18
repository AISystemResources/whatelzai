import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";

export interface SiteIdentity {
  owner_name: string;
  owner_short_name: string;
  owner_first_name: string;
  owner_initials: string | null;
  email: string;
  linkedin_url: string | null;
  portrait_url: string | null;
  tagline: string | null;
  meta_description: string | null;
  location: string | null;
  bio: string | null;
  resume_url: string | null;
  phone: string | null;
}

// Compile-time fallback used if the row isn't found (e.g. fresh clone before
// migration is applied). Values here are non-identifying placeholders — the
// real values live in Supabase and can be edited without a redeploy.
const FALLBACK: SiteIdentity = {
  owner_name: "whatelz.ai",
  owner_short_name: "whatelz.ai",
  owner_first_name: "whatelz",
  owner_initials: null,
  email: "hello@whatelz.ai",
  linkedin_url: null,
  portrait_url: null,
  tagline: "What else can you build with AI?",
  meta_description: "What else can you build with AI?",
  location: null,
  bio: null,
  resume_url: null,
  phone: null,
};

// Cached per-request read — React `cache` dedupes concurrent calls within a
// single render. Handles missing-table gracefully so build never breaks pre-migration.
export const getSiteIdentity = cache(async (): Promise<SiteIdentity> => {
  const { data, error } = await supabaseAdmin
    .from("site_identity")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message)) {
      return FALLBACK;
    }
    throw new Error(`getSiteIdentity: ${error.message}`);
  }

  return (data as SiteIdentity | null) ?? FALLBACK;
});

export async function updateSiteIdentity(
  patch: Partial<Omit<SiteIdentity, "owner_name" | "email">> & {
    owner_name?: string;
    email?: string;
  },
): Promise<SiteIdentity> {
  const payload = { ...patch, updated_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin
    .from("site_identity")
    .update(payload)
    .eq("singleton", true)
    .select()
    .single();
  if (error) throw new Error(`updateSiteIdentity: ${error.message}`);
  return data as SiteIdentity;
}
