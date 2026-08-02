import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { ensureUserRow, isAdminRole, type AppUser } from "@/lib/users";
import { ALL_SCOPES, OWNER_SCOPE } from "@/lib/auth/scopes";

// whatelz.ai is single-operator: only Edmund (admin role on Clerk) ever
// authorizes an MCP client. So instead of asking him to paste his own
// server-side token, we gate this page behind Clerk auth and expose a
// single "Authorize" button. Click → server signs an OAuth code binding
// the challenge to the authorising user; token exchange issues a fresh
// per-login auth_token (see /api/oauth/token).
//
// SPRINT-106: `scope` param (RFC 6749 §3.3, space-separated) narrows what
// the issued token can do. Omit → issues owner-scope ['*'] (backwards
// compat with whatelz login). Client asks; server can only issue scopes
// that exist in the catalog (unknown scopes get filtered out silently
// per spec §3.3 wording).

function sign(secret: string, payload: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
    .slice(0, 32);
}

interface AuthorizeParams {
  redirect_uri: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string; // space-separated
}

const VALID_SCOPE_SET = new Set<string>([OWNER_SCOPE, ...ALL_SCOPES]);

// Also accept `resource:*` wildcards even though they're not in ALL_SCOPES
// individually — e.g. `newsletter:*`. Regex checks the shape.
const WILDCARD_SCOPE_RE = /^[a-z]+:\*$/;

function filterKnownScopes(requested: string): string[] {
  return requested
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => VALID_SCOPE_SET.has(s) || WILDCARD_SCOPE_RE.test(s));
}

