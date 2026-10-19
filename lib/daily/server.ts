import "server-only";
import { notFound } from "next/navigation";
import { isOwnerUser } from "@/lib/admin-policy";
import { ensureUserRow } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import { type Task } from "./model";

export async function dailyOwner() {
  const user = await ensureUserRow();
  if (!isOwnerUser(user)) notFound();
  return user!.id;
}
export async function loadDailyTasks(day: string) {
  const owner = await dailyOwner();
  const { data, error } = await supabaseAdmin
    .from("daily_tasks")
    .select("id,title,lane,due_on,status,revision,accepted_on,completed_at")
    .eq("owner_id", owner)
    .not("status", "in", "(done,dropped)")
    .order("due_on")
    .order("created_at")
    .limit(100);
  if (error)
    throw new Error("Commitments could not be loaded. Please try again.");
  const completed = await supabaseAdmin
    .from("daily_tasks")
    .select("id,title,lane,due_on,status,revision,accepted_on,completed_at")
    .eq("owner_id", owner)
    .eq("completed_on", day)
    .order("completed_at")
    .limit(100);
  if (completed.error)
    throw new Error("Completed commitments could not be loaded.");
  return {
    active: (data ?? []) as Task[],
    completed: (completed.data ?? []) as Task[],
  };
}
