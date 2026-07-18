"use client";

import { useState, useTransition } from "react";
import { saveProvocation } from "../actions";
import type { ProvocationContent } from "@/lib/landing-content";
import {
  ACCENT_HINT,
  Button,
  Field,
  SectionCard,
  StatusPill,
  TextArea,
  TextInput,
} from "./primitives";

export function ProvocationForm({ initial }: { initial: ProvocationContent }) {
  const [state, setState] = useState<ProvocationContent>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [pending, start] = useTransition();

  function save() {
    setStatus("saving");
    start(async () => {
      try {
        await saveProvocation(state);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <SectionCard title="The Gap" slug="provocation">
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

      <Field label="Body" hint={ACCENT_HINT}>
        <TextArea
          rows={3}
          value={state.body}
          onChange={(e) => setState({ ...state, body: e.target.value })}
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={pending}>
          Save
        </Button>
        <StatusPill status={status} />
      </div>
    </SectionCard>
  );
}
