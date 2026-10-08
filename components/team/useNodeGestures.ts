"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  zoomNodeCamera,
  type NodeCamera,
  type ZoomPoint,
} from "@/lib/team/node-zoom";

type SafariGesture = Event & {
  scale: number;
  clientX: number;
  clientY: number;
};

export function useNodeGestures(viewport: RefObject<HTMLDivElement | null>) {
  const [camera, setCamera] = useState<NodeCamera>({ x: 0, y: 0, zoom: 1 });
  const current = useRef(camera);
  const suppressClickUntil = useRef(0);
  const updateCamera = useCallback((next: NodeCamera) => {
    current.current = next;
    setCamera(next);
  }, []);
  const zoomAt = useCallback(
    (zoom: number, anchor: ZoomPoint) => {
      updateCamera(zoomNodeCamera(current.current, zoom, anchor, anchor));
    },
    [updateCamera],
  );

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const pointers = new Map<number, ZoomPoint>();
    let previousPair: { point: ZoomPoint; distance: number } | null = null;
    let dragStart: ZoomPoint | null = null;
    let dragged = false;
    let safariScale: number | null = null;
    const pointAt = (x: number, y: number): ZoomPoint => {
      const rect = element.getBoundingClientRect();
      return {
        x: x - rect.left - element.clientLeft,
        y: y - rect.top - element.clientTop,
      };
    };
    const pan = (x: number, y: number) =>
      updateCamera({
        ...current.current,
        x: current.current.x + x,
        y: current.current.y + y,
      });
    const pair = () => {
      const [a, b] = [...pointers.values()];
      return a && b
        ? {
            point: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            distance: Math.hypot(a.x - b.x, a.y - b.y),
          }
        : null;
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? element.clientHeight
            : 1;
      if (event.ctrlKey) {
        if (safariScale !== null || pointers.size > 1) return;
        zoomAt(
          current.current.zoom * Math.exp(-event.deltaY * unit * 0.01),
          pointAt(event.clientX, event.clientY),
        );
      } else pan(-event.deltaX * unit, -event.deltaY * unit);
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const point = pointAt(event.clientX, event.clientY);
      pointers.set(event.pointerId, point);
      // Capture on the original target so a tap still selects a person.
      (event.target as Element).setPointerCapture(event.pointerId);
      if (pointers.size === 1) {
        dragStart = point;
        dragged = false;
      }
      previousPair = pair();
      if (previousPair) {
        dragged = true;
        suppressClickUntil.current = Date.now() + 500;
      }
    };
    const move = (event: PointerEvent) => {
      const previous = pointers.get(event.pointerId);
      if (!previous) return;
      const point = pointAt(event.clientX, event.clientY);
      pointers.set(event.pointerId, point);
      const nextPair = pair();
      if (nextPair && previousPair && previousPair.distance > 0) {
        updateCamera(
          zoomNodeCamera(
            current.current,
            (current.current.zoom * nextPair.distance) / previousPair.distance,
            previousPair.point,
            nextPair.point,
          ),
        );
        dragged = true;
      } else if (pointers.size === 1) {
        if (
          !dragged &&
          dragStart &&
          Math.hypot(point.x - dragStart.x, point.y - dragStart.y) >= 4
        ) {
          dragged = true;
          pan(point.x - dragStart.x, point.y - dragStart.y);
        } else if (dragged) pan(point.x - previous.x, point.y - previous.y);
      }
      previousPair = nextPair;
      if (dragged) suppressClickUntil.current = Date.now() + 500;
    };
    const up = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      previousPair = pair();
      dragStart = [...pointers.values()][0] ?? null;
      if (dragged) suppressClickUntil.current = Date.now() + 500;
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== element) return;
      const steps: Record<string, ZoomPoint> = {
        ArrowLeft: { x: 60, y: 0 },
        ArrowRight: { x: -60, y: 0 },
        ArrowUp: { x: 0, y: 60 },
        ArrowDown: { x: 0, y: -60 },
      };
      const step = steps[event.key];
      if (step) {
        event.preventDefault();
        pan(step.x, step.y);
      }
    };
    const gestureStart = (event: Event) => {
      event.preventDefault();
      safariScale = 1;
    };
    const gestureChange = (event: Event) => {
      event.preventDefault();
      const gesture = event as SafariGesture;
      if (pointers.size > 1 || safariScale === null || gesture.scale <= 0)
        return;
      const point =
        Number.isFinite(gesture.clientX) && Number.isFinite(gesture.clientY)
          ? pointAt(gesture.clientX, gesture.clientY)
          : { x: element.clientWidth / 2, y: element.clientHeight / 2 };
      zoomAt((current.current.zoom * gesture.scale) / safariScale, point);
      safariScale = gesture.scale;
    };
    const gestureEnd = (event: Event) => {
      event.preventDefault();
      safariScale = null;
    };
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("lostpointercapture", up);
    element.addEventListener("keydown", key);
    element.addEventListener("gesturestart", gestureStart, { passive: false });
    element.addEventListener("gesturechange", gestureChange, {
      passive: false,
    });
    element.addEventListener("gestureend", gestureEnd);
    return () => {
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("lostpointercapture", up);
      element.removeEventListener("keydown", key);
      element.removeEventListener("gesturestart", gestureStart);
      element.removeEventListener("gesturechange", gestureChange);
      element.removeEventListener("gestureend", gestureEnd);
    };
  }, [viewport, updateCamera, zoomAt]);
  return { camera, zoomAt, updateCamera, suppressClickUntil };
}
