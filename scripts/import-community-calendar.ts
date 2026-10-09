import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  reconcileInvitations,
  expandMonth,
} from "../lib/community-calendar/ical";
const schema = z.object({
  imported_at: z.iso.datetime(),
  sender: z.literal("hello@foundersclub.asia"),
  messages: z
    .array(
      z.object({
        message_id: z.string().min(1),
        received_at: z.iso.datetime({ offset: true }),
        ics: z.string().min(1),
      }),
    )
    .min(1),
});
async function main() {
  const input = schema.parse(
    JSON.parse(await readFile(process.argv[2], "utf8")),
  );
  if (
    new Set(input.messages.map((x) => x.message_id)).size !==
    input.messages.length
  )
    throw new Error("Duplicate message IDs");
  const records = reconcileInvitations(input.messages);
  // Preflight every month with actual dated event inputs before publishing.
  for (const year of [2026, 2027, 2028, 2029])
    for (let m = 1; m <= 12; m++)
      expandMonth(records, `${year}-${String(m).padStart(2, "0")}`);
  const checksum = createHash("sha256")
    .update(JSON.stringify(records))
    .digest("hex");
  const id = `founders-${checksum.slice(0, 16)}`;
  const snapshot = {
    id,
    sender: input.sender,
    imported_at: input.imported_at,
    message_count: input.messages.length,
    record_count: records.length,
    checksum,
  };
  if (process.argv.includes("--dry-run")) {
    console.log(
      JSON.stringify({
        ...snapshot,
        october_events: expandMonth(records, "2026-10").length,
        november_events: expandMonth(records, "2026-11").length,
      }),
    );
    return;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !url.includes("tnjujbkpepchhgyqwmtb"))
    throw new Error("Expected Whatelz project credentials");
  const db = createClient(url, key, { auth: { persistSession: false } });
  // Register the snapshot only after all its rows verify. Readers use the
  // previous completed import until the final metadata upsert succeeds.
  const response = await db
    .from("community_calendar_imports")
    .select("id")
    .eq("id", id);
  if (response.error) throw response.error;
  if (!response.data?.length) {
    const created = await db
      .from("community_calendar_imports")
      .insert({ ...snapshot, imported_at: "1970-01-01T00:00:00Z" });
    if (created.error) throw created.error;
  }
  const written = await db
    .from("community_calendar_records")
    .upsert(records.map((r) => ({ import_id: id, ...r })));
  if (written.error) throw written.error;
  const count = await db
    .from("community_calendar_records")
    .select("id", { count: "exact", head: true })
    .eq("import_id", id);
  if (count.error || count.count !== records.length)
    throw new Error("Import verification failed");
  const published = await db
    .from("community_calendar_imports")
    .upsert(snapshot);
  if (published.error) throw published.error;
  console.log(
    `Imported ${input.messages.length} invitation/update messages as ${records.length} calendar records. October: ${expandMonth(records, "2026-10").length} occurrences.`,
  );
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Calendar import failed");
  process.exitCode = 1;
});
