import type { Mentorship } from '@/lib/mentorship';

interface Props {
  entries: Mentorship[];
}

function formatPeriod(start: string, end: string | null): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : `${fmt(start)} – Present`;
}

export function MentorshipSection({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <section
      id="mentorship"
      data-section="Mentorship"
      data-section-href="/mentorship"
      className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-baseline justify-between">
          <h2 id="mentorship-heading" className="text-2xl font-semibold text-zinc-900">
            Mentorship
          </h2>
          <p className="hidden font-mono text-[10px] uppercase tracking-widest text-zinc-400 sm:block">
            Programmes &amp; mentors
          </p>
        </header>

        <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
          {entries.map((entry) => (
            <li key={entry.id} className="grid grid-cols-12 items-baseline gap-4 py-5">
              <span className="col-span-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:text-xs">
                {formatPeriod(entry.start_date, entry.end_date)}
              </span>
              <span className="col-span-6 text-sm font-medium sm:text-base">
                {entry.programme}
              </span>
              <span
                className="col-span-3 text-right font-mono text-xs uppercase tracking-wide"
                style={{ color: 'var(--accent-text)' }}
              >
                {entry.organiser}
              </span>
              {entry.description && (
                <span className="col-span-12 text-xs text-zinc-500 sm:col-span-9 sm:col-start-4">
                  {entry.description.split('\n').find(l => l.trim())?.replace(/^[-*•]\s*/, '').trim()}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
