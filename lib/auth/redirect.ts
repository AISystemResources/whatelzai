const productionOrigins = new Set([
  "https://whatelz.ai",
  "https://www.whatelz.ai",
  "https://admin.whatelz.ai",
  "https://app.whatelz.ai",
]);

export function safeAuthRedirect(
  value: string | null | undefined,
  origin: string,
): string {
  const fallback = new URL("/", origin).toString();
  if (!value || value.includes("\\")) return fallback;
  try {
    const target = new URL(value, origin);
    if (target.username || target.password) return fallback;
    if (target.origin !== origin && !productionOrigins.has(target.origin))
      return fallback;
    if (!["https:", "http:"].includes(target.protocol)) return fallback;
    return target.toString();
  } catch {
    return fallback;
  }
}

export function authCookieOptions(host: string) {
  const hostname = host.toLowerCase().split(":")[0];
  const shared = [
    "whatelz.ai",
    "www.whatelz.ai",
    "admin.whatelz.ai",
    "app.whatelz.ai",
  ].includes(hostname);
  return {
    path: "/",
    sameSite: "lax" as const,
    ...(shared ? { domain: ".whatelz.ai", secure: true } : {}),
  };
}
