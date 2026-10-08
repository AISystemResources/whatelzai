export const MIN_NODE_ZOOM = 0.25;
export const MAX_NODE_ZOOM = 1.5;

export function clampNodeZoom(zoom: number) {
  return Math.max(MIN_NODE_ZOOM, Math.min(MAX_NODE_ZOOM, zoom));
}

export type ZoomPoint = { x: number; y: number };
export type NodeCamera = ZoomPoint & { zoom: number };

export function zoomNodeCamera(
  camera: NodeCamera,
  requested: number,
  previous: ZoomPoint,
  next: ZoomPoint,
): NodeCamera {
  const zoom = clampNodeZoom(requested);
  const ratio = zoom / camera.zoom;
  return {
    zoom,
    x: next.x - (previous.x - camera.x) * ratio,
    y: next.y - (previous.y - camera.y) * ratio,
  };
}

export function fitNodeCamera(
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): NodeCamera {
  const zoom = clampNodeZoom(
    Math.min(1, (viewportWidth - 32) / width, (viewportHeight - 32) / height),
  );
  return {
    zoom,
    x: (viewportWidth - width * zoom) / 2,
    y: (viewportHeight - height * zoom) / 2,
  };
}

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
