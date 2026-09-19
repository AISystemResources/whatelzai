import assert from "node:assert/strict";
import test from "node:test";
import {
  createTrackpadGesture,
  touchPageDirection,
} from "../lib/playbook-gestures";

test("one page per trackpad gesture, including a long momentum tail", () => {
  const gesture = createTrackpadGesture();
  const turns = [];
  for (let t = 0; t < 1600; t += 16) {
    const result = gesture(12, 1, t);
    if (result.direction) turns.push(result.direction);
    assert.equal(result.capture, true);
  }
  assert.deepEqual(turns, ["next"]);
  assert.equal(gesture(-70, 0, 1900).direction, "previous");
});

test("vertical scrolling and diagonal gestures do not turn pages", () => {
  const gesture = createTrackpadGesture();
  assert.deepEqual(gesture(10, 50, 0), { capture: false, direction: null });
  assert.deepEqual(gesture(100, 0, 30), { capture: false, direction: null });
  assert.deepEqual(gesture(50, 50, 500), { capture: false, direction: null });
});

test("small trackpad movements accumulate, but reset after the gesture ends", () => {
  const gesture = createTrackpadGesture();
  assert.equal(gesture(30, 0, 0).direction, null);
  assert.equal(gesture(30, 0, 50).direction, "next");
  assert.equal(gesture(30, 0, 400).direction, null);
});

test("touch swipes follow the finger direction and ignore taps or vertical scroll", () => {
  assert.equal(touchPageDirection(-90, 10), "next");
  assert.equal(touchPageDirection(90, 10), "previous");
  assert.equal(touchPageDirection(20, 0), null);
  assert.equal(touchPageDirection(20, 120), null);
  assert.equal(touchPageDirection(80, 80), null);
});
