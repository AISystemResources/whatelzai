'use client';

import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-center border-b border-zinc-200 bg-[var(--background)]">
      <Link
        href="/"
        className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-900 transition-opacity hover:opacity-60"
      >
        WHATELZ.AI
      </Link>
    </header>
  );
}
