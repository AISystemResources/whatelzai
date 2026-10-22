import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { dailyOwner, loadDailyTasks } from "@/lib/daily/server";
import { emdeeConnection } from "@/lib/daily/connections";
import { DAILY_PARENT } from "@/lib/daily/paths";
import { loadBrief } from "@/lib/daily/emdee";
import { singaporeDay, previousDay, type Brief } from "@/lib/daily/model";
import { getSelfMetrics } from "@/lib/cockpit-self";
import {
  fetchRemoteWidgets,
  type WidgetState,
  type OwnerMetrics,
} from "@/lib/cockpit";
import { aiBusinessFocus, type Source } from "./model";
async function safely<T>(operation: () => PromiseLike<T>): Promise<Source<T>> {
  try {
    return { status: "ready", data: await operation() };
  } catch {
    return { status: "unavailable" };
  }
}
export async function loadAdminOverview(now = new Date()) {
  // This boundary is independent of layouts/proxy and runs before any query.
  const owner = await dailyOwner();
  const day = singaporeDay(now);
  async function briefingSources() {
    const connection = await emdeeConnection(owner);
    if (connection?.parentPath !== DAILY_PARENT)
      throw Error("Daily connection required");
    return Promise.all([
      safely(() => loadBrief(day, "morning")),
      safely(() => loadBrief(day, "evening")),
      safely(() => loadBrief(previousDay(day), "evening")),
    ]);
  }
  async function count(table: string, where: Record<string, string>) {
    let query = supabaseAdmin
      .from(table)
      .select("id", { count: "exact", head: true });
    for (const [key, value] of Object.entries(where))
      query = query.eq(key, value);
    const { count, error } = await query;
    if (error || count === null) throw Error("Count unavailable");
    return count;
  }
  const [tasks, briefs, blog, newsletter, testimonials, self, remote] =
    await Promise.all([
      safely(() => loadDailyTasks(day)),
      safely(briefingSources),
      safely(() => count("blog_posts", { status: "draft" })),
      safely(() => count("newsletter_issues", { status: "draft" })),
      safely(() => count("testimonials", { status: "pending" })),
      safely(getSelfMetrics),
      safely(fetchRemoteWidgets),
    ]);
  const unavailable: Source<Brief> = { status: "unavailable" };
  const whatelz: WidgetState<OwnerMetrics> =
    self.status === "ready"
      ? { status: "available", data: self.data, fetched_at: now.toISOString() }
      : {
          status: "error",
          reason: "Product metrics could not be loaded. Try refreshing.",
        };
  const emdee: WidgetState<OwnerMetrics> =
    remote.status === "ready"
      ? remote.data.emdee
      : {
          status: "error",
          reason: "Product connection could not be checked. Try refreshing.",
        };
  return {
    day,
    loadedAt: now.toISOString(),
    focus:
      tasks.status === "ready"
        ? {
            status: "ready" as const,
            data: aiBusinessFocus(tasks.data.active, tasks.data.completed, day),
          }
        : { status: "unavailable" as const },
    morning: briefs.status === "ready" ? briefs.data[0] : unavailable,
    evening: briefs.status === "ready" ? briefs.data[1] : unavailable,
    handoff: briefs.status === "ready" ? briefs.data[2] : unavailable,
    growth: { blog, newsletter, testimonials },
    products: { whatelz, emdee },
  };
}
