"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";

interface Question {
  id: string;
  prompt: string;
  helper_md: string | null;
  choices: Array<{ id: string; label: string }>;
}

interface Archetype {
  key: string;
  name: string;
  one_line: string;
}

interface Props {
  slug: string;
  title: string;
  subtitle: string | null;
  introMd: string | null;
  ctaLabel: string;
  questions: Question[];
  archetypes: Archetype[];
}

type Phase = "intro" | "playing" | "preview" | "unlocking";

interface PreviewState {
  attempt_id: string;
  archetype_key: string;
  archetype: { key: string; name: string; one_line: string } | null;
}

function sessionKey(slug: string) {
  return `quiz:${slug}:session_id`;
}
function previewKey(slug: string) {
  return `quiz:${slug}:preview`;
}

function ensureSessionId(slug: string): string {
  if (typeof window === "undefined") return "";
  const key = sessionKey(slug);
  let s = window.sessionStorage.getItem(key);
  if (!s) {
    s = crypto.randomUUID();
    window.sessionStorage.setItem(key, s);
  }
  return s;
}

export function QuizPlayer({
  slug,
  title,
  subtitle,
  introMd,
  ctaLabel,
  questions,
  archetypes,
}: Props) {
  const router = useRouter();
  const { isSignedIn } = useUser();

  // Lazy init from sessionStorage so we render the correct phase on first paint
  // (avoids a flash of "intro" for a user returning from Clerk sign-in).
  const initialPreview: PreviewState | null =
    typeof window !== "undefined"
      ? (() => {
          const raw = window.sessionStorage.getItem(previewKey(slug));
          if (!raw) return null;
          try {
            return JSON.parse(raw) as PreviewState;
          } catch {
            return null;
          }
        })()
      : null;

  const [phase, setPhase] = useState<Phase>(
    initialPreview ? "preview" : "intro",
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<PreviewState | null>(initialPreview);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doUnlock(attempt_id: string) {
    setPhase("unlocking");
    try {
      const res = await fetch(`/api/quiz/attempts/${attempt_id}/unlock`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`unlock failed (${res.status})`);
      window.sessionStorage.removeItem(previewKey(slug));
      router.push(`/quiz/${slug}/result?a=${attempt_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unlock error");
      setPhase("preview");
    }
  }

  // Watch for sign-in flipping true → auto-trigger unlock. doUnlock touches
  // React state, but this is the intended external→internal sync (Clerk auth
  // → server-side unlock → redirect), so the setState-in-effect rule is off.
  useEffect(() => {
    if (!isSignedIn || !preview || phase !== "preview") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void doUnlock(preview.attempt_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, preview, phase]);

  const q = questions[currentQ];
  const progress = useMemo(
    () => ({
      current: currentQ + 1,
      total: questions.length,
      pct: Math.round(((currentQ + 1) / questions.length) * 100),
    }),
    [currentQ, questions.length],
  );

  function selectChoice(choice_id: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: choice_id }));
    // Auto-advance after a tick so the visual highlight registers.
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ((n) => n + 1);
      } else {
        void submitAll({ ...answers, [q.id]: choice_id });
      }
    }, 180);
  }

  async function submitAll(finalAnswers: Record<string, string>) {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const session_id = ensureSessionId(slug);
      const payload = {
        quiz_slug: slug,
        session_id,
        answers: Object.entries(finalAnswers).map(([q_id, choice_id]) => ({
          q_id,
          choice_id,
        })),
      };
      const res = await fetch("/api/quiz/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`submit failed (${res.status})`);
      const data = (await res.json()) as PreviewState;
      setPreview(data);
      window.sessionStorage.setItem(previewKey(slug), JSON.stringify(data));
      setPhase("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- render ----------

  if (phase === "intro") {
    return (
      <>
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Quiz · {questions.length} questions
        </p>
        <h1 className="font-display-hero mt-4 text-4xl text-zinc-900 sm:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-6 text-lg text-zinc-600">{subtitle}</p>}
        {introMd && (
          <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-zinc-700">
            {introMd}
          </p>
        )}
        <p className="mt-8 font-mono text-xs text-zinc-500">
          Takes about 90 seconds. No sign-in required to see your archetype.
        </p>
        <button
          onClick={() => setPhase("playing")}
          className="mt-8 border border-zinc-900 bg-zinc-900 px-6 py-3 font-mono text-sm uppercase tracking-widest text-white transition hover:bg-zinc-700"
        >
          {ctaLabel}
        </button>
      </>
    );
  }

  if (phase === "playing" && q) {
    return (
      <>
        <div className="mb-8">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            <span>
              Question {progress.current} of {progress.total}
            </span>
            <span>{progress.pct}%</span>
          </div>
          <div className="mt-2 h-0.5 bg-zinc-100">
            <div
              className="h-full bg-zinc-900 transition-all duration-300"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-semibold leading-snug text-zinc-900 sm:text-3xl">
          {q.prompt}
        </h2>
        {q.helper_md && (
          <p className="mt-3 text-sm text-zinc-500">{q.helper_md}</p>
        )}

        <ul className="mt-8 space-y-3">
          {q.choices.map((c) => {
            const active = answers[q.id] === c.id;
            return (
              <li key={c.id}>
                <button
                  onClick={() => selectChoice(c.id)}
                  disabled={submitting}
                  className={`w-full border p-4 text-left text-base transition ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-400"
                  }`}
                >
                  {c.label}
                </button>
              </li>
            );
          })}
        </ul>

        {submitting && (
          <p className="mt-6 font-mono text-xs text-zinc-500">Scoring…</p>
        )}
        {error && (
          <p className="mt-6 font-mono text-xs text-red-600">Error: {error}</p>
        )}
      </>
    );
  }

  if (phase === "preview" || phase === "unlocking") {
    const arch =
      preview?.archetype ??
      archetypes.find((a) => a.key === preview?.archetype_key) ??
      null;

    return (
      <>
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Your archetype
        </p>
        <h1 className="font-display-hero mt-4 text-5xl text-zinc-900 sm:text-6xl">
          {arch?.name ?? "Result"}
        </h1>
        {arch?.one_line && (
          <p className="mt-6 text-lg leading-relaxed text-zinc-700">
            {arch.one_line}
          </p>
        )}

        <div className="mt-12 border border-zinc-200 bg-zinc-50 p-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            Unlock the full playbook
          </p>
          <p className="mt-3 text-base leading-relaxed text-zinc-700">
            Your full report + the {arch?.name ?? "archetype"} ebook is ready.
            Sign in with Google to unlock — takes 2 seconds. You&rsquo;ll also
            get the weekly newsletter (unsubscribe anytime).
          </p>
          <div className="mt-6">
            {phase === "unlocking" ? (
              <p className="font-mono text-xs text-zinc-500">Unlocking…</p>
            ) : (
              <SignInButton mode="modal">
                <button className="border border-zinc-900 bg-zinc-900 px-6 py-3 font-mono text-sm uppercase tracking-widest text-white transition hover:bg-zinc-700">
                  Sign in with Google to unlock
                </button>
              </SignInButton>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-6 font-mono text-xs text-red-600">Error: {error}</p>
        )}
      </>
    );
  }

  return null;
}
