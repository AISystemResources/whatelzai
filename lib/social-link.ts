// Auto-detect which social platform a URL belongs to so the display can label
// it correctly. The underlying column is still called `author_linkedin_url`
// (kept for backward compat — no migration), but the field accepts any social
// URL: LinkedIn, Instagram, YouTube, Facebook, X, or a personal site.

export type SocialPlatform =
  | "LinkedIn"
  | "Instagram"
  | "YouTube"
  | "Facebook"
  | "X"
  | "GitHub"
  | "TikTok"
  | "Website";

export function detectSocialPlatform(url: string): SocialPlatform {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com")) return "LinkedIn";
  if (u.includes("instagram.com")) return "Instagram";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("facebook.com") || u.includes("fb.com")) return "Facebook";
  if (u.includes("twitter.com") || /(^|\/\/)(www\.)?x\.com/i.test(url))
    return "X";
  if (u.includes("github.com")) return "GitHub";
  if (u.includes("tiktok.com")) return "TikTok";
  return "Website";
}

// Merges the legacy single-URL field (`author_linkedin_url`) with the newer
// `author_socials` array, deduping by URL. Legacy field is preserved first
// (so older testimonials keep their existing display order); array entries
// follow in their declared order.
export function mergeSocials(
  legacyUrl: string | null | undefined,
  socials: { url: string }[] | null | undefined,
): { url: string; platform: SocialPlatform }[] {
  const out: { url: string; platform: SocialPlatform }[] = [];
  const seen = new Set<string>();
  const push = (url: string) => {
    const key = url.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ url: url.trim(), platform: detectSocialPlatform(url) });
  };
  if (legacyUrl) push(legacyUrl);
  for (const s of socials ?? []) if (s?.url) push(s.url);
  return out;
}
