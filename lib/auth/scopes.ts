// Scope catalog + wildcard matcher for token-based auth.
// Format: `resource:action` or `resource:sub:action`. `*` is the owner wildcard.
// `blog:*` matches any `blog:*` scope; nested wildcards are not supported.

export const SCOPES = {
  blog: ["read", "write", "publish", "delete"],
  newsletter: ["write", "send", "subscribers:read", "subscribers:manage"],
  services: ["read", "write", "delete"],
  testimonials: ["read", "write", "feature"],
  sections: ["read", "write"],
  dashboard: ["read", "write"],
  docs: ["read", "write"],
  hackathons: ["read"],
  offers: ["read"],
  events: ["read"],
  tokens: ["manage"],
} as const;

export const OWNER_SCOPE = "*" as const;

export type ScopeResource = keyof typeof SCOPES;

// Flat list of every concrete scope, e.g. 'blog:write', 'newsletter:subscribers:read'.
export const ALL_SCOPES: readonly string[] = Object.entries(SCOPES).flatMap(
  ([resource, actions]) => actions.map((a) => `${resource}:${a}`),
);

export function matchesScope(
  required: string,
  granted: readonly string[],
): boolean {
  if (granted.includes(OWNER_SCOPE)) return true;
  if (granted.includes(required)) return true;

  // Prefix wildcards: 'blog:*' matches 'blog:write', 'blog:read', etc.
  const firstColon = required.indexOf(":");
  if (firstColon === -1) return false;
  const resourcePrefix = required.slice(0, firstColon) + ":*";
  return granted.includes(resourcePrefix);
}
