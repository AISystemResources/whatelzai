import { NextResponse } from "next/server";
import { withClerkAdmin } from "@/lib/auth/withAuth";
import { createIssue, listIssues } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export const GET = withClerkAdmin(async () => {
  const issues = await listIssues(true);
  return NextResponse.json({ issues });
});

export const POST = withClerkAdmin(async (req) => {
  const body = (await req.json().catch(() => null)) as {
    slug?: unknown;
    title?: unknown;
    subtitle?: unknown;
    summary?: unknown;
    content?: unknown;
  } | null;

  if (!body || typeof body.slug !== "string" || body.slug.trim().length === 0) {
    return NextResponse.json({ error: "slug_required" }, { status: 400 });
  }
  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  }
  if (typeof body.content !== "string" || body.content.trim().length === 0) {
    return NextResponse.json({ error: "content_required" }, { status: 400 });
  }

  try {
    const issue = await createIssue({
      slug: body.slug.trim(),
      title: body.title.trim(),
      subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      content: body.content,
    });
    return NextResponse.json({ issue });
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? "insert_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
});
