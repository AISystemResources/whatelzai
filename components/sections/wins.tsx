import type { Hackathon } from '@/lib/hackathons';

interface Props {
  hackathons: Hackathon[];
}

export function Wins({ hackathons }: Props) {
  const winners = hackathons.filter(h => h.awards.length > 0);

  return (
    <section
      id="hackathons"
      data-section="Hackathons"
      data-section-href="/hackathons"
      className="border-b border-zinc-200 px-6 py-20 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-baseline justify-between">
          <h2 id="hackathons-heading" className="text-2xl font-semibold text-zinc-900">
            Hackathons
          </h2>
          <p className="hidden font-mono text-[10px] tracking-widest text-zinc-400 uppercase sm:block">
            Coding competitions
          </p>
        </header>

        <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
          {winners.map((h) => (
            <li
              key={h.id}
              className="grid grid-cols-12 items-baseline gap-4 py-5"
            >
              <span className="col-span-3 font-mono text-[10px] tracking-widest text-zinc-500 uppercase sm:text-xs">
                {new Date(h.date).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}
              </span>
              <span className="col-span-5 text-sm font-medium sm:text-base">
                {h.name}
              </span>
              <span
                className="col-span-4 text-right font-mono text-xs tracking-wide uppercase"
                style={{ color: 'var(--accent-text)' }}
              >
                {h.awards[0]?.title ?? '—'}
              </span>
              {h.project_name && (
                <span className="col-span-12 text-xs text-zinc-500 sm:col-span-9 sm:col-start-4">
                  {h.project_name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
