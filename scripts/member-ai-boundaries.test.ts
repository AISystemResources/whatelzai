import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import * as model from "../lib/member-ai/model";
const requireNode = createRequire(import.meta.url);
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
          : requireNode(name),
    process: { env: {} },
    Buffer,
    URL,
    URLSearchParams,
    Request,
    Response,
    AbortSignal,
    ...extra,
  });
  return testModule.exports as T;
}
test("member route rejects disabled, cross-origin and inactive calls before provider or reservation", async () => {
  for (const gate of ["origin", "flag", "member"]) {
    let queries = 0;
    const route = load<{ POST: (request: Request) => Promise<Response> }>(
      "app/api/member/assistant/route.ts",
      {
        "@/lib/supabase-server": {
          supabaseAdmin: {
            rpc: async () => {
              queries++;
              throw Error("must not reserve");
            },
          },
        },
        "@/lib/member-ai/server": {
          memberApiEnabled: () => gate !== "flag",
          memberActor: async () => {
            throw Error("inactive");
          },
          platformKey: async () => {
            throw Error("must not read");
          },
        },
        "@/lib/member-ai/http": {
          memberOriginAllowed: () => gate !== "origin",
        },
        "@/lib/member-ai/model": model,
        "@/lib/member-ai/agent": {},
        "@/lib/fcos/resources": {
          readFcosResource: async () => {
            throw Error("must not read resources before authorization");
          },
        },
        "@/lib/member-ai/emdee": {},
        "@/lib/daily/model": {},
      },
    );
    const response = await route.POST(
      new Request("https://app.whatelz.ai/api/member/assistant", {
        method: "POST",
      }),
    );
    assert.equal(response.status, gate === "flag" ? 503 : 403);
    assert.equal(queries, 0);
  }
});
test("admin changes independently require the configured owner", async () => {
  let touched = false;
  const action = load<{ manageMember: (input: unknown) => Promise<unknown> }>(
    "app/admin/users/actions.ts",
    {
      "next/cache": { revalidatePath: () => {} },
      "@/lib/daily/server": {
        dailyOwner: async () => {
          throw Error("Owner required");
        },
      },
      "@/lib/supabase-server": {
        supabaseAdmin: new Proxy(
          {},
          {
            get: () => {
              touched = true;
              throw Error("must not access");
            },
          },
        ),
      },
      "@/lib/member-ai/model": model,
    },
  );
  await assert.rejects(
    action.manageMember({ action: "reset" }),
    /Owner required/,
  );
  assert.equal(touched, false);
});
test("vault reads reject shared wrappers, traversal and sibling collections", async () => {
  let calls = 0;
  const vault = load<{
    allowedVaultPath: (path: string, parent: string) => boolean;
    readMemberVault: (
      user: string,
      path: string,
    ) => Promise<{ available: boolean }>;
  }>(
    "lib/member-ai/emdee.ts",
    {
      "next/headers": {},
      "@/lib/daily/crypto": {
        decryptSecret: () =>
          JSON.stringify({
            token: "fake",
            expiresAt: Date.now() + 60000,
            parentPath: "example/DAILY.md",
          }),
      },
      "@/lib/daily/oauth": {
        validParentPath: (path: string) =>
          /^[A-Za-z0-9_./-]+\.md$/.test(path) &&
          !path.startsWith("/") &&
          !path.split("/").some((x) => x === "." || x === ".."),
      },
      "@/lib/daily/emdee-client": {
        emdeeCall: async () => {
          calls++;
        },
      },
      "@/lib/supabase-server": {
        supabaseAdmin: {
          from: () => ({
            select() {
              return this;
            },
            eq() {
              return this;
            },
            maybeSingle: async () => ({
              data: {
                subject: "subject",
                vault_id: "vault",
                parent_path: "example/DAILY.md",
                encrypted_credentials: "fake",
              },
              error: null,
            }),
          }),
        },
      },
    },
    {
      fetch: async () => {
        calls++;
        throw Error("must not fetch");
      },
    },
  );
  for (const path of [
    "__shared__/other/DAILY.md",
    "example/daily/../SECRET.md",
    "example/books/SECRET.md",
    "/example/DAILY.md",
  ]) {
    assert.equal(vault.allowedVaultPath(path, "example/DAILY.md"), false);
    assert.equal(
      (await vault.readMemberVault("member", path)).available,
      false,
    );
  }
  assert.equal(
    vault.allowedVaultPath("example/daily/2026-10-21.md", "example/DAILY.md"),
    true,
  );
  assert.equal(calls, 0);
});

