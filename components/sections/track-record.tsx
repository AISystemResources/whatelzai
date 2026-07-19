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

        <h2 className="mt-8 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          <AccentText text={c.heading} />
        </h2>

        <dl className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {c.stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-3">
              <dt
                className="font-mono text-5xl font-medium tabular-nums tracking-tight sm:text-6xl"
                style={{ color: "var(--accent-text)" }}
              >
                {s.value}
              </dt>
              <dd>
                <span className="inline-block bg-zinc-900 px-2 py-1 text-xs font-semibold tracking-wide text-white uppercase">
                  {s.label}
                </span>
                {s.caption && (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                    {s.caption}
                  </p>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {c.links.length > 0 && (
          <aside className="mt-20 flex flex-col gap-4 border-t border-zinc-200 pt-10 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
            <div className="sm:max-w-xs">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                {c.links_heading}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Prefer to browse the receipts yourself?
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="font-mono text-sm text-zinc-700 underline underline-offset-4 transition-colors hover:text-zinc-900"
                  >
                    {l.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </section>
  );
}
