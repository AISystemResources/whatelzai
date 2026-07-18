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
} from "@/lib/testimonials";
import {
  Button,
  Field,
  SectionCard,
  StatusPill,
  TextArea,
  TextInput,
} from "@/app/admin/landing/forms/primitives";

type FormState = {
  id?: string;
  quote: string;
  long_quote: string;
  author_name: string;
  author_role: string;
  author_company: string;
  author_avatar_url: string;
  context: string;
  outcome_tag: string;
  category: TestimonialCategory;
  featured: boolean;
  published: boolean;
  sort_order: string;
};

function toState(t: Testimonial | null): FormState {
  return {
    id: t?.id,
    quote: t?.quote ?? "",
    long_quote: t?.long_quote ?? "",
    author_name: t?.author_name ?? "",
    author_role: t?.author_role ?? "",
    author_company: t?.author_company ?? "",
    author_avatar_url: t?.author_avatar_url ?? "",
    context: t?.context ?? "",
    outcome_tag: t?.outcome_tag ?? "",
    category: t?.category ?? "peer",
    featured: t?.featured ?? false,
    published: t?.published ?? false,
    sort_order: t?.sort_order?.toString() ?? "",
  };
}

export function TestimonialForm({ initial }: { initial: Testimonial | null }) {
  const [state, setState] = useState<FormState>(toState(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    setStatus("saving");
    start(async () => {
      try {
        await saveTestimonial({
          id: state.id,
          quote: state.quote,
          long_quote: state.long_quote || null,
          author_name: state.author_name,
          author_role: state.author_role || null,
          author_company: state.author_company || null,
          author_avatar_url: state.author_avatar_url || null,
          context: state.context || null,
          outcome_tag: state.outcome_tag || null,
          category: state.category,
          featured: state.featured,
          published: state.published,
          sort_order: state.sort_order ? Number(state.sort_order) : null,
        });
        setStatus("saved");
        if (!state.id) {
          router.push("/admin/testimonials");
        } else {
          setTimeout(() => setStatus("idle"), 2000);
        }
      } catch {
        setStatus("error");
      }
    });
  }

  function remove() {
    if (!state.id) return;
    if (!confirm("Delete this testimonial? This cannot be undone.")) return;
    start(async () => {
      try {
        await removeTestimonial(state.id!);
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
            {state.id ? "Edit testimonial" : "New testimonial"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {state.author_name || "Untitled"}
          </h1>
        </div>
        <Link
          href="/admin/testimonials"
          className="font-mono text-xs uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900"
        >
          ← Back
        </Link>
      </div>

      <SectionCard title="Quote" slug="what they said">
        <Field label="Short quote (the punchy line, 1–2 sentences)">
          <TextArea
            rows={3}
            value={state.quote}
            onChange={(e) => setState({ ...state, quote: e.target.value })}
          />
        </Field>
        <Field label="Long quote (optional — expanded version)">
          <TextArea
            rows={5}
            value={state.long_quote}
            onChange={(e) => setState({ ...state, long_quote: e.target.value })}
          />
        </Field>
        <Field label="Outcome tag (optional — e.g. → Shipped 3 workflows in 30 days)">
          <TextInput
            value={state.outcome_tag}
            onChange={(e) => setState({ ...state, outcome_tag: e.target.value })}
          />
        </Field>
        <Field label="Context (optional — grounds when/where)">
          <TextInput
            value={state.context}
            onChange={(e) => setState({ ...state, context: e.target.value })}
            placeholder="5-person AI workflow session · Nov 2025"
          />
        </Field>
      </SectionCard>

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
        <Field label="Avatar URL (optional)">
          <TextInput
            value={state.author_avatar_url}
            onChange={(e) =>
              setState({ ...state, author_avatar_url: e.target.value })
            }
            placeholder="https://…"
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
            {state.id ? "Save" : "Create"}
          </Button>
          <StatusPill status={status} />
        </div>
        {state.id && (
          <Button variant="danger" onClick={remove} disabled={pending}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
