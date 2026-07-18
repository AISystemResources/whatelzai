// Small helper — kebab-case a string for use in URL slugs.
// Strips combining diacritics (é → e), lowercases, collapses non-alnum to '-'.
export function slugify(input: string, maxLen = 60): string {
  const cleaned = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return cleaned || "";
}
