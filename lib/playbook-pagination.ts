export type PlaybookChapter = {
  number: number;
  part: number;
  title: string;
  slug: string;
  body: string;
};

export type BookPage = {
  chapter: number;
  part: number;
  title: string;
  opening: boolean;
  markdown: string;
};

export const PLAYBOOK_PARTS = [
  "Diagnosis",
  "Money Mindset",
  "AI Skillset",
  "Your next 30 days",
] as const;

/** Keep paragraphs/list items intact. Conservative page budget; oversized blocks
 * remain reachable in the page's scroll area, and in flowing reading mode. */
export function paginateChapters(chapters: PlaybookChapter[]): BookPage[] {
  return chapters.flatMap((chapter) => {
    const blocks = chapter.body.split(/\n\s*\n/).filter(Boolean);
    const pages: BookPage[] = [];
    let current: string[] = [];
    let size = 0;
    const flush = () => {
      if (!current.length) return;
      pages.push({
        chapter: chapter.number,
        part: chapter.part,
        title: chapter.title,
        opening: pages.length === 0,
        markdown: current.join("\n\n"),
      });
      current = [];
      size = 0;
    };
    for (const block of blocks) {
      const weight = block.length + 95 + (block.startsWith("##") ? 150 : 0);
      const budget = pages.length === 0 ? 800 : 1000;
      // Keep headings with the following paragraph.
      const previousIsHeading = current.at(-1)?.startsWith("##");
      if (size + weight > budget && !previousIsHeading) flush();
      current.push(block);
      size += weight;
    }
    flush();
    return pages;
  });
}
