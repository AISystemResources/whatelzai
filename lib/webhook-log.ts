import { supabaseAdmin } from "./supabase-server";

export async function logWebhookEvent(
  stripeEventId: string,
  eventType: string,
  processedOk: boolean,
  errorMsg?: string | null,
): Promise<void> {
  const { error } = await supabaseAdmin.from("webhook_events_log").upsert(
    {
      stripe_event_id: stripeEventId,
      event_type: eventType,
      processed_ok: processedOk,
      error_msg: errorMsg ?? null,
    },
    { onConflict: "stripe_event_id" },
  );
  if (error) {
    console.error("[webhook-log]", stripeEventId, error.message);
  }
}

export async function getLastWebhook(): Promise<{
  last_webhook_at: string | null;
  last_webhook_event: string | null;
} | null> {
  const { data, error } = await supabaseAdmin
    .from("webhook_events_log")
    .select("received_at, event_type")
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data)
    return { last_webhook_at: null, last_webhook_event: null };
  return {
    last_webhook_at: data.received_at,
    last_webhook_event: data.event_type,
  };
}