test("API pilot requires the configured owner before reading active pilot access", async () => {
  const owner = "00000000-0000-4000-8000-000000000001";
  const { isOwnerUser } = await import("../lib/admin-policy");
  for (const [user, configured, allowed] of [
    [null, owner, false],
    [
      { id: "00000000-0000-4000-8000-000000000002", role: "admin" },
      owner,
      false,
    ],
    [{ id: owner, role: "unauthorized" }, owner, false],
    [{ id: owner, role: "admin" }, undefined, false],
    [{ id: owner, role: "admin" }, owner, true],
  ] as const) {
    let reads = 0;
    const server = load<{
      memberActor: () => Promise<{ user: { id: string } }>;
    }>("lib/member-ai/server.ts", {
      "@/lib/team-assignment": { hasTeamAssignment: async () => true },
      "@/lib/users": { ensureUserRow: async () => user },
      "@/lib/admin-policy": {
        isOwnerUser: (value: typeof user) => isOwnerUser(value, configured),
      },
      "@/lib/member-ai/model": model,
      "./model": model,
      "@/lib/daily/connections": {
        openaiConnection: () => {
          throw Error("Must not read provider key");
        },
      },
      "@/lib/supabase-server": {
        supabaseAdmin: {
          from: () => {
            reads++;
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              maybeSingle: async () => ({
                data: { active: true, model: "gpt-6-luna" },
                error: null,
              }),
            };
          },
        },
      },
    });
    if (allowed) assert.equal((await server.memberActor()).user.id, owner);
    else await assert.rejects(server.memberActor());
    assert.equal(reads, allowed ? 1 : 0);
  }
});

test("attention loader verifies identity, scopes private sources and preserves source failures", async () => {
  const attention = await import("../lib/fcos/attention");
  const fcos = await import("../lib/fcos/model");
  const calls: { table: string; filters: unknown[][] }[] = [];
  const dashboard = load<{
    loadAttentionDashboard: () => Promise<{
      leads: { count: number | null };
      tasks: { count: number | null };
      items: unknown[];
      calendarAvailable: boolean;
    }>;
  }>("lib/fcos/dashboard.ts", {
    "./server": { fcosOwner: async () => "verified-owner" },
    "./attention": attention,
    "./model": fcos,
    "@/lib/leads/model": { todayUtc8: () => "2026-10-22" },
    "@/lib/community-calendar/server": {
      loadCommunityCalendar: async () => {
        throw Error("Unavailable");
      },
    },
    "@/lib/supabase-server": {
      supabaseAdmin: {
        from: (table: string) => {
          const entry = { table, filters: [] as unknown[][] };
          calls.push(entry);
          const query = {
            select() {
              return this;
            },
            eq(...args: unknown[]) {
              entry.filters.push(args);
              return this;
            },
            not() {
              return this;
            },
            lte() {
              return this;
            },
            in() {
              return this;
            },
            or() {
              return this;
            },
            order() {
              return this;
            },
            limit: async () => ({
              data: [],
              count: table === "daily_tasks" ? 8 : 0,
              error:
                table === "member_leads" ? { message: "Unavailable" } : null,
            }),
          };
          return query;
        },
      },
    },
  });
  const result = await dashboard.loadAttentionDashboard();
  assert.equal(result.leads.count, null);
  assert.equal(result.tasks.count, 8);
  assert.equal(result.calendarAvailable, false);
  for (const call of calls)
    assert.ok(
      call.filters.some(
        (filter) => filter[0] === "owner_id" && filter[1] === "verified-owner",
      ),
    );
  assert.equal(calls.length, 3);
});

