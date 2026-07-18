"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { isAdminRole } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  upsertLandingSection,
  type SectionKey,
  type ProvocationContent,
  type PovContent,
  type TrackRecordContent,
  type TrainingOfferContent,
} from "@/lib/landing-content";

async function assertAdmin(): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  const { data } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!isAdminRole(data?.role as "admin" | "superadmin" | undefined)) {
    throw new Error("Forbidden");
  }
}

async function save<T>(key: SectionKey, body: T) {
  await assertAdmin();
  await upsertLandingSection(key, body);
  revalidatePath("/");
  revalidatePath("/admin/landing");
}

export async function saveProvocation(body: ProvocationContent) {
  await save("provocation", body);
}

export async function savePov(body: PovContent) {
  await save("pov", body);
}

export async function saveTrackRecord(body: TrackRecordContent) {
  await save("track_record", body);
}

export async function saveTrainingOffer(body: TrainingOfferContent) {
  await save("training_offer", body);
}
