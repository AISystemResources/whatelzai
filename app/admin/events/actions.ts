"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdminRole } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  upsertServiceEvent,
  deleteServiceEvent,
  type ServiceEvent,
  type ServiceEventKind,
} from "@/lib/service-events";

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

function afterWrite() {
  revalidatePath("/admin/events");
  revalidatePath("/admin/testimonials");
}

export async function saveEvent(
  fields: Partial<ServiceEvent> & { slug: string; name: string; kind: ServiceEventKind },
) {
  await assertAdmin();
  const saved = await upsertServiceEvent(fields);
  afterWrite();
  if (!fields.id) redirect(`/admin/events/${saved.id}`);
}

export async function removeEvent(id: string) {
  await assertAdmin();
  await deleteServiceEvent(id);
  afterWrite();
  redirect("/admin/events");
}
