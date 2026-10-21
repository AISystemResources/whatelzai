"use client";
import { useActionState, useState } from "react";
import { saveBriefing } from "@/app/briefings/actions";
import type { Briefing } from "@/lib/fcos/model";
export function BriefingEditor({
  note,
  leads,
}: {
  note: Briefing;
  leads: { id: string; name: string }[];
}) {
  const [draft, setDraft] = useState(note);
  const [state, action, pending] = useActionState(saveBriefing, {});
  const input =
    "mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3 text-base";
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={note.id} />
      <input type="hidden" name="revision" value={note.revision} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          Type
          <select
            name="kind"
            value={draft.kind}
            onChange={(e) =>
              setDraft({ ...draft, kind: e.target.value as Briefing["kind"] })
            }
            className={input}
          >
            <option>HQH</option>
            <option>HHH</option>
          </select>
        </label>
        <label>
          Date
          <input
            name="occurred_on"
            type="date"
            required
            value={draft.occurred_on}
            onChange={(e) =>
              setDraft({ ...draft, occurred_on: e.target.value })
            }
            className={input}
          />
        </label>
      </div>
      <label className="block">
        Title
        <input
          name="title"
          required
          maxLength={180}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className={input}
        />
      </label>
      <label className="block">
        Event or class (optional)
        <input
          name="event_name"
          maxLength={240}
          value={draft.event_name}
          onChange={(e) => setDraft({ ...draft, event_name: e.target.value })}
          className={input}
        />
      </label>
      {draft.lead_ids
        .filter((id) => !leads.some((lead) => lead.id === id))
        .map((id) => (
          <input key={id} type="hidden" name="lead_ids" value={id} />
        ))}
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer">
          Link leads · {draft.lead_ids.length} selected (optional)
        </summary>
        <p className="mt-2 text-xs text-zinc-500">
          Your first 200 leads alphabetically. Class learnings can have no
          linked lead. Linking never shares private notes.
        </p>
        <div className="mt-3 grid max-h-52 gap-3 overflow-y-auto sm:grid-cols-2">
          {leads.map((lead) => (
            <label key={lead.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="lead_ids"
                value={lead.id}
                checked={draft.lead_ids.includes(lead.id)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    lead_ids: e.target.checked
                      ? [...draft.lead_ids, lead.id]
                      : draft.lead_ids.filter((id) => id !== lead.id),
                  })
                }
              />
              {lead.name}
            </label>
          ))}
        </div>
      </details>
      {(
        [
          {
            name: "observations",
            label:
              draft.kind === "HQH"
                ? "Known background and previous conversations"
                : "What happened / what was actually said",
            max: 12000,
          },
          {
            name: "reflections",
            label:
              draft.kind === "HQH"
                ? "Approach, questions and things to understand"
                : "Learnings, interpretations and draft reflections",
            max: 12000,
          },
          {
            name: "next_steps",
            label: "Proposed next steps / who will follow up",
            max: 6000,
          },
        ] as const
      ).map((field) => (
        <label key={field.name} className="block">
          {field.label}
          <textarea
            name={field.name}
            rows={5}
            maxLength={field.max}
            value={draft[field.name]}
            onChange={(e) =>
              setDraft({ ...draft, [field.name]: e.target.value })
            }
            className={input}
          />
        </label>
      ))}
      <label className="block">
        Review status
        <select
          name="status"
          value={draft.status}
          onChange={(e) =>
            setDraft({ ...draft, status: e.target.value as Briefing["status"] })
          }
          className={input}
        >
          <option value="draft">Draft</option>
          <option value="reviewed">Reviewed by me</option>
        </select>
      </label>
      <p className="text-sm text-zinc-500">
        Private to you. Saving does not send invitations, share the note or
        accept a commitment.
      </p>
      <p role="status" className="text-sm text-red-700">
        {state.error}
      </p>
      <button
        disabled={pending}
        className="min-h-12 rounded-xl bg-yellow-300 px-6 font-semibold disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}
