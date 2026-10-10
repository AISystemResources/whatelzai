import { MemberNav } from "@/components/culture/MemberNav";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { currentMonth, validMonth } from "@/lib/community-calendar/model";
import { loadCommunityCalendar } from "@/lib/community-calendar/server";
import { CommunityCalendar } from "@/components/community-calendar/CommunityCalendar";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Founder’s Club calendar",
  robots: { index: false, follow: false },
};
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; persona?: string }>;
}) {
  if (!(await ensureUserRow())) redirect("/sign-in?redirect_url=/calendar");
  const params = await searchParams;
  const month = validMonth(params.month) ? params.month! : currentMonth();
  let calendar;
  try {
    calendar = await loadCommunityCalendar(month, params.persona);
  } catch {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/" className="underline">
          ← Member home
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Founder’s Club calendar</h1>
        <p className="mt-4">
          The calendar is temporarily unavailable. Please try again shortly.
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-10 sm:px-8">
      <MemberNav current="/calendar" />
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Network Marketing · Community
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Founder’s Club calendar
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-zinc-600">
          Find the next activity for you and the people you’re inviting. Explore
          the schedule, then arrange attendance with your host.
        </p>
      </header>
      <CommunityCalendar
        key={`${month}:${calendar.viewingAs}`}
        month={month}
        initialNow={new Date().toISOString()}
        {...calendar}
      />
    </main>
  );
}
