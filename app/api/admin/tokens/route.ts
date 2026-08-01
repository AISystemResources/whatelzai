import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withClerkAdmin } from "@/lib/auth/withAuth";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { ALL_SCOPES, OWNER_SCOPE } from "@/lib/auth/scopes";
import { recordAudit } from "@/lib/auth/audit";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getClientIp } from "@/lib/rate-limit";
import type { RateLimitTier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const VALID_TIERS: readonly RateLimitTier[] = ["default", "agent", "owner"];

function isValidScope(scope: string): boolean {
  return (
    scope === OWNER_SCOPE ||
    ALL_SCOPES.includes(scope) ||
    /^[a-z]+:\*$/.test(scope)
  );
}

export const GET = withClerkAdmin(async () => {
  const { data, error } = await supabaseAdmin
    .from("auth_tokens")
    .select(
      "id, name, scopes, rate_limit_tier, expires_at, last_used_at, created_at, revoked_at",
    )
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tokens: data ?? [] });
});

export const POST = withClerkAdmin(async (req: Request) => {
  const body = (await req.json().catch(() => null)) as {
    name?: unknown;
    scopes?: unknown;
    rate_limit_tier?: unknown;
    expires_at?: unknown;
  } | null;

  if (!body || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
    return NextResponse.json({ error: "scopes_required" }, { status: 400 });
  }

  const scopes = body.scopes.filter((s): s is string => typeof s === "string");
  if (scopes.length === 0 || !scopes.every(isValidScope)) {
    return NextResponse.json({ error: "invalid_scope" }, { status: 400 });
  }

  const tier: RateLimitTier =
    typeof body.rate_limit_tier === "string" &&
    (VALID_TIERS as readonly string[]).includes(body.rate_limit_tier)
      ? (body.rate_limit_tier as RateLimitTier)
      : "default";

  const expiresAt =
    typeof body.expires_at === "string" && body.expires_at.length > 0
      ? new Date(body.expires_at).toISOString()
      : null;

  const { userId } = await auth();
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId!)
    .single();
  if (!userRow) {
    return NextResponse.json({ error: "user_not_found" }, { status: 500 });
  }

  const token = generateToken();
  const { data: inserted, error } = await supabaseAdmin
    .from("auth_tokens")
    .insert({
      user_id: (userRow as { id: string }).id,
      token_hash: hashToken(token),
      name: body.name.trim(),
      scopes,
      rate_limit_tier: tier,
      expires_at: expiresAt,
    })
    .select("id, name, scopes, rate_limit_tier, expires_at, created_at")
    .single();

  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "insert_failed" },
      { status: 500 },
    );
  }

  const row = inserted as {
    id: string;
    name: string;
    scopes: string[];
    rate_limit_tier: RateLimitTier;
    expires_at: string | null;
    created_at: string;
  };

  void recordAudit({
    actorType: "clerk",
    actorId: userId!,
    action: "tokens:issue",
    resourceType: "auth_token",
    resourceId: row.id,
    payload: { name: row.name, scopes: row.scopes, tier: row.rate_limit_tier },
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return NextResponse.json({ ...row, token });
});
