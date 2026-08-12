import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";

export interface Quiz {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  intro_md: string | null;
  cta_label: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  sort_order: number;
  prompt: string;
  helper_md: string | null;
  question_type: string;
}

export interface QuizChoice {
  id: string;
  question_id: string;
  sort_order: number;
  label: string;
  archetype_weights: Record<string, number>;
}

export interface QuizArchetype {
  id: string;
  quiz_id: string;
  key: string;
  name: string;
  sort_order: number;
  one_line: string;
  full_report_md: string | null;
  ebook_url: string | null;
  ebook_label: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  session_id: string | null;
  answers: Array<{ q_id: string; choice_id: string }>;
  scores: Record<string, number>;
  archetype_key: string | null;
  clerk_user_id: string | null;
  clerk_user_email: string | null;
  started_at: string;
  completed_at: string | null;
  unlocked_at: string | null;
}

export interface QuizWithContent {
  quiz: Quiz;
  questions: Array<QuizQuestion & { choices: QuizChoice[] }>;
  archetypes: QuizArchetype[];
}

export const getQuizBySlug = cache(
  async (slug: string): Promise<QuizWithContent | null> => {
    const { data: quiz } = await supabaseAdmin
      .from("quizzes")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (!quiz) return null;

    const [{ data: questions }, { data: choices }, { data: archetypes }] =
      await Promise.all([
        supabaseAdmin
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", quiz.id)
          .order("sort_order"),
        supabaseAdmin
          .from("quiz_choices")
          .select("*")
          .in(
            "question_id",
            (
              await supabaseAdmin
                .from("quiz_questions")
                .select("id")
                .eq("quiz_id", quiz.id)
            ).data?.map((q) => q.id) ?? [],
          )
          .order("sort_order"),
        supabaseAdmin
          .from("quiz_archetypes")
          .select("*")
          .eq("quiz_id", quiz.id)
          .order("sort_order"),
      ]);

    const choicesByQ = new Map<string, QuizChoice[]>();
    for (const c of (choices ?? []) as QuizChoice[]) {
      const arr = choicesByQ.get(c.question_id) ?? [];
      arr.push(c);
      choicesByQ.set(c.question_id, arr);
    }

    const qWithChoices = ((questions ?? []) as QuizQuestion[]).map((q) => ({
      ...q,
      choices: choicesByQ.get(q.id) ?? [],
    }));

    return {
      quiz: quiz as Quiz,
      questions: qWithChoices,
      archetypes: (archetypes ?? []) as QuizArchetype[],
    };
  },
);

export async function listQuizzes(publishedOnly = true): Promise<Quiz[]> {
  const q = supabaseAdmin.from("quizzes").select("*").order("created_at");
  const { data } = publishedOnly ? await q.eq("published", true) : await q;
  return (data ?? []) as Quiz[];
}

// Scoring — sum archetype_weights across all chosen options.
// Tie-breaker: lowest sort_order on quiz_archetypes wins (declared order).
export function scoreAttempt(
  answers: Array<{ q_id: string; choice_id: string }>,
  choices: QuizChoice[],
  archetypes: QuizArchetype[],
): { scores: Record<string, number>; winner: string | null } {
  const scores: Record<string, number> = {};
  for (const a of answers) {
    const c = choices.find((x) => x.id === a.choice_id);
    if (!c) continue;
    for (const [k, v] of Object.entries(c.archetype_weights ?? {})) {
      scores[k] = (scores[k] ?? 0) + v;
    }
  }
  if (archetypes.length === 0) return { scores, winner: null };
  // Find highest score; break tie by archetype sort_order.
  let winner: string | null = null;
  let bestScore = -Infinity;
  let bestOrder = Infinity;
  for (const a of archetypes) {
    const s = scores[a.key] ?? 0;
    if (s > bestScore || (s === bestScore && a.sort_order < bestOrder)) {
      winner = a.key;
      bestScore = s;
      bestOrder = a.sort_order;
    }
  }
  return { scores, winner };
}

