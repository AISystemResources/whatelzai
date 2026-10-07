"use server";
import { adminUrl } from "@/lib/admin-url";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { isAdminRole } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  deleteTemplate,
  upsertTemplate,
  type UpsertTemplateInput,
} from "@/lib/testimonial-templates";

async function assertAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not signed in");
  const { data } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!isAdminRole(data?.role as "admin" | "superadmin" | undefined)) {
    throw new Error("Forbidden");
  }
  return userId;
}

function afterWrite() {
  revalidatePath("/admin/testimonials/templates");
  revalidatePath("/admin/testimonials/templates/[id]", "page");
}

export async function saveTemplate(input: UpsertTemplateInput) {
  const userId = await assertAdmin();
  const withOwner: UpsertTemplateInput = input.id
    ? input
    : { ...input, created_by_clerk_id: userId };
  const saved = await upsertTemplate(withOwner);
  afterWrite();
  if (!input.id)
    redirect(adminUrl(`/admin/testimonials/templates/${saved.id}`));
}

export async function removeTemplate(id: string) {
  await assertAdmin();
  await deleteTemplate(id);
  afterWrite();
  redirect(adminUrl("/admin/testimonials/templates"));
}
