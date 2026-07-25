"use client";

import { useState, useTransition } from "react";
import { saveTrackRecord } from "../actions";
import type {
  TrackRecordContent,
  TrackRecordStat,
  TrackRecordLink,
} from "@/lib/landing-content";
import {
  ACCENT_HINT,
  Button,
  Field,
  SectionCard,
  StatusPill,
  TextArea,
  TextInput,
} from "./primitives";

export function TrackRecordForm({ initial }: { initial: TrackRecordContent }) {
  const [state, setState] = useState<TrackRecordContent>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [pending, start] = useTransition();

  function save() {
    setStatus("saving");
    start(async () => {
      try {
        await saveTrackRecord(state);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("error");
      }
    });
  }

  function updateStat(i: number, patch: Partial<TrackRecordStat>) {
    setState({
      ...state,
      stats: state.stats.map((s, j) => (i === j ? { ...s, ...patch } : s)),
    });
  }
  function addStat() {
    setState({ ...state, stats: [...state.stats, { value: "", label: "" }] });
  }
  function removeStat(i: number) {
    setState({ ...state, stats: state.stats.filter((_, j) => j !== i) });
  }

  function updateLink(i: number, patch: Partial<TrackRecordLink>) {
    setState({
      ...state,
      links: state.links.map((l, j) => (i === j ? { ...l, ...patch } : l)),
    });
  }
  function addLink() {
    setState({ ...state, links: [...state.links, { href: "", label: "" }] });
  }
  function removeLink(i: number) {
    setState({ ...state, links: state.links.filter((_, j) => j !== i) });
  }

  return (
    <SectionCard title="The Work" slug="track_record">
      <Field label="Eyebrow">
        <TextInput
          value={state.eyebrow}
          onChange={(e) => setState({ ...state, eyebrow: e.target.value })}
        />
      </Field>

      <Field label="Heading" hint={ACCENT_HINT}>
        <TextArea
          rows={2}
          value={state.heading}
          onChange={(e) => setState({ ...state, heading: e.target.value })}
        />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Stats
          </span>
          <Button variant="ghost" onClick={addStat}>
            + Add stat
          </Button>
        </div>
        <div className="space-y-3">
          {state.stats.map((s, i) => (
            <div
              key={i}
              className="grid gap-2 rounded border border-zinc-100 p-3 sm:grid-cols-[120px_1fr_auto]"
            >
              <TextInput
                placeholder="Value (e.g. 5,000+)"
                value={s.value}
                onChange={(e) => updateStat(i, { value: e.target.value })}
              />
              <TextInput
                placeholder="Label"
                value={s.label}
                onChange={(e) => updateStat(i, { label: e.target.value })}
              />
              <Button variant="danger" onClick={() => removeStat(i)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Field label="Links heading">
        <TextInput
          value={state.links_heading}
          onChange={(e) =>
            setState({ ...state, links_heading: e.target.value })
          }
        />
      </Field>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Links
          </span>
          <Button variant="ghost" onClick={addLink}>
            + Add link
          </Button>
        </div>
        <div className="space-y-3">
          {state.links.map((l, i) => (
            <div
              key={i}
              className="grid gap-2 rounded border border-zinc-100 p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <TextInput
                placeholder="/path"
                value={l.href}
                onChange={(e) => updateLink(i, { href: e.target.value })}
              />
              <TextInput
                placeholder="Label"
                value={l.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
              />
              <Button variant="danger" onClick={() => removeLink(i)}>
                Remove
              </Button>
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
