import { supabaseAdmin } from "./supabase-server";

// ELZ OS tenant docs library. Mirrors lib/website-docs.ts but scoped to the
// `elzos` schema and with an `author` parameter on all writes (stored in
// updated_by).

export type DocSlug =
  | "INSTRUCTIONS"
  | "CONTEXT"
  | "BUILD"
  | "USERMANUAL"
  | "METHODOLOGY"
  | "INBOX";

export const VALID_SLUGS: DocSlug[] = [
  "INSTRUCTIONS",
  "CONTEXT",
  "BUILD",
  "USERMANUAL",
  "METHODOLOGY",
  "INBOX",
];

const DEFAULT_AUTHOR = "mcp:elzos:unknown";

const sections = () => supabaseAdmin.schema("elzos").from("docs_sections");
const versions = () =>
  supabaseAdmin.schema("elzos").from("docs_section_versions");
const rpc = () => supabaseAdmin.schema("elzos");

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

async function snapshotVersion(
  row: SectionRow,
  capturedBy: string,
  author: string,
) {
  const { error } = await versions().insert({
    section_id: row.id,
    doc_slug: row.doc_slug,
    heading: row.heading,
    position: row.position,
    content: row.content,
    version: row.version,
    captured_by: capturedBy,
    updated_by: author,
  });
  if (error) throw new Error(`version_snapshot_failed: ${error.message}`);
}

// list_docs — count current sections per slug
export async function listDocs() {
  const { data, error } = await sections()
    .select("doc_slug, updated_at")
    .eq("is_current", true);
  if (error) throw new Error(error.message);
  const map = new Map<
    string,
    { doc_slug: string; section_count: number; last_updated: string | null }
  >();
  for (const slug of VALID_SLUGS) {
    map.set(slug, { doc_slug: slug, section_count: 0, last_updated: null });
  }
  for (const row of data ?? []) {
    const cur = map.get(row.doc_slug);
    if (!cur) continue;
    const next = {
      doc_slug: cur.doc_slug,
      section_count: cur.section_count + 1,
      last_updated:
        !cur.last_updated || row.updated_at > cur.last_updated
          ? row.updated_at
          : cur.last_updated,
    };
    map.set(row.doc_slug, next);
  }
  return Array.from(map.values());
}

