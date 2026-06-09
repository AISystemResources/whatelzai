'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function AppHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 flex h-14 items-center justify-center border-b transition-all duration-300 ${
        scrolled
          ? 'border-zinc-200 bg-white/80 backdrop-blur-md'
          : 'border-transparent bg-transparent'
      }`}
    >
      <Link
        href="/"
        className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-900 transition-opacity hover:opacity-60"
      >
        WHATELZ.AI
      </Link>
    </header>
  );
}
