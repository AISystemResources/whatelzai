import { NextResponse } from "next/server";
import { withClerkAdmin } from "@/lib/auth/withAuth";
import {
  addDistribution,
  listDistributions,
  type DistributionPlatform,
} from "@/lib/newsletter";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const PLATFORMS: readonly DistributionPlatform[] = [
  "whatelz",
  "resend",
  "linkedin",
  "medium",
  "substack",
  "beehiiv",
];

export const GET = withClerkAdmin<Context>(async (_req, { params }) => {
  const { id } = await params;
  const distributions = await listDistributions(id);
  return NextResponse.json({ distributions });
});

export const POST = withClerkAdmin<Context>(async (req, { params }) => {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    platform?: unknown;
    external_url?: unknown;
    published_at?: unknown;
    notes?: unknown;
  } | null;

  if (
    !body ||
    typeof body.platform !== "string" ||
    !PLATFORMS.includes(body.platform as DistributionPlatform)
  ) {
    return NextResponse.json({ error: "invalid_platform" }, { status: 400 });
  }

  try {
    const distribution = await addDistribution({
      issue_id: id,
      platform: body.platform as DistributionPlatform,
      external_url:
        typeof body.external_url === "string" ? body.external_url : undefined,
      published_at:
        typeof body.published_at === "string" ? body.published_at : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
    });
    return NextResponse.json({ distribution });
  } catch (err) {
    const msg = (err as { message?: string })?.message ?? "insert_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
});
