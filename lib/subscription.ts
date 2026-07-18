import { supabaseAdmin } from "./supabase-server";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface Subscription {
  id: string;
  clerk_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  offer_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// A subscription grants access when Stripe considers it "live" — active or
// trialing. past_due keeps access briefly by convention (grace period); flip
// this if you want to lock access the moment a payment fails.
const LIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing", "past_due"];

export async function getActiveSubscription(
  clerkId: string,
): Promise<Subscription | null> {
  if (!clerkId) return null;
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("clerk_id", clerkId)
    .in("status", LIVE_STATUSES)
    .order("current_period_end", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as Subscription | null;
}

export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();
  if (error) return null;
  return data as Subscription | null;
}

export async function findCustomerIdForClerkUser(
  clerkId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("clerk_id", clerkId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.stripe_customer_id;
}

export async function upsertSubscriptionFromStripe(input: {
  clerk_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  offer_id: string | null;
  status: string;
  current_period_end: number | null; // unix seconds from Stripe
  cancel_at_period_end: boolean;
}): Promise<void> {
  const payload = {
    clerk_id: input.clerk_id,
    stripe_customer_id: input.stripe_customer_id,
    stripe_subscription_id: input.stripe_subscription_id,
    stripe_price_id: input.stripe_price_id,
    offer_id: input.offer_id,
    status: input.status,
    current_period_end: input.current_period_end
      ? new Date(input.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: input.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(payload, { onConflict: "stripe_subscription_id" });
  if (error) throw new Error(`upsertSubscriptionFromStripe: ${error.message}`);
}
