import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { leadOwner } from "./server";
import { sharedLeadIds, sharedLeadColumns } from "./sharing";
import { todayUtc8 } from "./model";
export async function readLeadContext(query: string) {
  const viewer = await leadOwner();
  const filter = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const own = await supabaseAdmin
    .from("member_leads")
    .select(`${sharedLeadColumns},notes`)
    .eq("owner_id", viewer)
    .ilike("name", filter)
    .order("is_priority", { ascending: false })
    .order("name")
    .order("id")
    .limit(5);
  if (own.error) throw Error("Your leads are unavailable.");
  const allowed = await sharedLeadIds(viewer);
  const shared = allowed.length
    ? await supabaseAdmin
        .from("member_leads")
        .select(sharedLeadColumns)
        .in(
          "id",
          allowed.slice(0, 500).map((x) => x.id),
        )
        .ilike("name", filter)
        .order("name")
        .order("id")
        .limit(5)
    : { data: [], error: null };
  if (shared.error) throw Error("Shared leads are unavailable.");
  const profiles = [
    ...(own.data ?? []).map((x) => ({ ...x, access: "Own profile" })),
    ...(shared.data ?? []).map((x) => ({ ...x, access: "Shared read-only" })),
  ];
  const items = await Promise.all(
    profiles.map(async (raw) => {
      const lead = raw as unknown as Record<string, unknown> & {
        id: string;
        story: string;
        notes?: string;
        interests: string;
        concerns: string;
        next_action: string;
        access: string;
      };
      const owner =
        lead.access === "Own profile"
          ? viewer
          : allowed.find((x) => x.id === lead.id)!.owner_id;
      const history = await supabaseAdmin
        .from("member_lead_activities")
        .select("title,activity_on,status")
        .eq("owner_id", owner)
        .eq("lead_id", lead.id)
        .order("activity_on", { ascending: false })
        .order("id")
        .limit(21);
      if (history.error) throw Error("Lead activity history unavailable.");
      // Explicit allowlist: no contact data, private activity notes, photo paths,
      // other owner metadata or linked briefing/chat records enter the tool result.
      return {
        id: lead.id,
        name: lead.name,
        region: lead.region,
        membership: lead.membership,
        stage: lead.stage,
        goal: lead.goal,
        is_priority: lead.is_priority,
        access: lead.access,
        story: lead.story.slice(0, 1200),
        interests: lead.interests.slice(0, 400),
        concerns: lead.concerns.slice(0, 400),
        ...(lead.access === "Own profile"
          ? { notes: lead.notes?.slice(0, 800) }
          : {}),
        next_action: lead.next_action.slice(0, 300),
        follow_up_on: lead.follow_up_on,
        activities: (history.data ?? []).slice(0, 20),
        activityCoverage:
          (history.data?.length ?? 0) > 20
            ? "Latest 20 records; older history omitted"
            : "All recorded activities",
        url: `/leads/${lead.id}`,
      };
    }),
  );
  return {
    items,
    today: todayUtc8(),
    coverage:
      "Up to 5 own matching leads, priority first, plus 5 explicitly shared matching profiles (first 500 permitted IDs). Text fields are bounded excerpts. Activity statuses are authoritative records: Planned, Tentative and To invite are NOT attendance, even after the date passes. Shared access never includes contacts, private remarks, activity notes, HQH/HHH or chats. Follow-up dates are not completion.",
  };
}
