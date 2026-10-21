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
