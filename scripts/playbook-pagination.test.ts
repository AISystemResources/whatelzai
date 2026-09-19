import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  paginateChapters,
  type PlaybookChapter,
} from "../lib/playbook-pagination";

const chapters: PlaybookChapter[] = JSON.parse(
  readFileSync(
    new URL("../content/playbook/chapters.json", import.meta.url),
    "utf8",
  ),
);

test("all twelve chapters survive pagination, in order, without losing prose", () => {
  assert.equal(chapters.length, 12);
  assert.deepEqual(
    chapters.map((chapter) => chapter.number),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  const pages = paginateChapters(chapters);
  assert.ok(pages.length > chapters.length);
  for (const chapter of chapters) {
    const chapterPages = pages.filter(
      (page) => page.chapter === chapter.number,
    );
    assert.ok(chapterPages.length > 0);
    assert.equal(chapterPages.filter((page) => page.opening).length, 1);
    assert.equal(chapterPages[0].opening, true);
    assert.equal(
      chapterPages.map((page) => page.markdown).join("\n\n"),
      chapter.body,
    );
  }
  assert.deepEqual(
    pages.map((page) => page.chapter),
    pages.map((page) => page.chapter).sort((a, b) => a - b),
  );
});

test("reader content excludes vault and editorial metadata", () => {
  for (const chapter of chapters) {
    assert.ok(chapter.body.length > 1000);
    assert.doesNotMatch(
      chapter.body,
      /EDMUND-PLACEHOLDER|SCREENSHOT SLOT|## Child of|## Parent of|## Status|DEC-CEO|DEC-CMO|\[\[/,
    );
  }
});

test("heading and following paragraph stay together at a page boundary", () => {
  const pages = paginateChapters([
    {
      number: 1,
      part: 1,
      title: "Example",
      slug: "example",
      body: `${"First paragraph. ".repeat(65)}\n\n## Next step\n\n${"Instruction. ".repeat(50)}`,
    },
  ]);
  assert.ok(pages.length > 1);
  assert.ok(
    pages.some((page) =>
      page.markdown.includes("## Next step\n\nInstruction."),
    ),
  );
});
