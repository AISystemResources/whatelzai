"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createInviteAction } from "../actions";
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

export function NewInviteForm() {
  const [author_name, setName] = useState("");
  const [author_role, setRole] = useState("");
  const [author_company, setCompany] = useState("");
  const [author_email, setEmail] = useState("");
  const [author_linkedin_url, setLinkedin] = useState("");
  const [category, setCategory] = useState<TestimonialCategory>("peer");
  const [questionIds, setQuestionIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [pending, start] = useTransition();

  const questions = TESTIMONIAL_QUESTIONS[category] ?? [];

  function toggleQuestion(id: string) {
    const next = new Set(questionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setQuestionIds(next);
  }

  function create() {
    setStatus("saving");
    start(async () => {
      try {
        await createInviteAction(
          {
            author_name: author_name || undefined,
            author_role: author_role || undefined,
            author_company: author_company || undefined,
            author_email: author_email || undefined,
            author_linkedin_url: author_linkedin_url || undefined,
            category,
            question_ids: Array.from(questionIds),
          },
          note || null,
        );
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
            New invite
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Pre-fill what you know. All fields optional except category — but
            the more you fill, the easier for them.
          </p>
        </div>
        <Link
          href="/admin/testimonials/invites"
          className="font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back
        </Link>
      </div>

      <SectionCard title="Who is this for?" slug="prefill">
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
            placeholder="Prudential Singapore"
          />
        </Field>
        <Field label="Email">
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
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as TestimonialCategory);
              setQuestionIds(new Set());
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

      <SectionCard title="Suggested questions" slug="what to nudge them toward">
        <p className="text-xs text-zinc-500">
          Highlight the questions you&rsquo;d most like this person to answer.
          They&rsquo;ll see all questions for their category, but the ones you
          pick get a &ldquo;suggested&rdquo; badge.
        </p>
        <div className="space-y-2">
          {questions.map((q) => (
            <label
              key={q.id}
              className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${
                questionIds.has(q.id)
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <input
                type="checkbox"
                checked={questionIds.has(q.id)}
                onChange={() => toggleQuestion(q.id)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-zinc-800">{q.text}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Note (private)" slug="for your own tracking">
        <Field label="Note about this invite (not shown to the recipient)">
          <TextArea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sent via WhatsApp · deadline end of month"
          />
        </Field>
      </SectionCard>

      <div className="flex items-center gap-3 border-t border-zinc-200 pt-6">
        <Button onClick={create} disabled={pending}>
          Create invite link
        </Button>
        {status === "saving" && <StatusPill status="saving" />}
        {status === "error" && <StatusPill status="error" />}
      </div>
    </div>
  );
}