export async function createAttempt(input: {
  quiz_id: string;
  session_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}): Promise<QuizAttempt> {
  const { data, error } = await supabaseAdmin
    .from("quiz_attempts")
    .insert({
      quiz_id: input.quiz_id,
      session_id: input.session_id ?? null,
      ip: input.ip ?? null,
      user_agent: input.user_agent ?? null,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "createAttempt failed");
  return data as QuizAttempt;
}

export async function completeAttempt(input: {
  attempt_id: string;
  answers: Array<{ q_id: string; choice_id: string }>;
  scores: Record<string, number>;
  archetype_key: string;
}): Promise<QuizAttempt> {
  const { data, error } = await supabaseAdmin
    .from("quiz_attempts")
    .update({
      answers: input.answers,
      scores: input.scores,
      archetype_key: input.archetype_key,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.attempt_id)
    .select()
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "completeAttempt failed");
  return data as QuizAttempt;
}

export async function unlockAttempt(input: {
  attempt_id: string;
  clerk_user_id: string;
  clerk_user_email: string | null;
}): Promise<QuizAttempt> {
  // Idempotent: setting unlocked_at again is a no-op except for updated_at.
  const { data, error } = await supabaseAdmin
    .from("quiz_attempts")
    .update({
      clerk_user_id: input.clerk_user_id,
      clerk_user_email: input.clerk_user_email,
      unlocked_at: new Date().toISOString(),
    })
    .eq("id", input.attempt_id)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "unlockAttempt failed");
  return data as QuizAttempt;
}

export async function getAttempt(id: string): Promise<QuizAttempt | null> {
  const { data } = await supabaseAdmin
    .from("quiz_attempts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as QuizAttempt) ?? null;
}

export async function getArchetype(
  quiz_id: string,
  key: string,
): Promise<QuizArchetype | null> {
  const { data } = await supabaseAdmin
    .from("quiz_archetypes")
    .select("*")
    .eq("quiz_id", quiz_id)
    .eq("key", key)
    .maybeSingle();
  return (data as QuizArchetype) ?? null;
}

// -------- MCP write verbs (admin/token surface) --------

export async function quizCreate(input: {
  slug: string;
  title: string;
  subtitle?: string | null;
  intro_md?: string | null;
  published?: boolean;
}): Promise<Quiz> {
  const { data, error } = await supabaseAdmin
    .from("quizzes")
    .insert({
      slug: input.slug,
      title: input.title,
      subtitle: input.subtitle ?? null,
      intro_md: input.intro_md ?? null,
      published: input.published ?? false,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "quizCreate failed");
  return data as Quiz;
}

export async function quizUpdate(input: {
  slug: string;
  title?: string;
  subtitle?: string | null;
  intro_md?: string | null;
  cta_label?: string;
  published?: boolean;
}): Promise<Quiz> {
  const { slug, ...rest } = input;
  const { data, error } = await supabaseAdmin
    .from("quizzes")
    .update(rest)
    .eq("slug", slug)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "quizUpdate failed");
  return data as Quiz;
}

export async function questionCreate(input: {
  quiz_slug: string;
  sort_order: number;
  prompt: string;
  helper_md?: string | null;
}): Promise<QuizQuestion> {
  const { data: quiz } = await supabaseAdmin
    .from("quizzes")
    .select("id")
    .eq("slug", input.quiz_slug)
    .single();
  if (!quiz) throw new Error(`quiz not found: ${input.quiz_slug}`);
  const { data, error } = await supabaseAdmin
    .from("quiz_questions")
    .insert({
      quiz_id: quiz.id,
      sort_order: input.sort_order,
      prompt: input.prompt,
      helper_md: input.helper_md ?? null,
    })
    .select()
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "questionCreate failed");
  return data as QuizQuestion;
}

export async function questionUpdate(input: {
  id: string;
  sort_order?: number;
  prompt?: string;
  helper_md?: string | null;
}): Promise<QuizQuestion> {
  const { id, ...rest } = input;
  const { data, error } = await supabaseAdmin
    .from("quiz_questions")
    .update(rest)
    .eq("id", id)
    .select()
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "questionUpdate failed");
  return data as QuizQuestion;
}

