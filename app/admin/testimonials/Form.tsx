"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveTestimonial, removeTestimonial } from "./actions";
import {
  TESTIMONIAL_CATEGORIES,
  CATEGORY_LABELS,
  type Testimonial,
  type TestimonialCategory,
  type TestimonialStatus,
  type QuoteAnswer,
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

type FormState = {
  id: string;
  author_name: string;
  author_role: string;
  author_company: string;
  author_avatar_url: string;
  author_email: string;
  author_linkedin_url: string;
  outcome_tag: string;
  category: TestimonialCategory;
  status: TestimonialStatus;
  featured: boolean;
  published: boolean;
  sort_order: string;
  admin_note: string;
  suggested_question_ids: Set<string>;
  answers: Map<string, string>;
};

function toState(t: Testimonial): FormState {
  return {
    id: t.id,
    author_name: t.author_name ?? "",
    author_role: t.author_role ?? "",
    author_company: t.author_company ?? "",
    author_avatar_url: t.author_avatar_url ?? "",
    author_email: t.author_email ?? "",
    author_linkedin_url: t.author_linkedin_url ?? "",
    outcome_tag: t.outcome_tag ?? "",
    category: t.category,
    status: t.status,
    featured: t.featured,
    published: t.published,
    sort_order: t.sort_order?.toString() ?? "",
    admin_note: t.admin_note ?? "",
    suggested_question_ids: new Set(t.suggested_question_ids ?? []),
    answers: new Map((t.quote_answers ?? []).map((a) => [a.question_id, a.answer])),
  };
}

const PUBLIC_ORIGIN =
  typeof window === "undefined" ? "https://whatelz.ai" : window.location.origin;

export function TestimonialForm({
  initial,
  completionToken,
}: {
  initial: Testimonial;
  completionToken: string | null;
}) {
  const [state, setState] = useState<FormState>(toState(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const questions = TESTIMONIAL_QUESTIONS[state.category] ?? [];
  const completionUrl = completionToken
    ? `${PUBLIC_ORIGIN}/testimonials/new?t=${completionToken}`
    : null;
  const isIncomplete = state.status === "incomplete";

  function toggleSuggested(qid: string) {
    const next = new Set(state.suggested_question_ids);
    if (next.has(qid)) next.delete(qid);
    else next.add(qid);
    setState({ ...state, suggested_question_ids: next });
  }

  function setAnswer(qid: string, value: string) {
    const next = new Map(state.answers);
    if (value) next.set(qid, value);
    else next.delete(qid);
    setState({ ...state, answers: next });
  }

  function copyLink() {
    if (!completionUrl) return;
    navigator.clipboard.writeText(completionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function save() {
    setStatus("saving");
    start(async () => {
      try {
        // Build quote_answers from answers map, in question order.
        const quote_answers: QuoteAnswer[] = questions
          .filter((q) => (state.answers.get(q.id) ?? "").trim().length > 0)
          .map((q) => ({
            question_id: q.id,
            question_text: q.text,
            answer: state.answers.get(q.id)!.trim(),
          }));
        const quote = quote_answers[0]?.answer ?? "";

        await saveTestimonial({
          id: state.id,
          category: state.category,
          quote,
          quote_answers,
          author_name: state.author_name,
          author_role: state.author_role || null,
          author_company: state.author_company || null,
          author_avatar_url: state.author_avatar_url || null,
          author_email: state.author_email || null,
          author_linkedin_url: state.author_linkedin_url || null,
          outcome_tag: state.outcome_tag || null,
          status: state.status,
          featured: state.featured,
          published: state.published,
          sort_order: state.sort_order ? Number(state.sort_order) : null,
          admin_note: state.admin_note || null,
          suggested_question_ids: Array.from(state.suggested_question_ids),
        });
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("error");
      }
    });
  }

  function remove() {
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    start(async () => {
      try {
        await removeTestimonial(state.id);
        router.push("/admin/testimonials");
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
            {isIncomplete ? "Edit prefill" : "Edit testimonial"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {state.author_name || state.author_email || "Untitled"}
          </h1>
        </div>
        <Link
          href="/admin/testimonials"
          className="font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back
        </Link>
      </div>

      {isIncomplete && completionUrl && (
        <div className="rounded border-2 border-zinc-900 bg-zinc-50 p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Completion link — send to them
          </p>
          <div className="mt-3 flex items-center gap-3">
            <p className="min-w-0 flex-1 break-all font-mono text-sm text-zinc-800">
              {completionUrl}
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 border border-zinc-900 bg-zinc-900 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent)] hover:text-zinc-900"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Paste into a DM or email. When they submit, this row moves to
            &ldquo;Pending review&rdquo; automatically.
          </p>
        </div>
      )}

      <SectionCard title="Author" slug="who said it">
        <Field label="Name">
          <TextInput
            value={state.author_name}
            onChange={(e) => setState({ ...state, author_name: e.target.value })}
          />
        </Field>
        <Field label="Role">
          <TextInput
            value={state.author_role}
            onChange={(e) => setState({ ...state, author_role: e.target.value })}
            placeholder="AI Engineering Manager"
          />
        </Field>
        <Field label="Company / team">
          <TextInput
            value={state.author_company}
            onChange={(e) =>
              setState({ ...state, author_company: e.target.value })
            }
            placeholder="Prudential Singapore"
          />
        </Field>
        <Field label="Email (private)">
          <TextInput
            type="email"
            value={state.author_email}
            onChange={(e) =>
              setState({ ...state, author_email: e.target.value })
            }
          />
        </Field>
        <Field label="LinkedIn URL (public — proof of authority)">
          <TextInput
            type="url"
            value={state.author_linkedin_url}
            onChange={(e) =>
              setState({ ...state, author_linkedin_url: e.target.value })
            }
            placeholder="https://www.linkedin.com/in/…"
          />
        </Field>
        <Field label="Avatar URL">
          <TextInput
            value={state.author_avatar_url}
            onChange={(e) =>
              setState({ ...state, author_avatar_url: e.target.value })
            }
            placeholder="https://…"
          />
        </Field>
      </SectionCard>

      <SectionCard title="Their answers" slug="the testimonial">
        <p className="text-xs text-zinc-500">
          Questions for the selected category. If you tick a question as
          &ldquo;suggested&rdquo;, it gets highlighted for them.
        </p>
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="rounded border border-zinc-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900">{q.text}</p>
                <label className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  <input
                    type="checkbox"
                    checked={state.suggested_question_ids.has(q.id)}
                    onChange={() => toggleSuggested(q.id)}
                    className="h-3.5 w-3.5"
                  />
                  Suggested
                </label>
              </div>
              <TextArea
                rows={3}
                value={state.answers.get(q.id) ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Their answer, or empty if unanswered."
                className="mt-3"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Polish" slug="admin-only enhancements">
        <Field label="Outcome tag (e.g. → Shipped 3 workflows in 30 days)">
          <TextInput
            value={state.outcome_tag}
            onChange={(e) =>
              setState({ ...state, outcome_tag: e.target.value })
            }
          />
        </Field>
        <Field label="Private admin note">
          <TextArea
            rows={2}
            value={state.admin_note}
            onChange={(e) => setState({ ...state, admin_note: e.target.value })}
            placeholder="Sent via WhatsApp Mar 2026"
          />
        </Field>
      </SectionCard>

      <SectionCard title="Placement" slug="where it shows">
        <Field label="Category">
          <select
            value={state.category}
            onChange={(e) =>
              setState({
                ...state,
                category: e.target.value as TestimonialCategory,
              })
            }
            className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            {TESTIMONIAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            value={state.status}
            onChange={(e) =>
              setState({
                ...state,
                status: e.target.value as TestimonialStatus,
              })
            }
            className="w-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          >
            <option value="incomplete">Incomplete — waiting on them</option>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>
        <Field label="Sort order (lower = earlier)">
          <TextInput
            type="number"
            value={state.sort_order}
            onChange={(e) => setState({ ...state, sort_order: e.target.value })}
          />
        </Field>
        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.featured}
              onChange={(e) =>
                setState({ ...state, featured: e.target.checked })
              }
              className="h-4 w-4"
            />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-700">
              Featured on homepage
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.published}
              onChange={(e) =>
                setState({ ...state, published: e.target.checked })
              }
              className="h-4 w-4"
            />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-700">
              Published (public)
            </span>
          </label>
        </div>
      </SectionCard>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-6">
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={pending}>
            Save
          </Button>
          <StatusPill status={status} />
        </div>
        <Button variant="danger" onClick={remove} disabled={pending}>
          Delete
        </Button>
      </div>
    </div>
  );
}
