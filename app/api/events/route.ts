import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logEvent } from "@/lib/event-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Body {
  event_type?: unknown;
  session_id?: unknown;
  payload?: unknown;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const event_type =
    typeof body.event_type === "string" ? body.event_type : null;
  if (!event_type) {
    return NextResponse.json(
      { ok: false, error: "event_type required" },
      { status: 400 },
    );
  }

  const session_id =
    typeof body.session_id === "string" && body.session_id.length > 0
      ? body.session_id
      : null;

  const payload =
    body.payload &&
    typeof body.payload === "object" &&
    !Array.isArray(body.payload)
      ? (body.payload as Record<string, unknown>)
      : {};

  const { userId } = await auth();

  await logEvent({
    event_type,
    session_id,
    user_id: userId ?? null,
    source: "client",
    payload,
    user_agent: req.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
