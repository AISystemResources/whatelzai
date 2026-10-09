export const activityTypes = [
  "All activities",
  "Intro",
  "Gather",
  "Collab",
  "Sports & social",
  "Learning",
  "Other",
] as const;
export type ActivityType = (typeof activityTypes)[number];
export type CalendarOccurrence = {
  id: string;
  title: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  recurring: boolean;
  category: ActivityType;
};
export function activityType(title: string): ActivityType {
  if (/\bintro\b/i.test(title)) return "Intro";
  if (/\bgather\b/i.test(title)) return "Gather";
  if (/\bcollab\b/i.test(title)) return "Collab";
  if (
    /badminton|captain ball|night run|coffee with founders$|board game|trip/i.test(
      title,
    )
  )
    return "Sports & social";
  if (
    /class|training|workshop|大会|dahui|learning|health|mobility|strength|recognition/i.test(
      title,
    )
  )
    return "Learning";
  return "Other";
}
export function localDay(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
export function currentMonth(now = new Date()) {
  return localDay(now.toISOString()).slice(0, 7);
}
export function validMonth(value: string | undefined) {
  return !!value && /^(20\d{2})-(0[1-9]|1[0-2])$/.test(value);
}
export function shiftMonth(month: string, offset: number) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + offset, 1)).toISOString().slice(0, 7);
}
export function monthBounds(month: string) {
  if (!validMonth(month)) throw new Error("Invalid month");
  return {
    start: new Date(`${month}-01T00:00:00+08:00`),
    end: new Date(`${shiftMonth(month, 1)}-01T00:00:00+08:00`),
  };
}
export function occursOn(event: CalendarOccurrence, day: string) {
  const start = new Date(`${day}T00:00:00+08:00`).getTime();
  const end = start + 86400000;
  return (
    new Date(event.start).getTime() < end &&
    new Date(event.end).getTime() > start
  );
}
