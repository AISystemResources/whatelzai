import type { CareerEntry } from '@/lib/career';

interface Props {
  entries: CareerEntry[];
}

function formatPeriod(start: string, end: string | null): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : `${fmt(start)} – Present`;
}

function firstBullet(description: string | null): string {
  if (!description) return '';
  const line = description.split('\n').find(l => l.trim().length > 0) ?? '';
  return line.replace(/^[-*•]\s*/, '').trim();
}

export function Arc({ entries }: Props) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  return (
    <section
      id="arc"
      data-section="Career"
      data-section-href="/career"
      className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-baseline justify-between">
          <h2 id="arc-heading" className="text-2xl font-semibold text-zinc-900">
            Career
          </h2>
          <p className="hidden font-mono text-[10px] tracking-widest text-zinc-400 uppercase sm:block">
            2023 → 2026
          </p>
        </header>

        <ol className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
          {sorted.map((entry, i) => (
            <li key={entry.id} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="font-mono text-[10px] tracking-widest uppercase"
                  style={{ color: 'var(--accent-text)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-zinc-300" aria-hidden="true" />
              </div>
              <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                {formatPeriod(entry.start_date, entry.end_date)}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                {entry.company}
              </h3>
              <p className="mt-1 text-sm text-zinc-600">{entry.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                {firstBullet(entry.description)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
