"use client";
import { useActionState } from "react";
import { changeNoteSharing } from "@/app/briefings/sharing-actions";
export function NoteSharing({
  id,
  recipients,
  shares,
}: {
  id: string;
  recipients: { id: string; label: string }[];
  shares: { recipient_user_id: string; recipient_label: string }[];
}) {
  const [state, action, pending] = useActionState(changeNoteSharing, {});
  return (
    <section className="space-y-4 rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">Share this saved note</h2>
      <p className="text-sm leading-6 text-zinc-600">
        Chosen people can read this entire note and future saved edits,
        including its background, reflections and next steps. They cannot edit
        it or open the linked lead profiles. Unsaved edits are not included. No
        messages or invitations are sent.
      </p>
      {shares.map((share) => (
        <form
          action={action}
          key={share.recipient_user_id}
          className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3"
        >
          <input type="hidden" name="id" value={id} />
          <input
            type="hidden"
            name="recipient"
            value={share.recipient_user_id}
          />
          <input type="hidden" name="operation" value="revoke" />
          <p className="text-sm">{share.recipient_label} · Can view</p>
          <button
            disabled={pending}
            className="min-h-11 px-3 text-sm underline"
          >
            Revoke access
          </button>
        </form>
      ))}
      {recipients.length ? (
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="operation" value="share" />
          <label className="block text-sm">
            Choose a linked team account
            <select
              required
              name="recipient"
              defaultValue=""
              className="mt-2 w-full rounded-xl border bg-white p-3 text-base"
            >
              <option value="" disabled>
                Select a person
              </option>
              {recipients
                .filter(
                  (person) =>
                    !shares.some(
                      (share) => share.recipient_user_id === person.id,
                    ),
                )
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.label}
                  </option>
                ))}
            </select>
          </label>
          <button
            disabled={pending}
            className="min-h-12 rounded-xl bg-yellow-300 px-5 font-semibold"
          >
            Share saved note · Read only
          </button>
        </form>
      ) : (
        <p className="text-sm text-zinc-500">
          No other linked team accounts are available yet. A team member must
          sign in and have their account linked to the team before you can
          select them here.
        </p>
      )}
      <p role="status" className="text-sm">
        {state.message}
      </p>
    </section>
  );
}
