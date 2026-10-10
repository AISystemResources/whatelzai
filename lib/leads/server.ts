import "server-only";
import { ensureUserRow } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  regions,
  stages,
  type Lead,
  type LeadSummary,
  type Activity,
} from "./model";

export async function leadOwner() {
  const user = await ensureUserRow();
  if (!user) throw new Error("Sign in to manage your leads.");
  return user.id;
}
export async function loadLeads(params: {
  q?: string;
  region?: string;
  stage?: string;
  page?: string;
}) {
  const owner = await leadOwner();
  const q = (params.q ?? "").trim().slice(0, 160);
  const region = regions.find((value) => value === params.region);
  const stage = stages.find((value) => value === params.stage);
  const page = /^[1-9]\d{0,4}$/.test(params.page ?? "")
    ? Number(params.page)
    : 1;
  let query = supabaseAdmin
    .from("member_leads")
    .select("id,name,region,membership,stage,goal,next_action,follow_up_on", {
      count: "exact",
    })
    .eq("owner_id", owner);
  if (q) query = query.ilike("name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  if (region) query = query.eq("region", region);
  if (stage) query = query.eq("stage", stage);
  const { data, error, count } = await query
    .order("follow_up_on", { ascending: true, nullsFirst: false })
    .order("name")
    .order("id")
    .range((page - 1) * 50, page * 50 - 1);
  if (error) throw new Error("Your leads could not be loaded.");
  return {
    leads: (data ?? []) as LeadSummary[],
    count: count ?? 0,
    page,
    q,
    region: region ?? "",
    stage: stage ?? "",
  };
}
export async function loadLead(id: string) {
  const owner = await leadOwner();
  const { data, error } = await supabaseAdmin
    .from("member_leads")
    .select(
      "id,name,region,membership,stage,goal,email,phone,birthday,zodiac,relationship,story,interests,concerns,notes,next_action,follow_up_on,revision,updated_at",
    )
    .eq("owner_id", owner)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("This profile could not be loaded.");
  if (!data) return null;
  const { data: activities, error: activityError } = await supabaseAdmin
    .from("member_lead_activities")
    .select("id,lead_id,title,activity_on,status,notes,revision")
    .eq("owner_id", owner)
    .eq("lead_id", id)
    .order("activity_on", { ascending: false })
    .order("id");
  if (activityError) throw new Error("Activity history could not be loaded.");
  return { lead: data as Lead, activities: (activities ?? []) as Activity[] };
}
