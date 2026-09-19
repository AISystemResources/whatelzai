"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

/** Pointer movement acknowledges the book as a physical, clickable object.
 * Motion values avoid rerendering the page; touch and reduced motion stay still. */
export function BookTilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 150, damping: 22 });
  const rotateY = useSpring(y, { stiffness: 150, damping: 22 });
  return (
    <motion.div
      ref={ref}
      className="book-tilt"
      style={reduced ? undefined : { rotateX, rotateY }}
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== "mouse" || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set(-((event.clientY - rect.top) / rect.height - 0.5) * 10);
        y.set(((event.clientX - rect.left) / rect.width - 0.5) * 14);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** A small upward settling motion marks a new section without hiding its content. */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduced ? undefined : { y: [16, 0] }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
