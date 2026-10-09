import assert from "node:assert/strict";
import { test } from "node:test";
import {
  reconcileInvitations,
  expandMonth,
} from "../lib/community-calendar/ical";
import {
  occursOn,
  monthBounds,
  shiftMonth,
} from "../lib/community-calendar/model";
const zone =
  "BEGIN:VTIMEZONE\r\nTZID:Asia/Singapore\r\nBEGIN:STANDARD\r\nDTSTART:19700101T000000\r\nTZOFFSETFROM:+0800\r\nTZOFFSETTO:+0800\r\nEND:STANDARD\r\nEND:VTIMEZONE";
function message(
  body: string,
  sequence = 0,
  method = "REQUEST",
  id = "message",
) {
  return {
    message_id: id,
    received_at: "2026-10-10T00:00:00Z",
    ics: `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nMETHOD:${method}\r\n${zone}\r\nBEGIN:VEVENT\r\nUID:test-series\r\nDTSTAMP:20261009T000000Z\r\nSEQUENCE:${sequence}\r\nSUMMARY:Example activity\r\n${body}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`,
  };
}
const weekly =
  "DTSTART;TZID=Asia/Singapore:20260929T200000\r\nDTEND;TZID=Asia/Singapore:20260929T220000\r\nRRULE:FREQ=WEEKLY;BYDAY=TU";
test("weekly recurrence keeps UTC+8 times and excludes EXDATE", () => {
  const records = reconcileInvitations([
    message(weekly + "\r\nEXDATE;TZID=Asia/Singapore:20261013T200000"),
  ]);
  const events = expandMonth(records, "2026-10");
  assert.deepEqual(
    events.map((e) => e.start),
    [
      "2026-10-06T12:00:00.000Z",
      "2026-10-20T12:00:00.000Z",
      "2026-10-27T12:00:00.000Z",
    ],
  );
});
test("latest sequence wins irrespective of mail retrieval order", () => {
  const old = message(weekly, 0, "REQUEST", "old"),
    newer = message(weekly.replace("T200000", "T210000"), 2, "REQUEST", "new");
  assert.equal(reconcileInvitations([newer, old])[0].message_id, "new");
  assert.equal(reconcileInvitations([old, newer]).length, 1);
});
test("revision date breaks sequence ties", () => {
  const old = message(weekly, 1, "REQUEST", "old"),
    newer = message(weekly, 1, "REQUEST", "new");
  newer.ics = newer.ics.replace(
    "DTSTAMP:20261009T000000Z",
    "DTSTAMP:20261010T000000Z",
  );
  assert.equal(reconcileInvitations([newer, old])[0].message_id, "new");
});
test("a moved exception replaces its occurrence without duplicating", () => {
  const exception = message(
    "RECURRENCE-ID;TZID=Asia/Singapore:20261013T200000\r\nDTSTART;TZID=Asia/Singapore:20261014T180000\r\nDTEND;TZID=Asia/Singapore:20261014T200000",
    1,
  );
  const events = expandMonth(
    reconcileInvitations([message(weekly), exception]),
    "2026-10",
  );
  assert.equal(events.length, 4);
  assert(events.some((e) => e.start === "2026-10-14T10:00:00.000Z"));
  assert(!events.some((e) => e.start === "2026-10-13T12:00:00.000Z"));
});
test("cancelled series and cancelled instances are omitted", () => {
  assert.equal(
    expandMonth(
      reconcileInvitations([message(weekly), message(weekly, 2, "CANCEL")]),
      "2026-10",
    ).length,
    0,
  );
  const cancellation = message(
    "RECURRENCE-ID;TZID=Asia/Singapore:20261013T200000\r\nDTSTART;TZID=Asia/Singapore:20261013T200000\r\nDTEND;TZID=Asia/Singapore:20261013T220000",
    2,
    "CANCEL",
  );
  assert.equal(
    expandMonth(
      reconcileInvitations([message(weekly), cancellation]),
      "2026-10",
    ).length,
    3,
  );
});
test("orphan exception remains an independently invited occurrence", () => {
  const exception = message(
    "RECURRENCE-ID;TZID=Asia/Singapore:20261013T200000\r\nDTSTART;TZID=Asia/Singapore:20261014T180000\r\nDTEND;TZID=Asia/Singapore:20261014T200000",
    1,
  );
  assert.equal(
    expandMonth(reconcileInvitations([exception]), "2026-10").length,
    1,
  );
});
test("an exception moved from next month appears in this month", () => {
  const exception = message(
    "RECURRENCE-ID;TZID=Asia/Singapore:20261103T200000\r\nDTSTART;TZID=Asia/Singapore:20261031T180000\r\nDTEND;TZID=Asia/Singapore:20261031T200000",
    1,
  );
  assert.equal(
    expandMonth(reconcileInvitations([message(weekly), exception]), "2026-10")
      .length,
    5,
  );
});
test("multi-day all-day events use exclusive end dates", () => {
  const [event] = expandMonth(
    reconcileInvitations([
      message("DTSTART;VALUE=DATE:20261031\r\nDTEND;VALUE=DATE:20261102"),
    ]),
    "2026-11",
  );
  assert(event.allDay);
  assert(occursOn(event, "2026-11-01"));
  assert(!occursOn(event, "2026-11-02"));
});
test("private mail details and subcomponents cannot enter shared records", () => {
  const [record] = reconcileInvitations([
    message(
      weekly +
        "\r\nATTENDEE:mailto:private@example.test\r\nDESCRIPTION:Private RSVP token\r\nBEGIN:VALARM\r\nACTION:EMAIL\r\nEND:VALARM",
    ),
  ]);
  assert(!/private|attendee|valarm|description/i.test(record.ics));
});
test("month boundaries follow Malaysia/Singapore time", () => {
  assert.equal(
    monthBounds("2026-10").start.toISOString(),
    "2026-09-30T16:00:00.000Z",
  );
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.throws(() => monthBounds("2026-13"));
});
test("meeting links in location are replaced with a host instruction", () => {
  const [record] = reconcileInvitations([
    message(weekly + "\r\nLOCATION:https://meet.google.com/private-code"),
  ]);
  assert(!record.ics.includes("private-code"));
  assert(expandMonth([record], "2026-10")[0].location.startsWith("Online"));
});
test("physical venues survive when a meeting link shares the location field", () => {
  const [record] = reconcileInvitations([
    message(
      weekly +
        "\r\nLOCATION:Example venue\\; https://meet.google.com/private-code",
    ),
  ]);
  assert.equal(expandMonth([record], "2026-10")[0].location, "Example venue");
  assert(!record.ics.includes("private-code"));
});
test("identical standalone and repeating invitations display once", () => {
  const single = message(
    "DTSTART;TZID=Asia/Singapore:20261006T200000\r\nDTEND;TZID=Asia/Singapore:20261006T220000",
  );
  single.ics = single.ics.replace("UID:test-series", "UID:separate-invitation");
  assert.equal(
    expandMonth(reconcileInvitations([message(weekly), single]), "2026-10")
      .length,
    4,
  );
});
