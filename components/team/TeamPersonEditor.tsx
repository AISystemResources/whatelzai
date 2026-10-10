"use client";
import { useActionState, useState } from "react";
import { saveTeamPerson } from "@/app/admin/team/actions";
import type { TeamPerson } from "@/lib/team/model";

export function TeamPersonEditor({
  person,
  teamId,
  compact = false,
}: {
  person: TeamPerson;
  teamId: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(saveTeamPerson, {});
  const [draft, setDraft] = useState({
    email: person.email ?? "",
    abo_number: person.abo_number ?? "",
    current_level: person.current_level ?? "",
    next_goal: person.next_goal ?? "",
    progress_notes: person.progress_notes ?? "",
  });
  const fields = [
    { name: "email", label: "Email", max: 254, type: "email" },
    { name: "abo_number", label: "ABO number", max: 20, type: "text" },
    { name: "current_level", label: "Current level", max: 120, type: "text" },
    { name: "next_goal", label: "Next goal", max: 240, type: "text" },
  ] as const;
  const notes = (
    <label className="block text-sm">
      Progress notes (admin-only)
      <textarea
        name="progress_notes"
        maxLength={1000}
        rows={3}
        value={draft.progress_notes}
        onChange={(event) =>
          setDraft((previous) => ({
            ...previous,
            progress_notes: event.target.value,
          }))
        }
        className="mt-1 block w-full rounded-lg border border-zinc-300 p-2"
      />
    </label>
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="team_id" value={teamId} />
      <input type="hidden" name="person_id" value={person.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="text-sm">
            {field.label}
            <input
              name={field.name}
              type={field.type}
              maxLength={field.max}
              inputMode={field.name === "abo_number" ? "numeric" : undefined}
              pattern={field.name === "abo_number" ? "[0-9]{1,20}" : undefined}
              value={draft[field.name]}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  [field.name]: event.target.value,
                }))
              }
              className="mt-1 block w-full rounded-lg border border-zinc-300 p-2"
            />
          </label>
        ))}
      </div>
      {compact ? (
        <details>
          <summary className="cursor-pointer text-sm text-zinc-600">
            Progress notes
          </summary>
          <div className="mt-3">{notes}</div>
        </details>
      ) : (
        notes
      )}
      <p
        role="status"
        className={`text-sm ${state.error ? "text-red-700" : "text-green-700"}`}
      >
        {state.error || state.success}
      </p>
      <button
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}
