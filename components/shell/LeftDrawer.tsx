'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDrawerStore } from '@/lib/shell/drawer-store';
import { pillForPath } from '@/lib/pill-access';
import { MODULE_NAV } from '@/lib/module-nav';

export function LeftDrawer() {
  const { state, dispatch } = useDrawerStore();
  const pathname = usePathname();
  const active = pillForPath(pathname);
  const navItems = MODULE_NAV[active] ?? [];

  // Close on route change
  useEffect(() => {
    dispatch({ type: 'CLOSE_LEFT' });
  }, [pathname, dispatch]);

  return (
    <>
      {/* Backdrop */}
      {state.left && (
        <div
          className="fixed inset-0 z-20 bg-black/20"
          onClick={() => dispatch({ type: 'CLOSE_LEFT' })}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-14 left-0 z-30 flex h-[calc(100vh-56px)] w-64 flex-col border-r border-zinc-200 bg-[var(--background)] transition-transform duration-200 ${
          state.left ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Module navigation"
      >
        <div className="flex-1 overflow-y-auto p-4">
          {navItems.length === 0 ? (
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
              No sub-pages yet
            </p>
          ) : (
            <ul className="space-y-1">
              {navItems.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded px-3 py-2 text-sm transition-colors hover:bg-zinc-100 hover:text-zinc-900 ${
                      pathname === item.href
                        ? 'bg-zinc-100 font-semibold text-zinc-900'
                        : 'text-zinc-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Settings pin */}
        <div className="border-t border-zinc-200 p-4">
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 9a2 2 0 100-4 2 2 0 000 4z"
                stroke="currentColor" strokeWidth="1.2"
              />
              <path
                d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
              />
            </svg>
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
