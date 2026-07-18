"use client";

import { useState, useRef, useActionState } from "react";
import Image from "next/image";
import { submitPublicTestimonial } from "./actions";
import {
  TESTIMONIAL_CATEGORIES,
  SUBMITTER_ROLE_LABELS,
  type TestimonialCategory,
} from "@/lib/testimonials";

export function PublicForm({ initialCategory }: { initialCategory: TestimonialCategory }) {
  const [state, action, pending] = useActionState(submitPublicTestimonial, null);
  const [category, setCategory] = useState<TestimonialCategory>(initialCategory);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  const inputCls =
    "w-full border-b border-zinc-200 bg-transparent py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none transition-colors";

  return (
    <form action={action} className="space-y-10">
      {/* Avatar upload */}
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
        <div className="mt-3 space-y-2">
          {TESTIMONIAL_CATEGORIES.map((c) => (
            <label
              key={c}
              className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors ${
                category === c
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="h-4 w-4"
              />
              <span className="text-sm text-zinc-800">
                {SUBMITTER_ROLE_LABELS[c]}
              </span>
            </label>
          ))}
        </div>
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
          maxLength={200}
          className={inputCls}
          placeholder="Jane Doe"
        />
      </div>

      {/* Role + Company */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Your role
          </label>
          <input
            name="author_role"
            type="text"
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
            maxLength={200}
            className={inputCls}
            placeholder="you@example.com"
          />
          <p className="mt-1 font-mono text-[10px] text-zinc-400">
            Kept private. I use it to reply, never displayed.
          </p>
        </div>
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            LinkedIn URL
          </label>
          <input
            name="author_linkedin_url"
            type="url"
            maxLength={500}
            className={inputCls}
            placeholder="https://www.linkedin.com/in/…"
          />
          <p className="mt-1 font-mono text-[10px] text-zinc-400">
            Shown alongside your quote as proof of authority (not spam).
          </p>
        </div>
      </div>

      {/* The quote */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Your testimonial *
        </label>
        <textarea
          name="quote"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          className={`${inputCls} resize-none`}
          placeholder="What did you actually change or take away? What surprised you? What would you tell a colleague thinking of working with me?"
        />
        <p className="mt-1 font-mono text-[10px] text-zinc-400">
          Speak in your own voice — specifics beat superlatives.
        </p>
      </div>

      {/* Context */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Context (optional)
        </label>
        <input
          name="context"
          type="text"
          maxLength={500}
          className={inputCls}
          placeholder="Hackomania 2026 · March 2026"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Tags (optional, comma-separated)
        </label>
        <input
          name="tags"
          type="text"
          maxLength={500}
          className={inputCls}
          placeholder="prompt-engineering, workflow, fintech"
        />
      </div>

      {/* Honeypot — hidden from real users */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website (leave blank)
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Error */}
      {state?.error && (
        <p className="border-l-2 border-red-500 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 border border-zinc-900 bg-zinc-900 px-6 py-4 font-mono text-xs tracking-widest uppercase text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send testimonial"}
        <span aria-hidden="true">→</span>
      </button>

      <p className="font-mono text-[10px] text-zinc-400">
        Your submission is reviewed before it appears. Thanks for taking the time.
      </p>
    </form>
  );
}
