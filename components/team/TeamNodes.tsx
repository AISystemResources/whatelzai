"use client";

import { useMemo, useRef } from "react";
import { relationshipTo, type TeamPerson } from "@/lib/team/model";
import { fitNodeCamera } from "@/lib/team/node-zoom";
import { useNodeGestures } from "./useNodeGestures";
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
  const viewport = useRef<HTMLDivElement>(null);
  const {
    camera,
    zoomAt: zoomCamera,
    updateCamera,
    suppressClickUntil,
  } = useNodeGestures(viewport);
  const { zoom } = camera;
  const zoomAt = (value: number) =>
    zoomCamera(value, {
      x: (viewport.current?.clientWidth ?? 0) / 2,
      y: (viewport.current?.clientHeight ?? 0) / 2,
    });
  const focus = people.find((person) => person.id === selectedId);
  const controlClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p id="team-node-help" className="text-xs text-zinc-500">
          Sponsors sit above their downlines. Drag or scroll to explore. Pinch
          with two fingers to zoom.
          {onSelect ? " Select a person to change perspective." : ""}
        </p>
        <div className="flex items-center gap-2" aria-label="Node view zoom">
          <button
            type="button"
            className={controlClass}
            aria-label="Zoom out"
            disabled={zoom <= 0.25}
            onClick={() => zoomAt(zoom - 0.25)}
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
            onClick={() => zoomAt(zoom + 0.25)}
          >
            +
          </button>
          <button
            type="button"
            className={controlClass}
            onClick={() => {
              const element = viewport.current;
              if (element)
                updateCamera(
                  fitNodeCamera(
                    layout.width,
                    layout.height,
                    element.clientWidth,
                    element.clientHeight,
                  ),
                );
            }}
          >
            Fit
          </button>
          <button
            type="button"
            className={controlClass}
            onClick={() => {
              const element = viewport.current;
              updateCamera({
                zoom: 1,
                x: ((element?.clientWidth ?? layout.width) - layout.width) / 2,
                y:
                  ((element?.clientHeight ?? layout.height) - layout.height) /
                  2,
              });
            }}
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
        style={{ touchAction: "none" }}
        onClickCapture={(event) => {
          if (event.detail !== 0 && Date.now() < suppressClickUntil.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        className="h-[420px] sm:h-[560px] relative overflow-hidden cursor-grab active:cursor-grabbing select-none rounded-xl border border-zinc-200 bg-zinc-50 focus-visible:outline-2 focus-visible:outline-yellow-500"
      >
        <div className="absolute inset-0">
          <div
            className="absolute origin-top-left"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `translate(${camera.x}px, ${camera.y}px) scale(${zoom})`,
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
                    {person.current_level ? (
                      <span
                        className="mt-2 block truncate text-xs font-medium text-zinc-700"
                        title={person.current_level}
                      >
                        Level: {person.current_level}
                      </span>
                    ) : null}
                    {person.next_goal ? (
                      <span
                        className="mt-1 block truncate text-xs text-zinc-600"
                        title={person.next_goal}
                      >
                        Next: {person.next_goal}
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
      {focus?.current_level || focus?.next_goal || focus?.progress_notes ? (
        <div className="space-y-1 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-zinc-600">
          <p className="font-medium text-zinc-900">{focus.display_name}</p>
          <p>Current level: {focus.current_level || "Not recorded"}</p>
          <p>Next goal: {focus.next_goal || "Not recorded"}</p>
          {focus.progress_notes ? (
            <p className="whitespace-pre-wrap">{focus.progress_notes}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
