"use client";

import { useState, useTransition } from "react";
import { savePov } from "../actions";
import type { PovContent, PovBelief } from "@/lib/landing-content";
import {
  ACCENT_HINT,
  Button,
  Field,
  SectionCard,
  StatusPill,
  TextArea,
  TextInput,
} from "./primitives";

export function PovForm({ initial }: { initial: PovContent }) {
  const [state, setState] = useState<PovContent>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [pending, start] = useTransition();

  function save() {
    setStatus("saving");
    start(async () => {
      try {
        await savePov(state);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("error");
      }
    });
  }

  function updateBelief(i: number, patch: Partial<PovBelief>) {
    setState({
      ...state,
      beliefs: state.beliefs.map((b, j) => (i === j ? { ...b, ...patch } : b)),
    });
  }

  function addBelief() {
    const nextN = String(state.beliefs.length + 1).padStart(2, "0");
    setState({
      ...state,
      beliefs: [...state.beliefs, { n: nextN, title: "", body: "" }],
    });
  }

  function removeBelief(i: number) {
    setState({
      ...state,
      beliefs: state.beliefs.filter((_, j) => j !== i),
    });
  }

  function moveBelief(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= state.beliefs.length) return;
    const next = [...state.beliefs];
    [next[i], next[j]] = [next[j], next[i]];
    setState({ ...state, beliefs: next });
  }

  return (
    <SectionCard title="What I think" slug="pov">
      <Field label="Eyebrow">
        <TextInput
          value={state.eyebrow}
          onChange={(e) => setState({ ...state, eyebrow: e.target.value })}
        />
      </Field>

      <Field label="Heading" hint={ACCENT_HINT}>
        <TextArea
          rows={3}
          value={state.heading}
          onChange={(e) => setState({ ...state, heading: e.target.value })}
        />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Beliefs
          </span>
          <Button variant="ghost" onClick={addBelief}>
            + Add belief
          </Button>
        </div>

        <div className="space-y-4">
          {state.beliefs.map((b, i) => (
            <div
              key={i}
              className="space-y-2 rounded border border-zinc-100 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  Belief {i + 1}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    onClick={() => moveBelief(i, -1)}
                    disabled={i === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => moveBelief(i, 1)}
                    disabled={i === state.beliefs.length - 1}
                  >
                    ↓
                  </Button>
                  <Button variant="danger" onClick={() => removeBelief(i)}>
                    Remove
                  </Button>
                </div>
              </div>

              <Field label="Number">
                <TextInput
                  value={b.n}
                  onChange={(e) => updateBelief(i, { n: e.target.value })}
                />
              </Field>
              <Field label="Title" hint={ACCENT_HINT}>
                <TextInput
                  value={b.title}
                  onChange={(e) => updateBelief(i, { title: e.target.value })}
                />
              </Field>
              <Field label="Body" hint={ACCENT_HINT}>
                <TextArea
                  rows={3}
                  value={b.body}
                  onChange={(e) => updateBelief(i, { body: e.target.value })}
                />
              </Field>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={pending}>
          Save
        </Button>
        <StatusPill status={status} />
      </div>
    </SectionCard>
  );
}