function page(body: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connect to Claude — whatelz.ai</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fafafa; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 2rem; width: 100%; max-width: 480px; }
    .logo { font-family: monospace; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem; }
    h1 { font-size: 1.4rem; font-weight: 600; color: #09090b; margin-bottom: 0.5rem; }
    p  { font-size: 0.875rem; color: #52525b; margin-bottom: 1.25rem; line-height: 1.55; }
    .signed { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; border: 1px solid #e4e4e7; border-radius: 6px; padding: 0.625rem 0.75rem; margin-bottom: 1rem; }
    .signed-label { font-family: monospace; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #a1a1aa; }
    .signed-email { font-size: 0.875rem; color: #09090b; font-weight: 500; word-break: break-all; text-align: right; }
    button, .btn { display: block; width: 100%; background: #09090b; color: white; border: none; border-radius: 6px; padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; text-align: center; text-decoration: none; transition: opacity 0.15s; }
    button:hover, .btn:hover { opacity: 0.85; }
    .btn-secondary { background: white; color: #09090b; border: 1px solid #e4e4e7; margin-top: 0.5rem; }
    .warn { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; border-radius: 6px; padding: 0.625rem 0.75rem; font-size: 0.8125rem; margin-bottom: 1rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; padding: 0.625rem 0.75rem; font-size: 0.8125rem; margin-bottom: 1rem; }
    .scopes { border: 1px solid #e4e4e7; border-radius: 6px; padding: 0.75rem; margin-bottom: 1.25rem; }
    .scopes-label { font-family: monospace; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 0.5rem; }
    .scope-chip { display: inline-block; font-family: monospace; font-size: 0.75rem; color: #27272a; background: #f4f4f5; border: 1px solid #e4e4e7; padding: 0.125rem 0.5rem; margin: 0.125rem; border-radius: 4px; }
    .scope-owner { background: #fef3c7; border-color: #fde68a; color: #78350f; }
  </style>
</head>
<body>
  <div class="card">
    <p class="logo">whatelz.ai</p>
    ${body}
  </div>
</body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}

function signInPage(currentUrl: string): NextResponse {
  const signIn = `/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`;
  return page(`
    <h1>Connect to Claude</h1>
    <p>Sign in to whatelz.ai first — the connector is authorized against your admin account.</p>
    <a class="btn" href="${signIn}">Sign in to continue</a>
  `);
}

function unauthorizedPage(): NextResponse {
  return page(`
    <h1>Not authorized</h1>
    <p>Your account isn't allowed to connect an MCP client to whatelz.ai. Only the site admin can authorize connectors.</p>
  `);
}

function scopeChipsHtml(scopes: string[]): string {
  if (scopes.length === 0) {
    return `<span class="scope-chip scope-owner">${OWNER_SCOPE}</span>
        <p style="font-size: 0.75rem; color: #a1a1aa; margin-top: 0.5rem;">Owner — full access to every tool.</p>`;
  }
  return scopes.map((s) => `<span class="scope-chip">${s}</span>`).join("");
}

function consentPage(
  p: AuthorizeParams,
  email: string,
  requestedScopes: string[],
  error: boolean,
): NextResponse {
  const description =
    requestedScopes.length === 0
      ? "Grant this Claude workspace full owner access to your whatelz tools — testimonials, offers, hackathons, dashboard cards, website docs, newsletter, and services."
      : "Grant this Claude workspace narrow, scoped access — only the tools listed below.";

  return page(`
    <h1>Connect Claude to whatelz.ai</h1>
    <p>${description}</p>
    ${error ? `<div class="error">Something went wrong signing the connection. Try again.</div>` : ""}
    <div class="signed">
      <span class="signed-label">Signed in as</span>
      <span class="signed-email">${email || "admin"}</span>
    </div>
    <div class="scopes">
      <div class="scopes-label">Requested scopes</div>
      ${scopeChipsHtml(requestedScopes)}
    </div>
    <form method="POST" action="/api/oauth/authorize">
      <input type="hidden" name="redirect_uri"          value="${p.redirect_uri}" />
      <input type="hidden" name="state"                 value="${p.state}" />
      <input type="hidden" name="code_challenge"        value="${p.code_challenge}" />
      <input type="hidden" name="code_challenge_method" value="${p.code_challenge_method}" />
      <input type="hidden" name="scope"                 value="${p.scope}" />
      <button type="submit">Authorize Claude</button>
    </form>
  `);
}

function missingConfigPage(): NextResponse {
  return page(`
    <h1>OAuth not configured</h1>
    <p>No <code>oauth_code_secret</code> row is present in <code>system_config</code>. This should have been created by the SPRINT-100 migration — check that it ran.</p>
  `);
}

async function getOauthCodeSecret(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("system_config")
    .select("value")
    .eq("key", "oauth_code_secret")
    .single();
  return data?.value ?? null;
}

async function requireAdmin(): Promise<
  | { ok: true; user: AppUser }
  | { ok: false; reason: "unauthenticated" | "not-admin" }
> {
  const { userId } = await auth();
  if (!userId) return { ok: false, reason: "unauthenticated" };
  const user = await ensureUserRow();
  if (!user || !isAdminRole(user.role))
    return { ok: false, reason: "not-admin" };
  return { ok: true, user };
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const scopeRaw = u.searchParams.get("scope") ?? "";
  const params: AuthorizeParams = {
    redirect_uri: u.searchParams.get("redirect_uri") ?? "",
    state: u.searchParams.get("state") ?? "",
    code_challenge: u.searchParams.get("code_challenge") ?? "",
    code_challenge_method: u.searchParams.get("code_challenge_method") ?? "",
    scope: scopeRaw,
  };

  const gate = await requireAdmin();
  if (!gate.ok) {
    if (gate.reason === "unauthenticated") return signInPage(req.url);
    return unauthorizedPage();
  }

  const secret = await getOauthCodeSecret();
  if (!secret) return missingConfigPage();

  const known = filterKnownScopes(scopeRaw);
  return consentPage(
    params,
    gate.user.email,
    known,
    u.searchParams.has("error"),
  );
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    if (gate.reason === "unauthenticated") return signInPage(req.url);
    return unauthorizedPage();
  }

  const form = await req.formData();
  const redirect_uri = String(form.get("redirect_uri") ?? "");
  const state = String(form.get("state") ?? "");
  const code_challenge = String(form.get("code_challenge") ?? "");
  const code_challenge_method = String(form.get("code_challenge_method") ?? "");
  const scopeRaw = String(form.get("scope") ?? "");

  if (!redirect_uri)
    return new NextResponse("Missing redirect_uri", { status: 400 });

  const secret = await getOauthCodeSecret();
  if (!secret) return missingConfigPage();

  // Filter unknown scopes silently (RFC 6749 §3.3 permits this). If the
  // client asked for nothing recognisable, fall back to owner scope so
  // whatelz login (no scope param) keeps working.
  const filteredScopes = filterKnownScopes(scopeRaw);
  const scopesForCode =
    filteredScopes.length > 0 ? filteredScopes.join(" ") : "";

  const now = Math.floor(Date.now() / 1000);
  // Payload segments:
  //   challenge . method . iat . user_id . scope_b64 (optional)
  // 4-segment payloads (no scope) are still accepted by /token for
  // backwards compat with pre-SPRINT-106 clients.
  const scopeSegment =
    scopesForCode.length > 0
      ? "." + Buffer.from(scopesForCode).toString("base64url")
      : "";
  const payload = `${code_challenge}.${code_challenge_method}.${now}.${gate.user.id}${scopeSegment}`;
  const code = `${Buffer.from(payload).toString("base64url")}.${sign(secret, payload)}`;

  const redirect = new URL(redirect_uri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);
  return NextResponse.redirect(redirect.toString(), { status: 303 });
}
