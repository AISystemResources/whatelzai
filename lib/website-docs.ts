import { supabaseAdmin } from "./supabase-server";

export type DocSlug =
  | "IDEAS"
  | "BUILD"
  | "CONTEXT"
  | "INSTRUCTIONS"
  | "MYSTORY"
  | "INBOX"
  | "BRAND"
  | "LOGS"
  | "LEARNINGS"
  | "ELZOS";
export const VALID_SLUGS: DocSlug[] = [
  "IDEAS",
  "BUILD",
  "CONTEXT",
  "INSTRUCTIONS",
  "MYSTORY",
  "INBOX",
  "BRAND",
  "LOGS",
  "LEARNINGS",
  "ELZOS",
];

type SectionRow = {
  id: string;
  doc_slug: string;
  heading: string;
  position: number;
  content: string;
  version: number;
  is_current: boolean;
  updated_at: string;
};

// Helper: snapshot current state into versions table before mutating
async function snapshotVersion(row: SectionRow, capturedBy = "unknown") {
  const { error } = await supabaseAdmin.from("docs_section_versions").insert({
    section_id: row.id,
    doc_slug: row.doc_slug,
    heading: row.heading,
    position: row.position,
    content: row.content,
    version: row.version,
    captured_by: capturedBy,
  });
  if (error) throw new Error(`version_snapshot_failed: ${error.message}`);
}

// 1. list_sections
export async function listSections(doc_slug: DocSlug) {
  const { data, error } = await supabaseAdmin
    .from("docs_sections")
    .select("heading, position, version, updated_at, content")
    .eq("doc_slug", doc_slug)
    .eq("is_current", true)
    .is("trashed_at", null)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return {
    sections: (data ?? []).map((r) => ({
      heading: r.heading,
      position: r.position,
      version: r.version,
      updated_at: r.updated_at,
      preview: r.content.slice(0, 120),
    })),
  };
}

