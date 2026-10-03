import { stripAdminPath } from "./domain-routing";

// Keep path-based access for localhost and Vercel preview testing.
export function adminUrl(path = "/admin"): string {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ADMIN_ORIGIN === ""
  )
    return path;
  return `https://admin.whatelz.ai${stripAdminPath(path)}`;
}
