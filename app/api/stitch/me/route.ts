import { NextResponse, type NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stitchOrphansToUser } from "@/lib/entitlements";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/stitch/me — call after a Clerk sign-in/sign-up completes to bind
// pre-signup state (orphan entitlements matched by email, and optionally a
// specific quiz attempt id from the browser session) to the newly-signed-in
// Clerk user. Idempotent — a no-op when there's nothing to bind.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401 },
    );
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  const body = await req.json().catch(() => ({}));
  const attemptId =
    typeof (body as { attempt_id?: unknown })?.attempt_id === "string"
      ? (body as { attempt_id: string }).attempt_id
      : null;

  let entitlementsBound = 0;
  if (email) {
    try {
      entitlementsBound = await stitchOrphansToUser(userId, email);
    } catch {
      // Non-fatal; report 0.
    }
  }

  let quizBound = 0;
  if (attemptId) {
    const { data } = await supabaseAdmin
      .from("quiz_attempts")
      .update({ clerk_user_id: userId })
      .eq("id", attemptId)
      .is("clerk_user_id", null)
      .select("id");
    quizBound = data?.length ?? 0;
  }

  return NextResponse.json({
    ok: true,
    entitlements_bound: entitlementsBound,
    quiz_attempts_bound: quizBound,
  });
}
