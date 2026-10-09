import "server-only";
import { ensureUserRow } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import { expandMonth, type CalendarRecord } from "./ical";
export async function loadCommunityCalendar(month: string) {
  if (!(await ensureUserRow())) throw new Error("Sign-in required");
  const { data: snapshot, error } = await supabaseAdmin
    .from("community_calendar_imports")
    .select("id,imported_at,message_count,record_count")
    .gt("imported_at", "1970-01-01T00:00:00Z")
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("Calendar unavailable");
  if (!snapshot) return { events: [], snapshot: null };
  const { data, error: recordError } = await supabaseAdmin
    .from("community_calendar_records")
    .select(
      "id,uid,recurrence_id,sequence,revision_at,message_id,received_at,ics",
    )
    .eq("import_id", snapshot.id)
    .range(0, 999);
  if (recordError || !data || data.length !== snapshot.record_count)
    throw new Error("Calendar import incomplete");
  return {
    events: expandMonth(data as CalendarRecord[], month),
    snapshot: {
      imported_at: snapshot.imported_at,
      message_count: snapshot.message_count,
      record_count: snapshot.record_count,
    },
  };
}
