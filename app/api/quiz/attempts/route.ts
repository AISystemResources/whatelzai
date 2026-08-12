import { NextRequest, NextResponse } from "next/server";
import {
  createAttempt,
  completeAttempt,
  scoreAttempt,
  getQuizBySlug,
} from "@/lib/quizzes";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// POST /api/quiz/attempts
// Body: { quiz_slug, session_id, answers: [{q_id, choice_id}] }
// If answers is empty → creates a fresh attempt (started).
// If answers is populated → creates + immediately completes with scoring.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: {
    quiz_slug?: unknown;
    session_id?: unknown;
    answers?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const quiz_slug = typeof body.quiz_slug === "string" ? body.quiz_slug : null;
  if (!quiz_slug) {
    return NextResponse.json({ error: "quiz_slug required" }, { status: 400 });
  }

  const quiz = await getQuizBySlug(quiz_slug);
  if (!quiz) {
    return NextResponse.json({ error: "quiz_not_found" }, { status: 404 });
  }

  const session_id =
    typeof body.session_id === "string" ? body.session_id : null;
  const user_agent = req.headers.get("user-agent") ?? null;

  const attempt = await createAttempt({
    quiz_id: quiz.quiz.id,
    session_id,
    ip,
    user_agent,
  });

  // If answers included, score + complete in the same call.
  const answers = Array.isArray(body.answers)
    ? (body.answers as Array<{ q_id: string; choice_id: string }>)
    : [];
  if (answers.length === 0) {
    return NextResponse.json({ attempt_id: attempt.id, archetype: null });
  }

  const allChoices = quiz.questions.flatMap((q) => q.choices);
  const { scores, winner } = scoreAttempt(answers, allChoices, quiz.archetypes);
  if (!winner) {
    return NextResponse.json({ error: "unable_to_score" }, { status: 500 });
  }

  const completed = await completeAttempt({
    attempt_id: attempt.id,
    answers,
    scores,
    archetype_key: winner,
  });

  const archetype = quiz.archetypes.find((a) => a.key === winner) ?? null;

  return NextResponse.json({
    attempt_id: completed.id,
    archetype_key: winner,
    archetype: archetype
      ? {
          key: archetype.key,
          name: archetype.name,
          one_line: archetype.one_line,
        }
      : null,
  });
}
