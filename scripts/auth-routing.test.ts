import assert from "node:assert/strict";
import { test } from "node:test";
import { safeAuthRedirect, authCookieOptions } from "../lib/auth/redirect";
import { domainRoute } from "../lib/domain-routing";

test("OAuth callbacks and initiation remain accessible on both private hosts", () => {
  for (const host of ["admin.whatelz.ai", "app.whatelz.ai"])
    for (const path of ["/auth/google", "/auth/callback"]) {
      assert.equal(domainRoute(host, path).rewrite, undefined);
      assert.equal(domainRoute(host, path).protect, false);
    }
});
test("auth redirects preserve local paths and approved subdomains", () => {
  assert.equal(
    safeAuthRedirect("/team?view=nodes", "https://app.whatelz.ai"),
    "https://app.whatelz.ai/team?view=nodes",
  );
  assert.equal(
    safeAuthRedirect("https://admin.whatelz.ai/team", "https://app.whatelz.ai"),
    "https://admin.whatelz.ai/team",
  );
  assert.equal(
    safeAuthRedirect("/account", "http://localhost:3100"),
    "http://localhost:3100/account",
  );
});
test("external, deceptive, credential-bearing and script redirects are rejected", () => {
  for (const value of [
    "https://evil.test",
    "//evil.test",
    "https://app.whatelz.ai.evil.test",
    "https://evil.test@app.whatelz.ai",
    "javascript:alert(1)",
    "/\\evil.test",
    "http://app.whatelz.ai",
  ])
    assert.equal(
      safeAuthRedirect(value, "https://app.whatelz.ai"),
      "https://app.whatelz.ai/",
    );
});
test("auth cookies share only the known production domain", () => {
  assert.equal(authCookieOptions("admin.whatelz.ai").domain, ".whatelz.ai");
  assert.equal(authCookieOptions("app.whatelz.ai").secure, true);
  for (const host of [
    "localhost:3100",
    "feature.vercel.app",
    "admin.whatelz.ai.evil.test",
  ])
    assert.equal(authCookieOptions(host).domain, undefined);
});
