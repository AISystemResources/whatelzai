import Link from "next/link";
import { MemberNav } from "@/components/culture/MemberNav";
import { SignOutButton } from "@/components/auth/AuthControls";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Member home",
  robots: { index: false, follow: false },
};

export default async function MemberHome() {
  const user = await ensureUserRow();
  if (!user) redirect("/sign-in");
  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <header className="flex items-center justify-between border-b border-zinc-200 pb-6">
          <a href="https://whatelz.ai" className="font-semibold">
            whatelz.ai
          </a>
          <SignOutButton />
        </header>
        <div className="mt-6">
          <MemberNav current="/" />
        </div>
        <h1 className="mt-12 text-3xl font-semibold">
          Welcome{user.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-3 text-zinc-600">
          Your space for learning and staying connected.
        </p>
        <div className="mt-8 rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">Your account</h2>
          <p className="mt-2 text-sm text-zinc-600">
            View your existing purchases.
          </p>
          <a href="/account" className="mt-4 inline-block underline">
            View purchases →
          </a>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">My team</h2>
          <p className="mt-2 text-sm text-zinc-600">
            See your sponsor relationships once your account has been linked to
            your team profile.
          </p>
          <a href="/team" className="mt-4 inline-block underline">
            View my team →
          </a>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">Product catalogue</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Explore Malaysia and Singapore product references, prices and
            published PV/BV.
          </p>
          <a href="/catalogue" className="mt-4 inline-block underline">
            Explore products →
          </a>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">Founder’s Club calendar</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Explore upcoming community activities, Intro, Gather, Collab and
            learning events.
          </p>
          <a href="/calendar" className="mt-4 inline-block underline">
            View calendar →
          </a>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">Culture</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Wise words from 超凡, with 顺育 and Founder’s Club collections to
            come.
          </p>
          <a href="/culture" className="mt-4 inline-block underline">
            Explore culture →
          </a>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">Leads</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Your private namelist, personal stories, activity history and next
            follow-ups.
          </p>
          <Link href="/leads" className="mt-4 inline-block underline">
            Open leads →
          </Link>
        </div>
        <p className="mt-8 text-sm text-zinc-500">
          Seminar learnings and pipeline activities will be added here
          gradually.
        </p>
      </main>
    </>
  );
}
