import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe-server";
import { findCustomerIdForClerkUser } from "@/lib/subscription";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://whatelz.ai";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet." },
      { status: 503 },
    );
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const customerId = await findCustomerIdForClerkUser(userId);
  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer for this account yet." },
      { status: 404 },
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/members`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Portal session failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
