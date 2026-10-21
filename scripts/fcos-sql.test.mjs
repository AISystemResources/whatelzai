import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create role service_role;create table public.users(id uuid primary key);create table public.member_leads(id uuid primary key,owner_id uuid references public.users(id));`,
);
await db.exec(
  readFileSync(
    new URL(
      "../supabase/migrations/20261021120000_fcos_briefings.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const owner = "00000000-0000-4000-8000-000000000001",
  other = "00000000-0000-4000-8000-000000000002",
  lead = "00000000-0000-4000-8000-000000000003";
await db.query("insert into public.users values($1),($2)", [owner, other]);
await db.query("insert into public.member_leads values($1,$2)", [lead, owner]);
await db.query(
  "insert into public.member_briefings(owner_id,kind,title,occurred_on,lead_ids) values($1,'HQH','Example',current_date,array[$2::uuid])",
  [owner, lead],
);
await assert.rejects(
  db.query(
    "insert into public.member_briefings(owner_id,kind,title,occurred_on,lead_ids) values($1,'HHH','Cross owner',current_date,array[$2::uuid])",
    [other, lead],
  ),
  /Lead unavailable/,
);
await assert.rejects(
  db.query("update public.member_briefings set owner_id=$1", [other]),
  /identity is immutable/,
);
const access = await db.query(
  "select has_table_privilege('anon','public.member_briefings','select') as anon,has_table_privilege('authenticated','public.member_briefings','select') as member",
);
assert.deepEqual(access.rows, [{ anon: false, member: false }]);
await db.exec("set role authenticated");
await assert.rejects(
  db.query("select * from public.member_briefings"),
  /permission denied/,
);
await db.exec("reset role");
await db.close();
console.log(
  "fcOS SQL ownership, immutable identity and browser denial checks passed.",
);
