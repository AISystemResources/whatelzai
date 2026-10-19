import Link from "next/link";
import { dailyOwner } from "@/lib/daily/server";
import { weeklyStatus } from "@/lib/daily/weekly";
import { emdeeConnection, openaiConnection } from "@/lib/daily/connections";
import { readEmdee } from "@/lib/daily/emdee-client";
import { previousWeek } from "@/lib/daily/weekly-model";
import { DAILY_PARENT } from "@/lib/daily/paths";
import { adminUrl } from "@/lib/admin-url";
import { WeeklyForm } from "./WeeklyForm";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = {
  title: "Weekly reflection — Admin",
  robots: { index: false, follow: false },
};
export default async function WeeklyPage() {
  const owner = await dailyOwner();
  const week = previousWeek();
  const [run, emdee, ai] = await Promise.all([
    weeklyStatus(owner),
    emdeeConnection(owner),
    openaiConnection(owner),
  ]);
  const ready = emdee?.parentPath === DAILY_PARENT && !!ai;
  let body = "",
    readError = false;
  if (emdee?.parentPath === DAILY_PARENT && run?.status === "completed") {
    try {
      const doc = await readEmdee(emdee, week.path);
      body = doc?.content?.split(/^## Notes\s*$/m)[1]?.trim() ?? "";
      if (!doc) readError = true;
    } catch {
      readError = true;
    }
  }
  return (
    <div className="max-w-3xl space-y-6 text-zinc-950">
      <Link href={adminUrl("/admin/today")} className="text-sm underline">
        ← Back to Today
      </Link>
      <header className="rounded-3xl bg-yellow-300 p-7">
        <p className="text-xs uppercase tracking-widest">
          Your weekly practice
        </p>
        <h1 className="mt-3 text-3xl font-semibold">
          Keep the lesson. Keep moving.
        </h1>
        <p className="mt-3 text-sm">
          {week.id} · {week.start} to {week.end}
        </p>
      </header>
      <p className="text-sm leading-6">
        Every Monday at 8am Singapore time, the previous Monday–Sunday entries
        are condensed into one weekly reflection under Personal → Daily → Weeks.
        Daily originals stay in Morning and Evening.
      </p>
      <p role="status" className="text-sm">
        Last week: {run?.status ?? "not prepared yet"}
        {run ? ` · ${run.attempts}/3 attempts` : ""}
        {run?.source_count != null ? ` · ${run.source_count}/14 entries` : ""}.
      </p>
      {run?.status === "failed" ? (
        <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm">
          The run needs attention at {run.error_code}. Your original entries are
          safe. Check Connections before retrying.
        </p>
      ) : null}
      {!ready ? (
        <p className="text-sm">
          Connect EMDEE to Personal Daily and OpenAI in{" "}
          <Link
            className="underline"
            href={adminUrl("/admin/today/connections")}
          >
            Connections
          </Link>{" "}
          to enable weekly preparation.
        </p>
      ) : null}
      <WeeklyForm
        disabled={
          !ready ||
          run?.status === "completed" ||
          run?.status === "empty" ||
          (run?.attempts ?? 0) >= 3
        }
      />
      {readError ? (
        <p role="alert">
          The saved summary could not be read. Check EMDEE before retrying.
        </p>
      ) : null}
      {body ? (
        <article className="whitespace-pre-wrap rounded-2xl border border-zinc-200 p-6 text-sm leading-7">
          {body}
        </article>
      ) : null}
      <p className="text-xs text-zinc-500">
        Expired authorization or unavailable sources stop the run. Renew EMDEE
        access in Connections when needed. Daily 8am/9pm preparation schedules
        remain disabled.
      </p>
    </div>
  );
}
