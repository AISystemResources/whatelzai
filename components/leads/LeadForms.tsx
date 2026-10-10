"use client";
import { useActionState, useState } from "react";
import {
  createLead,
  saveLead,
  addActivity,
  updateActivity,
} from "@/app/leads/actions";
import {
  regions,
  memberships,
  stages,
  goals,
  activityStatuses,
  type Lead,
  type Activity,
  type ActionResult,
} from "@/lib/leads/model";
const input =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2";
const button =
  "rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:opacity-50";
function Message({ state }: { state: ActionResult }) {
  return (
    <p
      role="status"
      className={state.error ? "text-red-700" : "text-green-700"}
    >
      {state.error || state.success}
    </p>
  );
}
function Select({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      {label}
      <select
        name={name}
        {...(onChange
          ? { value, onChange: (event) => onChange(event.target.value) }
          : { defaultValue: value })}
        className={input}
      >
        {options.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
}
export function NewLead() {
  const [state, action, pending] = useActionState(createLead, {});
  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer font-semibold">Add a lead</summary>
      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label>
          Name
          <input name="name" required maxLength={160} className={input} />
        </label>
        <Select
          name="region"
          label="Community"
          value="Unassigned"
          options={regions}
        />
        <Message state={state} />
        <button disabled={pending} className={button}>
          {pending ? "Creating…" : "Create profile"}
        </button>
      </form>
    </details>
  );
}
export function LeadEditor({ lead }: { lead: Lead }) {
  const [state, action, pending] = useActionState(saveLead, {});
  const [draft, setDraft] = useState(lead);
  const change = (name: string, value: string) =>
    setDraft((previous) => ({ ...previous, [name]: value }));
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="revision" value={lead.revision} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          Name
          <input
            name="name"
            value={draft.name}
            onChange={(event) => change("name", event.target.value)}
            required
            maxLength={160}
            className={input}
          />
        </label>
        <Select
          name="region"
          label="Community"
          value={draft.region}
          onChange={(value) => change("region", value)}
          options={regions}
        />
        <Select
          name="membership"
          label="Club membership"
          value={draft.membership}
          onChange={(value) => change("membership", value)}
          options={memberships}
        />
        <Select
          name="stage"
          label="Current stage"
          value={draft.stage}
          onChange={(value) => change("stage", value)}
          options={stages}
        />
        <Select
          name="goal"
          label="Goal"
          value={draft.goal}
          onChange={(value) => change("goal", value)}
          options={goals}
        />
      </div>
      <p className="text-sm text-zinc-500">
        Membership and stage are your records. They do not create an account or
        change anyone’s access.
      </p>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Their story</h2>
        {(
          [
            {
              name: "relationship",
              label: "How we know each other",
              max: 2000,
            },
            {
              name: "story",
              label: "Personal story and background",
              max: 10000,
            },
            {
              name: "interests",
              label: "Interests, aspirations and priorities",
              max: 4000,
            },
            { name: "concerns", label: "Questions and concerns", max: 4000 },
            {
              name: "notes",
              label: "Sales remarks and follow-up notes",
              max: 10000,
            },
          ] as const
        ).map((f) => (
          <label key={f.name} className="block">
            {f.label}
            <textarea
              name={f.name}
              value={draft[f.name]}
              onChange={(event) => change(f.name, event.target.value)}
              rows={3}
              maxLength={f.max}
              className={input}
            />
          </label>
        ))}
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Next follow-up</h2>
        <label className="block">
          Next action
          <input
            name="next_action"
            value={draft.next_action}
            onChange={(event) => change("next_action", event.target.value)}
            maxLength={1000}
            className={input}
          />
        </label>
        <label className="block">
          Follow-up date
          <input
            type="date"
            name="follow_up_on"
            value={draft.follow_up_on || ""}
            onChange={(event) => change("follow_up_on", event.target.value)}
            className={input}
          />
        </label>
      </section>
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer">
          Contact and personal details (optional)
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              { name: "email", label: "Email", type: "email", max: 254 },
              { name: "phone", label: "Phone", type: "tel", max: 80 },
              { name: "birthday", label: "Birthday", type: "date", max: 10 },
              { name: "zodiac", label: "Zodiac sign", type: "text", max: 80 },
            ] as const
          ).map((f) => (
            <label key={f.name}>
              {f.label}
              <input
                name={f.name}
                type={f.type}
                maxLength={f.max}
                value={draft[f.name] || ""}
                onChange={(event) => change(f.name, event.target.value)}
                className={input}
              />
            </label>
          ))}
        </div>
      </details>
      <Message state={state} />
      <button className={button} disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
export function NewActivity({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(addActivity, {});
  return (
    <form action={action} className="space-y-4 rounded-xl border p-4">
      <h3 className="font-semibold">Record an activity</h3>
      <input type="hidden" name="lead_id" value={leadId} />
      <label className="block">
        Event or conversation
        <input name="title" required maxLength={240} className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          Date
          <input name="activity_on" type="date" required className={input} />
        </label>
        <Select
          name="status"
          label="Status"
          value="To invite"
          options={activityStatuses}
        />
      </div>
      <label className="block">
        Notes
        <textarea name="notes" rows={2} maxLength={4000} className={input} />
      </label>
      <Message state={state} />
      <button className={button} disabled={pending}>
        {pending ? "Recording…" : "Record activity"}
      </button>
    </form>
  );
}
export function ActivityStatus({ activity }: { activity: Activity }) {
  const [state, action, pending] = useActionState(updateActivity, {});
  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={activity.id} />
      <input type="hidden" name="lead_id" value={activity.lead_id} />
      <input type="hidden" name="revision" value={activity.revision} />
      <Select
        name="status"
        label="Update status"
        value={activity.status}
        options={activityStatuses}
      />
      <button className={button} disabled={pending}>
        Save status
      </button>
      <Message state={state} />
    </form>
  );
}
