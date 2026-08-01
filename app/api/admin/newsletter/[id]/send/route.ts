import { NextResponse } from "next/server";
import { withClerkAdmin } from "@/lib/auth/withAuth";
import { sendIssue } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const POST = withClerkAdmin<Context>(async (_req, { params }) => {
  const { id } = await params;
  try {
    const result = await sendIssue(id);
    return NextResponse.json({
      ok: true,
      sent: result.sent,
      skipped: result.skipped,
      issue: result.issue,
    });
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? "send_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
});
