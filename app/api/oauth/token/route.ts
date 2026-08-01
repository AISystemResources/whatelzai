import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { recordAudit } from "@/lib/auth/audit";
import { getClientIp } from "@/lib/rate-limit";

// Token TTL — 1 year on the wire (informational for the client). Tokens
// are persisted with expires_at = null so they don't hard-expire; revoke
// manually via /admin/tokens if compromised.
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 365;

async function getOauthCodeSecret(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("system_config")
    .select("value")
    .eq("key", "oauth_code_secret")
    .single();
  return data?.value ?? null;
}

function sign(secret: string, payload: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
    .slice(0, 32);
}

function s256(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function POST(req: NextRequest) {
  const secret = await getOauthCodeSecret();
  if (!secret)
    return NextResponse.json({ error: "server_error" }, { status: 500 });

  const form = await req.formData();
  const code = String(form.get("code") ?? "");
  const code_verifier = String(form.get("code_verifier") ?? "");

  const [payloadB64, sig] = code.split(".");
  if (!payloadB64 || !sig)
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });

  const payload = Buffer.from(payloadB64, "base64url").toString();
  if (sign(secret, payload) !== sig)
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });

  const [challenge, method, issuedAt, userId] = payload.split(".");
  if (Number(issuedAt) < Math.floor(Date.now() / 1000) - 600)
    return NextResponse.json(
      { error: "invalid_grant", reason: "expired" },
      { status: 400 },
    );

  if (method !== "S256" || s256(code_verifier) !== challenge)
    return NextResponse.json(
      { error: "invalid_grant", reason: "pkce_mismatch" },
      { status: 400 },
    );

  if (!userId)
    return NextResponse.json(
      { error: "invalid_grant", reason: "no_user_bound" },
      { status: 400 },
    );

  // Verify the bound user still exists and is an admin. Guards against
  // a code minted for a user that was later demoted or deleted.
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!userRow || (userRow.role !== "admin" && userRow.role !== "superadmin"))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Issue a fresh, revocable, per-login auth_token with owner scope.
  const token = generateToken();
  const now = new Date().toISOString();
  const name = `oauth-${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(3).toString("hex")}`;

  const { data: inserted, error } = await supabaseAdmin
    .from("auth_tokens")
    .insert({
      user_id: userId,
      token_hash: hashToken(token),
      name,
      scopes: ["*"],
      rate_limit_tier: "owner",
      expires_at: null,
    })
    .select("id")
    .single();

  if (error || !inserted)
    return NextResponse.json(
      { error: "server_error", reason: error?.message ?? "insert_failed" },
      { status: 500 },
    );

  void recordAudit({
    tokenId: (inserted as { id: string }).id,
    actorType: "token",
    actorId: (inserted as { id: string }).id,
    action: "tokens:issue:oauth",
    resourceType: "auth_token",
    resourceId: (inserted as { id: string }).id,
    payload: { name, via: "oauth", issued_at: now },
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return NextResponse.json(
    {
      access_token: token,
      token_type: "Bearer",
      expires_in: TOKEN_TTL_SECONDS,
    },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
