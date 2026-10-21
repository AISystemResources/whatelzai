import { futureEvents } from "@/lib/fcos/model";
import { loadCommunityCalendar } from "@/lib/community-calendar/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import { todayUtc8, dateLabel } from "@/lib/leads/model";
import { MemberNav } from "@/components/culture/MemberNav";
import { SignOutButton } from "@/components/auth/AuthControls";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Today · fcOS",
  robots: { index: false, follow: false },
};
export default async function MemberHome() {
  const user = await ensureUserRow();
  if (!user) redirect("/sign-in");
  const today = todayUtc8();
  const [leads, tasks, calendar] = await Promise.all([
    supabaseAdmin
      .from("member_leads")
      .select("id,name,next_action,follow_up_on")
      .eq("owner_id", user.id)
      .not("stage", "in", '(ABO,APC,"Not now")')
      .lte("follow_up_on", today)
      .order("follow_up_on")
      .limit(8),
    supabaseAdmin
      .from("daily_tasks")
      .select("id,title,due_on,status")
      .eq("owner_id", user.id)
      .in("status", ["open", "blocked", "waiting"])
      .not("accepted_on", "is", null)
      .lte("due_on", today)
      .order("due_on")
      .limit(8),
    loadCommunityCalendar(today.slice(0, 7)).catch(() => null),
  ]);
  const comingUp = calendar ? futureEvents(calendar.events) : [];
  return (
    <main className="mx-auto max-w-4xl space-y-7 px-5 py-7">
      <MemberNav current="/" />
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Founder’s Club Operating System
          </p>
          <h1 className="mt-2 text-4xl font-semibold">
            A little focus.
            <br />A step forward<span className="text-yellow-400">.</span>
          </h1>
          <p className="mt-4 text-zinc-600">
            {dateLabel(today)} · Welcome
            {user.name ? `, ${user.name.split(" ")[0]}` : ""}.
          </p>
        </div>
        <SignOutButton />
      </header>
      <Link
        href="/assistant"
        className="block rounded-3xl bg-zinc-950 p-6 text-white"
      >
        <p className="text-xs uppercase tracking-widest text-yellow-300">
          fcOS Chat
        </p>
        <h2 className="mt-3 text-2xl font-semibold">
          What would help right now?
        </h2>
        <p className="mt-3 text-sm text-zinc-300">
          Prepare an HQH, reflect with an HHH, or decide who to follow up with.
        </p>
        <p className="mt-5 font-medium text-yellow-300">Open chat →</p>
      </Link>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your focus today</h2>
          <Link href="/leads" className="text-sm underline">
            My leads →
          </Link>
        </div>
        <p className="mb-4 text-sm text-zinc-500">
          Follow-ups due and commitments you accepted. Dates passing never means
          something is completed.
        </p>
        <div className="space-y-3">
          {leads.error ? (
            <p>Follow-ups are temporarily unavailable.</p>
          ) : (
            leads.data?.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="block rounded-xl border p-4"
              >
                <p className="font-semibold">{lead.name}</p>
                <p className="mt-1 text-sm">
                  {lead.next_action || "Choose a thoughtful follow-up"}
                </p>
                <p className="mt-2 text-xs text-amber-800">
                  {lead.follow_up_on < today
                    ? "Past follow-up date"
                    : "Due today"}{" "}
                  · {dateLabel(lead.follow_up_on)}
                </p>
              </Link>
            ))
          )}
          {tasks.error ? (
            <p>Commitments are temporarily unavailable.</p>
          ) : (
            tasks.data?.map((task) => (
              <Link
                key={task.id}
                href="/assistant"
                className="block rounded-xl border p-4"
              >
                <p className="font-semibold">{task.title}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  Accepted commitment · {task.status} · {dateLabel(task.due_on)}
                </p>
              </Link>
            ))
          )}
          {!leads.error &&
            !tasks.error &&
            !leads.data?.length &&
            !tasks.data?.length && (
              <p className="rounded-xl border border-dashed p-5 text-zinc-500">
                Nothing due is recorded. Choose your next step in chat or add a
                follow-up to a lead.
              </p>
            )}
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/briefings/new?kind=HQH"
          className="rounded-2xl bg-yellow-100 p-5"
        >
          <h2 className="font-semibold">HQH · 会前会</h2>
          <p className="mt-2 text-sm">Prepare before you meet →</p>
        </Link>
        <Link
          href="/briefings/new?kind=HHH"
          className="rounded-2xl bg-zinc-100 p-5"
        >
          <h2 className="font-semibold">HHH · 会后会</h2>
          <p className="mt-2 text-sm">Reflect after an experience →</p>
        </Link>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Coming up</h2>
          <Link href="/calendar" className="text-sm underline">
            Calendar →
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          Your permitted activities this month · imported schedule, not an RSVP.
        </p>
        {calendar === null ? (
          <p className="text-sm text-zinc-500">
            Calendar is temporarily unavailable.
          </p>
        ) : (
          comingUp.slice(0, 3).map((event) => (
            <Link
              key={event.id}
              href="/calendar"
              className="block rounded-xl border p-4"
            >
              <h3 className="font-medium">{event.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {new Intl.DateTimeFormat("en-MY", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Singapore",
                }).format(new Date(event.start))}
              </p>
            </Link>
          ))
        )}
        {calendar && !comingUp.length && (
          <p className="text-sm text-zinc-500">
            No upcoming activity is visible in this month’s saved schedule.
          </p>
        )}
      </section>
      <footer className="flex flex-wrap gap-5 border-t pt-4 text-sm text-zinc-500">
        <Link href="/resources">Explore resources</Link>
        <Link href="/team">My team</Link>
        <Link href="/account">My account</Link>
      </footer>
    </main>
  );
}
