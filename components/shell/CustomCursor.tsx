'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

export function CustomCursor() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const dotX = useSpring(x, { stiffness: 600, damping: 40 });
  const dotY = useSpring(y, { stiffness: 600, damping: 40 });
  const ringX = useSpring(x, { stiffness: 160, damping: 20 });
  const ringY = useSpring(y, { stiffness: 160, damping: 20 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    function onMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    }

    function onOver(e: MouseEvent) {
      const t = e.target as Element;
      if (t.closest('a, button, [role="button"], label, input, textarea, select')) {
        setHovering(true);
      } else {
        setHovering(false);
      }
    }

    function onLeave() {
      setVisible(false);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, [mounted, x, y]);

  if (!mounted || reduced) return null;

  return (
    <>
      {/* Trailing ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9997] rounded-full"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: hovering ? 44 : 28,
          height: hovering ? 44 : 28,
          borderWidth: hovering ? 1.5 : 1,
          borderColor: hovering ? '#f59e0b' : '#d4d4d8',
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      />
      {/* Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full bg-zinc-900"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: hovering ? 5 : 5,
          height: hovering ? 5 : 5,
          backgroundColor: hovering ? '#f59e0b' : '#171717',
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.15 }}
      />
    </>
  );
}
