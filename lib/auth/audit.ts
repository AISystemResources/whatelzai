import { supabaseAdmin } from "@/lib/supabase-server";

export type AuditActorType = "token" | "clerk" | "anon";

export interface AuditEvent {
  tokenId?: string | null;
  actorType: AuditActorType;
  actorId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  payload?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

// Fire-and-forget. Audit failures never block the caller — we log server-side
// and return void so a bad audit insert can't drop a legitimate write.
export async function recordAudit(event: AuditEvent): Promise<void> {
  const { error } = await supabaseAdmin.from("audit_log").insert({
    token_id: event.tokenId ?? null,
    actor_type: event.actorType,
    actor_id: event.actorId ?? null,
    action: event.action,
    resource_type: event.resourceType ?? null,
    resource_id: event.resourceId ?? null,
    payload: event.payload ?? null,
    ip: event.ip ?? null,
    user_agent: event.userAgent ?? null,
  });
  if (error) console.error("[audit] insert failed", error.message);
}
