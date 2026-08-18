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

  const isOneOff = offer.billing_period === "one_off";
  // Recurring offers require sign-in (needed for a stable Clerk↔Stripe link
  // across renewals). One-off offers (the Playbook) intentionally accept
  // anonymous checkout — Stripe collects the email, Clerk sign-up happens on
  // /success with that email prefilled.
  const { userId } = await auth();
  if (!isOneOff && !userId) {
    return NextResponse.json(
      {
        error: "Sign in required",
        signInUrl: "/sign-in?redirect_url=/services",
      },
      { status: 401 },
    );
  }

  const user = userId ? await currentUser() : null;
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const existingCustomerId = userId
    ? await findCustomerIdForClerkUser(userId)
    : null;

  const successPath = isOneOff
    ? `/success?session_id={CHECKOUT_SESSION_ID}`
    : `/members?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelPath = isOneOff
    ? `/playbook?checkout=cancelled`
    : `/services?checkout=cancelled`;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: isOneOff ? "payment" : "subscription",
      line_items: [{ price: offer.stripe_price_id, quantity: 1 }],
      // Reuse the existing Stripe customer if the user already has one,
      // otherwise let Stripe create one and we'll capture it in the webhook.
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : email
          ? { customer_email: email }
          : {}),
      // Anonymous one-off buyers need a Customer object created on the fly so
      // the webhook can key entitlements on customer_email and /success can
      // prefill Clerk sign-up.
      ...(isOneOff && !existingCustomerId
        ? { customer_creation: "always" as const }
        : {}),
      // client_reference_id / metadata.clerk_id are omitted for anonymous
      // one-off checkouts — no Clerk user exists yet.
      ...(userId ? { client_reference_id: userId } : {}),
      metadata: {
        offer_id: offer.id,
        offer_slug: offer.slug,
        ...(userId ? { clerk_id: userId } : {}),
      },
      subscription_data: !isOneOff
        ? { metadata: { clerk_id: userId ?? "", offer_id: offer.id } }
        : undefined,
      success_url: `${SITE_URL}${successPath}`,
      cancel_url: `${SITE_URL}${cancelPath}`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
