import { supabaseAdmin } from "./supabase-server";

// ── Frozen event payload shapes (ARC-009 v1) ──────────────────────
export interface PlaybookSessionStartPayload {
  entry_path: string;
  referrer: string | null;
  archetype_slug: string | null;
}

export interface PlaybookChapterViewedPayload {
  chapter_slug: string;
  chapter_part: 1 | 2 | 3 | 4;
  chapter_ordinal: number;
}

// Open union — ARC-009 §"The route" says accept unknown event_types.
export type KnownEventType =
  | "playbook.session_start"
  | "playbook.chapter_viewed";

export type EventPayload =
  | PlaybookSessionStartPayload
  | PlaybookChapterViewedPayload
  | Record<string, unknown>;

export interface LogEventInput {
  event_type: KnownEventType | string;
  session_id: string | null;
  user_id: string | null;
  source: "server" | "client";
  payload?: EventPayload;
  user_agent?: string | null;
}

export async function logEvent(input: LogEventInput): Promise<void> {
  const { error } = await supabaseAdmin.from("event_log").insert({
    event_type: input.event_type,
    session_id: input.session_id,
    user_id: input.user_id,
    source: input.source,
    payload: input.payload ?? {},
    user_agent: input.user_agent?.slice(0, 256) ?? null,
  });
  if (error) {
    console.error("[event-log]", input.event_type, error.message);
  }
}

// Session-scoped dedupe for playbook.session_start — check whether this
// session_id has already fired session_start recently. Cheap read; we accept
// the small race window (two near-simultaneous first-hits fire twice).
export async function hasRecentSessionStart(
  sessionId: string,
  withinMinutes = 30,
): Promise<boolean> {
  const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("event_log")
    .select("id")
    .eq("session_id", sessionId)
    .eq("event_type", "playbook.session_start")
    .gte("occurred_at", since)
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}