test("shared-note reads require an active grant to the verified recipient and select only the note", async () => {
  for (const granted of [false, true]) {
    const calls: { table: string; columns: string; filters: unknown[][] }[] =
      [];
    const sharing = load<{
      loadSharedBriefing: (id: string) => Promise<unknown>;
    }>("lib/fcos/sharing.ts", {
      "./server": { fcosOwner: async () => "verified-recipient" },
      "@/lib/team/server": {},
      "@/lib/supabase-server": {
        supabaseAdmin: {
          from: (table: string) => {
            const entry = { table, columns: "", filters: [] as unknown[][] };
            calls.push(entry);
            return {
              select(value: string) {
                entry.columns = value;
                return this;
              },
              eq(...args: unknown[]) {
                entry.filters.push(args);
                return this;
              },
              is(...args: unknown[]) {
                entry.filters.push(args);
                return this;
              },
              maybeSingle: async () => ({
                data:
                  table === "member_briefing_shares"
                    ? granted
                      ? { briefing_id: "note" }
                      : null
                    : { id: "note", title: "Shared example" },
                error: null,
              }),
            };
          },
        },
      },
    });
    const result = await sharing.loadSharedBriefing("note");
    assert.ok(
      calls[0].filters.some(
        (value) =>
          value[0] === "recipient_user_id" && value[1] === "verified-recipient",
      ),
    );
    assert.ok(
      calls[0].filters.some(
        (value) => value[0] === "revoked_at" && value[1] === null,
      ),
    );
    if (!granted) {
      assert.equal(result, null);
      assert.equal(calls.length, 1);
    } else {
      assert.equal(calls.length, 2);
      assert.doesNotMatch(
        calls[1].columns,
        /lead_ids|owner_id|event_key|email|phone/,
      );
    }
  }
});

test("sharing cannot mutate another owner's note or grant an unlisted account", async () => {
  for (const owned of [false, true]) {
    let writes = 0;
    const actions = load<{
      changeNoteSharing: (
        state: unknown,
        form: FormData,
      ) => Promise<{ message: string }>;
    }>(
      "app/briefings/sharing-actions.ts",
      {
        "next/cache": { revalidatePath: () => {} },
        "@/lib/fcos/server": {
          fcosOwner: async () => "owner",
          loadBriefing: async () => (owned ? { id: "note" } : null),
        },
        "@/lib/fcos/sharing": { shareRecipients: async () => [] },
        "@/lib/supabase-server": {
          supabaseAdmin: {
            from: () => {
              writes++;
              throw Error("Must not write");
            },
          },
        },
      },
      { FormData },
    );
    const form = new FormData();
    form.set("id", "00000000-0000-4000-8000-000000000001");
    form.set("recipient", "00000000-0000-4000-8000-000000000002");
    form.set("operation", "share");
    assert.match(
      (await actions.changeNoteSharing({}, form)).message,
      /unavailable/,
    );
    assert.equal(writes, 0);
  }
});

test("note event lookups use the real calendar membership and no preview persona", async () => {
  const calls: unknown[][] = [];
  const events = load<{
    calendarEvent: (month: string, key: string) => Promise<unknown>;
  }>("lib/fcos/events.ts", {
    "@/lib/community-calendar/server": {
      loadCommunityCalendar: async (...args: unknown[]) => {
        calls.push(args);
        return { events: [{ id: "permitted" }] };
      },
    },
    "@/lib/community-calendar/model": {
      validMonth: (month: string) => month === "2026-10",
      localDay: () => "2026-10-22",
    },
  });
  assert.equal(await events.calendarEvent("bad", "permitted"), null);
  assert.equal(await events.calendarEvent("2026-10", "restricted"), null);
  assert.ok(await events.calendarEvent("2026-10", "permitted"));
  for (const args of calls) assert.deepEqual(args, ["2026-10"]);
});

test("note grants use the verified owner and selected team label; revocation is owner-scoped", async () => {
  for (const operation of ["share", "revoke"]) {
    const owner = "00000000-0000-4000-8000-000000000001",
      recipient = "00000000-0000-4000-8000-000000000002";
    let written: Record<string, unknown> | undefined;
    const filters: unknown[][] = [];
    const query = {
      eq(...args: unknown[]) {
        filters.push(args);
        return this;
      },
      then(resolve: (value: unknown) => unknown) {
        return Promise.resolve({ error: null }).then(resolve);
      },
    };
    const actions = load<{
      changeNoteSharing: (
        state: unknown,
        form: FormData,
      ) => Promise<{ message: string }>;
    }>(
      "app/briefings/sharing-actions.ts",
      {
        "next/cache": { revalidatePath: () => {} },
        "@/lib/fcos/server": {
          fcosOwner: async () => owner,
          loadBriefing: async () => ({ id: "note" }),
        },
        "@/lib/fcos/sharing": {
          shareRecipients: async () => [
            { id: recipient, label: "Verified team person" },
          ],
        },
        "@/lib/supabase-server": {
          supabaseAdmin: {
            from: () => ({
              upsert: async (value: Record<string, unknown>) => {
                written = value;
                return { error: null };
              },
              update: (value: Record<string, unknown>) => {
                written = value;
                return query;
              },
            }),
          },
        },
      },
      { FormData },
    );
    const form = new FormData();
    form.set("id", "00000000-0000-4000-8000-000000000003");
    form.set("recipient", recipient);
    form.set("operation", operation);
    form.set("owner_id", recipient);
    form.set("recipient_label", "Forged label");
    assert.match(
      (await actions.changeNoteSharing({}, form)).message,
      operation === "share" ? /now shared/ : /revoked/,
    );
    if (operation === "share") {
      assert.equal(written?.owner_id, owner);
      assert.equal(written?.recipient_label, "Verified team person");
    } else {
      assert.ok(
        filters.some((value) => value[0] === "owner_id" && value[1] === owner),
      );
      assert.ok(written?.revoked_at);
    }
  }
});

