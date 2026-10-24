export const adminWorkstreams = [
  { label: "Overview", path: "/admin" },
  { label: "Personal", path: "/admin/personal" },
  { label: "AI Business", path: "/admin/ai-business" },
  { label: "Network Marketing", path: "/admin/network-marketing" },
  { label: "Day Job", path: "/admin/day-job" },
] as const;

export function cleanAdminPath(pathname: string) {
  return pathname.replace(/^\/admin(?=\/|$)/, "") || "/";
}
const within = (path: string, root: string) =>
  path === root || path.startsWith(root + "/");

export function adminNavigation(pathname: string) {
  const path = cleanAdminPath(pathname);
  if (within(path, "/users"))
    return { tab: "users" as const, workstream: null };
  if (["/settings", "/tokens", "/developer"].some((root) => within(path, root)))
    return { tab: "settings" as const, workstream: null };
  const workstream = ["/network-marketing", "/team", "/calendar-access"].some(
    (root) => within(path, root),
  )
    ? "Network Marketing"
    : within(path, "/personal")
      ? "Personal"
      : within(path, "/day-job")
        ? "Day Job"
        : path === "/" ||
            within(path, "/today") ||
            within(path, "/command-center")
          ? "Overview"
          : "AI Business";
  return { tab: "home" as const, workstream };
}
