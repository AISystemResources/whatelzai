import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import * as model from "../lib/daily/model";
const requireNode = createRequire(import.meta.url);
const OWNER = "11111111-1111-4111-8111-111111111111";
function load(
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
  const testModule = {
    exports: {} as Record<string, (...args: unknown[]) => unknown>,
  };
  vm.runInNewContext(code, {
    module: testModule,
    exports: testModule.exports,
    require: (name: string) =>
      name === "server-only"
        ? {}
        : name in mocks
          ? mocks[name]
          : requireNode(name),
    process: { env: { DAILY_INTEGRATION_KEY: "a".repeat(64) } },
    Buffer,
    URL,
    URLSearchParams,
    Headers,
    Request,
    Response,
    AbortSignal,
    console,
    ...extra,
  });
  return testModule.exports;
}
test("daily dates follow Singapore at midnight and preserve prior-day handoff across year boundaries", () => {
  assert.equal(
    model.singaporeDay(new Date("2026-10-19T15:59:59Z")),
    "2026-10-19",
  );
  assert.equal(
    model.singaporeDay(new Date("2026-10-19T16:00:00Z")),
    "2026-10-20",
  );
  assert.equal(model.previousDay("2027-01-01"), "2026-12-31");
  assert.equal(model.previousDay("2028-03-01"), "2028-02-29");
  assert.throws(() =>
    model.briefPath("private/DAILY.md", "2026-02-30", "morning"),
  );
});
test("private credentials encrypt with random nonces and reject tampering", () => {
  const crypto = load("lib/daily/crypto.ts", {});
  const first = crypto.encryptSecret("test-only-secret") as string;
  const second = crypto.encryptSecret("test-only-secret") as string;
  assert.notEqual(first, second);
  assert.ok(!first.includes("test-only-secret"));
  assert.equal(crypto.decryptSecret(first), "test-only-secret");
  const parts = first.split(":");
  parts[1] = (parts[1][0] === "0" ? "1" : "0") + parts[1].slice(1);
  assert.throws(() => crypto.decryptSecret(parts.join(":")));
});
function emdeeMock(existing: boolean, hash = "1".repeat(16)) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  let body = "### Handoff\n\nOne unfinished commitment.";
  let present = existing;
  const parent = "private/DAILY.md";
  const path = model.briefPath(parent, "2026-10-19", "morning");
  const api = load(
    "lib/daily/emdee.ts",
    {
      "./server": { dailyOwner: async () => OWNER },
      "./connections": {
        emdeeConnection: async () => ({
          token: "test-token",
          parentPath: parent,
        }),
      },
      "./model": model,
    },
    {
      fetch: async (_url: string, init: RequestInit) => {
        const rpc = JSON.parse(init.body as string);
        const name = rpc.params.name;
        const args = rpc.params.arguments;
        calls.push({ name, args });
        let result: unknown;
        if (name === "list_docs") result = present ? [{ path }] : [];
        else if (name === "get_doc")
          result =
            args.path === parent
              ? { doc_content_hash: "parent-hash", sections: [] }
              : {
                  content: `# Brief\n\n## Notes\n\n${body}\n`,
                  sections: [{ heading: "Notes", content_hash: hash }],
                  doc_content_hash: "doc-hash",
                };
        else if (name === "patch_section" || name === "create_child") {
          present = true;
          body = args.body;
          result = { ok: true };
        }
        return Response.json({
          result: { content: [{ type: "text", text: JSON.stringify(result) }] },
        });
      },
    },
  );
  return { api, calls, path };
}
test("stale EMDEE edits are rejected without writing; brief bodies remain in EMDEE", async () => {
  const { api, calls } = emdeeMock(true);
  await assert.rejects(
    async () =>
      api.saveBrief("2026-10-19", "morning", "new text", "2".repeat(16)),
    /changed in EMDEE/,
  );
  assert.ok(
    !calls.some((c) => ["patch_section", "create_child"].includes(c.name)),
  );
});
test("new brief creates reciprocal parent linkage with strict parent hash and verified readback", async () => {
  const { api, calls, path } = emdeeMock(false);
  const saved = (await api.saveBrief(
    "2026-10-19",
    "morning",
    "### Focus\n\nOne step.",
    "",
  )) as model.Brief;
  assert.equal(saved.path, path);
  assert.equal(saved.body, "### Focus\n\nOne step.");
  const created = calls.find((c) => c.name === "create_child")!;
  assert.equal(created.args.expected_parent_content_hash, "parent-hash");
  assert.equal(created.args.no_auto_hash, true);
  assert.equal(created.args.author, "whatelz-daily");
});
test("existing brief patches only Notes with strict section hash", async () => {
  const { api, calls } = emdeeMock(true);
  await api.saveBrief(
    "2026-10-19",
    "morning",
    "### Revised\n\nKeep everything else.",
    "1".repeat(16),
  );
  const patched = calls.find((c) => c.name === "patch_section")!;
  assert.equal(patched.args.heading, "Notes");
  assert.equal(patched.args.expected_content_hash, "1".repeat(16));
  assert.equal(patched.args.no_auto_hash, true);
});
test("EMDEE service failure cannot be mistaken for an empty/missing document", async () => {
  const api = load(
    "lib/daily/emdee.ts",
    {
      "./server": { dailyOwner: async () => OWNER },
      "./connections": {
        emdeeConnection: async () => ({
          token: "token",
          parentPath: "private/DAILY.md",
        }),
      },
      "./model": model,
    },
    { fetch: async () => new Response("unavailable", { status: 503 }) },
  );
  await assert.rejects(
    async () => api.loadBrief("2026-10-19", "morning"),
    /unavailable/,
  );
});
test("OAuth uses PKCE and limits write requests to the chosen parent and briefing folder", async () => {
  let pending: unknown;
  const api = load(
    "lib/daily/oauth.ts",
    {
      "next/headers": {
        headers: async () =>
          new Headers({ origin: "https://admin.whatelz.ai" }),
      },
      "./connections": {
        storeConnection: async (
          _owner: string,
          _provider: string,
          data: unknown,
        ) => {
          pending = data;
        },
        readConnection: async () => pending,
      },
    },
    {
      fetch: async () =>
        Response.json({ client_id: "test-client" }, { status: 201 }),
    },
  );
  for (const path of [
    "../DAILY.md",
    "/private/DAILY.md",
    "private/../DAILY.md",
    "private/daily.txt",
  ])
    assert.equal(api.validParentPath(path), false);
  const destination = (await api.beginEmdeeConnection(
    OWNER,
    "private/DAILY.md",
  )) as string;
  const url = new URL(destination);
  assert.equal(url.origin, "https://emdee.tech");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(
    url.searchParams.get("scope"),
    "docs:read docs:write:private%2FDAILY.md docs:write:private%2Fdaily%2F",
  );
  assert.equal(
    url.searchParams.get("redirect_uri"),
    "https://admin.whatelz.ai/api/admin/daily/emdee/callback",
  );
  await assert.rejects(
    async () =>
      api.finishEmdeeConnection(
        OWNER,
        new URL(
          "https://admin.whatelz.ai/api/admin/daily/emdee/callback?state=wrong&code=test",
        ),
      ),
    /expired|does not match/,
  );
});
test("daily loader denies a foreign administrator before accessing operational data", async () => {
  const api = load("lib/daily/server.ts", {
    "next/navigation": {
      notFound: () => {
        throw Error("denied");
      },
    },
    "@/lib/admin-policy": { isOwnerUser: () => false },
    "@/lib/users": {
      ensureUserRow: async () => ({ id: "other", role: "superadmin" }),
    },
    "@/lib/supabase-server": {
      supabaseAdmin: {
        from: () => {
          throw Error("database accessed");
        },
      },
    },
  });
  await assert.rejects(async () => api.loadDailyTasks("2026-10-19"), /denied/);
});
test("AI generation caps output, disables response storage and labels unavailable sources", async () => {
  let request: Record<string, unknown> = {};
  const api = load(
    "lib/daily/agent.ts",
    { "./model": model },
    {
      fetch: async (_url: string, init: RequestInit) => {
        request = JSON.parse(init.body as string);
        return Response.json({
          status: "completed",
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    markdown: "### Focus\n\nReview the proposal.",
                  }),
                },
              ],
            },
          ],
          usage: { input_tokens: 100, output_tokens: 20 },
        });
      },
    },
  );
  await api.generateDailyDraft(
    { key: "test-key", model: "chosen-model" },
    {
      day: "2026-10-19",
      kind: "morning",
      tasks: { active: [], completed: [] },
      previousCloseout: null,
      notes: "Confirm available time.",
    },
  );
  assert.equal(request.max_output_tokens, 2000);
  assert.equal(request.store, false);
  const input = JSON.parse(request.input as string);
  assert.equal(input.sourceAvailability.calendar, "not connected");
  assert.equal(input.sourceAvailability.previousCloseout, "not found");
});
test("atomic slot reservations cap AI preparation at three attempts, including provider failures", async () => {
  const slots = new Set<number>();
  let generationCalls = 0;
  const db = {
    from: () => ({
      insert: (value: { slot: number }) => ({
        select: () => ({
          single: async () => {
            if (slots.has(value.slot))
              return { data: null, error: { code: "23505" } };
            slots.add(value.slot);
            return { data: { id: String(value.slot) }, error: null };
          },
        }),
      }),
      update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
    }),
  };
  const api = load("app/admin/today/actions.ts", {
    "next/cache": { revalidatePath: () => {} },
    "@/lib/supabase-server": { supabaseAdmin: db },
    "@/lib/daily/server": {
      dailyOwner: async () => OWNER,
      loadDailyTasks: async () => ({ active: [], completed: [] }),
    },
    "@/lib/daily/model": model,
    "@/lib/daily/emdee": {
      loadBrief: async () => ({ exists: false }),
      saveBrief: () => {},
    },
    "@/lib/daily/connections": {
      openaiConnection: async () => ({ key: "test", model: "chosen-model" }),
    },
    "@/lib/daily/agent": {
      generateDailyDraft: async () => {
        generationCalls++;
        throw Error("provider unavailable");
      },
    },
  });
  for (let i = 0; i < 3; i++)
    assert.match(
      (
        (await api.prepareDraft({
          day: model.singaporeDay(),
          kind: "morning",
          notes: "",
        })) as model.ActionResult
      ).error!,
      /AI preparation failed/,
    );
  const capped = (await api.prepareDraft({
    day: model.singaporeDay(),
    kind: "morning",
    notes: "",
  })) as model.ActionResult;
  assert.match(capped.error!, /three preparation attempts/);
  assert.equal(generationCalls, 3);
});
