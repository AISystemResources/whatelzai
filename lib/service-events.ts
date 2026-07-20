import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";

export type ServiceEventKind =
  | "training"
  | "workshop"
  | "mentorship"
  | "talk"
  | "hackathon"
  | "other";

export const SERVICE_EVENT_KINDS: readonly ServiceEventKind[] = [
  "training",
  "workshop",
  "mentorship",
  "talk",
  "hackathon",
  "other",
];

export const SERVICE_EVENT_KIND_LABELS: Record<ServiceEventKind, string> = {
  training: "Training",
  workshop: "Workshop",
  mentorship: "Mentorship",
  talk: "Talk",
  hackathon: "Hackathon",
  other: "Other",
};

// Which event kinds show up in the dropdown for each testimonial category.
// Categories not listed here (peer, academic, friend) don't get an event dropdown.
export const CATEGORY_EVENT_KINDS: Partial<Record<string, ServiceEventKind[]>> =
  {
    trainer: ["training", "workshop"],
    mentor: ["mentorship"],
    hackathon: ["hackathon"],
  };

// Label used above the event dropdown for each category.
export const CATEGORY_EVENT_LABEL: Partial<Record<string, string>> = {
  trainer: "Which training?",
  mentor: "Which mentorship programme?",
  hackathon: "Which hackathon?",
};

export interface ServiceEvent {
  id: string;
  slug: string;
  name: string;
  kind: ServiceEventKind;
  event_date: string | null;
  location: string | null;
  description: string | null;
  attendee_count: number | null;
  created_at: string;
  updated_at: string;
}

export const listServiceEvents = cache(async (): Promise<ServiceEvent[]> => {
  const { data, error } = await supabaseAdmin
    .from("service_events")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false });
  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message))
      return [];
    throw new Error(`listServiceEvents: ${error.message}`);
  }
  return (data ?? []) as ServiceEvent[];
});

export async function getServiceEvent(
  id: string,
): Promise<ServiceEvent | null> {
  const { data, error } = await supabaseAdmin
    .from("service_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getServiceEvent: ${error.message}`);
  return data as ServiceEvent | null;
}

export async function upsertServiceEvent(
  fields: Partial<ServiceEvent> & {
    slug: string;
    name: string;
    kind: ServiceEventKind;
  },
): Promise<ServiceEvent> {
  const payload = { ...fields, updated_at: new Date().toISOString() };
  const query = fields.id
    ? supabaseAdmin
        .from("service_events")
        .update(payload)
        .eq("id", fields.id)
        .select()
        .single()
    : supabaseAdmin.from("service_events").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw new Error(`upsertServiceEvent: ${error.message}`);
  const saved = data as ServiceEvent;

  // PHASE 1 dual-write mirror to unified events table. Kind maps 1:1 to
  // events.type. If the service_event represents a hackathon, we rely on
  // the initial backfill to have linked it to the hackathon-sourced events
  // row via legacy_service_event_id — so this upsert updates that row.
  try {
    const { upsertEvent } = await import("./events");
    await upsertEvent({
      type: saved.kind,
      name: saved.name,
      slug: saved.slug ? `${saved.kind}-${saved.slug}` : null,
      date: saved.event_date,
      location: saved.location,
      published: true,
      metadata: {
        description: saved.description,
        attendee_count: saved.attendee_count,
        original_slug: saved.slug,
      },
      legacy_service_event_id: saved.id,
    });
  } catch (err) {
    console.warn(
      `[phase1-dual-write] mirror service_event → events failed for ${saved.id}:`,
      err,
    );
  }

  return saved;
}

export async function deleteServiceEvent(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("service_events")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`deleteServiceEvent: ${error.message}`);
  try {
    const { deleteEventByLegacyServiceEventId } = await import("./events");
    await deleteEventByLegacyServiceEventId(id);
  } catch (err) {
    console.warn(
      `[phase1-dual-write] delete events by legacy_service_event_id failed for ${id}:`,
      err,
    );
  }
}
