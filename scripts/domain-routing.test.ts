import assert from "node:assert/strict";
import { test } from "node:test";
import { domainRoute, siteSurface } from "../lib/domain-routing";

test("public legacy admin URLs redirect to clean admin URLs", () => {
  assert.equal(
    domainRoute("whatelz.ai", "/admin").redirect,
    "https://admin.whatelz.ai/",
  );
  assert.equal(
    domainRoute("www.whatelz.ai", "/admin/blog/new").redirect,
    "https://admin.whatelz.ai/blog/new",
  );
  assert.equal(domainRoute("whatelz.ai", "/administrator").redirect, undefined);
});
test("admin pages rewrite and require a session, including deep routes", () => {
  assert.equal(domainRoute("admin.whatelz.ai", "/").rewrite, "/admin");
  assert.equal(
    domainRoute("admin.whatelz.ai", "/blog/new").rewrite,
    "/admin/blog/new",
  );
  assert.equal(domainRoute("admin.whatelz.ai", "/blog/new").protect, true);
  assert.equal(
    domainRoute("admin.whatelz.ai", "/admin/blog").redirect,
    "https://admin.whatelz.ai/blog",
  );
});
test("auth callbacks and API endpoints are not rewritten into pages", () => {
  for (const path of [
    "/sign-in",
    "/sign-in/sso-callback",
    "/sign-up",
    "/api/admin/newsletter",
    "/api/oauth/authorize",
    "/_next/static/chunk.js",
  ]) {
    assert.equal(domainRoute("admin.whatelz.ai", path).rewrite, undefined);
  }
});
test("members have a separate signed-in landing page", () => {
  assert.equal(domainRoute("app.whatelz.ai", "/").rewrite, "/member-home");
  assert.equal(domainRoute("app.whatelz.ai", "/").protect, true);
  assert.equal(domainRoute("app.whatelz.ai", "/account").protect, true);
  assert.equal(domainRoute("app.whatelz.ai", "/sign-up").protect, false);
  assert.equal(
    domainRoute("app.whatelz.ai", "/admin").redirect,
    "https://admin.whatelz.ai/",
  );
});
test("local previews keep admin access, and host matching is exact", () => {
  assert.equal(domainRoute("localhost:3100", "/admin").protect, true);
  assert.equal(domainRoute("feature.vercel.app", "/admin").redirect, undefined);
  assert.equal(domainRoute("admin.localhost:3100", "/").rewrite, "/admin");
  assert.equal(siteSurface("admin.whatelz.ai.attacker.test"), "public");
  assert.equal(siteSurface("ADMIN.WHATELZ.AI:443"), "admin");
});
