export const MIN_NODE_ZOOM = 0.25;
export const MAX_NODE_ZOOM = 1.5;

export function clampNodeZoom(zoom: number) {
  return Math.max(MIN_NODE_ZOOM, Math.min(MAX_NODE_ZOOM, zoom));
}

export type ZoomPoint = { x: number; y: number };

// Keep the same diagram coordinate beneath the gesture as its midpoint moves.
export function anchoredNodeScroll(
  scroll: ZoomPoint,
  previousPoint: ZoomPoint,
  nextPoint: ZoomPoint,
  previousZoom: number,
  nextZoom: number,
): ZoomPoint {
  return {
    x: ((scroll.x + previousPoint.x) / previousZoom) * nextZoom - nextPoint.x,
    y: ((scroll.y + previousPoint.y) / previousZoom) * nextZoom - nextPoint.y,
  };
}
