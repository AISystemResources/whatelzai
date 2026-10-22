import { BriefMarkdown } from "@/components/admin/BriefMarkdown";
import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { dailyOwner, loadDailyTasks } from "@/lib/daily/server";
import { emdeeConnection, openaiConnection } from "@/lib/daily/connections";
import { loadBrief } from "@/lib/daily/emdee";
import { DAILY_PARENT } from "@/lib/daily/paths";
import { singaporeDay, previousDay, type Brief } from "@/lib/daily/model";
import { adminUrl } from "@/lib/admin-url";
import { BriefEditor, NewTask, TaskRow } from "./Forms";
import { apiGenerationEnabled } from "@/lib/daily/settings";
export const metadata: Metadata = {
  title: "Today — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function TodayPage() {
  const owner = await dailyOwner();
  const day = singaporeDay();
  const [tasks, emdee, ai] = await Promise.all([
    loadDailyTasks(day),
    emdeeConnection(owner),
    openaiConnection(owner),
  ]);
  const connected = emdee?.parentPath === DAILY_PARENT;
  let morning: Brief | null = null,
    evening: Brief | null = null,
    yesterday: Brief | null = null;
  let sourceError = "";
  if (connected) {
    try {
      [morning, evening, yesterday] = await Promise.all([
        loadBrief(day, "morning"),
        loadBrief(day, "evening"),
        loadBrief(previousDay(day), "evening"),
      ]);
    } catch {
      sourceError =
        "EMDEE could not be read. Existing text has not been replaced. Reconnect or reload before editing.";
    }
  }
  const due = tasks.active.filter((t) => t.due_on <= day);
  const upcoming = tasks.active.filter((t) => t.due_on > day);
  return (
    <div className="space-y-8 text-zinc-950">
      <header className="rounded-3xl bg-yellow-300 px-6 py-7 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.18em]">
          Your daily practice · Singapore
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Make today count.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6">
              Prepare with intention. Move something meaningful forward. Close
              the day with clarity.
            </p>
          </div>
          <p className="text-sm font-medium">
            {new Date(day + "T12:00:00+08:00").toLocaleDateString("en-SG", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Singapore",
            })}
          </p>
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-zinc-600">
          {due.filter((t) => t.accepted_on).length} accepted ·{" "}
          {tasks.completed.length} completed today
        </p>
        <Link
          href={adminUrl("/admin/today/connections")}
          className="underline underline-offset-4"
        >
          Connections · {connected ? "EMDEE connected" : "Connect EMDEE"}
        </Link>
      </div>
      <Link
        href={adminUrl("/admin/today/weekly")}
        className="inline-block text-sm underline underline-offset-4"
      >
        Weekly reflection →
      </Link>
      {!connected ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6">
          Your commitments are ready to use. Connect or reconnect EMDEE to
          Personal → Daily to save your briefs in your brain, and OpenAI when
          you want help preparing them. No daily schedules are enabled.
        </p>
      ) : null}
      {sourceError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {sourceError}
        </p>
      ) : null}
      {!apiGenerationEnabled() ? (
        <p className="rounded-xl bg-yellow-50 p-4 text-sm leading-6">
          ChatGPT prepares your morning brief at 4:30am and evening debrief at
          9pm Singapore time. Saved EMDEE entries appear here when you open or
          refresh this page. API generation is off.
        </p>
      ) : null}
      <section className="rounded-2xl border border-zinc-200 p-5">
        <h2 className="text-lg font-semibold">Yesterday’s handoff</h2>
        {yesterday?.exists ? (
          <div className="mt-3">
            <BriefMarkdown body={yesterday.body} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            {sourceError
              ? "Unavailable while EMDEE is disconnected."
              : connected
                ? "No evening closeout was found for yesterday. Start with what you know today."
                : "Your previous closeout will appear here once EMDEE is connected."}
          </p>
        )}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        {(["morning", "evening"] as const).map((kind) => {
          const brief = kind === "morning" ? morning : evening;
          return (
            <section
              key={kind}
              id={kind}
              className="rounded-2xl border border-zinc-200 p-5 sm:p-6"
            >
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                {kind === "morning" ? "Begin well" : "Finish with clarity"}
              </p>
              <h2 className="mb-5 mt-2 text-2xl font-semibold">
                {kind === "morning"
                  ? "Morning preparation"
                  : "Evening closeout"}
              </h2>
              {sourceError ? (
                <p className="text-sm text-zinc-500">
                  The editor will return when EMDEE can be read safely.
                </p>
              ) : (
                <>
                  {brief?.exists ? <BriefMarkdown body={brief.body} /> : null}
                  <details
                    open={!brief?.exists}
                    className="mt-5 rounded-xl border border-zinc-200 p-4"
                  >
                    <summary className="cursor-pointer text-sm font-medium">
                      {brief?.exists ? "Edit Markdown" : "Write an entry"}
                    </summary>
                    <div className="mt-4">
                      <BriefEditor
                        key={`${day}-${kind}-${brief?.hash ?? "new"}`}
                        day={day}
                        kind={kind}
                        brief={brief}
                        connected={connected}
                        aiReady={!!ai && apiGenerationEnabled()}
                      />
                    </div>
                  </details>
                </>
              )}
            </section>
          );
        })}
      </div>
      <section id="commitments" className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">
            Commitments & follow-through
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Proposals become commitments when you accept them. Unfinished work
            stays here until you complete it, move its check-in date, or
            explicitly drop it.
          </p>
        </div>
        <NewTask
          key={tasks.active.length + tasks.completed.length}
          day={day}
          id={randomUUID()}
        />
        <div className="grid gap-3 lg:grid-cols-2">
          {due.map((task) => (
            <TaskRow
              key={`${task.id}-${task.revision}`}
              task={task}
              day={day}
            />
          ))}
        </div>
        {!due.length ? (
          <p className="text-sm text-zinc-500">
            Nothing due yet. Choose one action worth committing to.
          </p>
        ) : null}
      </section>
      {upcoming.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Coming up</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {upcoming.map((task) => (
              <TaskRow
                key={`${task.id}-${task.revision}`}
                task={task}
                day={day}
              />
            ))}
          </div>
        </section>
      ) : null}
      {tasks.completed.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Moved forward today</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {tasks.completed.map((task) => (
              <TaskRow
                key={`${task.id}-${task.revision}`}
                task={task}
                day={day}
              />
            ))}
          </div>
        </section>
      ) : null}
      <p className="text-xs leading-5 text-zinc-500">
        Showing up to 100 unfinished commitments and 100 completions. Briefs
        live in EMDEE; operational status lives here. Your scheduled ChatGPT
        tasks save these records to EMDEE. Refresh after a run to see the latest
        saved changes.
      </p>
    </div>
  );
}
