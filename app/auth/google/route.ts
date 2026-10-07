import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/auth-server";
import { safeAuthRedirect } from "@/lib/auth/redirect";

export async function POST(req: NextRequest) {
  const origin = new URL(req.url).origin;
  if (req.headers.get("origin") !== origin)
    return new Response("Forbidden", { status: 403 });
  const form = await req.formData();
  const next = safeAuthRedirect(
    typeof form.get("next") === "string" ? String(form.get("next")) : null,
    origin,
  );
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", next);
  const client = await createAuthClient();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url)
    return NextResponse.redirect(new URL("/sign-in?error=google", origin), 303);
  const response = NextResponse.redirect(data.url, 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
