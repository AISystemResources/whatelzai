import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { withClerkAdmin } from "@/lib/auth/withAuth";
import { recordAudit } from "@/lib/auth/audit";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const POST = withClerkAdmin<Context>(async (req, { params }) => {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("auth_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)
    .select("id, name")
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)
    return NextResponse.json(
      { error: "not_found_or_already_revoked" },
      { status: 404 },
    );

  const { userId } = await auth();
  const row = data as { id: string; name: string };
  void recordAudit({
    actorType: "clerk",
    actorId: userId ?? null,
    action: "tokens:revoke",
    resourceType: "auth_token",
    resourceId: row.id,
    payload: { name: row.name },
    ip: getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
});
