"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdminRole } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  createIncompleteTestimonial,
  deleteTestimonial,
  upsertTestimonial,
  type Testimonial,
  type TestimonialCategory,
  type TestimonialStatus,
} from "@/lib/testimonials";

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
  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");
}

export async function saveTestimonial(
  fields: Partial<Testimonial> & { category: TestimonialCategory },
) {
  await assertAdmin();
  await upsertTestimonial(fields);
  afterWrite();
}

export async function removeTestimonial(id: string) {
  await assertAdmin();
  await deleteTestimonial(id);
  afterWrite();
  redirect("/admin/testimonials");
}

export async function toggleFeatured(id: string, featured: boolean) {
  await assertAdmin();
  const { error } = await supabaseAdmin
    .from("testimonials")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  afterWrite();
}

export async function togglePublished(id: string, published: boolean) {
  await assertAdmin();
  const { error } = await supabaseAdmin
    .from("testimonials")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  afterWrite();
}

export async function setStatus(id: string, status: TestimonialStatus) {
  await assertAdmin();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    moderated_at: now,
    updated_at: now,
  };
  if (status === "approved") patch.published = true;
  if (status === "rejected") {
    patch.published = false;
    patch.featured = false;
  }
  const { error } = await supabaseAdmin.from("testimonials").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  afterWrite();
}

export async function createPrefillTestimonial(input: {
  category: TestimonialCategory;
  author_name?: string;
  author_role?: string;
  author_email?: string;
  author_linkedin_url?: string;
  author_company?: string;
  suggested_question_ids?: string[];
  admin_note?: string;
}) {
  const userId = await assertAdmin();
  const t = await createIncompleteTestimonial({
    ...input,
    created_by_clerk_id: userId,
  });
  afterWrite();
  redirect(`/admin/testimonials/${t.id}`);
}