test("blank Chat skips transcript reads while latest Chat loads only its owner's messages", async () => {
  for (const blank of [true, false]) {
    const calls: { table: string; filters: unknown[][] }[] = [];
    const server = load<{
      memberWorkspace: (
        id?: string,
        blank?: boolean,
      ) => Promise<{ selected: string | null; messages: unknown[] }>;
    }>("lib/member-ai/server.ts", {
      "@/lib/team-assignment": { hasTeamAssignment: async () => true },
      "@/lib/users": {
        ensureUserRow: async () => ({
          id: "owner",
          role: "admin",
          name: "Example",
        }),
      },
      "@/lib/admin-policy": { isOwnerUser: () => true },
      "@/lib/daily/connections": {},
      "./model": model,
      "@/lib/supabase-server": {
        supabaseAdmin: {
          from: (table: string) => {
            const call = { table, filters: [] as unknown[][] };
            calls.push(call);
            return {
              select() {
                return this;
              },
              eq(...args: unknown[]) {
                call.filters.push(args);
                return this;
              },
              in() {
                return this;
              },
              order() {
                return this;
              },
              limit: async () => ({
                error: null,
                data:
                  table === "member_ai_conversations"
                    ? [{ id: "latest" }]
                    : table === "member_ai_messages"
                      ? [
                          {
                            id: "message",
                            role: "assistant",
                            body: "Example",
                            proposals: [],
                          },
                        ]
                      : [],
              }),
              maybeSingle: async () => ({
                error: null,
                data:
                  table === "member_ai_access"
                    ? {
                        active: true,
                        model: "gpt-6-luna",
                        current_cycle_id: null,
                      }
                    : table === "member_ai_conversations"
                      ? { id: "latest" }
                      : null,
              }),
            };
          },
        },
      },
    });
    const workspace = await server.memberWorkspace(undefined, blank);
    assert.equal(workspace.selected, blank ? null : "latest");
    assert.equal(workspace.messages.length, blank ? 0 : 1);
    const transcriptCalls = calls.filter(
      (call) => call.table === "member_ai_messages",
    );
    assert.equal(transcriptCalls.length, blank ? 0 : 1);
    for (const call of transcriptCalls)
      assert.ok(
        call.filters.some(
          (filter) => filter[0] === "user_id" && filter[1] === "owner",
        ),
      );
  }
});
test("first-send conversation creation verifies the owner and never accepts a caller-supplied identity", async () => {
  for (const allowed of [false, true]) {
    let row: Record<string, unknown> | undefined;
    const actions = load<{ createConversation: () => Promise<{ id: string }> }>(
      "app/assistant/actions.ts",
      {
        "next/navigation": {},
        "next/cache": {},
        "@/lib/member-ai/server": {
          memberActor: async () => {
            if (!allowed) throw Error("Owner required");
            return { user: { id: "verified-owner" } };
          },
        },
        "@/lib/member-ai/model": model,
        "@/lib/daily/model": { singaporeDay: () => "2026-10-22" },
        "@/lib/supabase-server": {
          supabaseAdmin: {
            from: () => ({
              insert: (value: Record<string, unknown>) => {
                row = value;
                return {
                  select: () => ({
                    single: async () => ({
                      data: { id: "created" },
                      error: null,
                    }),
                  }),
                };
              },
            }),
          },
        },
      },
    );
    if (allowed) {
      assert.equal((await actions.createConversation()).id, "created");
      assert.equal(row?.user_id, "verified-owner");
    } else {
      await assert.rejects(actions.createConversation(), /Owner required/);
      assert.equal(row, undefined);
    }
  }
});
