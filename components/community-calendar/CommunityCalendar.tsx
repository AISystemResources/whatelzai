"use client";
import Link from "next/link";
import { useState } from "react";
import {
  activityTypes,
  localDay,
  occursOn,
  shiftMonth,
  type ActivityType,
  type CalendarOccurrence,
} from "@/lib/community-calendar/model";
const dateLabel = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Singapore",
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeLabel = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Singapore",
  hour: "numeric",
  minute: "2-digit",
});
function schedule(event: CalendarOccurrence) {
  if (event.allDay) {
    const last = new Date(new Date(event.end).getTime() - 1);
    return localDay(event.start) === localDay(last.toISOString())
      ? "All day · Time not specified"
      : `${dateLabel.format(new Date(event.start))} – ${dateLabel.format(last)} · Time not specified`;
  }
  return `${dateLabel.format(new Date(event.start))} · ${timeLabel.format(new Date(event.start))} – ${localDay(event.start) !== localDay(event.end) ? dateLabel.format(new Date(event.end)) + " · " : ""}${timeLabel.format(new Date(event.end))}`;
}
export function CommunityCalendar({
  month,
  today,
  events,
  snapshot,
}: {
  month: string;
  today: string;
  events: CalendarOccurrence[];
  snapshot: {
    imported_at: string;
    message_count: number;
    record_count: number;
  } | null;
}) {
  const [category, setCategory] = useState<ActivityType>("All activities");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"month" | "agenda">("month");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const visible = events.filter(
    (e) =>
      (category === "All activities" || e.category === category) &&
      `${e.title} ${e.location}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  const listed = selectedDay
    ? visible.filter((e) => occursOn(e, selectedDay))
    : visible;
  const [year, m] = month.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat("en-MY", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00Z`));
  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-600">
        {snapshot ? (
          <>
            Imported {snapshot.message_count} invitation/update messages ·
            Updated {dateLabel.format(new Date(snapshot.imported_at))},{" "}
            {new Date(snapshot.imported_at).getFullYear()}. This is a saved
            schedule, not live sync. Recurring activities follow the invitation
            pattern; confirm upcoming sessions, fees and venues with your host.
          </>
        ) : (
          "No events have been imported yet."
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            aria-label="Previous month"
            href={`/calendar?month=${shiftMonth(month, -1)}`}
            className="rounded-lg border px-3 py-2"
          >
            ←
          </Link>
          <h2 className="min-w-40 text-lg font-semibold">{monthLabel}</h2>
          <Link
            aria-label="Next month"
            href={`/calendar?month=${shiftMonth(month, 1)}`}
            className="rounded-lg border px-3 py-2"
          >
            →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/calendar?month=${today}`}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            This month
          </Link>
          {(["month", "agenda"] as const).map((v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() => {
                setView(v);
                setSelectedDay(null);
              }}
              className={`rounded-lg border px-3 py-2 text-sm ${view === v ? "bg-zinc-900 text-white" : ""}`}
            >
              {v === "month" ? "Month" : "Agenda"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Activity
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as ActivityType);
              setSelectedDay(null);
            }}
            className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white p-3 text-zinc-900"
          >
            {activityTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Search events
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedDay(null);
            }}
            placeholder="Event name or venue"
            className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white p-3 text-zinc-900"
          />
        </label>
      </div>
      {view === "month" ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <div className="grid grid-cols-7 bg-zinc-50 text-center text-xs font-medium text-zinc-600">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="py-3">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstWeekday }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="border-t border-zinc-100 bg-zinc-50/50"
              />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const day = `${month}-${String(i + 1).padStart(2, "0")}`,
                items = visible.filter((e) => occursOn(e, day));
              return (
                <button
                  key={day}
                  onClick={() =>
                    setSelectedDay(selectedDay === day ? null : day)
                  }
                  aria-label={`${day}, ${items.length} events`}
                  aria-pressed={selectedDay === day}
                  className={`min-h-20 min-w-0 border-t border-r border-zinc-100 p-1.5 text-left sm:min-h-32 sm:p-3 ${selectedDay === day ? "bg-yellow-100" : "hover:bg-zinc-50"}`}
                >
                  <span className="text-sm font-medium">{i + 1}</span>
                  <span className="mt-2 block text-[10px] text-zinc-500 sm:hidden">
                    {items.length
                      ? `${items.length} event${items.length > 1 ? "s" : ""}`
                      : ""}
                  </span>
                  <span className="mt-2 hidden space-y-1 sm:block">
                    {items.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        className="block truncate rounded bg-zinc-100 px-1 py-1 text-[11px]"
                      >
                        {e.title}
                      </span>
                    ))}
                    {items.length > 2 ? (
                      <span className="block text-xs text-zinc-500">
                        +{items.length - 2} more
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">
          {selectedDay
            ? dateLabel.format(new Date(`${selectedDay}T12:00:00+08:00`))
            : "Month’s events"}{" "}
          <span className="text-sm font-normal text-zinc-500">
            ({listed.length})
          </span>
        </h3>
        {selectedDay ? (
          <button
            onClick={() => setSelectedDay(null)}
            className="text-sm underline"
          >
            Show whole month
          </button>
        ) : null}
      </div>
      <div aria-live="polite" className="grid gap-3 sm:grid-cols-2">
        {listed.map((e) => (
          <article
            key={e.id}
            className="min-w-0 rounded-xl border border-zinc-200 p-5"
          >
            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              <span>{e.category}</span>
              {e.recurring ? <span>· Recurring schedule</span> : null}
            </div>
            <h4 className="mt-2 break-words text-lg font-semibold">
              {e.title}
            </h4>
            <p className="mt-3 text-sm leading-relaxed">{schedule(e)}</p>
            <p className="mt-2 break-words text-sm text-zinc-500">
              {e.location || "Venue not specified"}
            </p>
          </article>
        ))}
      </div>
      {listed.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-zinc-500">
          No imported events match this selection.
        </p>
      ) : null}
      <p className="text-xs text-zinc-500">
        All times are Malaysia / Singapore time (UTC+8). Invitations show
        scheduled activities, not confirmed attendance.
      </p>
    </section>
  );
}
