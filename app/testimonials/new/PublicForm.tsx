"use client";

import { useState, useRef, useActionState } from "react";
import Image from "next/image";
import { submitPublicTestimonial } from "./actions";
import {
  TESTIMONIAL_CATEGORIES,
  CATEGORY_LABELS,
  SUBMITTER_ROLE_LABELS,
  type Testimonial,
  type TestimonialCategory,
} from "@/lib/testimonials";
import {
  TESTIMONIAL_QUESTIONS,
  type TestimonialQuestion,
} from "@/lib/testimonial-questions";

export function PublicForm({ prefill }: { prefill: Testimonial }) {
  const [state, action, pending] = useActionState(
    submitPublicTestimonial,
    null,
  );
  const [category, setCategory] = useState<TestimonialCategory>(prefill.category);
  const [preview, setPreview] = useState<string | null>(prefill.author_avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);

  const questions: TestimonialQuestion[] = TESTIMONIAL_QUESTIONS[category] ?? [];
  const highlightedIds = new Set(prefill.suggested_question_ids ?? []);
  const existingAnswers = new Map(
    (prefill.quote_answers ?? []).map((a) => [a.question_id, a.answer]),
  );

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
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
          onChange={(e) => setCategory(e.target.value as TestimonialCategory)}
          className="mt-3 w-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:border-zinc-900 focus:outline-none"
        >
          {TESTIMONIAL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {SUBMITTER_ROLE_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Your name *
        </label>
        <input
          name="author_name"
          type="text"
          required
          defaultValue={prefill.author_name ?? ""}
          maxLength={200}
          className={inputCls}
          placeholder="Jane Doe"
        />
      </div>

      {/* Role + company */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Your role
          </label>
          <input
            name="author_role"
            type="text"
            defaultValue={prefill.author_role ?? ""}
            maxLength={200}
            className={inputCls}
            placeholder="Senior Engineer"
          />
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Company / team
          </label>
          <input
            name="author_company"
            type="text"
            defaultValue={prefill.author_company ?? ""}
            maxLength={200}
            className={inputCls}
            placeholder="Prudential Singapore"
          />
        </div>
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
          Pick whichever question hits you. Specifics beat superlatives.
        </p>

        <div className="mt-6 space-y-6">
          {questions.map((q) => {
            const highlighted = highlightedIds.has(q.id);
            return (
              <div
                key={q.id}
                className={`border p-4 sm:p-5 ${
                  highlighted
                    ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                    : "border-zinc-200"
                }`}
              >
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
                <textarea
                  name={`answer_${q.id}`}
                  rows={3}
                  maxLength={2000}
                  defaultValue={existingAnswers.get(q.id) ?? ""}
                  className="mt-3 w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
                  placeholder="Skip if you don't want to answer this one."
                />
              </div>
            );
          })}
        </div>
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
        {pending ? "Sending…" : "Send testimonial"}
        <span aria-hidden="true">→</span>
      </button>

      <p className="font-mono text-[10px] text-zinc-400">
        {CATEGORY_LABELS[category]} · Reviewed before it appears on the site.
      </p>
    </form>
  );
}
