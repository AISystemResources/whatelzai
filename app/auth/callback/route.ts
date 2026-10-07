import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/auth-server";
import { safeAuthRedirect } from "@/lib/auth/redirect";
import { ensureUserRow } from "@/lib/users";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const client = await createAuthClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error && (await ensureUserRow())) {
      const response = NextResponse.redirect(
        safeAuthRedirect(url.searchParams.get("next"), url.origin),
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  }
  return NextResponse.redirect(new URL("/sign-in?error=callback", url.origin));
}
