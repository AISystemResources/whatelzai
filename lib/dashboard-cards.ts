import { supabaseAdmin } from "./supabase-server";

export interface DashboardCard {
  id: string;
  key: string;
  title: string;
  body_markdown: string;
  meta: Record<string, unknown> | null;
  source: string | null;
  expected_cadence_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertCardInput {
  key: string;
  title: string;
  body_markdown: string;
  meta?: Record<string, unknown>;
  source?: string;
  expected_cadence_hours?: number;
}

export async function listDashboardCards(): Promise<DashboardCard[]> {
  const { data, error } = await supabaseAdmin
    .from("dashboard_cards")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`listDashboardCards: ${error.message}`);
  return (data ?? []) as DashboardCard[];
}

export async function upsertDashboardCard(
  input: UpsertCardInput,
): Promise<DashboardCard> {
  const payload = {
    key: input.key,
    title: input.title,
    body_markdown: input.body_markdown,
    meta: input.meta ?? null,
    source: input.source ?? null,
    expected_cadence_hours: input.expected_cadence_hours ?? null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin
    .from("dashboard_cards")
    .upsert(payload, { onConflict: "key" })
    .select()
    .single();
  if (error) throw new Error(`upsertDashboardCard: ${error.message}`);
  return data as DashboardCard;
}

export async function deleteDashboardCard(
  key: string,
): Promise<{ deleted: boolean }> {
  const { data, error } = await supabaseAdmin
    .from("dashboard_cards")
    .delete()
    .eq("key", key)
    .select("key");
  if (error) throw new Error(`deleteDashboardCard: ${error.message}`);
  return { deleted: (data?.length ?? 0) > 0 };
}

// A card is "stale" when the writer promised a cadence and we're past it.
// Null cadence = no promise, never stale. This is the immune system: absence
// of a fresh briefing becomes visible instead of silently missing.
export function isCardStale(card: DashboardCard, now: Date = new Date()): boolean {
  if (card.expected_cadence_hours == null) return false;
  const updated = new Date(card.updated_at).getTime();
  const staleAfter = updated + card.expected_cadence_hours * 60 * 60 * 1000;
  return now.getTime() > staleAfter;
}
