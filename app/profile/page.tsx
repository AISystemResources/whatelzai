import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LogOut,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  UsersRound,
  RotateCcw,
  CalendarClock,
} from "lucide-react";
import { ensureUserRow } from "@/lib/users";
import { MemberNav } from "@/components/culture/MemberNav";
import { SignOutButton } from "@/components/auth/AuthControls";
import { InstallAppButton } from "@/components/fcos/AppInstallation";
import { loadProfileData } from "@/lib/profile/server";
import { money } from "@/lib/member-ai/model";
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
    <main className="fcos-profile-page mx-auto min-h-dvh max-w-4xl space-y-6 bg-[#f7f6f4] px-4 pb-8 pt-6 text-zinc-950 sm:px-8">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500 text-white">
            <Sparkles size={23} aria-hidden="true" />
          </span>
          <span className="text-xl tracking-tight">
            fcOS
            <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Founder’s Club OS
            </span>
          </span>
        </Link>
        <SignOutButton>
          <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-600 disabled:opacity-50">
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </SignOutButton>
      </header>
      <MemberNav current="/profile" compact accent="orange" />
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
          <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight sm:text-4xl">
            Welcome back,
            <br />
            {firstName}.
          </h1>
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
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  AI allowance
                </p>
                <h2 className="mt-2 text-2xl font-bold">Your AI credits</h2>
                <div className="mt-5 flex flex-wrap items-baseline gap-2">
                  <strong className="text-4xl font-bold tracking-tight">
                    {money(usage.remaining, 3)}
                  </strong>
                  <span className="text-sm text-zinc-400">
                    of {money(usage.allowance)} remaining
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="AI allowance used or reserved"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Number(usage.percent.toFixed(1))}
                  className="mt-5 h-2.5 overflow-hidden rounded-full bg-zinc-100"
                >
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${usage.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-orange-600">
                  {usage.percent.toFixed(1)}% used or reserved
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-zinc-400">Used this allowance</dt>
                    <dd className="mt-1 font-semibold">
                      {money(usage.spent, 6)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-400">Reserved for replies</dt>
                    <dd className="mt-1 font-semibold">
                      {money(usage.reserved, 6)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-zinc-500">
                  <CalendarClock
                    size={16}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  Renews {date(usage.renewsAt)} · Singapore time
                </p>
                <div className="mt-5 border-t border-zinc-100 pt-4 text-xs leading-5 text-zinc-500">
                  {usage.canChat ? (
                    <>
                      Active personal pilot ·{" "}
                      <span className="font-medium text-zinc-700">
                        {usage.model}
                      </span>
                    </>
                  ) : usage.assigned ? (
                    "AI Chat is not enabled for this account. Assigned credits do not grant access."
                  ) : (
                    "AI Chat has not been enabled for your account yet."
                  )}
                  <p className="mt-2">
                    Credits are a USD allowance estimate, not a subscription
                    bill. Reserved credits are held while a reply is being
                    prepared.
                  </p>
                </div>
              </section>
              <section className={card}>
                <div className="flex items-center gap-2">
                  <RotateCcw
                    size={21}
                    className="text-orange-500"
                    aria-hidden="true"
                  />
                  <h2 className="text-xl font-bold">Admin-granted resets</h2>
                </div>
                {usage.lastReset ? (
                  <>
                    <p className="mt-4 text-sm font-semibold text-orange-600">
                      Full reset granted
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Your admin granted a fresh{" "}
                      {money(Number(usage.lastReset.allowance_micro))} allowance
                      on {date(usage.lastReset.started_at)}.
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {usage.resetCount} full{" "}
                      {usage.resetCount === 1 ? "reset" : "resets"} granted so
                      far.
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">
                    No admin-granted full reset yet.
                  </p>
                )}
                <p className="mt-4 text-xs leading-5 text-zinc-400">
                  A full reset starts a fresh allowance. Previous usage stays in
                  your history. Only the admin can grant one.
                </p>
              </section>
              <section className={card}>
                <h2 className="text-xl font-bold">Allowance history</h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Your 20 most recent allowance cycles
                </p>
                <ul className="mt-4 divide-y divide-zinc-100">
                  {usage.history.map((c) => (
                    <li key={c.id} className="py-4 first:pt-0">
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <strong>
                          {c.reason === "owner-reset"
                            ? "Admin full reset"
                            : "Monthly allowance"}
                        </strong>
                        <span className="font-semibold">
                          {money(Number(c.spent_micro), 6)} used
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {date(c.started_at)} ·{" "}
                        {money(Number(c.allowance_micro))} granted
                        {c.id === usage.current?.id ? " · Current" : ""}
                      </p>
                      {Number(c.reserved_micro) > 0 && (
                        <p className="mt-1 text-xs text-orange-600">
                          {money(Number(c.reserved_micro), 6)} reserved
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
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <section className={card}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              Your next chapter
            </p>
            <h2 className="mt-3 flex items-center gap-2 text-2xl font-bold">
              <Sparkles
                className="shrink-0 text-orange-500"
                aria-hidden="true"
              />
              Grow with intention.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              Prepare for your next conversation. Learn something worth sharing.
              Take one meaningful step forward.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-orange-600"
            >
              What needs my attention{" "}
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </section>
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
