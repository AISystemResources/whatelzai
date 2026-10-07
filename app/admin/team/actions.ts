"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function linkTeamAccount(form: FormData): Promise<void> {
  await requireAdmin();
  const input = z
    .object({
      team_id: z.uuid(),
      person_id: z.uuid(),
      user_id: z.uuid(),
      access_role: z.enum(["member", "manager"]),
    })
    .parse(Object.fromEntries(form));
  // Insert only: replacing a verified identity needs a separate reviewed flow.
  const { error } = await supabaseAdmin
    .from("business_team_accounts")
    .insert(input);
  if (error)
    throw new Error(
      "Account could not be linked. Check whether it is already linked.",
    );
  revalidatePath("/admin/team");
  revalidatePath("/team");
}

export async function updateTeamPerson(form: FormData): Promise<void> {
  await requireAdmin();
  const blankToNull = (value: FormDataEntryValue | null) =>
    typeof value === "string" && value.trim() ? value.trim() : null;
  const input = z
    .object({
      team_id: z.uuid(),
      person_id: z.uuid(),
      email: z.email().max(254).nullable(),
      abo_number: z
        .string()
        .regex(/^[0-9]{1,20}$/)
        .nullable(),
    })
    .parse({
      team_id: form.get("team_id"),
      person_id: form.get("person_id"),
      email: blankToNull(form.get("email"))?.toLowerCase() ?? null,
      abo_number: blankToNull(form.get("abo_number")),
    });
  const { data, error } = await supabaseAdmin
    .from("business_team_people")
    .update({ email: input.email, abo_number: input.abo_number })
    .eq("team_id", input.team_id)
    .eq("id", input.person_id)
    .select("id")
    .single();
  if (error || !data)
    throw new Error(
      "Profile could not be saved. Check the email and ABO number.",
    );
  revalidatePath("/admin/team");
  revalidatePath("/team");
}
