import Link from "next/link";
import { AccentText } from "@/components/shell/AccentText";
import { getTrackRecordContent } from "@/lib/landing-content";

export async function TrackRecord() {
  const c = await getTrackRecordContent();

  return (
    <section
      id="track-record"
      data-section="Track record"
      className="border-b border-zinc-200 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          {c.eyebrow}
        </p>

        <h2 className="mt-8 font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          <AccentText text={c.heading} />
        </h2>

        <dl className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {c.stats.map((s) => (
            <div key={s.label}>
              <dt
                className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
                style={{ color: "var(--accent-text)" }}
              >
                {s.value}
              </dt>
              <dd className="mt-2 text-sm text-zinc-600">{s.label}</dd>
            </div>
          ))}
        </dl>

        {c.links.length > 0 && (
          <div className="mt-14 border-t border-zinc-100 pt-8">
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              {c.links_heading}
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-mono text-sm text-zinc-600 underline underline-offset-4 transition-colors hover:text-zinc-900"
                  >
                    {l.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
