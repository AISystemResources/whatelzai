import assert from "node:assert/strict";
import { test } from "node:test";
import { adminNavigation, cleanAdminPath } from "../lib/admin-navigation";

test("clean host paths and preview /admin paths select the same navigation", () => {
  for (const path of [
    "/",
    "/today/routines/whatelz-morning-brief",
    "/users",
    "/settings",
    "/team/example",
    "/day-job",
    "/blog/new",
  ]) {
    assert.deepEqual(
      adminNavigation(path),
      adminNavigation(`/admin${path === "/" ? "" : path}`),
    );
  }
  assert.equal(cleanAdminPath("/administrator"), "/administrator");
});
test("Users and Settings own their deep links without selecting a workstream", () => {
  assert.deepEqual(adminNavigation("/users"), {
    tab: "users",
    workstream: null,
  });
  for (const path of ["/settings", "/tokens", "/developer"])
    assert.deepEqual(adminNavigation(path), {
      tab: "settings",
      workstream: null,
    });
  assert.equal(adminNavigation("/users-guide").tab, "home");
});
test("existing tools stay under their parent venture and Today stays reachable under Overview", () => {
  for (const path of ["/team/person", "/calendar-access", "/network-marketing"])
    assert.deepEqual(adminNavigation(path), {
      tab: "home",
      workstream: "Network Marketing",
    });
  for (const path of [
    "/profile",
    "/profile/career",
    "/design-system",
    "/blog/new",
    "/testimonials/templates/new",
    "/site-dashboard",
    "/events/example",
  ])
    assert.deepEqual(adminNavigation(path), {
      tab: "home",
      workstream: "AI Business",
    });
  assert.deepEqual(adminNavigation("/day-job"), {
    tab: "home",
    workstream: "Day Job",
  });
  assert.deepEqual(adminNavigation("/today/routines/whatelz-weekly-closeout"), {
    tab: "home",
    workstream: "Overview",
  });
});
