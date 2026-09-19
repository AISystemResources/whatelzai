export type PageDirection = "next" | "previous";

/** A wheel stream includes momentum after fingers lift. Consume at most one
 * turn until the stream has been quiet, rather than one turn per wheel event. */
export function createTrackpadGesture() {
  let lastTime = -Infinity;
  let distance = 0;
  let consumed = false;
  let axis: "horizontal" | "vertical" | null = null;
  return (dx: number, dy: number, time: number) => {
    if (time - lastTime > 220) {
      distance = 0;
      consumed = false;
      axis = null;
    }
    lastTime = time;
    if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 2) {
      axis = Math.abs(dx) > Math.abs(dy) * 1.5 ? "horizontal" : "vertical";
    }
    if (axis !== "horizontal") return { capture: false, direction: null };
    distance += dx;
    let direction: PageDirection | null = null;
    if (!consumed && Math.abs(distance) >= 60) {
      consumed = true;
      direction = distance > 0 ? "next" : "previous";
    }
    return { capture: true, direction };
  };
}

export function touchPageDirection(
  dx: number,
  dy: number,
): PageDirection | null {
  if (Math.abs(dx) < 55 || Math.abs(dx) <= Math.abs(dy) * 1.5) return null;
  return dx < 0 ? "next" : "previous";
}
