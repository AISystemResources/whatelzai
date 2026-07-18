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
    if (error.code === "42P01" || /schema cache/i.test(error.message)) return [];
    throw new Error(`listServiceEvents: ${error.message}`);
  }
  return (data ?? []) as ServiceEvent[];
});

export async function getServiceEvent(id: string): Promise<ServiceEvent | null> {
  const { data, error } = await supabaseAdmin
    .from("service_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getServiceEvent: ${error.message}`);
  return data as ServiceEvent | null;
}

export async function upsertServiceEvent(
  fields: Partial<ServiceEvent> & { slug: string; name: string; kind: ServiceEventKind },
): Promise<ServiceEvent> {
  const payload = { ...fields, updated_at: new Date().toISOString() };
  const query = fields.id
    ? supabaseAdmin.from("service_events").update(payload).eq("id", fields.id).select().single()
    : supabaseAdmin.from("service_events").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw new Error(`upsertServiceEvent: ${error.message}`);
  return data as ServiceEvent;
}

export async function deleteServiceEvent(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("service_events").delete().eq("id", id);
  if (error) throw new Error(`deleteServiceEvent: ${error.message}`);
}
