import type { Metadata } from "next";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { getActiveSubscription } from "@/lib/subscription";
import { getOfferBySlug } from "@/lib/offers";
import { CheckoutButton } from "./CheckoutButton";
import { ManageBillingButton } from "./ManageBillingButton";

export const metadata: Metadata = {
  title: "Members",
  description:
    "Members-only learning library — quizzes, videos, e-books, and podcasts by Edmund.",
};

export const dynamic = "force-dynamic";

const COMING_SOON = [
  {
    label: "Quizzes",
    body: "Short, self-check quizzes I built to test what I actually know — and what I'd expect you to.",
  },
  {
    label: "Videos",
    body: "Recorded walkthroughs of AI systems, live builds, and behind-the-scenes of things I ship.",
  },
  {
    label: "E-books & playbooks",
    body: "Longer-form written pieces — the ones too dense for a blog post but too short for a book.",
  },
  {
    label: "Podcasts",
    body: "Episodes and interviews on building AI systems in public.",
  },
];

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const subscription = userId ? await getActiveSubscription(userId) : null;
  const offer = await getOfferBySlug("whatelz-membership");
  const stripeReady = Boolean(offer?.stripe_price_id);

  const isMember = Boolean(subscription);
  const firstName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    null;

  return (
    <main className="px-6 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Members
        </p>

        {isMember ? (
          <>
            <h1 className="font-display-hero mt-4 text-4xl text-zinc-900 sm:text-5xl">
              {firstName ? `Hey, ${firstName}.` : "You're in."}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-600">
              You&rsquo;re on the whatelz.ai Membership. New content is being
              built — the first pieces land soon. Check back, or manage your
              subscription below.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {COMING_SOON.map((c) => (
                <div
                  key={c.label}
                  className="border border-zinc-200 bg-white p-6"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    Coming soon
                  </p>
                  <p className="mt-3 text-sm font-semibold text-zinc-900">
                    {c.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 border-t border-zinc-200 pt-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                Manage
              </p>
              <p className="mt-3 text-sm text-zinc-600">
                Update your card, download invoices, or cancel any time — no
                friction from me.
              </p>
              <div className="mt-4">
                <ManageBillingButton />
              </div>
              {subscription?.cancel_at_period_end && (
                <p className="mt-4 font-mono text-xs text-amber-700">
                  Your subscription is scheduled to cancel at the end of the
                  current period.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display-hero mt-4 text-4xl text-zinc-900 sm:text-6xl">
              {offer?.name ?? "whatelz.ai Membership"}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-600">
              {offer?.description ??
                "Members-only learning library — quizzes, videos, e-books, and podcasts."}
            </p>

            <p
              className="mt-8 font-mono text-lg tabular-nums"
              style={{ color: "var(--accent-text)" }}
            >
              {offer?.price_display ?? "$50 / month"}
            </p>

            {offer?.features && offer.features.length > 0 && (
              <ul className="mt-8 space-y-3 border-t border-zinc-200 pt-8">
                {offer.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-base text-zinc-700"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--accent-text)" }}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {checkout === "success" && (
              <p className="mt-8 border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Payment received. Give the webhook a moment to catch up, then
                refresh — you should see your dashboard here.
              </p>
            )}

            <div className="mt-10">
              {userId ? (
                offer && stripeReady ? (
                  <CheckoutButton offerId={offer.id} label="Subscribe →" />
                ) : (
                  <div className="border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
                    Checkout is being wired up. Come back once Stripe is live —
                    you&rsquo;re signed in, so you&rsquo;ll be first through.
                  </div>
                )
              ) : (
                <SignInButton mode="modal">
                  <button className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 hover:border-[var(--accent)]">
                    Sign in to subscribe →
                  </button>
                </SignInButton>
              )}
            </div>

            <p className="mt-8 text-xs text-zinc-400">
              Prefer to work with me 1:1?{" "}
              <Link
                href="/services"
                className="underline underline-offset-2 hover:text-zinc-700"
              >
                See services →
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
