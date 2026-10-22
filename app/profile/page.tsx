import { AppHeader } from "@/components/fcos/AppHeader";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LogOut,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  UsersRound,
  ChevronDown,
} from "lucide-react";
import { ensureUserRow } from "@/lib/users";
import { MemberNav } from "@/components/culture/MemberNav";
import { SignOutButton } from "@/components/auth/AuthControls";
import { InstallAppButton } from "@/components/fcos/AppInstallation";
import { loadProfileData } from "@/lib/profile/server";
import { percentage } from "@/lib/profile/usage";
import { UsageLimit } from "./UsageLimit";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Profile · fcOS",
  robots: { index: false, follow: false },
};
const date = (value: string) =>
  new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
const card =
  "rounded-[2rem] bg-white p-6 shadow-[0_8px_35px_rgba(0,0,0,0.035)] sm:p-8";
export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await ensureUserRow();
  if (!user) redirect("/sign-in");
  const { tab } = await searchParams;
  const usageTab = tab === "usage";
  const { persona, usage } = await loadProfileData();
  const firstName = user.name?.split(" ")[0] || "friend";
  return (
    <main className="fcos-tab-page fcos-profile-page mx-auto min-h-dvh max-w-5xl space-y-6 bg-[#f7f6f4] px-5 pb-8 pt-6 text-zinc-950 sm:px-8">
      <AppHeader
        title="Profile"
        end={
          <SignOutButton>
            <button
              aria-label="Sign out"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600"
            >
              <LogOut size={20} aria-hidden="true" />
            </button>
          </SignOutButton>
        }
      />
      <MemberNav current="/profile" compact persistent accent="orange" />
      {!usageTab && (
        <section className="flex items-center gap-4 py-3 sm:gap-6">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-orange-100 bg-orange-50 text-3xl font-semibold text-orange-600 sm:h-28 sm:w-28">
            {user.image_url ? (
              <Image
                src={user.image_url}
                alt=""
                width={112}
                height={112}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              firstName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl">
              Welcome back,
              <br />
              {firstName}.
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Current tier:{" "}
              <strong className="font-semibold uppercase text-zinc-600">
                {persona ?? "Unavailable"}
              </strong>
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-600">
              <Sparkles size={13} aria-hidden="true" />
              Prepare · connect · grow
            </span>
          </div>
        </section>
      )}
      <nav
        aria-label="Profile sections"
        className="flex rounded-2xl bg-zinc-200/60 p-1"
      >
        {[
          { label: "Profile", href: "/profile", selected: !usageTab },
          { label: "Usage", href: "/profile?tab=usage", selected: usageTab },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.selected ? "page" : undefined}
            className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold ${item.selected ? "bg-white text-orange-600 shadow-sm" : "text-zinc-500"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {usageTab ? (
        <div className="space-y-5">
          {!usage ? (
            <section className={card}>
              <h2 className="text-xl font-bold">
                Usage temporarily unavailable
              </h2>
              <p className="mt-3 text-sm text-zinc-500">
                Your balance could not be checked. Reload to try again.
              </p>
            </section>
          ) : (
            <>
              <section className={card}>
                <UsageLimit
                  remaining={usage.remaining}
                  baseline={usage.baseline}
                  reserved={usage.reserved}
                  renewsAt={usage.renewsAt}
                  observedAt={usage.observedAt}
                />
                {!usage.canChat && (
                  <p className="mt-4 text-sm text-zinc-500">
                    AI Chat is currently unavailable.
                  </p>
                )}
              </section>
              <details className={`${card} group`}>
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  Resets & history
                  <ChevronDown
                    aria-hidden="true"
                    size={18}
                    className="shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {usage.lastReset
                    ? `Last admin reset: ${date(usage.lastReset.started_at)}.`
                    : "No admin resets yet."}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Only your admin can grant a full reset.
                </p>
                <ul className="mt-4 divide-y divide-zinc-100">
                  {usage.history.map((c) => (
                    <li key={c.id} className="py-4 first:pt-0">
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <strong>
                          {c.reason === "owner-reset"
                            ? "Admin allowance reset"
                            : c.reason === "weekly"
                              ? "Weekly allowance"
                              : "Previous monthly allowance"}
                        </strong>
                        <span className="font-semibold">
                          {percentage(
                            Number(c.spent_micro),
                            Number(c.allowance_micro),
                          ).toFixed(1)}
                          % used
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {date(c.started_at)} · {date(c.ends_at)} end
                        {c.id === usage.current?.id ? " · Current" : ""}
                      </p>
                      {Number(c.reserved_micro) > 0 && (
                        <p className="mt-1 text-xs text-orange-600">
                          {percentage(
                            Number(c.reserved_micro),
                            Number(c.allowance_micro),
                          ).toFixed(1)}
                          % reserved
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                {!usage.history.length && (
                  <p className="mt-4 text-sm text-zinc-500">
                    Your history starts when your first allowance cycle begins.
                  </p>
                )}
              </details>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 p-6 text-white shadow-[0_12px_30px_rgba(249,115,22,0.16)] sm:p-8">
            <div
              className="absolute -right-8 -top-12 h-44 w-44 rounded-full border-[28px] border-white/10"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                  fcOS · Founder’s Club OS
                </p>
                <h2 className="mt-2 text-2xl font-bold">Member Pass</h2>
              </div>
              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase">
                {persona ?? "Unverified"}
              </span>
            </div>
            <div className="relative mt-9">
              <p className="text-lg font-semibold">
                {user.name || "Your account"}
              </p>
              <p className="mt-1 break-all text-xs text-white/80">
                {user.email}
              </p>
            </div>
          </section>
          <section className={`${card} space-y-5`}>
            <Link
              href="/team"
              className="flex items-center justify-between text-sm font-semibold"
            >
              <span className="flex items-center gap-3">
                <UsersRound
                  size={20}
                  className="text-orange-500"
                  aria-hidden="true"
                />
                View my team
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <div className="border-t border-zinc-100 pt-5">
              <InstallAppButton accent="orange" />
            </div>
            <p className="flex items-start gap-2 text-xs leading-5 text-zinc-400">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              Your leads and notes stay private unless you explicitly share a
              note. Signing in does not automatically link a team profile.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
