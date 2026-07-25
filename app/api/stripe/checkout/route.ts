import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe-server";
import { getOfferById, getOfferBySlug } from "@/lib/offers";
import { findCustomerIdForClerkUser } from "@/lib/subscription";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://whatelz.ai";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Check back soon." },
      { status: 503 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      {
        error: "Sign in required",
        signInUrl: "/sign-in?redirect_url=/services",
      },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const offerId: string | undefined = body?.offer_id;
  const offerSlug: string | undefined = body?.offer_slug;

  const offer = offerId
    ? await getOfferById(offerId)
    : offerSlug
      ? await getOfferBySlug(offerSlug)
      : null;

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }
  if (!offer.active) {
    return NextResponse.json({ error: "Offer is not active" }, { status: 400 });
  }
  if (!offer.stripe_price_id) {
    return NextResponse.json(
      { error: "This offer is not ready for checkout yet." },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const existingCustomerId = await findCustomerIdForClerkUser(userId);

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: offer.billing_period === "recurring" ? "subscription" : "payment",
      line_items: [{ price: offer.stripe_price_id, quantity: 1 }],
      // Reuse the existing Stripe customer if the user already has one,
      // otherwise let Stripe create one and we'll capture it in the webhook.
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : email
          ? { customer_email: email }
          : {}),
      // Metadata flows through to the resulting Subscription/Session and lets
      // the webhook tie Stripe events back to a Clerk user without guessing.
      client_reference_id: userId,
      metadata: { clerk_id: userId, offer_id: offer.id },
      subscription_data:
        offer.billing_period === "recurring"
          ? { metadata: { clerk_id: userId, offer_id: offer.id } }
          : undefined,
      success_url: `${SITE_URL}/members?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/services?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
