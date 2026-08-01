import { NextRequest, NextResponse } from "next/server";
import { subscribe } from "@/lib/newsletter";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(
            (limit.resetMs - Date.now()) / 1000,
          ).toString(),
        },
      },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
    name?: unknown;
    source?: unknown;
  } | null;
  if (!body || typeof body.email !== "string" || !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    const subscriber = await subscribe({
      email: body.email,
      name: typeof body.name === "string" ? body.name : undefined,
      source: typeof body.source === "string" ? body.source : undefined,
    });
    return NextResponse.json({
      ok: true,
      status: subscriber.status,
    });
  } catch (err) {
    console.error("[newsletter.subscribe] failed:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
