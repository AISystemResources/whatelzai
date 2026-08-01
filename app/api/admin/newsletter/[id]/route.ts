import { NextResponse } from "next/server";
import { withClerkAdmin } from "@/lib/auth/withAuth";
import { deleteIssue, updateIssue, getIssueById } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export const GET = withClerkAdmin<Context>(async (_req, { params }) => {
  const { id } = await params;
  const issue = await getIssueById(id);
  if (!issue) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ issue });
});

export const PATCH = withClerkAdmin<Context>(async (req, { params }) => {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    slug?: unknown;
    title?: unknown;
    subtitle?: unknown;
    summary?: unknown;
    content?: unknown;
  } | null;
  if (!body) return NextResponse.json({ error: "empty_body" }, { status: 400 });

  try {
    const issue = await updateIssue(id, {
      slug: typeof body.slug === "string" ? body.slug : undefined,
      title: typeof body.title === "string" ? body.title : undefined,
      subtitle:
        typeof body.subtitle === "string"
          ? body.subtitle
          : body.subtitle === null
            ? null
            : undefined,
      summary:
        typeof body.summary === "string"
          ? body.summary
          : body.summary === null
            ? null
            : undefined,
      content: typeof body.content === "string" ? body.content : undefined,
    });
    return NextResponse.json({ issue });
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? "update_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
});

export const DELETE = withClerkAdmin<Context>(async (_req, { params }) => {
  const { id } = await params;
  try {
    await deleteIssue(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? "delete_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
});
