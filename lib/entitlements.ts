import { supabaseAdmin } from "./supabase-server";

export interface Entitlement {
  id: string;
  user_id: string | null;
  stripe_customer_id: string;
  customer_email: string;
  product_slug: string;
  granted_at: string;
  revoked_at: string | null;
  stripe_event_id: string;
  stripe_checkout_session_id: string | null;
  stripe_charge_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrantEntitlementInput {
  user_id: string | null;
  stripe_customer_id: string;
  customer_email: string;
  product_slug: string;
  stripe_event_id: string;
  stripe_checkout_session_id?: string | null;
  stripe_charge_id?: string | null;
}

// Insert-or-noop on Stripe event id. Stripe retries webhooks aggressively; the
// unique(stripe_event_id) constraint is what makes replays safe.
export async function grantEntitlement(
  input: GrantEntitlementInput,
): Promise<{ inserted: boolean; row: Entitlement | null }> {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .insert({
      user_id: input.user_id,
      stripe_customer_id: input.stripe_customer_id,
      customer_email: input.customer_email.toLowerCase(),
      product_slug: input.product_slug,
      stripe_event_id: input.stripe_event_id,
      stripe_checkout_session_id: input.stripe_checkout_session_id ?? null,
      stripe_charge_id: input.stripe_charge_id ?? null,
    })
    .select("*")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") return { inserted: false, row: null };
    throw new Error(`grantEntitlement: ${error.message}`);
  }
  return { inserted: true, row: data as Entitlement };
}

// Soft revoke by Stripe charge id (refund path). Marks all matching active
// rows revoked — normally exactly one.
export async function revokeEntitlementByCharge(
  chargeId: string,
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .update({ revoked_at: new Date().toISOString() })
    .eq("stripe_charge_id", chargeId)
    .is("revoked_at", null)
    .select("id");
  if (error) throw new Error(`revokeEntitlementByCharge: ${error.message}`);
  return data?.length ?? 0;
}

export async function hasActiveEntitlement(
  userId: string,
  productSlug: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("product_slug", productSlug)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

// Bind orphan (user_id IS NULL) entitlements to a Clerk user on signup, by
// case-insensitive email match. SPR-112 calls this from the post-signup path.
export async function stitchOrphansToUser(
  userId: string,
  email: string,
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("entitlements")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("customer_email", email.toLowerCase())
    .select("id");
  if (error) throw new Error(`stitchOrphansToUser: ${error.message}`);
  return data?.length ?? 0;
}
