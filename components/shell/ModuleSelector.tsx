'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PILLS, pillForPath, type Pill } from '@/lib/pill-access';

interface Props {
  isAdmin: boolean;
  onClose: () => void;
}

export function ModuleSelector({ isAdmin, onClose }: Props) {
  const pathname = usePathname();
  const active = pillForPath(pathname);
  const ref = useRef<HTMLDivElement>(null);

  const visible = PILLS.filter((p: Pill) => !p.gated || isAdmin);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-1/2 top-full mt-2 -translate-x-1/2 z-50 w-48 rounded border border-zinc-200 bg-white shadow-lg py-1"
      role="menu"
    >
      {visible.map((pill: Pill) => (
        <Link
          key={pill.key}
          href={pill.route}
          onClick={onClose}
          role="menuitem"
          className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-zinc-50 ${
            active === pill.key
              ? 'font-semibold text-zinc-900 bg-zinc-50'
              : 'text-zinc-600'
          }`}
        >
          {active === pill.key && (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
          )}
          {active !== pill.key && <span className="h-1.5 w-1.5 shrink-0" />}
          {pill.label}
        </Link>
      ))}
    </div>
  );
}
