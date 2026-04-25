// Seed ELZ OS sections by calling lib/elzos-docs.ts directly (no network).
// 1) Read ./elzos-export.json (or path passed as first arg).
// 2) For each entry, create the section if missing (idempotent: skip on dupe).
// 3) For any of the 6 ELZ OS slugs that ends up with zero current sections,
//    create an empty Preamble placeholder.

import fs from "node:fs";
import path from "node:path";
import {
  createSection,
  listSections,
  VALID_SLUGS,
  type DocSlug,
} from "../lib/elzos-docs";

type ExportRow = {
  doc_slug: string;
  heading: string;
  position?: number;
  content: string;
  updated_at?: string | null;
};

const inPath = process.argv[2] ?? path.resolve(process.cwd(), "elzos-export.json");

const PLACEHOLDER = "_Placeholder. Backfill incoming._";
const AUTHOR = "mcp:elzos:seed";

function isValidSlug(s: string): s is DocSlug {
  return (VALID_SLUGS as string[]).includes(s);
}

async function main() {
  const rows: ExportRow[] = fs.existsSync(inPath)
    ? JSON.parse(fs.readFileSync(inPath, "utf8"))
    : [];

  console.log(
    `seed-elzos-from-export: read ${rows.length} rows from ${inPath}`,
  );

  // 1. Insert export rows.
  for (const row of rows) {
    if (!isValidSlug(row.doc_slug)) {

      console.warn(
        `  skip: unknown doc_slug=${row.doc_slug} heading=${row.heading}`,
      );
      continue;
    }
    const result = await createSection(
      row.doc_slug,
      row.heading,
      row.content ?? "",
      row.position,
      AUTHOR,
    );
    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      result.error === "duplicate_heading"
    ) {

      console.log(
        `  skip (exists): ${row.doc_slug} / ${row.heading}`,
      );
    } else {

      console.log(`  inserted: ${row.doc_slug} / ${row.heading}`);
    }
  }

  // 2. Empty-Preamble fallback for any slug with zero current sections.
  for (const slug of VALID_SLUGS) {
    const { sections } = await listSections(slug);
    if (sections.length === 0) {
      const result = await createSection(
        slug,
        "Preamble",
        PLACEHOLDER,
        0,
        AUTHOR,
      );
      if (
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error === "duplicate_heading"
      ) {

        console.log(`  preamble already exists: ${slug}`);
      } else {

        console.log(`  preamble placeholder created: ${slug}`);
      }
    }
  }


  console.log("seed-elzos-from-export: done.");
}

main().catch((e) => {

  console.error("seed-elzos-from-export failed:", e);
  process.exit(1);
});
