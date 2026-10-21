import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { ensureUserRow } from "@/lib/users";
import type { Briefing } from "./model";
export async function fcosOwner() {
  const user = await ensureUserRow();
  if (!user) throw Error("Sign in to continue.");
  return user.id;
}
export async function briefingLeads() {
  const owner = await fcosOwner();
  const { data, error } = await supabaseAdmin
    .from("member_leads")
    .select("id,name")
    .eq("owner_id", owner)
    .order("name")
    .limit(200);
  if (error) throw Error("Leads unavailable.");
  return data ?? [];
}
export async function loadBriefing(id: string) {
  const owner = await fcosOwner();
  const { data, error } = await supabaseAdmin
    .from("member_briefings")
    .select(
      "id,kind,title,event_name,occurred_on,lead_ids,observations,reflections,next_steps,status,revision",
    )
    .eq("owner_id", owner)
    .eq("id", id)
    .maybeSingle();
  if (error) throw Error("Note unavailable.");
  return data as Briefing | null;
}
export async function loadBriefings(page = 1) {
  const owner = await fcosOwner();
  const { data, error, count } = await supabaseAdmin
    .from("member_briefings")
    .select("id,kind,title,event_name,occurred_on,status", { count: "exact" })
    .eq("owner_id", owner)
    .order("updated_at", { ascending: false })
    .order("id")
    .range((page - 1) * 30, page * 30 - 1);
  if (error) throw Error("Notes unavailable.");
  return { items: data ?? [], count: count ?? 0 };
}
