import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/users";
import { domainRoute } from "@/lib/domain-routing";

export default clerkMiddleware(async (auth, req) => {
  const route = domainRoute(
    req.headers.get("host") ?? req.nextUrl.host,
    req.nextUrl.pathname,
  );
  if (route.redirect) {
    const destination = new URL(route.redirect);
    destination.search = req.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  if (route.protect) {
    const { userId } = await auth();
    if (!userId) {
      const visibleUrl = new URL(req.url);
      visibleUrl.host = req.headers.get("host") ?? req.nextUrl.host;
      const signIn = new URL("/sign-in", visibleUrl);
      signIn.searchParams.set("redirect_url", visibleUrl.toString());
      return NextResponse.redirect(signIn);
    }
    // Server Actions run independently of the layout's role check.
    const adminRequest =
      route.surface === "admin" ||
      req.nextUrl.pathname === "/admin" ||
      req.nextUrl.pathname.startsWith("/admin/");
    if (
      adminRequest &&
      req.method !== "GET" &&
      req.method !== "HEAD" &&
      !(await isCurrentUserAdmin())
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
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
  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)((?!inngest|oauth).)*",
  ],
};
