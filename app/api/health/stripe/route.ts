import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe-server";
import { getLastWebhook } from "@/lib/webhook-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const configured = isStripeConfigured();
  let stripeReachable = false;
  let stripeError: string | null = null;

  if (configured) {
    try {
      await getStripe().balance.retrieve();
      stripeReachable = true;
    } catch (e) {
      stripeError = e instanceof Error ? e.message : "unknown";
    }
  }

  const last = await getLastWebhook();
  const secondsSinceLast = last?.last_webhook_at
    ? Math.floor((Date.now() - new Date(last.last_webhook_at).getTime()) / 1000)
    : null;

  return NextResponse.json({
    ok: configured && stripeReachable,
    stripe_configured: configured,
    stripe_reachable: stripeReachable,
    stripe_error: stripeError,
    last_webhook_at: last?.last_webhook_at ?? null,
    last_webhook_event: last?.last_webhook_event ?? null,
    seconds_since_last_webhook: secondsSinceLast,
  });
}
