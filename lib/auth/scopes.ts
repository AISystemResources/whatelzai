// Scope catalog + wildcard matcher for token-based auth.
// Format: `resource:action` or `resource:sub:action`. `*` is the owner wildcard.
// `blog:*` matches any `blog:*` scope; nested wildcards are not supported.

export const SCOPES = {
  blog: ["read", "write", "publish", "delete"],
  newsletter: [
    "read",
    "write",
    "send",
    "subscribers:read",
    "subscribers:manage",
  ],
  services: ["read", "write", "delete"],
  testimonials: ["read", "write", "feature"],
  sections: ["read", "write"],
  dashboard: ["read", "write"],
  docs: ["read", "write"],
  hackathons: ["read"],
  offers: ["read"],
  events: ["read"],
  system: ["read"],
  tokens: ["manage"],
  quiz: ["read", "manage"],
} as const;

export const OWNER_SCOPE = "*" as const;

export type ScopeResource = keyof typeof SCOPES;

// Flat list of every concrete scope, e.g. 'blog:write', 'newsletter:subscribers:read'.
export const ALL_SCOPES: readonly string[] = Object.entries(SCOPES).flatMap(
  ([resource, actions]) => actions.map((a) => `${resource}:${a}`),
);

// Safe defaults applied to newly-registered clients (i.e. any OAuth client
// that provides a client_id) when they don't explicitly request scopes.
// Covers "read + author drafts + write briefings" — everything the newsletter
// draft routine and similar low-risk cloud agents need.
export const SAFE_DEFAULT_SCOPES: readonly string[] = [
  "docs:read",
  "newsletter:read",
  "newsletter:write",
  "testimonials:read",
  "dashboard:read",
  "dashboard:write",
  "quiz:read",
];

// Elevated scopes require explicit human tick on the consent screen. Owner,
// destructive ops, list-management, token issuance — all things a routine
// should never inherit without deliberate approval.
export const ELEVATED_SCOPES: readonly string[] = [
  OWNER_SCOPE,
  "newsletter:send",
  "newsletter:subscribers:manage",
  "blog:delete",
  "services:delete",
  "tokens:manage",
];

const ELEVATED_SET = new Set<string>(ELEVATED_SCOPES);

export function isElevatedScope(scope: string): boolean {
  if (ELEVATED_SET.has(scope)) return true;
  // Any :* wildcard on a resource that has an elevated action is elevated.
  // e.g. newsletter:* implies newsletter:send.
  if (/^[a-z]+:\*$/.test(scope)) {
    const resource = scope.slice(0, -2);
    return ELEVATED_SCOPES.some((s) => s.startsWith(`${resource}:`));
  }
  return false;
}

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