export async function listSections(doc_slug: DocSlug) {
  const { data, error } = await sections()
    .select("heading, position, version, updated_at, content")
    .eq("doc_slug", doc_slug)
    .eq("is_current", true)
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

export async function readSection(doc_slug: DocSlug, heading: string) {
  const { data, error } = await sections()
    .select("heading, content, version, updated_at")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { error: "section_not_found", doc_slug, heading };
  return data;
}

export async function readDoc(doc_slug: DocSlug) {
  const { data, error } = await sections()
    .select("heading, content, position, version, updated_at")
    .eq("doc_slug", doc_slug)
    .eq("is_current", true)
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

export async function createSection(
  doc_slug: DocSlug,
  heading: string,
  content: string,
  position?: number,
  author: string = DEFAULT_AUTHOR,
) {
  const { data: existing } = await sections()
    .select("id")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .maybeSingle();
  if (existing) return { error: "duplicate_heading", doc_slug, heading };

  let finalPosition = position;
  if (finalPosition === undefined) {
    const { data: maxRow } = await sections()
      .select("position")
      .eq("doc_slug", doc_slug)
      .eq("is_current", true)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    finalPosition = maxRow ? maxRow.position + 1 : 0;
  } else {
    await rpc().rpc("shift_positions_up", {
      p_slug: doc_slug,
      p_from: finalPosition,
    });
  }

  const { data, error } = await sections()
    .insert({
      doc_slug,
      heading,
      position: finalPosition,
      content,
      version: 1,
      updated_by: author,
    })
    .select("heading, position, version")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function appendSection(
  doc_slug: DocSlug,
  heading: string,
  content: string,
  create_if_missing: boolean = true,
  author: string = DEFAULT_AUTHOR,
) {
  const { data: existing } = await sections()
    .select("id, doc_slug, heading, position, content, version")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .maybeSingle();

  if (!existing) {
    if (!create_if_missing)
      return { error: "section_not_found", doc_slug, heading };
    return createSection(doc_slug, heading, content, undefined, author);
  }

  await snapshotVersion(existing as SectionRow, "append", author);
  const newContent = existing.content + "\n\n" + content;
  const newVersion = existing.version + 1;
  const { error } = await sections()
    .update({ content: newContent, version: newVersion, updated_by: author })
    .eq("id", existing.id);
  if (error) throw new Error(error.message);
  return { heading, version: newVersion };
}

export async function patchSection(
  doc_slug: DocSlug,
  heading: string,
  new_content: string,
  expected_version: number,
  author: string = DEFAULT_AUTHOR,
) {
  const { data: row } = await sections()
    .select("*")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .maybeSingle();

  if (!row) return { error: "section_not_found", doc_slug, heading };
  if (row.version !== expected_version) {
    return {
      error: "version_conflict",
      current_version: row.version,
      current_content: row.content,
    };
  }

  await snapshotVersion(row as SectionRow, "patch", author);
  const newVersion = row.version + 1;
  const { error } = await sections()
    .update({
      content: new_content,
      version: newVersion,
      updated_by: author,
    })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
  return { heading, version: newVersion };
}

export async function renameSection(
  doc_slug: DocSlug,
  old_heading: string,
  new_heading: string,
  expected_version: number,
  author: string = DEFAULT_AUTHOR,
) {
  const { data: row } = await sections()
    .select("*")
    .eq("doc_slug", doc_slug)
    .eq("heading", old_heading)
    .eq("is_current", true)
    .maybeSingle();

  if (!row)
    return { error: "section_not_found", doc_slug, heading: old_heading };
  if (row.version !== expected_version) {
    return {
      error: "version_conflict",
      current_version: row.version,
      current_content: row.content,
    };
  }

  const { data: dup } = await sections()
    .select("id")
    .eq("doc_slug", doc_slug)
    .eq("heading", new_heading)
    .eq("is_current", true)
    .maybeSingle();
  if (dup)
    return { error: "duplicate_heading", doc_slug, heading: new_heading };

  await snapshotVersion(row as SectionRow, "rename", author);
  const newVersion = row.version + 1;
  const { error } = await sections()
    .update({
      heading: new_heading,
      version: newVersion,
      updated_by: author,
    })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
  return { old_heading, new_heading, version: newVersion };
}

export async function moveSection(
  doc_slug: DocSlug,
  heading: string,
  new_position: number,
  expected_version: number,
  author: string = DEFAULT_AUTHOR,
) {
  const { data: row } = await sections()
    .select("*")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
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

  await snapshotVersion(row as SectionRow, "move", author);

  const { error } = await rpc().rpc("move_section_atomic", {
    p_slug: doc_slug,
    p_section_id: row.id,
    p_old_position: old_position,
    p_new_position: new_position,
  });
  if (error) throw new Error(error.message);

  const newVersion = row.version + 1;
  await sections()
    .update({ version: newVersion, updated_by: author })
    .eq("id", row.id);

  return { heading, old_position, new_position, version: newVersion };
}

export async function deleteSection(
  doc_slug: DocSlug,
  heading: string,
  expected_version: number,
  force: boolean = false,
  author: string = DEFAULT_AUTHOR,
) {
  const { data: row } = await sections()
    .select("*")
    .eq("doc_slug", doc_slug)
    .eq("heading", heading)
    .eq("is_current", true)
    .maybeSingle();

  if (!row) return { error: "section_not_found", doc_slug, heading };
  if (row.version !== expected_version) {
    return {
      error: "version_conflict",
      current_version: row.version,
      current_content: row.content,
    };
  }

  const trimmed = (row.content ?? "").trim();
  if (!force && trimmed.length > 0) {
    return {
      error: "content_non_empty",
      doc_slug,
      heading,
      content_length: row.content.length,
      excerpt: row.content.slice(0, 200),
      hint: "Pass force=true to confirm deletion.",
    };
  }

  await snapshotVersion(row as SectionRow, "delete", author);
  const newVersion = row.version + 1;
  const { error } = await sections()
    .update({
      is_current: false,
      version: newVersion,
      updated_by: author,
    })
    .eq("id", row.id);
  if (error) throw new Error(error.message);
  return { heading, deleted: true, version: newVersion };
}

export async function listRecentChanges(
  doc_slug?: DocSlug,
  since?: string,
  limit: number = 20,
) {
  let query = sections()
    .select("doc_slug, heading, version, updated_at, updated_by, is_current")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (doc_slug) query = query.eq("doc_slug", doc_slug);
  if (since) query = query.gte("updated_at", since);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    doc_slug: r.doc_slug,
    heading: r.heading,
    version: r.version,
    updated_at: r.updated_at,
    updated_by: r.updated_by,
    change_type: r.is_current ? "update" : "delete",
  }));
}
