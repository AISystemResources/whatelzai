"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createPrefillTestimonial } from "../actions";
import {
  TESTIMONIAL_CATEGORIES,
  CATEGORY_LABELS,
  type TestimonialCategory,
} from "@/lib/testimonials";
import { TESTIMONIAL_QUESTIONS } from "@/lib/testimonial-questions";
import {
  Button,
  Field,
  SectionCard,
  StatusPill,
  TextArea,
  TextInput,
} from "@/app/admin/landing/forms/primitives";

export function NewPrefillForm() {
  const [author_name, setName] = useState("");
  const [author_role, setRole] = useState("");
  const [author_company, setCompany] = useState("");
  const [author_email, setEmail] = useState("");
  const [author_linkedin_url, setLinkedin] = useState("");
  const [category, setCategory] = useState<TestimonialCategory>("peer");
  const [suggested, setSuggested] = useState<Set<string>>(new Set());
  const [admin_note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [pending, start] = useTransition();

  const questions = TESTIMONIAL_QUESTIONS[category] ?? [];

  function toggle(qid: string) {
    const next = new Set(suggested);
    if (next.has(qid)) next.delete(qid);
    else next.add(qid);
    setSuggested(next);
  }

  function create() {
    setStatus("saving");
    start(async () => {
      try {
        await createPrefillTestimonial({
          category,
          author_name: author_name || undefined,
          author_role: author_role || undefined,
          author_company: author_company || undefined,
          author_email: author_email || undefined,
          author_linkedin_url: author_linkedin_url || undefined,
          suggested_question_ids: Array.from(suggested),
          admin_note: admin_note || undefined,
        });
        // action redirects, no need to reset status
      } catch {
        setStatus("error");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Testimonials
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            New prefill
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Fill what you know. Save. You&rsquo;ll get a link to send them.
          </p>
        </div>
        <Link
          href="/admin/testimonials"
          className="font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back
        </Link>
      </div>

      <SectionCard title="Who is this for?" slug="anchor">
        <Field label="Name">
          <TextInput
            value={author_name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Role">
          <TextInput
            value={author_role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Senior Engineer"
          />
        </Field>
        <Field label="Company / team">
          <TextInput
            value={author_company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </Field>
        <Field label="Email (anchor point — helps track them)">
          <TextInput
            type="email"
            value={author_email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="LinkedIn URL">
          <TextInput
            type="url"
            value={author_linkedin_url}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://www.linkedin.com/in/…"
          />
        </Field>
        <Field label="Category (defines which questions they see)">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as TestimonialCategory);
              setSuggested(new Set());
            }}
            className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            {TESTIMONIAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </SectionCard>

      <SectionCard title="Suggested questions" slug="what to nudge">
        <p className="text-xs text-zinc-500">
          Tick the questions you&rsquo;d most like them to answer. They&rsquo;ll
          see all questions but ticked ones get a yellow highlight.
        </p>
        <div className="space-y-2">
          {questions.map((q) => (
            <label
              key={q.id}
              className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${
                suggested.has(q.id)
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <input
                type="checkbox"
                checked={suggested.has(q.id)}
                onChange={() => toggle(q.id)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-zinc-800">{q.text}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Private note" slug="for your own tracking">
        <Field label="Not shown to the recipient">
          <TextArea
            rows={2}
            value={admin_note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sent via WhatsApp · deadline end of month"
          />
        </Field>
      </SectionCard>

      <div className="flex items-center gap-3 border-t border-zinc-200 pt-6">
        <Button onClick={create} disabled={pending}>
          Create prefill link
        </Button>
        {status === "saving" && <StatusPill status="saving" />}
        {status === "error" && <StatusPill status="error" />}
      </div>
    </div>
  );
}
