import { ensureUserRow, isAdminRole } from "@/lib/users";
import { redirect } from "next/navigation";
import { adminUrl } from "@/lib/admin-url";

export async function GET() {
  const user = await ensureUserRow();
  if (!user) redirect("/sign-in");
  // Signing in syncs a profile; it must never appoint an administrator.
  redirect(isAdminRole(user.role) ? adminUrl() : "https://app.whatelz.ai");
}
