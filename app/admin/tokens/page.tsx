import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase-server";
import { TokensAdmin, type TokenRow } from "./_components/TokensAdmin";

export const metadata: Metadata = { title: "Tokens — Admin" };
export const dynamic = "force-dynamic";

export default async function TokensAdminPage() {
  const { data } = await supabaseAdmin
    .from("auth_tokens")
    .select(
      "id, name, scopes, rate_limit_tier, expires_at, last_used_at, created_at, revoked_at",
    )
    .order("created_at", { ascending: false });

  const tokens = (data ?? []) as TokenRow[];

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Tokens
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Issue and revoke API tokens for the whatelz CLI and future agents.
          Owner tokens carry <code className="text-xs">*</code>; agent tokens
          should be scoped narrowly (e.g.{" "}
          <code className="text-xs">blog:*</code>). Raw token values are shown
          once at issue time and never again.
        </p>
      </header>

      <TokensAdmin initialTokens={tokens} />
    </div>
  );
}
