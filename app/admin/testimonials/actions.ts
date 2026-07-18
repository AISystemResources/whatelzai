"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdminRole } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import {
  upsertTestimonial,
  deleteTestimonial,
  type Testimonial,
  type TestimonialCategory,
} from "@/lib/testimonials";

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
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
}

export async function saveTestimonial(
  fields: Partial<Testimonial> & {
    quote: string;
    author_name: string;
    category: TestimonialCategory;
  },
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
