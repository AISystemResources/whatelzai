import { NextResponse } from "next/server";
import { withClerkAdmin } from "@/lib/auth/withAuth";
import {
  listSubscribers,
  subscriberStats,
  type SubscriberStatus,
} from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export const GET = withClerkAdmin(async (req) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") as SubscriberStatus | null;

  const [subscribers, stats] = await Promise.all([
    listSubscribers(status ?? undefined),
    subscriberStats(),
  ]);

  return NextResponse.json({ subscribers, stats });
});
