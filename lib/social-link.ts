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
