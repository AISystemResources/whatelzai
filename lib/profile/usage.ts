export type UsageAccess = {
  active: boolean;
  model: string;
  allowance_micro: number;
  current_cycle_id: string | null;
};
export type UsageCycle = {
  id: string;
  allowance_micro: number;
  spent_micro: number;
  reserved_micro: number;
  started_at: string;
  ends_at: string;
  reason: string;
};
export function summarizeUsage(
  access: UsageAccess | null,
  cycles: UsageCycle[],
  now = new Date(),
) {
  const current = cycles.find(
    (c) =>
      c.id === access?.current_cycle_id &&
      Date.parse(c.ends_at) > now.getTime(),
  );
  const allowance = Number(
    current?.allowance_micro ?? access?.allowance_micro ?? 0,
  );
  const spent = Number(current?.spent_micro ?? 0);
  const reserved = Number(current?.reserved_micro ?? 0);
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  const renewal = new Date(
    Date.UTC(year, month, 1) - 8 * 60 * 60 * 1000,
  ).toISOString();
  return {
    allowance,
    spent,
    reserved,
    remaining: Math.max(0, allowance - spent - reserved),
    percent: allowance
      ? Math.min(100, ((spent + reserved) / allowance) * 100)
      : 0,
    renewsAt: current?.ends_at ?? renewal,
    current,
  };
}
