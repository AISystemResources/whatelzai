// Export current ELZ OS sections from the local sqlite DB at ~/.elzos/elzos.db
// to a JSON file. Safe no-op if the DB does not exist (writes [] and exits 0).
//
// Usage:
//   npm run elzos:export-local                # writes ./elzos-export.json
//   npm run elzos:export-local -- /tmp/x.json # writes to /tmp/x.json
//
// The local schema is assumed to be a section-versioned table with at least
// these columns: doc_slug, heading, position, content, is_current, updated_at.
// Any subset is fine — missing columns get null/sane defaults.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const outPath = process.argv[2] ?? path.resolve(process.cwd(), "elzos-export.json");
const dbPath = path.join(os.homedir(), ".elzos", "elzos.db");

type Row = {
  doc_slug: string;
  heading: string;
  position: number;
  content: string;
  updated_at: string | null;
};

function writeOut(rows: Row[]) {
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));

  console.log(`elzos-export-local: wrote ${rows.length} sections → ${outPath}`);
}

if (!fs.existsSync(dbPath)) {

  console.log(
    `elzos-export-local: ${dbPath} not found. Writing empty export and exiting 0.`,
  );
  writeOut([]);
  process.exit(0);
}

// Lazy import so missing DB doesn't fail on the require step either.
type DatabaseCtor = new (path: string, opts?: { readonly?: boolean }) => {
  prepare: (sql: string) => {
    all: (...params: unknown[]) => unknown[];
  };
  pragma: (sql: string) => unknown;
  close: () => void;
};

let DB: DatabaseCtor;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DB = require("better-sqlite3");
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);

  console.error(`elzos-export-local: better-sqlite3 not installed: ${msg}`);
  process.exit(1);
}

const db = new DB(dbPath, { readonly: true });

// Discover the right table. Common candidates:
const candidates = ["docs_sections", "sections", "elzos_docs_sections"];
const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  )
  .all() as Array<{ name: string }>;
const tableNames = new Set(tables.map((t) => t.name));
const target = candidates.find((c) => tableNames.has(c));

if (!target) {

  console.error(
    `elzos-export-local: no recognised sections table found. Tables: ${[...tableNames].join(", ") || "(none)"}`,
  );
  writeOut([]);
  process.exit(0);
}

// Pull current rows. Defensive about column names.
const cols = (
  db.prepare(`PRAGMA table_info(${target})`).all() as Array<{ name: string }>
).map((c) => c.name);
const has = (n: string) => cols.includes(n);

const where = has("is_current") ? "WHERE is_current = 1" : "";
const orderCol = has("position") ? "position" : "rowid";

const sql = `
  SELECT
    ${has("doc_slug") ? "doc_slug" : "'INSTRUCTIONS' AS doc_slug"},
    ${has("heading") ? "heading" : "'Untitled' AS heading"},
    ${has("position") ? "position" : "0 AS position"},
    ${has("content") ? "content" : "'' AS content"},
    ${has("updated_at") ? "updated_at" : "NULL AS updated_at"}
  FROM ${target}
  ${where}
  ORDER BY ${has("doc_slug") ? "doc_slug, " : ""}${orderCol}
`;

const rows = db.prepare(sql).all() as Row[];
db.close();

writeOut(rows);
