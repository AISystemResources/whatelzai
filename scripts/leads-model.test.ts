import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validDate,
  todayUtc8,
  ageOn,
  leadCreateSchema,
  leadUpdateSchema,
  activityCreateSchema,
} from "../lib/leads/model";
import { domainRoute } from "../lib/domain-routing";
test("dates reject impossible days and track UTC+8 midnight", () => {
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2024-02-29"), true);
  assert.equal(todayUtc8(new Date("2026-10-09T16:00:00Z")), "2026-10-10");
  assert.equal(ageOn("2000-10-11", "2026-10-10"), 25);
  assert.equal(ageOn(null), null);
});
test("create strips forged ownership and validates lengths", () => {
  const x = leadCreateSchema.parse({
    name: " Example ",
    region: "FC Northern",
    owner_id: "forged",
  });
  assert.deepEqual(x, { name: "Example", region: "FC Northern" });
  assert.equal(
    leadCreateSchema.safeParse({ name: "x".repeat(161), region: "FC Northern" })
      .success,
    false,
  );
});
test("activity status does not infer attendance", () => {
  const base = {
    lead_id: "00000000-0000-4000-8000-000000000001",
    title: "Example event",
    activity_on: "2026-10-17",
    status: "To invite",
    notes: "",
  };
  assert.equal(activityCreateSchema.parse(base).status, "To invite");
  assert.equal(
    activityCreateSchema.safeParse({ ...base, status: "Confirmed" }).success,
    false,
  );
  assert.equal(
    activityCreateSchema.safeParse({ ...base, activity_on: "2026-02-30" })
      .success,
    false,
  );
});
test("profile revisions and enum values are validated", () => {
  assert.equal(leadUpdateSchema.shape.revision.safeParse(0).success, false);
  assert.equal(
    leadUpdateSchema.shape.membership.safeParse("Oracle").success,
    false,
  );
  assert.equal(leadUpdateSchema.shape.birthday.parse(""), null);
});
test("leads list and deep profiles belong to protected app", () => {
  for (const path of [
    "/leads",
    "/leads/00000000-0000-4000-8000-000000000001",
  ]) {
    assert.equal(
      domainRoute("whatelz.ai", path).redirect,
      "https://app.whatelz.ai" + path,
    );
    assert.equal(domainRoute("app.whatelz.ai", path).protect, true);
  }
  assert.equal(domainRoute("whatelz.ai", "/leadership").redirect, undefined);
});
