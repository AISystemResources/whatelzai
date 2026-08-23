import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";

export interface PlaybookChapter {
  id: string;
  slug: string;
  title: string;
  part: 1 | 2 | 3 | 4;
  ordinal: number;
  published: boolean;
}

export const listPublishedChapters = cache(
  async (): Promise<PlaybookChapter[]> => {
    const { data, error } = await supabaseAdmin
      .from("playbook_chapters")
      .select("id, slug, title, part, ordinal, published")
      .eq("published", true)
      .order("part", { ascending: true })
      .order("ordinal", { ascending: true });
    if (error) return [];
    return (data ?? []) as PlaybookChapter[];
  },
);

export async function getChapterBySlug(
  slug: string,
): Promise<PlaybookChapter | null> {
  const { data, error } = await supabaseAdmin
    .from("playbook_chapters")
    .select("id, slug, title, part, ordinal, published")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data as PlaybookChapter | null;
}

// Per-archetype ordering. Reads chapter_order from quiz_archetypes; if null,
// falls back to (part, ordinal) default. Returns published chapters only,
// in the resolved order.
export async function getReadingOrderForArchetype(
  archetypeSlug: string | null,
): Promise<PlaybookChapter[]> {
  const published = await listPublishedChapters();
  if (!archetypeSlug || published.length === 0) return published;

  const { data, error } = await supabaseAdmin
    .from("quiz_archetypes")
    .select("chapter_order")
    .eq("slug", archetypeSlug)
    .maybeSingle();
  if (error || !data?.chapter_order) return published;

  const order = data.chapter_order as unknown;
  if (!Array.isArray(order)) return published;

  const bySlug = new Map(published.map((c) => [c.slug, c]));
  const ordered: PlaybookChapter[] = [];
  for (const s of order) {
    if (typeof s !== "string") continue;
    const c = bySlug.get(s);
    if (c) {
      ordered.push(c);
      bySlug.delete(s);
    }
  }
  // Anything published-but-not-in-the-archetype-order lands at the end.
  for (const c of bySlug.values()) ordered.push(c);
  return ordered;
}