export async function questionDelete(id: string): Promise<{ ok: true }> {
  const { error } = await supabaseAdmin
    .from("quiz_questions")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function choiceCreate(input: {
  question_id: string;
  sort_order: number;
  label: string;
  archetype_weights: Record<string, number>;
}): Promise<QuizChoice> {
  const { data, error } = await supabaseAdmin
    .from("quiz_choices")
    .insert(input)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "choiceCreate failed");
  return data as QuizChoice;
}

export async function choiceUpdate(input: {
  id: string;
  sort_order?: number;
  label?: string;
  archetype_weights?: Record<string, number>;
}): Promise<QuizChoice> {
  const { id, ...rest } = input;
  const { data, error } = await supabaseAdmin
    .from("quiz_choices")
    .update(rest)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "choiceUpdate failed");
  return data as QuizChoice;
}

export async function choiceDelete(id: string): Promise<{ ok: true }> {
  const { error } = await supabaseAdmin
    .from("quiz_choices")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function archetypeUpsert(input: {
  quiz_slug: string;
  key: string;
  name: string;
  sort_order?: number;
  one_line: string;
  full_report_md?: string | null;
  ebook_url?: string | null;
  ebook_label?: string;
}): Promise<QuizArchetype> {
  const { data: quiz } = await supabaseAdmin
    .from("quizzes")
    .select("id")
    .eq("slug", input.quiz_slug)
    .single();
  if (!quiz) throw new Error(`quiz not found: ${input.quiz_slug}`);
  const payload = {
    quiz_id: quiz.id,
    key: input.key,
    name: input.name,
    sort_order: input.sort_order ?? 0,
    one_line: input.one_line,
    full_report_md: input.full_report_md ?? null,
    ebook_url: input.ebook_url ?? null,
    ebook_label: input.ebook_label ?? "Click here to access this ebook",
  };
  const { data, error } = await supabaseAdmin
    .from("quiz_archetypes")
    .upsert(payload, { onConflict: "quiz_id,key" })
    .select()
    .single();
  if (error || !data)
    throw new Error(error?.message ?? "archetypeUpsert failed");
  return data as QuizArchetype;
}

export async function listAttempts(input: {
  quiz_slug?: string;
  limit?: number;
}): Promise<QuizAttempt[]> {
  let q = supabaseAdmin
    .from("quiz_attempts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 100);
  if (input.quiz_slug) {
    const { data: quiz } = await supabaseAdmin
      .from("quizzes")
      .select("id")
      .eq("slug", input.quiz_slug)
      .single();
    if (!quiz) return [];
    q = q.eq("quiz_id", quiz.id);
  }
  const { data } = await q;
  return (data ?? []) as QuizAttempt[];
}

export async function attemptStats(quiz_slug: string): Promise<{
  started: number;
  completed: number;
  unlocked: number;
  by_archetype: Record<string, number>;
}> {
  const { data: quiz } = await supabaseAdmin
    .from("quizzes")
    .select("id")
    .eq("slug", quiz_slug)
    .single();
  if (!quiz) return { started: 0, completed: 0, unlocked: 0, by_archetype: {} };
  const { data } = await supabaseAdmin
    .from("quiz_attempts")
    .select("archetype_key,completed_at,unlocked_at")
    .eq("quiz_id", quiz.id);
  const rows = (data ?? []) as Array<{
    archetype_key: string | null;
    completed_at: string | null;
    unlocked_at: string | null;
  }>;
  const by_archetype: Record<string, number> = {};
  let completed = 0;
  let unlocked = 0;
  for (const r of rows) {
    if (r.completed_at) completed++;
    if (r.unlocked_at) unlocked++;
    if (r.archetype_key)
      by_archetype[r.archetype_key] = (by_archetype[r.archetype_key] ?? 0) + 1;
  }
  return { started: rows.length, completed, unlocked, by_archetype };
}
