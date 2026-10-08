import assert from "node:assert/strict";
import test from "node:test";
import { anchoredNodeScroll, clampNodeZoom } from "../lib/team/node-zoom";

test("pinch preserves the diagram point under the fingers while the midpoint moves", () => {
  const scroll = anchoredNodeScroll(
    { x: 320, y: 120 },
    { x: 200, y: 180 },
    { x: 230, y: 190 },
    1,
    1.5,
  );
  assert.equal((scroll.x + 230) / 1.5, 520);
  assert.equal((scroll.y + 190) / 1.5, 300);
});

test("zooming out and back in restores the viewport anchor", () => {
  const anchor = { x: 150, y: 100 };
  const initial = { x: 600, y: 400 };
  const out = anchoredNodeScroll(initial, anchor, anchor, 1, 0.5);
  assert.deepEqual(anchoredNodeScroll(out, anchor, anchor, 0.5, 1), initial);
});

test("moving two fingers pans even when zoom has reached its limit", () => {
  assert.deepEqual(
    anchoredNodeScroll(
      { x: 500, y: 200 },
      { x: 100, y: 100 },
      { x: 130, y: 80 },
      1.5,
      clampNodeZoom(3),
    ),
    { x: 470, y: 220 },
  );
  assert.equal(clampNodeZoom(0.01), 0.25);
  assert.equal(clampNodeZoom(1), 1);
});
