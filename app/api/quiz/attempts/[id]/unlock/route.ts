import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@/lib/auth/server";
import { getAttempt, unlockAttempt } from "@/lib/quizzes";
import { subscribe } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

// POST /api/quiz/attempts/[id]/unlock
// Requires Supabase session. Sets user_id + unlocked_at on the attempt,
// auto-subscribes the signed-in email to the newsletter (source='quiz'),
// returns { ok: true, archetype_key } for the client redirect.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  }

  const { id } = await params;
  const attempt = await getAttempt(id);
  if (!attempt) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }
  if (!attempt.completed_at) {
    return NextResponse.json(
      { error: "attempt_not_completed" },
      { status: 400 },
    );
  }

  const user = await currentUser();
  const email = user?.email ?? null;
  const name = user?.name ?? null;

  // Idempotent — repeated unlocks bump updated_at only.
  const unlocked = await unlockAttempt({
    attempt_id: id,
    user_id: userId,
    user_email: email,
  });

  // Fire-and-forget subscribe. Failure never blocks the unlock.
  if (email) {
    void subscribe({
      email,
      ...(name ? { name } : {}),
      source: "quiz",
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    attempt_id: unlocked.id,
    archetype_key: unlocked.archetype_key,
  });
}
