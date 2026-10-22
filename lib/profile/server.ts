import "server-only";
import { requireAssignedUser } from "@/lib/app-access";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isPersona } from "@/lib/community-calendar/personas";
import { memberApiEnabled } from "@/lib/member-ai/server";
import { summarizeUsage, type UsageAccess, type UsageCycle } from "./usage";

// Caller supplies no account identifier. Every private query uses verified identity.
export async function loadProfileData() {
  const user = await requireAssignedUser();
  if (!user) throw Error("Sign in to view your profile");
  const [membership, access, cycles, resets] = await Promise.all([
    supabaseAdmin
      .from("community_calendar_memberships")
      .select("persona")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("member_ai_access")
      .select("active,model,allowance_micro,current_cycle_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("member_ai_cycles")
      .select(
        "id,allowance_micro,spent_micro,reserved_micro,started_at,ends_at,reason",
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("member_ai_cycles")
      .select("id,started_at,allowance_micro", { count: "exact" })
      .eq("user_id", user.id)
      .eq("reason", "owner-reset")
      .order("started_at", { ascending: false })
      .limit(1),
  ]);
  const persona = membership.error
    ? null
    : isPersona(membership.data?.persona)
      ? membership.data.persona
      : "Guest";
  if (access.error || cycles.error || resets.error)
    return { persona, usage: null };
  const stored = (access.data as UsageAccess | null) ?? {
    active: true,
    model: "gpt-6-luna",
    allowance_micro: 5000000,
    current_cycle_id: null,
  };
  const history = (cycles.data ?? []) as UsageCycle[];
  // If the current cycle is outside the history window, do not display false zero usage.
  if (
    stored?.current_cycle_id &&
    !history.some((c) => c.id === stored.current_cycle_id)
  )
    return { persona, usage: null };
  return {
    persona,
    usage: {
      ...summarizeUsage(stored, history),
      assigned: Boolean(stored),
      active: true,
      canChat: Boolean(memberApiEnabled()),
      model: stored?.model ?? null,
      history,
      lastReset: resets.data?.[0] ?? null,
      resetCount: resets.count ?? 0,
    },
  };
}
