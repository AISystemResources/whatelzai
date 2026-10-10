import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import library from "../content/culture/ultra.json";
import { domainRoute } from "../lib/domain-routing";

test("every source occurrence survives deduplication with wording, chapter and order intact", () => {
  const source = readFileSync(
    new URL("../content/culture/ultra-source.txt", import.meta.url),
    "utf8",
  );
  const original: { text: string; chapterId: string; sourceOrder: number }[] =
    [];
  let chapter = 0;
  for (const line of source.split("\n")) {
    if (line.startsWith("## ")) {
      assert.equal(library.chapters[chapter].title, line.slice(3));
      chapter++;
    } else if (line && !line.startsWith("#")) {
      original.push({
        text: line,
        chapterId: library.chapters[chapter - 1].id,
        sourceOrder: original.length + 1,
      });
    }
  }
  const restored = library.quotes
    .flatMap((quote) =>
      quote.occurrences.map((occurrence) => ({
        text: quote.text,
        ...occurrence,
      })),
    )
    .sort((a, b) => a.sourceOrder - b.sourceOrder);
  assert.deepEqual(restored, original);
  assert.equal(chapter, 15);
  assert.equal(original.length, 233);
  assert.equal(library.quotes.length, 231);
  assert.equal(new Set(library.quotes.map((quote) => quote.text)).size, 231);
});

test("Culture belongs to the protected member surface", () => {
  assert.equal(
    domainRoute("whatelz.ai", "/culture").redirect,
    "https://app.whatelz.ai/culture",
  );
  assert.equal(domainRoute("app.whatelz.ai", "/culture").protect, true);
});
