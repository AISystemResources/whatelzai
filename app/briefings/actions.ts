"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";
import { briefingSchema } from "@/lib/fcos/model";
import { fcosOwner } from "@/lib/fcos/server";
export async function saveBriefing(
  _state: { error?: string },
  form: FormData,
): Promise<{ error?: string }> {
  const owner = await fcosOwner();
  const parsed = briefingSchema.safeParse({
    ...Object.fromEntries(form),
    lead_ids: form.getAll("lead_ids"),
  });
  if (!parsed.success)
    return { error: "Check the title, date and note fields before saving." };
  const { id, revision, ...fields } = parsed.data;
  let result;
  if (revision === 0)
    result = await supabaseAdmin
      .from("member_briefings")
      .insert({ ...fields, id, revision: 1, owner_id: owner })
      .select("id")
      .single();
  else
    result = await supabaseAdmin
      .from("member_briefings")
      .update({
        ...fields,
        revision: revision + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("owner_id", owner)
      .eq("revision", revision)
      .select("id")
      .maybeSingle();
  if (result.error || !result.data)
    return {
      error:
        "Could not save. A linked lead may be unavailable, or this note changed in another session. Your draft remains in this form.",
    };
  revalidatePath("/briefings");
  revalidatePath("/member-home");
  revalidatePath(`/briefings/${id}`);
  redirect(`/briefings/${id}?saved=1`);
}
