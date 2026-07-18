"use client";

import { useState, useRef, useActionState } from "react";
import Image from "next/image";
import { submitPublicTestimonial } from "./actions";
import {
  TESTIMONIAL_CATEGORIES,
  CATEGORY_LABELS,
  SUBMITTER_ROLE_LABELS,
  type Affiliation,
  type Testimonial,
  type TestimonialCategory,
} from "@/lib/testimonials";
import {
  TESTIMONIAL_QUESTIONS,
  getPrimaryQuestion,
} from "@/lib/testimonial-questions";
import {
  CATEGORY_EVENT_KINDS,
  CATEGORY_EVENT_LABEL,
  type ServiceEvent,
} from "@/lib/service-events";

// The question ids the user has "opened" — always includes the primary + any suggested.
function initialOpenedIds(
  category: TestimonialCategory,
  suggestedIds: string[],
  answeredIds: string[],
): Set<string> {
  const s = new Set<string>();
  s.add(getPrimaryQuestion(category).id);
  suggestedIds.forEach((id) => s.add(id));
  answeredIds.forEach((id) => s.add(id));
  return s;
}

export function PublicForm({
  prefill,
  events,
}: {
  prefill: Testimonial;
  events: ServiceEvent[];
}) {
  const [state, action, pending] = useActionState(submitPublicTestimonial, null);
  const [category, setCategory] = useState<TestimonialCategory>(prefill.category);
  const [eventId, setEventId] = useState<string>(prefill.service_event_id ?? "");
  const [preview, setPreview] = useState<string | null>(prefill.author_avatar_url);
  const [affiliations, setAffiliations] = useState<Affiliation[]>(
    prefill.author_affiliations && prefill.author_affiliations.length > 0
      ? prefill.author_affiliations
      : [{ role: "", company: "" }],
  );
  const [openedIds, setOpenedIds] = useState<Set<string>>(
    initialOpenedIds(
      prefill.category,
      prefill.suggested_question_ids ?? [],
      (prefill.quote_answers ?? []).map((a) => a.question_id),
    ),
  );

  const fileRef = useRef<HTMLInputElement>(null);

  const questions = TESTIMONIAL_QUESTIONS[category] ?? [];
  const highlightedIds = new Set(prefill.suggested_question_ids ?? []);
  const existingAnswers = new Map(
    (prefill.quote_answers ?? []).map((a) => [a.question_id, a.answer]),
  );
  const primary = getPrimaryQuestion(category);
  const unopened = questions.filter((q) => !openedIds.has(q.id));

  function onCategoryChange(next: TestimonialCategory) {
    setCategory(next);
    setEventId(""); // reset — old event kind may not match new category
    setOpenedIds(initialOpenedIds(next, prefill.suggested_question_ids ?? [], []));
  }

  const eventKinds = CATEGORY_EVENT_KINDS[category] ?? [];
  const relevantEvents = eventKinds.length
    ? events.filter((e) => eventKinds.includes(e.kind))
    : [];
  const eventLabel = CATEGORY_EVENT_LABEL[category];

  function openQuestion(id: string) {
    setOpenedIds(new Set([...openedIds, id]));
  }

  function closeQuestion(id: string) {
    if (id === primary.id) return; // primary can't be closed
    const next = new Set(openedIds);
    next.delete(id);
    setOpenedIds(next);
  }

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  function updateAffiliation(i: number, patch: Partial<Affiliation>) {
    setAffiliations(affiliations.map((a, j) => (i === j ? { ...a, ...patch } : a)));
  }
  function addAffiliation() {
    setAffiliations([...affiliations, { role: "", company: "" }]);
  }
  function removeAffiliation(i: number) {
    if (affiliations.length === 1) {
      setAffiliations([{ role: "", company: "" }]);
      return;
    }
    setAffiliations(affiliations.filter((_, j) => j !== i));
  }

  const inputCls =
    "w-full border-b border-zinc-200 bg-transparent py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors";

  return (
    <form action={action} className="space-y-12">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative h-28 w-28 overflow-hidden rounded-full border-2 border-dashed border-zinc-300 bg-zinc-50 transition-colors hover:border-zinc-900"
          aria-label="Upload your photo"
        >
          {preview ? (
            <Image
              src={preview}
              alt="Your photo preview"
              width={112}
              height={112}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-zinc-400 transition-colors group-hover:text-zinc-900">
              <span className="text-2xl">+</span>
              <span className="font-mono text-[10px] uppercase tracking-widest">
                Photo
              </span>
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onPickAvatar}
          className="sr-only"
        />
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Optional · JPG / PNG / WebP · Under 5MB
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Where do you know me from?
        </label>
        <select
          name="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as TestimonialCategory)}
          className="mt-3 w-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-zinc-900 focus:outline-none"
        >
          {TESTIMONIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SUBMITTER_ROLE_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Event dropdown — only shown when the category has relevant events */}
      {relevantEvents.length > 0 && eventLabel && (
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            {eventLabel}
          </label>
          <select
            name="service_event_id"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-3 w-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            <option value="">— Select one —</option>
            {relevantEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {relevantEvents.length === 0 && eventId && (
        <input type="hidden" name="service_event_id" value={eventId} />
      )}

      {/* Display Name */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Display name *
        </label>
        <input
          name="author_name"
          type="text"
          required
          defaultValue={prefill.author_name ?? ""}
          maxLength={200}
          className={inputCls}
          placeholder="How you'd like to be shown (e.g. Sim Yee L.)"
        />
      </div>

      {/* Affiliations (multiple role + company pairs) */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Role & company / team
        </label>
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          Add more than one if you wear more than one hat.
        </p>
        <div className="mt-3 space-y-3">
          {affiliations.map((aff, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                name={`affiliation_role_${i}`}
                type="text"
                maxLength={200}
                value={aff.role}
                onChange={(e) => updateAffiliation(i, { role: e.target.value })}
                className={inputCls}
                placeholder="Role (e.g. Co-founder)"
              />
              <input
                name={`affiliation_company_${i}`}
                type="text"
                maxLength={200}
                value={aff.company}
                onChange={(e) =>
                  updateAffiliation(i, { company: e.target.value })
                }
                className={inputCls}
                placeholder="Company / team"
              />
              <button
                type="button"
                onClick={() => removeAffiliation(i)}
                className="self-center font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-red-600"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addAffiliation}
          className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
        >
          + Add another role
        </button>
      </div>

      {/* Email + LinkedIn */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Email *
          </label>
          <input
            name="author_email"
            type="email"
            required
            defaultValue={prefill.author_email ?? ""}
            maxLength={200}
            className={inputCls}
            placeholder="you@example.com"
          />
          <p className="mt-1 font-mono text-[10px] text-zinc-400">
            Private. Never displayed.
          </p>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            LinkedIn URL
          </label>
          <input
            name="author_linkedin_url"
            type="url"
            defaultValue={prefill.author_linkedin_url ?? ""}
            maxLength={500}
            className={inputCls}
            placeholder="https://www.linkedin.com/in/…"
          />
          <p className="mt-1 font-mono text-[10px] text-zinc-400">
            Public — proof of authority.
          </p>
        </div>
      </div>

      {/* Questions */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Answer at least one *
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Specifics beat superlatives.
        </p>

        <div className="mt-6 space-y-6">
          {questions
            .filter((q) => openedIds.has(q.id))
            .map((q) => {
              const highlighted = highlightedIds.has(q.id);
              const isPrimary = q.id === primary.id;
              return (
                <div
                  key={q.id}
                  className={`border p-4 sm:p-5 ${
                    highlighted
                      ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                      : "border-zinc-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-zinc-900">
                      {q.text}
                      {highlighted && (
                        <span
                          className="ml-2 font-mono text-[10px] tracking-widest uppercase"
                          style={{ color: "var(--accent-text)" }}
                        >
                          · suggested
                        </span>
                      )}
                    </p>
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => closeQuestion(q.id)}
                        className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-red-600"
                        aria-label="Remove this question"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <textarea
                    name={`answer_${q.id}`}
                    rows={3}
                    maxLength={2000}
                    defaultValue={existingAnswers.get(q.id) ?? ""}
                    required={isPrimary}
                    minLength={isPrimary ? 15 : undefined}
                    className="mt-3 w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                    placeholder={
                      isPrimary
                        ? "Your answer here. At least 15 characters."
                        : "Optional."
                    }
                  />
                </div>
              );
            })}

          {/* "Add another question" — only if there are unopened questions */}
          {unopened.length > 0 && (
            <details className="border border-dashed border-zinc-300 p-4">
              <summary className="cursor-pointer font-mono text-xs uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-900">
                + Answer another question
              </summary>
              <div className="mt-3 space-y-2">
                {unopened.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => openQuestion(q.id)}
                    className="block w-full border border-zinc-200 bg-white p-3 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Private improvement note */}
      <div className="rounded border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          What could be improved? (optional, private)
        </label>
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          Only Edmund sees this — never shown publicly. Any honest feedback
          welcome.
        </p>
        <textarea
          name="improvement_note"
          rows={3}
          maxLength={2000}
          defaultValue={prefill.improvement_note ?? ""}
          className="mt-3 w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          placeholder="What could have been better, sharper, or different?"
        />
      </div>

      {prefill.completion_token && (
        <input
          type="hidden"
          name="completion_token"
          value={prefill.completion_token}
        />
      )}

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website (leave blank)
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state?.error && (
        <p className="border-l-2 border-red-500 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-6 py-4 font-mono text-xs tracking-widest uppercase text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send feedback"}
        <span aria-hidden="true">→</span>
      </button>

      <p className="font-mono text-[10px] text-zinc-400">
        {CATEGORY_LABELS[category]} · Reviewed before it appears on the site.
      </p>
    </form>
  );
}
