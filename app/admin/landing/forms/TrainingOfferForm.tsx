"use client";

import { useState, useTransition } from "react";
import { saveTrainingOffer } from "../actions";
import type { TrainingOfferContent } from "@/lib/landing-content";
import {
  ACCENT_HINT,
  Button,
  Field,
  SectionCard,
  StatusPill,
  TextArea,
  TextInput,
} from "./primitives";

export function TrainingOfferForm({
  initial,
}: {
  initial: TrainingOfferContent;
}) {
  const [state, setState] = useState<TrainingOfferContent>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [pending, start] = useTransition();

  function save() {
    setStatus("saving");
    start(async () => {
      try {
        await saveTrainingOffer(state);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <SectionCard title="The Ask" slug="training_offer">
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

      <Field label="Body" hint={ACCENT_HINT}>
        <TextArea
          rows={4}
          value={state.body}
          onChange={(e) => setState({ ...state, body: e.target.value })}
        />
      </Field>

      <Field label="Pricing note">
        <TextArea
          rows={2}
          value={state.pricing_note}
          onChange={(e) => setState({ ...state, pricing_note: e.target.value })}
        />
      </Field>

      <div className="rounded border border-zinc-100 p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Primary CTA
        </p>
        <div className="space-y-3">
          <Field label="Label">
            <TextInput
              value={state.primary_cta_label}
              onChange={(e) =>
                setState({ ...state, primary_cta_label: e.target.value })
              }
            />
          </Field>
          <Field label="Type">
            <select
              value={state.primary_cta_type}
              onChange={(e) =>
                setState({
                  ...state,
                  primary_cta_type: e.target.value as "email" | "url",
                })
              }
              className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
            >
              <option value="email">Email (uses site email)</option>
              <option value="url">URL (custom link)</option>
            </select>
          </Field>
          {state.primary_cta_type === "email" ? (
            <Field label="Email subject">
              <TextInput
                value={state.primary_cta_subject ?? ""}
                onChange={(e) =>
                  setState({ ...state, primary_cta_subject: e.target.value })
                }
              />
            </Field>
          ) : (
            <Field label="URL">
              <TextInput
                value={state.primary_cta_url ?? ""}
                onChange={(e) =>
                  setState({ ...state, primary_cta_url: e.target.value })
                }
              />
            </Field>
          )}
        </div>
      </div>

      <div className="rounded border border-zinc-100 p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Secondary CTA (optional)
        </p>
        <div className="space-y-3">
          <Field label="Label">
            <TextInput
              value={state.secondary_cta_label ?? ""}
              onChange={(e) =>
                setState({ ...state, secondary_cta_label: e.target.value })
              }
            />
          </Field>
          <Field label="URL">
            <TextInput
              value={state.secondary_cta_url ?? ""}
              onChange={(e) =>
                setState({ ...state, secondary_cta_url: e.target.value })
              }
            />
          </Field>
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
