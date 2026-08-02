import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withClerkAdmin } from "@/lib/auth/withAuth";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { recordAudit } from "@/lib/auth/audit";
import { SAFE_DEFAULT_SCOPES } from "@/lib/auth/scopes";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

// SPRINT-107: "Rotate to Safe" — revokes an existing (typically owner or
// elevated-scope) token and immediately issues a new one carrying only
// SAFE_DEFAULT_SCOPES. Preserves the original user_id and name (with a
// -safe suffix) so audit lineage is obvious.
export const POST = withClerkAdmin<Context>(async (req, { params }) => {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  // Load the old token to inherit user_id + name, and refuse if already revoked.
  const { data: old, error: loadErr } = await supabaseAdmin
    .from("auth_tokens")
    .select("id, user_id, name, revoked_at")
    .eq("id", id)
    .maybeSingle();
  if (loadErr)
    return NextResponse.json({ error: loadErr.message }, { status: 500 });
  if (!old) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const oldRow = old as {
    id: string;
    user_id: string;
    name: string;
    revoked_at: string | null;
  };
  if (oldRow.revoked_at)
    return NextResponse.json({ error: "already_revoked" }, { status: 400 });

  const nowIso = new Date().toISOString();

  // Revoke old.
  const { error: revokeErr } = await supabaseAdmin
    .from("auth_tokens")
    .update({ revoked_at: nowIso })
    .eq("id", id);
  if (revokeErr)
    return NextResponse.json({ error: revokeErr.message }, { status: 500 });

  // Issue new — inherit user_id, tag name with -safe suffix.
  const token = generateToken();
  const safeName = oldRow.name.endsWith("-safe")
    ? oldRow.name
    : `${oldRow.name}-safe`;

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("auth_tokens")
    .insert({
      user_id: oldRow.user_id,
      token_hash: hashToken(token),
      name: safeName,
      scopes: Array.from(SAFE_DEFAULT_SCOPES),
      rate_limit_tier: "agent",
      expires_at: null,
    })
    .select("id, name, scopes, rate_limit_tier, created_at")
    .single();

  if (insertErr || !inserted)
    return NextResponse.json(
      { error: insertErr?.message ?? "insert_failed" },
      { status: 500 },
    );

  const newRow = inserted as {
    id: string;
    name: string;
    scopes: string[];
    rate_limit_tier: string;
    created_at: string;
  };

  const { userId } = await auth();
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");
  void recordAudit({
    actorType: "clerk",
    actorId: userId ?? null,
    action: "tokens:rotate",
    resourceType: "auth_token",
    resourceId: newRow.id,
    payload: {
      revoked_token_id: oldRow.id,
      revoked_token_name: oldRow.name,
      new_token_name: safeName,
      new_scopes: newRow.scopes,
    },
    ip,
    userAgent,
  });

  return NextResponse.json({
    ok: true,
    revoked_token_id: oldRow.id,
    new_token: {
      id: newRow.id,
      name: newRow.name,
      scopes: newRow.scopes,
      rate_limit_tier: newRow.rate_limit_tier,
      created_at: newRow.created_at,
      token, // raw token — shown ONCE
    },
  });
});
