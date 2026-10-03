import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { parseTeamSeed } from "../lib/team/model";

async function main() {
  const path = process.argv[2];
  if (!path)
    throw new Error("Usage: npm run seed:team -- /path/to/private-team.json");
  const seed = parseTeamSeed(JSON.parse(await readFile(path, "utf8")));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase server credentials");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.rpc("import_business_team", { seed });
  if (error) throw new Error(`Import failed: ${error.message}`);
  console.log(
    `Imported ${seed.people.length} people. No login accounts were linked.`,
  );
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Import failed");
  process.exitCode = 1;
});
