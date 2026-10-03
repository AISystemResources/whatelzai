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
