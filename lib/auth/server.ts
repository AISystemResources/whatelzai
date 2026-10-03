import "server-only";
import { ensureUserRow } from "@/lib/users";

// All application ownership keys use users.id, never an auth provider ID.
export async function auth() {
  const user = await ensureUserRow();
  return { userId: user?.id ?? null };
}
export const currentUser = ensureUserRow;
