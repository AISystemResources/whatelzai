"use client";

import { useState } from "react";
import { relationshipTo, type TeamPerson } from "@/lib/team/model";

export function TeamTree({
  people,
  focusId,
  canSeeAll = false,
}: {
  people: TeamPerson[];
  focusId: string;
  canSeeAll?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(focusId);
  const focus = people.find((person) => person.id === selectedId);
  const bySponsor = new Map<string | null, TeamPerson[]>();
  for (const person of people) {
    const children = bySponsor.get(person.sponsor_person_id) ?? [];
    children.push(person);
    bySponsor.set(person.sponsor_person_id, children);
  }
  const relationships = people.map((person) =>
    relationshipTo(people, selectedId, person.id),
  );
  function branch(person: TeamPerson) {
    const children = bySponsor.get(person.id) ?? [];
    const relation = relationshipTo(people, selectedId, person.id);
    return (
      <li key={person.id} className="py-2">
        <div
          className={`rounded-xl border px-4 py-3 ${person.id === selectedId ? "border-yellow-400 bg-yellow-50" : "border-zinc-200 bg-white"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-zinc-900">
              {person.display_name}
            </span>
            <span className="text-xs capitalize text-zinc-500">
              {relation === "self" ? "You / selected person" : relation}
            </span>
          </div>
          {person.context && (
            <p className="mt-1 text-xs text-zinc-500">{person.context}</p>
          )}
        </div>
        {children.length > 0 && (
          <ul className="ml-3 mt-1 space-y-1 border-l border-zinc-200 pl-3 sm:ml-5 sm:pl-5">
            {children.map(branch)}
          </ul>
        )}
      </li>
    );
  }
  return (
    <section aria-label="Sponsor tree" className="space-y-6">
      {canSeeAll && (
        <label className="block text-sm text-zinc-600">
          View relationships from
          <select
            className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 sm:max-w-sm"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.display_name}
                {person.context ? ` — ${person.context}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          [
            "Uplines",
            relationships.filter((relation) => relation.includes("upline"))
              .length,
          ],
          [
            "Downlines",
            relationships.filter((relation) => relation.includes("downline"))
              .length,
          ],
          [
            "Direct sidelines",
            relationships.filter((relation) => relation === "direct sideline")
              .length,
          ],
        ].map(([label, count]) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 px-2 py-4"
          >
            <p className="text-2xl font-semibold text-zinc-900">{count}</p>
            <p className="mt-1 text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        Relationships are relative to{" "}
        {focus?.display_name ?? "your linked profile"}. A top-level person has
        no recorded upline in this view.
      </p>
      <ul className="space-y-2">{(bySponsor.get(null) ?? []).map(branch)}</ul>
      {!canSeeAll && (
        <p className="text-xs text-zinc-500">
          This view contains your direct upline and your downline branch. Counts
          cover only the people visible to you.
        </p>
      )}
    </section>
  );
}
