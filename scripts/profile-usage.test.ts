import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeUsage, type UsageCycle } from "../lib/profile/usage";
const access = {
  active: true,
  model: "gpt-6.1-sol",
  allowance_micro: 5000000,
  current_cycle_id: "current",
};
const cycle: UsageCycle = {
  id: "current",
  allowance_micro: 5000000,
  spent_micro: 1000000,
  reserved_micro: 500000,
  started_at: "2026-10-01T00:00:00Z",
  ends_at: "2026-10-31T16:00:00Z",
  reason: "monthly",
};
test("remaining credits include reservations without mixing in previous reset cycles", () => {
  const result = summarizeUsage(
    access,
    [
      cycle,
      { ...cycle, id: "old", spent_micro: 5000000, reason: "owner-reset" },
    ],
    new Date("2026-10-22T00:00:00Z"),
  );
  assert.equal(result.remaining, 3500000);
  assert.equal(result.spent, 1000000);
  assert.equal(result.percent, 30);
});
test("monthly rollover uses Singapore boundary and retains history without old charges", () => {
  const result = summarizeUsage(
    access,
    [cycle],
    new Date("2026-10-31T16:00:00Z"),
  );
  assert.equal(result.current, undefined);
  assert.equal(result.spent, 0);
  assert.equal(result.remaining, 5000000);
  assert.equal(result.renewsAt, "2026-11-30T16:00:00.000Z");
});
test("unassigned accounts do not display invented credits", () => {
  const result = summarizeUsage(null, [], new Date("2026-12-31T16:01:00Z"));
  assert.equal(result.allowance, 0);
  assert.equal(result.remaining, 0);
  assert.equal(result.percent, 0);
  assert.equal(result.renewsAt, "2027-01-31T16:00:00.000Z");
});
