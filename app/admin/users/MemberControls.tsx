"use client";
import { useState } from "react";
import { manageMember } from "./actions";
import type { MemberModel } from "@/lib/member-ai/model";
export function MemberControls({
  userId,
  active,
  model,
  cycle,
  enrolled,
}: {
  userId: string;
  active: boolean;
  model: MemberModel;
  cycle: string | null;
  enrolled: boolean;
}) {
  const [selected, setSelected] = useState(model);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function change(action: "access" | "reset", value = active) {
    setBusy(true);
    setNotice("");
    try {
      const result = await manageMember(
        action === "reset"
          ? { action, userId, cycle }
          : { action, userId, active: value, model: selected },
      );
      setNotice(result.error ?? result.success ?? "");
      setConfirm(false);
    } catch {
      setNotice("Could not update this member. Reload and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4 space-y-3">
      <label className="block text-xs text-zinc-600">
        Assistant model
        <select
          aria-label="Assistant model"
          value={selected}
          onChange={(e) => setSelected(e.target.value as MemberModel)}
          disabled={busy}
          className="mt-1 block w-full rounded-lg border p-2 text-sm"
        >
          <option value="gpt-6-luna">GPT-6 Luna · economical</option>
          <option value="gpt-6.1-sol">GPT-6.1 Sol</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => change("access", !active)}
          className="rounded-lg bg-yellow-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {active ? "Pause access" : "Activate · US$5/month"}
        </button>
        {active && selected !== model && (
          <button
            disabled={busy}
            onClick={() => change("access")}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Save model
          </button>
        )}
        {enrolled && (
          <button
            disabled={busy}
            onClick={() => setConfirm(true)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Full reset
          </button>
        )}
      </div>
      {confirm && (
        <div className="rounded-lg bg-yellow-50 p-3 text-sm">
          <p>
            Restore a fresh US$5 allowance now? Usage history stays intact. This
            grants additional spending before the next monthly renewal.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              disabled={busy}
              className="rounded bg-zinc-900 px-3 py-2 text-white"
              onClick={() => change("reset")}
            >
              Confirm reset
            </button>
            <button onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
      <p role="status" className="text-sm">
        {notice}
      </p>
    </div>
  );
}
