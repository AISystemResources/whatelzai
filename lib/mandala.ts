import { readingSections } from "./admin-reading";

export const MANDALA_PATH =
  "edmund/01-personal/dream/FINANCIAL-FREEDOM-MANDALA.md";

/** Display structure only. Original Markdown remains available even if it changes shape. */
export function mandalaAreas(body: string) {
  const areas = readingSections(body)
    .filter((section) => /^[1-8]\. /.test(section.title))
    .map((section) => ({
      ...section,
      cells: [
        ...section.body.matchAll(/^([1-8])\. \*\*(.+?)\*\* — (.+)$/gm),
      ].map((match) => ({ number: Number(match[1]), title: match[2] })),
    }));
  if (
    areas.length !== 8 ||
    areas.some(
      (area, index) =>
        !area.title.startsWith(`${index + 1}. `) ||
        area.cells.length !== 8 ||
        area.cells.some((cell, i) => cell.number !== i + 1),
    )
  )
    return null;
  return areas;
}
