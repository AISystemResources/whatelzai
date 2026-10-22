import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { fcosOwner } from "./server";
import { loadTeamView } from "@/lib/team/server";
// Only saved note content is readable through a grant. Never select lead IDs,
// profile data, owner account details, recipient lists or private chat context.
export const sharedColumns =
  "id,kind,title,event_name,occurred_on,observations,reflections,next_steps,status";
export async function shareRecipients() {
  const owner = await fcosOwner();
  const team = await loadTeamView();
  if (!team || !team.people.length) return [];
  const { data, error } = await supabaseAdmin
    .from("business_team_accounts")
    .select("user_id,person_id")
    .eq("team_id", team.team.id)
    .in(
      "person_id",
      team.people.map((person) => person.id),
    )
    .neq("user_id", owner);
  if (error) throw Error("Team accounts unavailable.");
  return (data ?? []).map((account) => ({
    id: account.user_id,
    label: team.people.find((person) => person.id === account.person_id)!
      .display_name,
  }));
}
export async function noteShares(id: string) {
  const owner = await fcosOwner();
  const { data, error } = await supabaseAdmin
    .from("member_briefing_shares")
    .select("recipient_user_id,recipient_label")
    .eq("briefing_id", id)
    .eq("owner_id", owner)
    .is("revoked_at", null)
    .order("shared_at");
  if (error) throw Error("Sharing settings unavailable.");
  return data ?? [];
}
export async function loadSharedBriefing(id: string) {
  const recipient = await fcosOwner();
  const grant = await supabaseAdmin
    .from("member_briefing_shares")
    .select("briefing_id")
    .eq("briefing_id", id)
    .eq("recipient_user_id", recipient)
    .is("revoked_at", null)
    .maybeSingle();
  if (grant.error) throw Error("Shared note unavailable.");
  if (!grant.data) return null;
  const { data, error } = await supabaseAdmin
    .from("member_briefings")
    .select(sharedColumns)
    .eq("id", grant.data.briefing_id)
    .maybeSingle();
  if (error) throw Error("Shared note unavailable.");
  return data;
}
export async function sharedBriefings(page: number) {
  const recipient = await fcosOwner();
  const { data, error, count } = await supabaseAdmin
    .from("member_briefing_shares")
    .select("briefing_id", { count: "exact" })
    .eq("recipient_user_id", recipient)
    .is("revoked_at", null)
    .order("shared_at", { ascending: false })
    .order("briefing_id")
    .range((page - 1) * 30, page * 30 - 1);
  if (error) throw Error("Shared notes unavailable.");
  if (!data?.length) return { items: [], count: count ?? 0 };
  const notes = await supabaseAdmin
    .from("member_briefings")
    .select("id,kind,title,event_name,occurred_on,status")
    .in(
      "id",
      data.map((grant) => grant.briefing_id),
    );
  if (notes.error) throw Error("Shared notes unavailable.");
  return {
    items: data.flatMap(
      (grant) =>
        notes.data?.filter((note) => note.id === grant.briefing_id) ?? [],
    ),
    count: count ?? 0,
  };
}
