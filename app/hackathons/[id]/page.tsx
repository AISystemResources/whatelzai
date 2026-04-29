import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getHackathon } from '@/lib/hackathons';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const h = await getHackathon(id);
  if (!h) return {};
  return { title: `${h.name} — Edmund Lin Zhenming` };
}

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function youtubeEmbedUrl(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default async function HackathonDetailPage({ params }: Props) {
  const { id } = await params;
  const h = await getHackathon(id);
  if (!h || !h.published) notFound();

  const embedUrl = h.demo_url && isYouTube(h.demo_url) ? youtubeEmbedUrl(h.demo_url) : null;

  return (
    <section className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/hackathons"
          className="font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          ← Hackathons
        </Link>

        <div className="mt-8 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            {new Date(h.date).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })}
            {h.location ? ` · ${h.location}` : ''}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            {h.name}
          </h1>
          {h.organizer && (
            <p className="text-zinc-500">{h.organizer}</p>
          )}
        </div>

        {/* Awards */}
        {h.awards.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {h.awards.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-3 py-1 font-mono text-xs uppercase tracking-widest text-amber-700"
              >
                {a.title}{a.track ? ` · ${a.track}` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        {h.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3">
            {h.tags.map(t => (
              <span key={t} className="font-mono text-xs text-zinc-400">#{t}</span>
            ))}
          </div>
        )}

        {/* Demo video */}
        {h.demo_url && (
          <div className="mt-10">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-3">Demo</p>
            {embedUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded border border-zinc-200">
                <iframe
                  src={embedUrl}
                  title="Demo video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            ) : (
              <a
                href={h.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-zinc-600 underline underline-offset-2 hover:text-zinc-900 transition-colors"
              >
                {h.demo_url} ↗
              </a>
            )}
          </div>
        )}

        {/* Writeup */}
        {h.writeup.trim() && (
          <div className="mt-12 prose prose-zinc prose-sm max-w-none">
            <ReactMarkdown>{h.writeup}</ReactMarkdown>
          </div>
        )}
      </div>
    </section>
  );
}
