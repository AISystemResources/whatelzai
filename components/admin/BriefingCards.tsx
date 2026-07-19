import {
  listDashboardCards,
  isCardStale,
  type DashboardCard,
} from "@/lib/dashboard-cards";

// Best-effort read — if the table doesn't exist yet (migration pending), we
// render nothing rather than throwing the whole /admin page.
async function safeListCards(): Promise<DashboardCard[]> {
  try {
    return await listDashboardCards();
  } catch {
    return [];
  }
}

function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// Extremely small markdown renderer — paragraphs + bullets + bold.
// Deliberately not pulling in a full parser: bodies here are short briefings.
function renderBody(md: string): React.ReactNode {
  const lines = md.split("\n");
  const out: React.ReactNode[] = [];
  let bulletBuf: string[] = [];

  const flushBullets = () => {
    if (bulletBuf.length === 0) return;
    out.push(
      <ul
        key={`ul-${out.length}`}
        className="list-disc space-y-1 pl-5 text-sm text-zinc-700"
      >
        {bulletBuf.map((b, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineBold(b) }} />
        ))}
      </ul>,
    );
    bulletBuf = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets();
      continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      bulletBuf.push(trimmed.slice(2));
      continue;
    }
    flushBullets();
    out.push(
      <p
        key={`p-${out.length}`}
        className="text-sm leading-relaxed text-zinc-700"
        dangerouslySetInnerHTML={{ __html: inlineBold(trimmed) }}
      />,
    );
  }
  flushBullets();
  return out;
}

function inlineBold(s: string): string {
  const escaped = s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  return escaped.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-zinc-900">$1</strong>',
  );
}

export async function BriefingCards() {
  const cards = await safeListCards();
  if (cards.length === 0) return null;

  const now = new Date();

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-xs tracking-widest text-zinc-400 uppercase">
          Briefings
        </p>
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
          Written by Claude Schedule
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {cards.map((card) => {
          const stale = isCardStale(card, now);
          return (
            <article
              key={card.id}
              className={`space-y-3 rounded border p-4 ${
                stale
                  ? "border-amber-400 bg-amber-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                    {card.title}
                  </h2>
                  <p className="mt-0.5 font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                    {card.key}
                    {card.source && <> · {card.source}</>}
                  </p>
                </div>
                {stale && (
                  <span
                    className="shrink-0 bg-amber-500 px-2 py-0.5 font-mono text-[10px] tracking-widest text-white uppercase"
                    title={`Expected every ${card.expected_cadence_hours}h — last update ${formatRelative(card.updated_at, now)}`}
                  >
                    Stale
                  </span>
                )}
              </header>
              <div className="space-y-2">{renderBody(card.body_markdown)}</div>
              <footer className="border-t border-zinc-100 pt-2 font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                Updated {formatRelative(card.updated_at, now)}
                {card.expected_cadence_hours && (
                  <> · cadence {card.expected_cadence_hours}h</>
                )}
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
