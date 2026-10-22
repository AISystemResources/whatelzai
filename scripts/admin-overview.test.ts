import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import {
  aiBusinessFocus,
  briefStatus,
  productSignal,
} from "../lib/admin-overview/model";
import type { Task } from "../lib/daily/model";
import type { OwnerMetrics } from "../lib/cockpit";
import * as dailyModel from "../lib/daily/model";
import * as overviewModel from "../lib/admin-overview/model";
const nodeRequire = createRequire(import.meta.url);
function load<T>(
  file: string,
  mocks: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  const code = ts.transpileModule(
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(code, {
    module: testModule,
    exports: testModule.exports,
    require: (name: string) =>
      name === "server-only"
        ? {}
        : name in mocks
          ? mocks[name]
          : nodeRequire(name),
    process: {
      env: {
        EMDEE_ORIGIN: "https://example.invalid",
        EMDEE_OWNER_METRICS_TOKEN: "fake-fixture",
      },
    },
    URL,
    Response,
    AbortController,
    setTimeout,
    clearTimeout,
    ...extra,
  });
  return testModule.exports as T;
}
const day = "2026-10-22";
const now = new Date("2026-10-21T22:00:00Z");
const task = (id: string, changes: Partial<Task> = {}): Task => ({
  id,
  title: id,
  lane: "ai-business",
  due_on: day,
  status: "open",
  revision: 0,
  accepted_on: day,
  completed_at: null,
  ...changes,
});
test("focus uses only accepted open AI-business commitments and preserves unresolved states", () => {
  const result = aiBusinessFocus(
    [
      task("today"),
      task("overdue", { due_on: "2026-10-21" }),
      task("proposal", { status: "proposed", accepted_on: null }),
      task("unaccepted", { accepted_on: null }),
      task("other-lane", { lane: "network-marketing" }),
      task("deferred", { status: "deferred" }),
      task("blocked", { status: "blocked" }),
      task("waiting", { status: "waiting" }),
      task("future", { due_on: "2026-10-23" }),
    ],
    [
      task("done", { status: "done" }),
      task("unknown", { status: "open" }),
      task("other-done", { status: "done", lane: "day-job" }),
    ],
    day,
  );
  assert.deepEqual(
    result.focus.map((t) => t.id),
    ["overdue", "today"],
  );
  assert.equal(result.due, 4);
  assert.equal(result.overdue, 1);
  assert.equal(result.blocked, 1);
  assert.equal(result.waiting, 1);
  assert.equal(result.completed, 1);
  assert.equal(result.proposals, 1);
  assert.equal(result.upcoming[0].id, "future");
});
test("saved-entry status respects Singapore schedule boundaries without claiming a task ran", () => {
  const missing = {
    status: "ready" as const,
    data: { body: "", path: "example.md", hash: "", exists: false },
  };
  assert.equal(
    briefStatus(missing, "morning", new Date("2026-10-21T20:29:00Z")),
    "Not due yet",
  );
  assert.equal(
    briefStatus(missing, "morning", new Date("2026-10-21T20:30:00Z")),
    "No saved entry found",
  );
  assert.equal(
    briefStatus(missing, "evening", new Date("2026-10-22T12:59:00Z")),
    "Not due yet",
  );
  assert.equal(
    briefStatus(missing, "evening", new Date("2026-10-22T13:00:00Z")),
    "No saved entry found",
  );
  assert.equal(
    briefStatus({ status: "unavailable" }, "morning", now),
    "Unavailable",
  );
  assert.equal(
    briefStatus(
      { status: "ready", data: { ...missing.data, exists: true } },
      "morning",
      now,
    ),
    "Saved in EMDEE",
  );
});
test("product status distinguishes fresh, stale, invalid and future-dated signals", () => {
  const state = (generated_at: string) => ({
    status: "available" as const,
    data: { generated_at } as OwnerMetrics,
    fetched_at: now.toISOString(),
  });
  assert.equal(productSignal(state(now.toISOString()), now), "available");
  assert.equal(productSignal(state("2026-10-20T00:00:00Z"), now), "stale");
  assert.equal(productSignal(state("bad"), now), "unavailable");
  assert.equal(
    productSignal(state("2026-11-01T00:00:00Z"), now),
    "unavailable",
  );
});
function overview(mocks: Record<string, unknown>) {
  return load<{
    loadAdminOverview: (now: Date) => Promise<{
      focus: { status: string };
      morning: { status: string };
      growth: { blog: { status: string } };
    }>;
  }>("lib/admin-overview/server.ts", {
    "@/lib/supabase-server": {
      supabaseAdmin: {
        from: () => {
          throw Error("source down");
        },
      },
    },
    "@/lib/daily/connections": { emdeeConnection: async () => null },
    "@/lib/daily/paths": { DAILY_PARENT: "example/DAILY.md" },
    "@/lib/daily/emdee": {},
    "@/lib/daily/model": dailyModel,
    "@/lib/cockpit-self": {
      getSelfMetrics: async () => {
        throw Error("unavailable");
      },
    },
    "@/lib/cockpit": {
      fetchRemoteWidgets: async () => ({
        emdee: { status: "pending", reason: "not connected" },
      }),
    },
    "./model": overviewModel,
    ...mocks,
  });
}
test("overview checks sole owner before touching any source", async () => {
  let touched = false;
  const api = overview({
    "@/lib/daily/server": {
      dailyOwner: async () => {
        throw Error("Owner required");
      },
      loadDailyTasks: async () => {
        touched = true;
      },
    },
  });
  await assert.rejects(api.loadAdminOverview(now), /Owner required/);
  assert.equal(touched, false);
});
test("one unavailable source does not erase the rest of the owner overview", async () => {
  const api = overview({
    "@/lib/daily/server": {
      dailyOwner: async () => "owner-fixture",
      loadDailyTasks: async () => ({
        active: [task("accepted")],
        completed: [],
      }),
    },
  });
  const result = await api.loadAdminOverview(now);
  assert.equal(result.focus.status, "ready");
  assert.equal(result.morning.status, "unavailable");
  assert.equal(result.growth.blog.status, "unavailable");
});
test("local metrics use real accounts, unknown revenue/workspaces and propagate query errors", async () => {
  const calls: { table: string; key: string; value: unknown }[] = [];
  let failure = false;
  const api = load<{ getSelfMetrics: () => Promise<OwnerMetrics> }>(
    "lib/cockpit-self.ts",
    {
      "./supabase-server": {
        supabaseAdmin: {
          from: (table: string) => {
            const builder = {
              select: () => builder,
              eq: (key: string, value: unknown) => {
                calls.push({ table, key, value });
                return builder;
              },
              gte: (key: string, value: unknown) => {
                calls.push({ table, key, value });
                return builder;
              },
              is: () => builder,
              then: (resolve: (value: unknown) => unknown) =>
                Promise.resolve({
                  count: table === "users" ? 2 : 7,
                  error: failure ? { message: "down" } : null,
                }).then(resolve),
            };
            return builder;
          },
        },
      },
    },
  );
  const data = await api.getSelfMetrics();
  assert.equal(data.business.signups_7d, 2);
  assert.equal(data.business.dau, 2);
  assert.equal(data.usage.website_visitors_24h, 7);
  assert.equal(data.business.arr_usd, null);
  assert.equal(data.business.active_workspaces, null);
  assert.ok(
    calls.some((c) => c.table === "users" && c.key === "first_seen_at"),
  );
  failure = true;
  await assert.rejects(api.getSelfMetrics(), /unavailable/);
});
test("remote metrics reject malformed or wrong-product payloads", async () => {
  const valid = {
    product: "emdee",
    generated_at: now.toISOString(),
    schema_version: 1,
    business: {
      dau: 1,
      wau: 2,
      mau: 3,
      arr_usd: null,
      signups_7d: 0,
      churn_30d: null,
      active_workspaces: 1,
    },
    usage: { reads: 4 },
    product_health: {
      uptime_pct_24h: null,
      error_rate_24h: null,
      latest_deploy_sha: null,
      npm_version: null,
    },
  };
  for (const payload of [
    valid,
    { ...valid, product: "other" },
    { ...valid, business: { ...valid.business, dau: "unknown" } },
    { ...valid, schema_version: 2 },
  ]) {
    const api = load<{
      fetchRemoteWidgets: () => Promise<{ emdee: { status: string } }>;
    }>(
      "lib/cockpit.ts",
      {},
      {
        fetch: async (_url: URL, init: RequestInit) => {
          assert.equal(init.redirect, "error");
          return Response.json(payload);
        },
      },
    );
    const result = await api.fetchRemoteWidgets();
    assert.equal(
      result.emdee.status,
      payload === valid ? "available" : "error",
    );
  }
});
