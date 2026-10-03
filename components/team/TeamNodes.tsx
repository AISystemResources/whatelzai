"use client";

import { useMemo, useRef, useState } from "react";
import { relationshipTo, type TeamPerson } from "@/lib/team/model";
import {
  layoutTeamNodes,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "@/lib/team/node-layout";

export function TeamNodes({
  people,
  selectedId,
  onSelect,
}: {
  people: TeamPerson[];
  selectedId: string;
  onSelect?: (id: string) => void;
}) {
  const layout = useMemo(() => layoutTeamNodes(people), [people]);
  const [zoom, setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const focus = people.find((person) => person.id === selectedId);
  const controlClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id="team-node-help" className="text-xs text-zinc-500">
          Sponsors sit above their downlines. Scroll to explore.
          {onSelect ? " Select a person to change perspective." : ""}
        </p>
        <div className="flex items-center gap-2" aria-label="Node view zoom">
          <button
            type="button"
            className={controlClass}
            aria-label="Zoom out"
            disabled={zoom <= 0.25}
            onClick={() => setZoom((value) => Math.max(0.25, value - 0.25))}
          >
            −
          </button>
          <output
            className="min-w-12 text-center text-xs text-zinc-600"
            aria-live="polite"
          >
            {Math.round(zoom * 100)}%
          </output>
          <button
            type="button"
            className={controlClass}
            aria-label="Zoom in"
            disabled={zoom >= 1.5}
            onClick={() => setZoom((value) => Math.min(1.5, value + 0.25))}
          >
            +
          </button>
          <button
            type="button"
            className={controlClass}
            onClick={() => {
              setZoom(
                Math.max(
                  0.25,
                  Math.min(
                    1,
                    (viewport.current?.clientWidth ?? layout.width) /
                      layout.width,
                  ),
                ),
              );
              viewport.current?.scrollTo({ left: 0, top: 0 });
            }}
          >
            Fit
          </button>
          <button
            type="button"
            className={controlClass}
            onClick={() => setZoom(1)}
          >
            Reset
          </button>
        </div>
      </div>
      <div
        ref={viewport}
        role="region"
        aria-label="Team relationship nodes"
        aria-describedby="team-node-help"
        tabIndex={0}
        className="max-h-[560px] overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 focus-visible:outline-2 focus-visible:outline-yellow-500"
      >
        <div
          className="relative"
          style={{ width: layout.width * zoom, height: layout.height * zoom }}
        >
          <div
            className="absolute origin-top-left"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `scale(${zoom})`,
            }}
          >
            <svg
              width={layout.width}
              height={layout.height}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            >
              {layout.edges.map(({ parent, child }) => {
                const startX = parent.x + NODE_WIDTH / 2;
                const startY = parent.y + NODE_HEIGHT;
                const endX = child.x + NODE_WIDTH / 2;
                const endY = child.y;
                const middleY = (startY + endY) / 2;
                return (
                  <path
                    key={child.person.id}
                    d={`M ${startX} ${startY} V ${middleY} H ${endX} V ${endY}`}
                    fill="none"
                    stroke="#a1a1aa"
                    strokeWidth={2}
                  />
                );
              })}
            </svg>
            <ul
              aria-label="People in this team view"
              className="m-0 list-none p-0"
            >
              {layout.nodes.map(({ person, x, y }) => {
                const selected = person.id === selectedId;
                const relation = relationshipTo(people, selectedId, person.id);
                const content = (
                  <>
                    <span className="block truncate text-xs capitalize text-zinc-500">
                      {selected ? "Selected person" : relation}
                    </span>
                    <span className="mt-2 block line-clamp-2 break-words text-base font-semibold leading-snug text-zinc-900">
                      {person.display_name}
                    </span>
                    {person.abo_number ? (
                      <span className="mt-1 block text-xs font-medium text-zinc-600">
                        ABO {person.abo_number}
                      </span>
                    ) : null}
                    {person.context && !person.abo_number ? (
                      <span className="mt-1 block truncate text-xs text-zinc-500">
                        {person.context}
                      </span>
                    ) : null}
                  </>
                );
                const cardClass = `block h-full w-full rounded-xl border-2 px-4 py-3 text-left ${selected ? "border-yellow-400 bg-yellow-50" : "border-zinc-200 bg-white"}`;
                return (
                  <li
                    key={person.id}
                    className="absolute"
                    style={{
                      left: x,
                      top: y,
                      width: NODE_WIDTH,
                      height: NODE_HEIGHT,
                    }}
                  >
                    {onSelect ? (
                      <button
                        type="button"
                        title={[person.display_name, person.context]
                          .filter(Boolean)
                          .join(" — ")}
                        aria-pressed={selected}
                        onClick={() => onSelect(person.id)}
                        className={`${cardClass} hover:border-yellow-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500`}
                      >
                        {content}
                      </button>
                    ) : (
                      <div className={cardClass}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      {focus?.context ? (
        <p className="text-sm text-zinc-600">
          {focus.display_name}: {focus.context}
        </p>
      ) : null}
    </div>
  );
}
