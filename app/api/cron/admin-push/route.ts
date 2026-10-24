import { timingSafeEqual } from "node:crypto";
import { checkRoutinePush } from "@/lib/admin-push/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    supplied.length !== expected.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  if (process.env.VERCEL_ENV !== "production")
    return Response.json(
      { error: "Production only" },
      { status: 503, headers },
    );
  try {
    return Response.json(await checkRoutinePush(), { headers });
  } catch {
    console.error(
      "Admin routine push check failed; inspect owner notification settings.",
    );
    return Response.json(
      { error: "Routine alert check needs attention" },
      { status: 503, headers },
    );
  }
}
export async function HEAD() {
  return new Response(null, { status: 405 });
}
