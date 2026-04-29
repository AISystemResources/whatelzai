import type { Metadata } from 'next';
import { listHackathons } from '@/lib/hackathons';
import { HackathonList } from './_components/HackathonList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hackathons — Edmund Lin Zhenming',
};

export default async function HackathonsPage() {
  const hackathons = await listHackathons(true);

  return (
    <section className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">Presence</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-zinc-900">
          Hackathons
        </h1>
        <p className="mt-4 text-zinc-500 max-w-xl">
          A record of hackathons I've competed in — the wins, the builds, and the teams.
        </p>

        {hackathons.length === 0 ? (
          <p className="mt-16 text-zinc-400 font-mono text-sm">No hackathons published yet.</p>
        ) : (
          <div className="mt-12">
            <HackathonList hackathons={hackathons} />
          </div>
        )}
      </div>
    </section>
  );
}
