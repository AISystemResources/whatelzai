import { createClient } from "@supabase/supabase-js";

// One-time, server-side provisioning after the reviewed identity migration.
// Never match arbitrary new sign-ins by email or write an admin role.
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const legacyKey = process.env.CLERK_SECRET_KEY;
  if (!url || !key || !legacyKey)
    throw new Error(
      "Migration requires the existing Supabase service key and legacy verification key in the local environment.",
    );
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: users, error } = await client
    .from("users")
    .select("id,clerk_user_id,email,supabase_auth_user_id")
    .not("clerk_user_id", "is", null);
  if (error) throw new Error("Apply the approved identity migration first.");
  let migrated = 0;
  for (const user of users ?? []) {
    if (user.supabase_auth_user_id) continue;
    const response = await fetch(
      `https://api.clerk.com/v1/users/${encodeURIComponent(user.clerk_user_id)}`,
      { headers: { Authorization: `Bearer ${legacyKey}` } },
    );
    if (!response.ok)
      throw new Error(
        `Legacy identity verification failed (${response.status}).`,
      );
    const old = (await response.json()) as {
      primary_email_address_id: string;
      email_addresses: {
        id: string;
        email_address: string;
        verification: { status: string };
      }[];
    };
    const email = old.email_addresses.find(
      (e) => e.id === old.primary_email_address_id,
    );
    if (
      !email ||
      email.verification?.status !== "verified" ||
      email.email_address.toLowerCase() !== user.email.toLowerCase()
    )
      throw new Error(
        "A legacy primary email is not a verified match. Resolve the identity manually.",
      );
    // Recover a prior creation if linking was interrupted. Refuse accounts already
    // attached to a different app user, rather than merging memberships/purchases.
    let authId: string | null = null;
    for (let page = 1; ; page++) {
      const result = await client.auth.admin.listUsers({ page, perPage: 1000 });
      if (result.error) throw result.error;
      const match = result.data.users.find(
        (u) => u.email?.toLowerCase() === email.email_address.toLowerCase(),
      );
      if (match) {
        if (!match.email_confirmed_at)
          throw new Error(
            "Existing auth identity is not confirmed; manual review required.",
          );
        authId = match.id;
        break;
      }
      if (result.data.users.length < 1000) break;
    }
    if (!authId) {
      const result = await client.auth.admin.createUser({
        email: email.email_address.toLowerCase(),
        email_confirm: true,
      });
      if (result.error || !result.data.user)
        throw new Error("Supabase identity provisioning failed.");
      authId = result.data.user.id;
    }
    const attached = await client
      .from("users")
      .select("id")
      .eq("supabase_auth_user_id", authId)
      .maybeSingle();
    if (attached.error || (attached.data && attached.data.id !== user.id))
      throw new Error(
        "Auth identity is already linked to another internal user; manual review required.",
      );
    const linked = await client
      .from("users")
      .update({ supabase_auth_user_id: authId })
      .eq("id", user.id)
      .is("supabase_auth_user_id", null)
      .select("id")
      .single();
    if (linked.error || !linked.data)
      throw new Error("Identity link failed; no roles were changed.");
    migrated++;
  }
  console.log(
    `Preserved ${migrated} legacy account identities. No roles or team links assigned.`,
  );
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Migration failed");
  process.exitCode = 1;
});
