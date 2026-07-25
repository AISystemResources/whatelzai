import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { ensureUserRow, isAdminRole } from "@/lib/users";

// whatelz.ai is single-operator: only Edmund (admin role on Clerk) ever
// authorizes an MCP client. So instead of asking him to paste his own
// server-side token, we gate this page behind Clerk auth and expose a
// single "Authorize" button. Click → server pulls the mcp_token from
// Supabase, signs the OAuth code, redirects back to the Claude client.

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
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 2rem; width: 100%; max-width: 440px; }
    .logo { font-family: monospace; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem; }
    h1 { font-size: 1.4rem; font-weight: 600; color: #09090b; margin-bottom: 0.5rem; }
    p  { font-size: 0.875rem; color: #52525b; margin-bottom: 1.25rem; line-height: 1.55; }
    .signed { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; border: 1px solid #e4e4e7; border-radius: 6px; padding: 0.625rem 0.75rem; margin-bottom: 1.25rem; }
    .signed-label { font-family: monospace; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #a1a1aa; }
    .signed-email { font-size: 0.875rem; color: #09090b; font-weight: 500; word-break: break-all; text-align: right; }
    button, .btn { display: block; width: 100%; background: #09090b; color: white; border: none; border-radius: 6px; padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; text-align: center; text-decoration: none; transition: opacity 0.15s; }
    button:hover, .btn:hover { opacity: 0.85; }
    .btn-secondary { background: white; color: #09090b; border: 1px solid #e4e4e7; margin-top: 0.5rem; }
    .warn { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; border-radius: 6px; padding: 0.625rem 0.75rem; font-size: 0.8125rem; margin-bottom: 1rem; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; padding: 0.625rem 0.75rem; font-size: 0.8125rem; margin-bottom: 1rem; }
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

function consentPage(
  p: AuthorizeParams,
  email: string,
  error: boolean,
): NextResponse {
  return page(`
    <h1>Connect Claude to whatelz.ai</h1>
    <p>Grant this Claude workspace read/write access to your whatelz tools — testimonials, offers, hackathons, dashboard cards, and website docs.</p>
    ${error ? `<div class="error">Something went wrong signing the connection. Try again.</div>` : ""}
    <div class="signed">
      <span class="signed-label">Signed in as</span>
      <span class="signed-email">${email || "admin"}</span>
    </div>
    <form method="POST" action="/api/oauth/authorize">
      <input type="hidden" name="redirect_uri"          value="${p.redirect_uri}" />
      <input type="hidden" name="state"                 value="${p.state}" />
      <input type="hidden" name="code_challenge"        value="${p.code_challenge}" />
      <input type="hidden" name="code_challenge_method" value="${p.code_challenge_method}" />
      <button type="submit">Authorize Claude</button>
    </form>
  `);
}

function missingConfigPage(): NextResponse {
  return page(`
    <h1>MCP not configured</h1>
    <p>No <code>mcp_token</code> row is present in <code>system_config</code>. Set one from <a href="/admin/developer">/admin/developer</a> before connecting a client.</p>
  `);
}

async function getMcpToken(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("system_config")
    .select("value")
    .eq("key", "mcp_token")
    .single();
  return data?.value ?? null;
}

async function requireAdmin(): Promise<
  | { ok: true; email: string }
  | { ok: false; reason: "unauthenticated" | "not-admin" }
> {
  const { userId } = await auth();
  if (!userId) return { ok: false, reason: "unauthenticated" };
  const user = await ensureUserRow();
  if (!user || !isAdminRole(user.role))
    return { ok: false, reason: "not-admin" };
  return { ok: true, email: user.email ?? "" };
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const params: AuthorizeParams = {
    redirect_uri: u.searchParams.get("redirect_uri") ?? "",
    state: u.searchParams.get("state") ?? "",
    code_challenge: u.searchParams.get("code_challenge") ?? "",
    code_challenge_method: u.searchParams.get("code_challenge_method") ?? "",
  };

  const gate = await requireAdmin();
  if (!gate.ok) {
    if (gate.reason === "unauthenticated") return signInPage(req.url);
    return unauthorizedPage();
  }

  const token = await getMcpToken();
  if (!token) return missingConfigPage();

  return consentPage(params, gate.email, u.searchParams.has("error"));
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

  if (!redirect_uri)
    return new NextResponse("Missing redirect_uri", { status: 400 });

  const token = await getMcpToken();
  if (!token) return missingConfigPage();

  const now = Math.floor(Date.now() / 1000);
  const payload = `${code_challenge}.${code_challenge_method}.${now}`;
  const code = `${Buffer.from(payload).toString("base64url")}.${sign(token, payload)}`;

  const redirect = new URL(redirect_uri);
  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);
  return NextResponse.redirect(redirect.toString(), { status: 303 });
}