// 2. read_section
export async function readSection(doc_slug: DocSlug, heading: string) {
  const { data, error } = await supabaseAdmin
    .from("docs_sections")
    .select("heading, content, version, updated_at")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .is("trashed_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { error: "section_not_found", doc_slug, heading };
  return data;
}

// 3. read_doc
export async function readDoc(doc_slug: DocSlug) {
  const { data, error } = await supabaseAdmin
    .from("docs_sections")
    .select("heading, content, position, version, updated_at")
    .eq("doc_slug", doc_slug)
    .eq("is_current", true)
    .is("trashed_at", null)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const content = rows
    .map((r) => `## ${r.heading}\n\n${r.content}`)
    .join("\n\n");
  return {
    doc_slug,
    content,
    sections: rows.map((r) => ({
      heading: r.heading,
      position: r.position,
      version: r.version,
      updated_at: r.updated_at,
    })),
    generated_at: new Date().toISOString(),
  };
}

// 4. create_section
export async function createSection(
  doc_slug: DocSlug,
  heading: string,
  content: string,
  position?: number,
) {
  const { data: existing } = await supabaseAdmin
    .from("docs_sections")
    .select("id")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .is("trashed_at", null)
    .maybeSingle();
  if (existing) return { error: "duplicate_heading", doc_slug, heading };

  let finalPosition = position;
  if (finalPosition === undefined) {
    const { data: maxRow } = await supabaseAdmin
      .from("docs_sections")
      .select("position")
      .eq("doc_slug", doc_slug)
      .eq("is_current", true)
      .is("trashed_at", null)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    finalPosition = maxRow ? maxRow.position + 1 : 0;
  } else {
    await supabaseAdmin.rpc("shift_positions_up", {
      p_slug: doc_slug,
      p_from: finalPosition,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("docs_sections")
    .insert({ doc_slug, heading, position: finalPosition, content, version: 1 })
    .select("heading, position, version")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// 5. append_section
export async function appendSection(
  doc_slug: DocSlug,
  heading: string,
  content: string,
  create_if_missing = true,
) {
  const { data: existing } = await supabaseAdmin
    .from("docs_sections")
    .select("id, doc_slug, heading, position, content, version")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (!existing) {
    if (!create_if_missing)
      return { error: "section_not_found", doc_slug, heading };
    return createSection(doc_slug, heading, content);
  }

  await snapshotVersion(existing as SectionRow, "append");
  const newContent = existing.content + "\n\n" + content;
  const newVersion = existing.version + 1;
  const { error } = await supabaseAdmin
    .from("docs_sections")
    .update({ content: newContent, version: newVersion })
    .eq("id", existing.id);
  if (error) throw new Error(error.message);
  return { heading, version: newVersion };
}

// 6. patch_section (version-guarded)
export async function patchSection(
  doc_slug: DocSlug,
  heading: string,
  content: string,
  expected_version: number,
  captured_by = "unknown",
) {
  const { data: row } = await supabaseAdmin
    .from("docs_sections")
    .select("*")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (!row) return { error: "section_not_found", doc_slug, heading };
  if (row.version !== expected_version) {
    return {
      error: "version_conflict",
      current_version: row.version,
      current_content: row.content,
    };
  }

  await snapshotVersion(row as SectionRow, captured_by);
  const newVersion = row.version + 1;
  const { error } = await supabaseAdmin
    .from("docs_sections")
    .update({ content, version: newVersion })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
  return { heading, version: newVersion };
}

// 7. rename_section (version-guarded)
export async function renameSection(
  doc_slug: DocSlug,
  heading: string,
  new_heading: string,
  expected_version: number,
) {
  const { data: row } = await supabaseAdmin
    .from("docs_sections")
    .select("*")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (!row) return { error: "section_not_found", doc_slug, heading };
  if (row.version !== expected_version) {
    return {
      error: "version_conflict",
      current_version: row.version,
      current_content: row.content,
    };
  }

  const { data: dup } = await supabaseAdmin
    .from("docs_sections")
    .select("id")
    .eq("doc_slug", doc_slug)
    .eq("heading", new_heading)
    .eq("is_current", true)
    .is("trashed_at", null)
    .maybeSingle();
  if (dup)
    return { error: "duplicate_heading", doc_slug, heading: new_heading };

  await snapshotVersion(row as SectionRow, "rename");
  const newVersion = row.version + 1;
  const { error } = await supabaseAdmin
    .from("docs_sections")
    .update({ heading: new_heading, version: newVersion })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
  return { heading, new_heading, version: newVersion };
}

// 8. move_section (version-guarded, insert-at-N semantics)
export async function moveSection(
  doc_slug: DocSlug,
  heading: string,
  new_position: number,
  expected_version: number,
) {
  const { data: row } = await supabaseAdmin
    .from("docs_sections")
    .select("*")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (!row) return { error: "section_not_found", doc_slug, heading };
  if (row.version !== expected_version) {
    return {
      error: "version_conflict",
      current_version: row.version,
      current_content: row.content,
    };
  }

  const old_position = row.position;
  if (old_position === new_position) {
    return { heading, old_position, new_position, version: row.version };
  }

  await snapshotVersion(row as SectionRow, "move");

  const { error } = await supabaseAdmin.rpc("move_section_atomic", {
    p_slug: doc_slug,
    p_section_id: row.id,
    p_old_position: old_position,
    p_new_position: new_position,
  });
  if (error) throw new Error(error.message);

  const newVersion = row.version + 1;
  await supabaseAdmin
    .from("docs_sections")
    .update({ version: newVersion })
    .eq("id", row.id);

  return { heading, old_position, new_position, version: newVersion };
}

// 9. delete_section (soft-delete, version-guarded)
export async function deleteSection(
  doc_slug: DocSlug,
  heading: string,
  expected_version: number,
) {
  const { data: row } = await supabaseAdmin
    .from("docs_sections")
    .select("*")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (!row) return { error: "section_not_found", doc_slug, heading };
  if (row.version !== expected_version) {
    return {
      error: "version_conflict",
      current_version: row.version,
      current_content: row.content,
    };
  }

  await snapshotVersion(row as SectionRow, "delete");
  const newVersion = row.version + 1;
  const { error } = await supabaseAdmin
    .from("docs_sections")
    .update({ is_current: false, version: newVersion })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
  return { heading, deleted: true, version: newVersion };
}

// 11. list_docs
export async function listDocs() {
  // Fetch both active and trashed to compute `is_trashed` per slug.
  const { data, error } = await supabaseAdmin
    .from("docs_sections")
    .select("doc_slug, updated_at, trashed_at")
    .eq("is_current", true);
  if (error) throw new Error(error.message);
  const map = new Map<
    string,
    {
      doc_slug: string;
      section_count: number;
      last_updated: string | null;
      is_trashed: boolean;
    }
  >();
  for (const slug of VALID_SLUGS) {
    map.set(slug, {
      doc_slug: slug,
      section_count: 0,
      last_updated: null,
      is_trashed: false,
    });
  }
  // A doc is "trashed" when it has ≥1 is_current section AND every one of
  // them carries trashed_at. Partial trashing (some sections trashed, some
  // not) is treated as active with a lower section_count.
  const trashedCounts = new Map<string, number>();
  for (const row of data ?? []) {
    const cur = map.get(row.doc_slug);
    if (!cur) continue;
    if (row.trashed_at) {
      trashedCounts.set(
        row.doc_slug,
        (trashedCounts.get(row.doc_slug) ?? 0) + 1,
      );
      continue; // don't count trashed sections in section_count / last_updated
    }
    map.set(row.doc_slug, {
      doc_slug: cur.doc_slug,
      section_count: cur.section_count + 1,
      last_updated:
        !cur.last_updated || row.updated_at > cur.last_updated
          ? row.updated_at
          : cur.last_updated,
      is_trashed: false,
    });
  }
  // Mark fully-trashed docs (section_count=0 but there were trashed rows).
  for (const [slug, trashed] of trashedCounts) {
    const cur = map.get(slug);
    if (cur && cur.section_count === 0 && trashed > 0) {
      map.set(slug, { ...cur, is_trashed: true });
    }
  }
  return Array.from(map.values());
}

// 10. list_recent_changes
export async function listRecentChanges(doc_slug?: DocSlug, limit = 20) {
  let query = supabaseAdmin
    .from("docs_sections")
    .select("doc_slug, heading, version, updated_at, is_current")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (doc_slug) query = query.eq("doc_slug", doc_slug);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    doc_slug: r.doc_slug,
    heading: r.heading,
    version: r.version,
    updated_at: r.updated_at,
    change_type: r.is_current ? "update" : "delete",
  }));
}

// 12. trash_doc — soft-hide every is_current section of the slug. Idempotent:
// running twice is a no-op on already-trashed sections.
export async function trashDoc(doc_slug: DocSlug) {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("docs_sections")
    .update({ trashed_at: now })
    .eq("doc_slug", doc_slug)
    .eq("is_current", true)
    .is("trashed_at", null)
    .select("id");
  if (error) throw new Error(error.message);
  const sectionCount = (data ?? []).length;
  return {
    doc_slug,
    section_count: sectionCount,
    trashed_at: sectionCount > 0 ? now : null,
    already_trashed: sectionCount === 0,
  };
}

// 13. restore_doc — clear trashed_at on every is_current section of the slug.
export async function restoreDoc(doc_slug: DocSlug) {
  const { data, error } = await supabaseAdmin
    .from("docs_sections")
    .update({ trashed_at: null })
    .eq("doc_slug", doc_slug)
    .eq("is_current", true)
    .not("trashed_at", "is", null)
    .select("id");
  if (error) throw new Error(error.message);
  const sectionCount = (data ?? []).length;
  return {
    doc_slug,
    section_count: sectionCount,
    restored: sectionCount > 0,
  };
}

// 14. delete_doc — hard-delete every section (current + historical) of the
// slug and their version snapshots. Requires confirm=true. Irreversible.
// Cleans docs_section_versions first (defensive; assumes no ON DELETE CASCADE).
export async function deleteDoc(doc_slug: DocSlug, confirm: boolean) {
  if (!confirm) {
    return {
      error: "confirm_required",
      doc_slug,
      hint: "Pass { confirm: true } to hard-delete this doc. Irreversible.",
    };
  }
  // Snapshot the section count first so we can report accurately.
  const { data: sections, error: countErr } = await supabaseAdmin
    .from("docs_sections")
    .select("id")
    .eq("doc_slug", doc_slug);
  if (countErr) throw new Error(countErr.message);
  const sectionCount = (sections ?? []).length;

  if (sectionCount === 0) {
    return { doc_slug, deleted_section_count: 0, already_empty: true };
  }

  const sectionIds = (sections ?? []).map((s) => s.id as string);

  // Defensive: wipe version rows first. If FK is ON DELETE CASCADE, this
  // is a no-op; otherwise it prevents orphans.
  await supabaseAdmin
    .from("docs_section_versions")
    .delete()
    .in("section_id", sectionIds);

  const { error: delErr } = await supabaseAdmin
    .from("docs_sections")
    .delete()
    .eq("doc_slug", doc_slug);
  if (delErr) throw new Error(delErr.message);

  return { doc_slug, deleted_section_count: sectionCount, deleted: true };
}
