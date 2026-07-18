import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  STRIPE_WEBHOOK_SECRET,
  isStripeConfigured,
} from "@/lib/stripe-server";
import { upsertSubscriptionFromStripe } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
// Stripe requires the raw request body for signature verification.
export const runtime = "nodejs";

async function findOfferIdForPrice(priceId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("stripe_offers")
    .select("id")
    .eq("stripe_price_id", priceId)
    .maybeSingle();
  return data?.id ?? null;
}

async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const clerkId =
    (sub.metadata?.clerk_id as string | undefined) ??
    (typeof sub.customer === "object" && sub.customer && "metadata" in sub.customer
      ? ((sub.customer.metadata?.clerk_id as string | undefined) ?? null)
      : null);
  if (!clerkId) {
    console.warn(
      `[stripe] subscription ${sub.id} has no clerk_id in metadata; skipping.`,
    );
    return;
  }

  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  if (!priceId) {
    console.warn(`[stripe] subscription ${sub.id} has no price; skipping.`);
    return;
  }

  const offerId =
    (sub.metadata?.offer_id as string | undefined) ??
    (await findOfferIdForPrice(priceId));

  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // current_period_end lives on the subscription item in newer Stripe API
  // versions and on the subscription itself in older ones. Read both.
  const periodEnd =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number })?.current_period_end ??
    null;

  await upsertSubscriptionFromStripe({
    clerk_id: clerkId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    offer_id: offerId,
    status: sub.status,
    current_period_end: periodEnd,
    cancel_at_period_end: sub.cancel_at_period_end,
  });
}

export async function POST(req: Request) {
  if (!isStripeConfigured() || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Signature verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          // Ensure clerk_id is on the subscription metadata (Checkout puts it
          // on the session but not always on the subscription).
          if (!sub.metadata?.clerk_id && session.client_reference_id) {
            await stripe.subscriptions.update(subId, {
              metadata: {
                ...(sub.metadata ?? {}),
                clerk_id: session.client_reference_id,
                offer_id: (session.metadata?.offer_id as string) ?? "",
              },
            });
            const fresh = await stripe.subscriptions.retrieve(subId);
            await syncSubscription(fresh);
          } else {
            await syncSubscription(sub);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = (invoice as unknown as { subscription?: string | Stripe.Subscription })
          .subscription;
        if (subRef) {
          const subId = typeof subRef === "string" ? subRef : subRef.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
        }
        break;
      }

      default:
        // Ignore other events; Stripe retries only on non-2xx.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook handler failed";
    console.error("[stripe webhook]", event.type, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
