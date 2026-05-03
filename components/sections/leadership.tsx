import type { Leadership } from '@/lib/leadership';

interface Props {
  entries: Leadership[];
}

function formatPeriod(start: string, end: string | null): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : `${fmt(start)} – Present`;
}

export function LeadershipSection({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <section
      id="leadership"
      data-section="Leadership"
      data-section-href="/leadership"
      className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-baseline justify-between">
          <h2 id="leadership-heading" className="text-2xl font-semibold text-zinc-900">
            Leadership
          </h2>
          <p className="hidden font-mono text-[10px] uppercase tracking-widest text-zinc-400 sm:block">
            Clubs &amp; organisations
          </p>
        </header>

        <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {entries.map((entry, i) => (
            <li key={entry.id} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: 'var(--accent-text)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-zinc-300" aria-hidden="true" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                {formatPeriod(entry.start_date, entry.end_date)}
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-zinc-900">
                {entry.organisation}
              </h3>
              {entry.body && (
                <p className="mt-0.5 text-sm text-zinc-500">{entry.body}</p>
              )}
              <p className="mt-1 text-sm text-zinc-600">{entry.role}</p>
              {entry.description && (
                <p className="mt-3 text-sm leading-relaxed text-zinc-700">
                  {entry.description.split('\n').find(l => l.trim())?.replace(/^[-*•]\s*/, '').trim()}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
