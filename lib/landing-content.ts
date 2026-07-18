import { cache } from "react";
import { supabaseAdmin } from "./supabase-server";

export interface ProvocationContent {
  eyebrow: string;
  heading: string;
  body: string;
}

export interface PovBelief {
  n: string;
  title: string;
  body: string;
}

export interface PovContent {
  eyebrow: string;
  heading: string;
  beliefs: PovBelief[];
}

export interface TrackRecordStat {
  value: string;
  label: string;
}

export interface TrackRecordLink {
  href: string;
  label: string;
}

export interface TrackRecordContent {
  eyebrow: string;
  heading: string;
  stats: TrackRecordStat[];
  links_heading: string;
  links: TrackRecordLink[];
}

export interface TrainingOfferContent {
  eyebrow: string;
  heading: string;
  body: string;
  pricing_note: string;
  primary_cta_label: string;
  primary_cta_type: "email" | "url";
  primary_cta_subject?: string;
  primary_cta_url?: string;
  secondary_cta_label?: string;
  secondary_cta_url?: string;
}

export type SectionKey =
  | "provocation"
  | "pov"
  | "track_record"
  | "training_offer";

const FALLBACKS: {
  provocation: ProvocationContent;
  pov: PovContent;
  track_record: TrackRecordContent;
  training_offer: TrainingOfferContent;
} = {
  provocation: {
    eyebrow: "The gap",
    heading:
      "Your team has AI accounts.\nYour team doesn't have {{accent:AI workflows}}.",
    body: "That gap isn't a tools problem. It's a training problem.",
  },
  pov: {
    eyebrow: "What I think",
    heading: "Three things about AI training\nyou don't hear enough.",
    beliefs: [],
  },
  track_record: {
    eyebrow: "The work",
    heading: "In case you were checking.",
    stats: [],
    links_heading: "Dig deeper",
    links: [],
  },
  training_offer: {
    eyebrow: "The ask",
    heading: "Book me to {{accent:train your team.}}",
    body: "Half-day or full-day. Tailored to your team's stack.",
    pricing_note: "",
    primary_cta_label: "Book a training session",
    primary_cta_type: "email",
    primary_cta_subject: "AI Training enquiry",
  },
};

// Cached per-request read of a single section.
async function readSection(key: SectionKey): Promise<unknown> {
  const { data, error } = await supabaseAdmin
    .from("landing_content")
    .select("body")
    .eq("section_key", key)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || /schema cache/i.test(error.message)) {
      return null;
    }
    throw new Error(`landing_content(${key}): ${error.message}`);
  }
  return data?.body ?? null;
}

export const getProvocationContent = cache(
  async (): Promise<ProvocationContent> =>
    ((await readSection("provocation")) as ProvocationContent | null) ??
    FALLBACKS.provocation,
);

export const getPovContent = cache(
  async (): Promise<PovContent> =>
    ((await readSection("pov")) as PovContent | null) ?? FALLBACKS.pov,
);

export const getTrackRecordContent = cache(
  async (): Promise<TrackRecordContent> =>
    ((await readSection("track_record")) as TrackRecordContent | null) ??
    FALLBACKS.track_record,
);

export const getTrainingOfferContent = cache(
  async (): Promise<TrainingOfferContent> =>
    ((await readSection("training_offer")) as TrainingOfferContent | null) ??
    FALLBACKS.training_offer,
);

export async function upsertLandingSection(
  key: SectionKey,
  body: unknown,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("landing_content")
    .upsert(
      { section_key: key, body, updated_at: new Date().toISOString() },
      { onConflict: "section_key" },
    );
  if (error) throw new Error(`upsertLandingSection: ${error.message}`);
}
