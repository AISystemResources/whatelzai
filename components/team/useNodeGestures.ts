"use client";

import { useEffect, useRef, type RefObject } from "react";
import { flushSync } from "react-dom";
import {
  anchoredNodeScroll,
  clampNodeZoom,
  type ZoomPoint,
} from "@/lib/team/node-zoom";

type SafariGesture = Event & {
  scale: number;
  clientX: number;
  clientY: number;
};

export function useNodeGestures(
  viewport: RefObject<HTMLDivElement | null>,
  zoom: number,
  setZoom: (zoom: number) => void,
) {
  const currentZoom = useRef(zoom);
  const suppressClickUntil = useRef(0);

  useEffect(() => {
    currentZoom.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    let pinch: { distance: number; point: ZoomPoint } | null = null;
    let safariScale: number | null = null;

    const pointAt = (x: number, y: number): ZoomPoint => {
      const rect = element.getBoundingClientRect();
      return {
        x: x - rect.left - element.clientLeft,
        y: y - rect.top - element.clientTop,
      };
    };
    const applyZoom = (
      requested: number,
      previousPoint: ZoomPoint,
      nextPoint = previousPoint,
    ) => {
      const nextZoom = clampNodeZoom(requested);
      const scroll = anchoredNodeScroll(
        { x: element.scrollLeft, y: element.scrollTop },
        previousPoint,
        nextPoint,
        currentZoom.current,
        nextZoom,
      );
      currentZoom.current = nextZoom;
      // Update canvas dimensions before the browser clamps the new scroll offset.
      flushSync(() => setZoom(nextZoom));
      element.scrollLeft = scroll.x;
      element.scrollTop = scroll.y;
    };
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return; // Ordinary two-finger scrolling still pans.
      event.preventDefault();
      if (safariScale !== null || pinch) return;
      const pixels =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? element.clientHeight
            : 1);
      applyZoom(
        currentZoom.current * Math.exp(-pixels * 0.01),
        pointAt(event.clientX, event.clientY),
      );
    };
    const touchPair = (touches: TouchList) => {
      const a = touches[0],
        b = touches[1];
      return {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        point: pointAt(
          (a.clientX + b.clientX) / 2,
          (a.clientY + b.clientY) / 2,
        ),
      };
    };
    const touchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        pinch = null;
        return;
      }
      event.preventDefault();
      pinch = touchPair(event.touches);
      suppressClickUntil.current = Date.now() + 500;
    };
    const touchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      event.preventDefault();
      const next = touchPair(event.touches);
      if (pinch && pinch.distance > 0) {
        applyZoom(
          (currentZoom.current * next.distance) / pinch.distance,
          pinch.point,
          next.point,
        );
      }
      pinch = next;
      suppressClickUntil.current = Date.now() + 500;
    };
    const touchEnd = (event: TouchEvent) => {
      if (pinch) suppressClickUntil.current = Date.now() + 500;
      pinch = event.touches.length === 2 ? touchPair(event.touches) : null;
    };
    // Safari's trackpad pinch uses GestureEvent rather than a ctrl-wheel event.
    const gestureStart = (event: Event) => {
      event.preventDefault();
      safariScale = 1;
    };
    const gestureChange = (event: Event) => {
      event.preventDefault();
      const gesture = event as SafariGesture;
      if (pinch || safariScale === null || gesture.scale <= 0) return;
      const point =
        Number.isFinite(gesture.clientX) && Number.isFinite(gesture.clientY)
          ? pointAt(gesture.clientX, gesture.clientY)
          : { x: element.clientWidth / 2, y: element.clientHeight / 2 };
      applyZoom((currentZoom.current * gesture.scale) / safariScale, point);
      safariScale = gesture.scale;
    };
    const gestureEnd = (event: Event) => {
      event.preventDefault();
      safariScale = null;
    };
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("touchstart", touchStart, { passive: false });
    element.addEventListener("touchmove", touchMove, { passive: false });
    element.addEventListener("touchend", touchEnd);
    element.addEventListener("touchcancel", touchEnd);
    element.addEventListener("gesturestart", gestureStart, { passive: false });
    element.addEventListener("gesturechange", gestureChange, {
      passive: false,
    });
    element.addEventListener("gestureend", gestureEnd);
    return () => {
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("touchstart", touchStart);
      element.removeEventListener("touchmove", touchMove);
      element.removeEventListener("touchend", touchEnd);
      element.removeEventListener("touchcancel", touchEnd);
      element.removeEventListener("gesturestart", gestureStart);
      element.removeEventListener("gesturechange", gestureChange);
      element.removeEventListener("gestureend", gestureEnd);
    };
  }, [viewport, setZoom]);

  return suppressClickUntil;
}
