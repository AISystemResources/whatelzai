import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { authCookieOptions } from "@/lib/auth/redirect";
import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import { domainRoute } from "@/lib/domain-routing";

export default async function proxy(req: NextRequest) {
  const route = domainRoute(
    req.headers.get("host") ?? req.nextUrl.host,
    req.nextUrl.pathname,
  );
  if (route.redirect) {
    const destination = new URL(route.redirect);
    destination.search = req.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  let sessionResponse = NextResponse.next({ request: req });
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions(req.headers.get("host") ?? ""),
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(values, cacheHeaders) {
          values.forEach(({ name, value }) => req.cookies.set(name, value));
          sessionResponse = NextResponse.next({ request: req });
          values.forEach(({ name, value, options }) =>
            sessionResponse.cookies.set(name, value, options),
          );
          Object.entries(cacheHeaders).forEach(([name, value]) =>
            sessionResponse.headers.set(name, value),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await client.auth.getUser();
  function finish(response: NextResponse) {
    for (const cookie of sessionResponse.cookies.getAll())
      response.cookies.set(cookie);
    for (const name of ["cache-control", "expires", "pragma"]) {
      const value = sessionResponse.headers.get(name);
      if (value) response.headers.set(name, value);
    }
    if (
      user ||
      route.protect ||
      req.nextUrl.pathname.startsWith("/auth/") ||
      req.nextUrl.pathname.startsWith("/sign-")
    )
      response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  if (route.protect) {
    const userId = user?.email_confirmed_at ? user.id : null;
    if (!userId) {
      const visibleUrl = new URL(req.url);
      visibleUrl.host = req.headers.get("host") ?? req.nextUrl.host;
      const signIn = new URL("/sign-in", visibleUrl);
      signIn.searchParams.set("redirect_url", visibleUrl.toString());
      return finish(NextResponse.redirect(signIn));
    }
    // Server Actions run independently of the layout's role check.
    const adminRequest =
      route.surface === "admin" ||
      req.nextUrl.pathname === "/admin" ||
      req.nextUrl.pathname.startsWith("/admin/");
    if (adminRequest && req.method !== "GET" && req.method !== "HEAD") {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("supabase_auth_user_id", userId)
        .maybeSingle();
      if (error || !isAdminRole(data?.role))
        return finish(
          NextResponse.json(
            { error: "Admin access required" },
            { status: 403 },
          ),
        );
    }
  }

  const headers = new Headers(req.headers);
  // Always overwrite this header; callers cannot choose their shell.
  headers.set("x-whatelz-surface", route.surface);
  const response = route.rewrite
    ? NextResponse.rewrite(
        new URL(route.rewrite + req.nextUrl.search, req.url),
        { request: { headers } },
      )
    : NextResponse.next({ request: { headers } });
  if (route.surface !== "public")
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return finish(response);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)((?!inngest|oauth).)*",
  ],
};
