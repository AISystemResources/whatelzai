'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CareerEntry } from '@/lib/career';

function blinkRow(el: HTMLElement, onDone: () => void) {
  const flash = 'rgba(250,204,21,0.35)';
  el.style.transition = 'background-color 200ms ease';
  el.style.backgroundColor = flash;
  setTimeout(() => { el.style.backgroundColor = ''; }, 300);
  setTimeout(() => { el.style.backgroundColor = flash; }, 600);
  setTimeout(() => {
    el.style.backgroundColor = '';
    el.style.transition = '';
    onDone();
  }, 1000);
}

function formatDateRange(start: string, end: string | null): string {
  const startDate = new Date(start).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
  if (!end) return `${startDate} – Present`;
  const endDate = new Date(end).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
  return `${startDate} – ${endDate}`;
}

interface Props {
  slugOrder: string[];
  bySlug: Record<string, CareerEntry[]>;
  highlight?: string;
}

export function CareerList({ slugOrder, bySlug, highlight }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-career-slug="${highlight}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const dest = `/career/${highlight}`;
      setTimeout(() => blinkRow(el, () => router.push(dest)), 400);
    }, 350);
    return () => clearTimeout(t);
  }, [highlight, router]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="pb-3 text-left font-mono text-[10px] uppercase tracking-widest text-zinc-400 pr-8">Company</th>
            <th className="pb-3 text-left font-mono text-[10px] uppercase tracking-widest text-zinc-400 pr-8">Role</th>
            <th className="pb-3 text-left font-mono text-[10px] uppercase tracking-widest text-zinc-400">Period</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {slugOrder.map(slug => {
            const roles = bySlug[slug];
            const latest = roles[0];
            return (
              <tr key={slug} data-career-slug={slug} className="hover:bg-zinc-50 transition-colors">
                <td className="py-4 pr-8 font-medium text-zinc-900 whitespace-nowrap">
                  <Link href={`/career/${slug}`} className="hover:underline underline-offset-2">
                    {latest.company}
                  </Link>
                </td>
                <td className="py-4 pr-8 text-zinc-600 whitespace-nowrap">
                  {roles.length > 1 ? (
                    <span>
                      {latest.role}
                      <span className="ml-1.5 font-mono text-[10px] text-zinc-400">+{roles.length - 1} more</span>
                    </span>
                  ) : (
                    latest.role
                  )}
                </td>
                <td className="py-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                  {formatDateRange(latest.start_date, latest.end_date)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {slugOrder.length === 0 && (
        <p className="py-12 text-center font-mono text-xs uppercase tracking-widest text-zinc-300">
          No entries yet.
        </p>
      )}
    </div>
  );
}
