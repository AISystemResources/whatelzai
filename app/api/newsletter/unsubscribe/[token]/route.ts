import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

function page(body: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribe — What ELZ This Week?</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fafafa; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; color: #27272a; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 2rem; width: 100%; max-width: 440px; text-align: center; }
    .logo { font-family: monospace; font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase; color: #71717a; margin-bottom: 1.5rem; }
    h1 { font-size: 1.4rem; font-weight: 600; color: #09090b; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: #52525b; margin-bottom: 1.25rem; line-height: 1.55; }
    a { color: #09090b; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <p class="logo">What ELZ This Week?</p>
    ${body}
  </div>
</body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}

// Support both GET (email link click) and POST (List-Unsubscribe one-click).
async function handle(context: Context): Promise<NextResponse> {
  const { token } = await context.params;
  const result = await unsubscribeByToken(token);
  if (!result.ok) {
    return page(`
      <h1>Link no longer valid</h1>
      <p>This unsubscribe link is invalid or expired. If you're still receiving emails, reply to any issue and I'll remove you manually.</p>
      <p><a href="https://whatelz.ai/this-week">Return to What ELZ This Week?</a></p>
    `);
  }
  return page(`
    <h1>You're unsubscribed</h1>
    <p>${result.email} has been removed from the list. No more weekly emails.</p>
    <p>Changed your mind? <a href="https://whatelz.ai/this-week">Resubscribe here</a>.</p>
  `);
}

export async function GET(_req: NextRequest, context: Context) {
  return handle(context);
}

export async function POST(_req: NextRequest, context: Context) {
  return handle(context);
}
