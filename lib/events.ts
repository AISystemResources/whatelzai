import { supabaseAdmin } from "./supabase-server";

// Unified event ledger. Phase 1 of the migration off separate hackathons +
// service_events tables. Reads still hit those tables in Phase 1; this lib
// exists so upsert paths on both source tables can dual-write here.
//
// Phase 2 will flip public reads to `events`. Phase 3 drops the source
// tables and removes the legacy_* columns.

export type EventType =
  | "hackathon"
  | "training"
  | "workshop"
  | "mentorship"
  | "talk"
  | "other";

export interface EventRow {
  id: string;
  type: EventType;
  slug: string | null;
  name: string;
  date: string | null;
  location: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  published: boolean;
  legacy_hackathon_id: string | null;
  legacy_service_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertEventInput {
  type: EventType;
  name: string;
  slug?: string | null;
  date?: string | null;
  location?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
  published?: boolean;
  // Provide one of these to reconcile with the corresponding legacy row.
  legacy_hackathon_id?: string | null;
  legacy_service_event_id?: string | null;
}

// Idempotent upsert. If a legacy_* id is provided, updates that existing
// events row (preserving id + relations); otherwise inserts a new row.
export async function upsertEvent(input: UpsertEventInput): Promise<EventRow> {
  const payload = {
    type: input.type,
    name: input.name,
    slug: input.slug ?? null,
    date: input.date ?? null,
    location: input.location ?? null,
    notes: input.notes ?? null,
    metadata: input.metadata ?? {},
    published: input.published ?? false,
    legacy_hackathon_id: input.legacy_hackathon_id ?? null,
    legacy_service_event_id: input.legacy_service_event_id ?? null,
    updated_at: new Date().toISOString(),
  };

  // Prefer conflict on legacy_hackathon_id when set, then legacy_service_event_id,
  // then insert new. Supabase's upsert with onConflict handles the primary case.
  const onConflict = input.legacy_hackathon_id
    ? "legacy_hackathon_id"
    : input.legacy_service_event_id
      ? "legacy_service_event_id"
      : undefined;

  const { data, error } = onConflict
    ? await supabaseAdmin
        .from("events")
        .upsert(payload, { onConflict })
        .select()
        .single()
    : await supabaseAdmin.from("events").insert(payload).select().single();

  if (error) throw new Error(`upsertEvent: ${error.message}`);
  return data as EventRow;
}

export async function deleteEventByLegacyHackathonId(
  hackathonId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("events")
    .delete()
    .eq("legacy_hackathon_id", hackathonId);
  if (error)
    throw new Error(`deleteEventByLegacyHackathonId: ${error.message}`);
}

export async function deleteEventByLegacyServiceEventId(
  serviceEventId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("events")
    .delete()
    .eq("legacy_service_event_id", serviceEventId);
  if (error)
    throw new Error(`deleteEventByLegacyServiceEventId: ${error.message}`);
}

// Convenience read used by Phase 2 read-path swap. Phase 1 code doesn't
// call this — it's here so the API surface is complete now.
export async function listEvents(
  filters: { type?: EventType; publishedOnly?: boolean } = {},
): Promise<EventRow[]> {
  let q = supabaseAdmin.from("events").select("*");
  if (filters.type) q = q.eq("type", filters.type);
  if (filters.publishedOnly) q = q.eq("published", true);
  const { data, error } = await q.order("date", {
    ascending: false,
    nullsFirst: false,
  });
  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message))
      return [];
    throw new Error(`listEvents: ${error.message}`);
  }
  return (data ?? []) as EventRow[];
}
