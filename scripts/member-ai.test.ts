import { test } from "node:test";
import assert from "node:assert/strict";
import { runMemberAgent, type Receipt } from "../lib/member-ai/agent";
import {
  reserveCost,
  usageCost,
  type MemberModel,
} from "../lib/member-ai/model";
const receipt = (): Receipt => ({
  input: 0,
  output: 0,
  charge: 0,
  uncertain: false,
});
const options = () => ({
  key: "fake-test-key",
  model: "gpt-6-luna" as MemberModel,
  history: [
    { id: "a", role: "user" as const, body: "Help me plan", proposals: [] },
  ],
  day: "2026-10-21",
  receipt: receipt(),
  readCommitments: async () => ({ items: [] }),
  readVault: async () => ({ available: false }),
});
const reply = (
  output: unknown[],
  usage = { input_tokens: 100, output_tokens: 20 },
) => Response.json({ status: "completed", usage, output });
test("tool loop binds reads through the server and proposals remain uncommitted", async () => {
  let calls = 0;
  let reads = 0;
  const config = options();
  config.readCommitments = async () => {
    reads++;
    return { items: [] };
  };
  const result = await runMemberAgent({
    ...config,
    request: async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.store, false);
      assert.equal(body.max_output_tokens, 1024);
      calls++;
      if (calls === 1)
        return reply([
          {
            type: "function_call",
            name: "read_commitments",
            arguments: "{}",
            call_id: "r",
          },
        ]);
      if (calls === 2)
        return reply([
          {
            type: "function_call",
            name: "prepare_commitment",
            arguments: JSON.stringify({
              title: "Write a draft",
              lane: "ai-business",
              due_on: "2026-10-22",
            }),
            call_id: "p",
          },
        ]);
      assert.match(JSON.stringify(body.input), /requires_member_acceptance/);
      return reply([
        {
          type: "message",
          content: [
            { type: "output_text", text: "Here is a proposal to review." },
          ],
        },
      ]);
    },
  });
  assert.equal(reads, 1);
  assert.equal(result.proposals.length, 1);
  assert.equal(calls, 3);
  assert.equal(config.receipt.charge, 60);
  assert.equal(config.receipt.uncertain, false);
});
test("model cannot inject a different user into a private read", async () => {
  let reads = 0;
  await assert.rejects(
    runMemberAgent({
      ...options(),
      readCommitments: async () => {
        reads++;
        return [];
      },
      request: async () =>
        reply([
          {
            type: "function_call",
            name: "read_commitments",
            arguments: '{"userId":"someone-else"}',
            call_id: "r",
          },
        ]),
    }),
  );
  assert.equal(reads, 0);
});
test("unknown provider outcome retains reservation; known incomplete receipts remain chargeable", async () => {
  const config = options();
  await assert.rejects(
    runMemberAgent({
      ...config,
      request: async () => {
        throw Error("timeout");
      },
    }),
  );
  assert.equal(config.receipt.uncertain, true);
  const second = options();
  await assert.rejects(
    runMemberAgent({
      ...second,
      request: async () =>
        Response.json({
          status: "incomplete",
          usage: { input_tokens: 100, output_tokens: 20 },
          output: [],
        }),
    }),
  );
  assert.equal(second.receipt.uncertain, false);
  assert.equal(second.receipt.charge, 20);
});
test("oversized input fails before contacting provider", async () => {
  const config = options();
  config.history[0].body = "x".repeat(61000);
  let called = false;
  await assert.rejects(
    runMemberAgent({
      ...config,
      request: async () => {
        called = true;
        return reply([]);
      },
    }),
  );
  assert.equal(called, false);
});
test("loop stops after four provider calls and reservations exceed bounded usage", async () => {
  let calls = 0;
  await assert.rejects(
    runMemberAgent({
      ...options(),
      request: async (_url, init) => {
        calls++;
        if (calls === 4)
          assert.equal(JSON.parse(String(init?.body)).tool_choice, "none");
        return reply([
          {
            type: "function_call",
            name: "read_commitments",
            arguments: "{}",
            call_id: String(calls),
          },
        ]);
      },
    }),
  );
  assert.equal(calls, 4);
  for (const model of ["gpt-6-luna", "gpt-6.1-sol"] as const)
    assert.ok(reserveCost(model) >= 4 * usageCost(model, 60000, 1024));
});
