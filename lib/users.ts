import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "./supabase-server";

export type UserRole = "superadmin" | "admin" | "unauthorized";

// Roles that can access the /admin dashboard. Superadmin additionally
// can promote/demote other users (enforced in admin UI, not here).
export const ADMIN_ROLES: readonly UserRole[] = ["superadmin", "admin"];

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "superadmin" || role === "admin";
}

export function isSuperAdminRole(role: UserRole | null | undefined): boolean {
  return role === "superadmin";
}

export interface AppUser {
  id: string;
  clerk_user_id: string;
  email: string;
  role: UserRole;
  name: string | null;
  image_url: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

// Upserts the current Clerk-signed-in user into the users table and returns the row.
// New sign-ins land with role='unauthorized' by default — admins are promoted manually.
// Returns null if no Clerk session.
export async function ensureUserRow(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;
  const imageUrl = user?.imageUrl ?? null;
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        clerk_user_id: userId,
        email,
        name,
        image_url: imageUrl,
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: "clerk_user_id", ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) throw new Error(`ensureUserRow: ${error.message}`);
  return data as AppUser;
}

// Lightweight admin check without upserting — for hot paths like layout.
// Returns false if not signed in, or if the row is missing / not admin.
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const { data } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  return isAdminRole(data?.role as UserRole | undefined);
}
