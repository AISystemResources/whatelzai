import ICAL from "ical.js";
import { activityType, monthBounds, type CalendarOccurrence } from "./model";

export type Invitation = {
  message_id: string;
  received_at: string;
  ics: string;
};
export type CalendarRecord = {
  id: string;
  uid: string;
  recurrence_id: string;
  sequence: number;
  revision_at: string;
  message_id: string;
  received_at: string;
  ics: string;
};
const eventProperties = new Set([
  "uid",
  "summary",
  "location",
  "dtstart",
  "dtend",
  "duration",
  "dtstamp",
  "created",
  "last-modified",
  "sequence",
  "status",
  "rrule",
  "rdate",
  "exdate",
  "recurrence-id",
]);
function parseCalendar(ics: string) {
  const calendar = new ICAL.Component(ICAL.parse(ics));
  if (calendar.name !== "vcalendar") throw new Error("Expected VCALENDAR");
  for (const zone of calendar.getAllSubcomponents("vtimezone")) {
    const tzid = String(zone.getFirstPropertyValue("tzid"));
    if (!["Asia/Singapore", "Asia/Kuala_Lumpur"].includes(tzid))
      throw new Error(`Unsupported timezone: ${tzid}`);
    ICAL.TimezoneService.register(zone);
  }
  return calendar;
}
function toDate(time: ICAL.Time) {
  if (time.isDate) return new Date(`${time.toString()}T00:00:00+08:00`);
  if (time.zone.tzid === "floating")
    throw new Error("Timed events must specify a timezone");
  return time.toJSDate();
}
// Keep only schedule fields. Never persist attendees, alarms, descriptions,
// RSVP tokens, conferencing credentials or mail headers in the shared copy.
export function reconcileInvitations(messages: Invitation[]) {
  const winners = new Map<string, CalendarRecord>();
  for (const message of messages) {
    const calendar = parseCalendar(message.ics);
    for (const component of calendar.getAllSubcomponents("vevent")) {
      for (const property of [...component.getAllProperties()])
        if (!eventProperties.has(property.name))
          component.removeProperty(property);
      for (const child of [...component.getAllSubcomponents()])
        component.removeSubcomponent(child);
      const event = new ICAL.Event(component);
      if (
        /meet\.google\.com|zoom\.us|teams\.microsoft\.com/i.test(
          event.location || "",
        )
      ) {
        event.location =
          event.location
            .replace(
              /https?:\/\/[^\s;]*(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)[^\s;]*/gi,
              "",
            )
            .replace(/[;\s]+$/, "")
            .trim() || "Online — ask the host for joining details";
      }
      if (!event.uid) throw new Error("Missing event UID");
      const recurrence = component.getFirstPropertyValue(
        "recurrence-id",
      ) as ICAL.Time | null;
      const recurrence_id = recurrence ? toDate(recurrence).toISOString() : "";
      const revision = (component.getFirstPropertyValue("last-modified") ||
        component.getFirstPropertyValue("dtstamp")) as ICAL.Time | null;
      const sequence = Number(component.getFirstPropertyValue("sequence") || 0);
      if (!Number.isInteger(sequence) || sequence < 0)
        throw new Error("Invalid sequence");
      const cleaned = new ICAL.Component("vcalendar");
      cleaned.addPropertyWithValue("version", "2.0");
      cleaned.addPropertyWithValue(
        "method",
        String(calendar.getFirstPropertyValue("method") || "REQUEST"),
      );
      for (const zone of calendar.getAllSubcomponents("vtimezone"))
        cleaned.addSubcomponent(new ICAL.Component(zone.toJSON()));
      cleaned.addSubcomponent(component);
      const record: CalendarRecord = {
        id: `${event.uid}|${recurrence_id}`,
        uid: event.uid,
        recurrence_id,
        sequence,
        revision_at: revision
          ? toDate(revision).toISOString()
          : message.received_at,
        message_id: message.message_id,
        received_at: message.received_at,
        ics: cleaned.toString(),
      };
      const previous = winners.get(record.id);
      const newer =
        !previous ||
        record.sequence > previous.sequence ||
        (record.sequence === previous.sequence &&
          (record.revision_at > previous.revision_at ||
            (record.revision_at === previous.revision_at &&
              record.received_at > previous.received_at)));
      if (newer) winners.set(record.id, record);
    }
  }
  return [...winners.values()].sort((a, b) => a.id.localeCompare(b.id));
}
export function expandMonth(
  records: CalendarRecord[],
  month: string,
): CalendarOccurrence[] {
  const bounds = monthBounds(month);
  const groups = new Map<string, { event: ICAL.Event; cancelled: boolean }[]>();
  for (const record of records) {
    const calendar = parseCalendar(record.ics);
    const component = calendar.getFirstSubcomponent("vevent");
    if (!component) throw new Error("Missing event");
    const item = {
      event: new ICAL.Event(component),
      cancelled:
        calendar.getFirstPropertyValue("method") === "CANCEL" ||
        component.getFirstPropertyValue("status") === "CANCELLED",
    };
    groups.set(record.uid, [...(groups.get(record.uid) || []), item]);
  }
  const result = new Map<string, CalendarOccurrence>();
  const add = (
    event: ICAL.Event,
    start: ICAL.Time,
    end: ICAL.Time,
    key: string,
    recurring: boolean,
  ) => {
    if (event.component.getFirstPropertyValue("status") === "CANCELLED") return;
    const startDate = toDate(start),
      endDate = toDate(end);
    if (endDate <= startDate) throw new Error("Invalid event duration");
    if (startDate >= bounds.end || endDate <= bounds.start) return;
    result.set(key, {
      id: key,
      title: event.summary || "Untitled event",
      location: event.location || "",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay: start.isDate,
      recurring,
      category: activityType(event.summary || ""),
    });
  };
  for (const [uid, group] of groups) {
    const master = group.find((x) => !x.event.isRecurrenceException());
    const exceptions = group.filter((x) => x.event.isRecurrenceException());
    if (!master) {
      // A single occurrence may be invited without its parent series.
      for (const x of exceptions)
        if (!x.cancelled)
          add(
            x.event,
            x.event.startDate,
            x.event.endDate,
            `${uid}|${x.event.recurrenceId.toString()}`,
            false,
          );
      continue;
    }
    if (master.cancelled) continue;
    for (const x of exceptions) master.event.relateException(x.event);
    if (!master.event.isRecurring()) {
      add(
        master.event,
        master.event.startDate,
        master.event.endDate,
        uid,
        false,
      );
      continue;
    }
    const cancelled = new Set(
      exceptions
        .filter((x) => x.cancelled)
        .map((x) => x.event.recurrenceId.toString()),
    );
    const iterator = master.event.iterator();
    let complete = false;
    for (let i = 0; i < 50000; i++) {
      const next = iterator.next();
      if (!next || toDate(next) >= bounds.end) {
        complete = true;
        break;
      }
      if (cancelled.has(next.toString())) continue;
      const details = master.event.getOccurrenceDetails(next);
      add(
        details.item,
        details.startDate,
        details.endDate,
        `${uid}|${next.toString()}`,
        true,
      );
    }
    if (!complete) throw new Error("Recurrence expansion exceeded limit");
    // Include exceptions moved into this month from a later original date.
    for (const x of exceptions)
      if (!x.cancelled)
        add(
          x.event,
          x.event.startDate,
          x.event.endDate,
          `${uid}|${x.event.recurrenceId.toString()}`,
          true,
        );
  }
  const unique = new Map<string, CalendarOccurrence>();
  for (const item of result.values()) {
    const key = JSON.stringify([
      item.title.trim().toLowerCase(),
      item.start,
      item.end,
      item.location.trim().toLowerCase(),
    ]);
    const previous = unique.get(key);
    if (!previous || item.recurring) unique.set(key, item);
  }
  return [...unique.values()].sort(
    (a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title),
  );
}
