"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdminRole } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  createInvite,
  deleteInvite,
  type InvitePrefill,
} from "@/lib/testimonial-invites";

async function assertAdmin(): Promise<string> {
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
  return userId;
}

export async function createInviteAction(
  prefill: InvitePrefill,
  note: string | null,
) {
  const userId = await assertAdmin();
  const invite = await createInvite(prefill, note, userId);
  revalidatePath("/admin/testimonials/invites");
  redirect(`/admin/testimonials/invites?created=${invite.token}`);
}

export async function deleteInviteAction(id: string) {
  await assertAdmin();
  await deleteInvite(id);
  revalidatePath("/admin/testimonials/invites");
}
