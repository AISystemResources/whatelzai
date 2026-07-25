"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdminRole } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import { deleteService, upsertService, type Service } from "@/lib/services";

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

function afterWrite() {
  revalidatePath("/services");
  revalidatePath("/services/[slug]", "page");
  revalidatePath("/admin/services");
}

export async function saveService(
  fields: Partial<Service> & { slug: string; name: string; category: string },
) {
  await assertAdmin();
  await upsertService(fields);
  afterWrite();
}

export async function removeService(id: string) {
  await assertAdmin();
  await deleteService(id);
  afterWrite();
  redirect("/admin/services");
}
