import { supabaseAdmin } from "./supabase-server";
import {
  upsertEvent,
  deleteEventByLegacyHackathonId,
  type EventType,
} from "./events";

// PHASE 1 dual-write helper. Mirrors a hackathon row into the unified events
// table. Called from upsertHackathon/deleteHackathon below. Wrapped in
// try/catch by callers so a mirror failure does not fail the primary write.
async function mirrorHackathonToEvents(h: Hackathon): Promise<void> {
  await upsertEvent({
    type: "hackathon" as EventType,
    name: h.name,
    slug: h.slug,
    date: h.date,
    location: h.location,
    published: h.published,
    metadata: {
      organizer: h.organizer,
      awards: h.awards,
      demo_url: h.demo_url,
      writeup: h.writeup,
      tags: h.tags,
      thumbnail_url: h.thumbnail_url,
      team: h.team,
      tier: h.tier,
      project_name: h.project_name,
      content: h.content ?? null,
    },
    legacy_hackathon_id: h.id,
  });
}

export type HackathonAward = {
  title: string;
  track?: string;
};

export type Hackathon = {
  id: string;
  slug: string;
  name: string;
  organizer: string | null;
  date: string;
  location: string | null;
  awards: HackathonAward[];
  demo_url: string | null;
  writeup: string;
  tags: string[];
  thumbnail_url: string | null;
  published: boolean;
  team: string[];
  tier: "coding" | "non-coding";
  project_name: string | null;
  content?: string | null;
  created_at: string;
  updated_at: string;
};

const AWARD_RANK: Record<string, number> = {
  champion: 1,
  "first place": 1,
  "1st place": 1,
  "second place": 2,
  "2nd place": 2,
  "third place": 3,
  "3rd place": 3,
  finalist: 4,
  "special award": 5,
  participant: 6,
};

export function awardRankScore(awards: HackathonAward[]): number {
  if (!awards.length) return 99;
  const scores = awards.map((a) => {
    const key = a.title.toLowerCase();
    for (const [pattern, score] of Object.entries(AWARD_RANK)) {
      if (key.includes(pattern)) return score;
    }
    return 7;
  });
  return Math.min(...scores);
}

export async function listHackathons(
  publishedOnly = true,
): Promise<Hackathon[]> {
  let q = supabaseAdmin.from("hackathons").select("*");
  if (publishedOnly) q = q.eq("published", true);
  const { data, error } = await q.order("date", { ascending: false });
  if (error) throw new Error(`listHackathons: ${error.message}`);
  return (data ?? []) as Hackathon[];
}

export async function getHackathon(id: string): Promise<Hackathon | null> {
  const { data, error } = await supabaseAdmin
    .from("hackathons")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getHackathon: ${error.message}`);
  return data as Hackathon | null;
}

export async function getHackathonBySlug(
  slug: string,
): Promise<Hackathon | null> {
  const { data, error } = await supabaseAdmin
    .from("hackathons")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getHackathonBySlug: ${error.message}`);
  return data as Hackathon | null;
}

export async function upsertHackathon(
  fields: Partial<Hackathon> & { name: string; date: string },
  id?: string,
): Promise<Hackathon> {
  const payload = {
    ...fields,
    updated_at: new Date().toISOString(),
    ...(id ? { id } : {}),
  };
  const { data, error } = await supabaseAdmin
    .from("hackathons")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw new Error(`upsertHackathon: ${error.message}`);
  const saved = data as Hackathon;
  // Dual-write mirror (Phase 1). Failure here is logged but doesn't break
  // the source write — Phase 2 flip depends on this, so any drift will be
  // reconcilable via re-backfill.
  try {
    await mirrorHackathonToEvents(saved);
  } catch (err) {
    console.warn(
      `[phase1-dual-write] mirrorHackathonToEvents failed for ${saved.id}:`,
      err,
    );
  }
  return saved;
}

export async function deleteHackathon(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("hackathons")
    .delete()
    .eq("id", id);
  if (error) throw new Error(`deleteHackathon: ${error.message}`);
  try {
    await deleteEventByLegacyHackathonId(id);
  } catch (err) {
    console.warn(
      `[phase1-dual-write] deleteEventByLegacyHackathonId failed for ${id}:`,
      err,
    );
  }
}
