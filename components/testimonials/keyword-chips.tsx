import Link from "next/link";
import { getKeywordMeta, keywordLabel } from "./keyword-meta";

// Smaller icon+adjective card for the individual /testimonials/[slug] page.
// No filter state, no counts — each card is a link back to the aggregate
// /testimonials view filtered by that keyword. Same visual language as the
// big cards on /testimonials so the two surfaces feel like one system.
export function KeywordChips({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) return null;
  return (
    <ul className="grid grid-cols-3 gap-2 sm:gap-3">
      {keywords.slice(0, 3).map((k) => {
        const meta = getKeywordMeta(k);
        const Icon = meta.Icon;
        return (
          <li key={k}>
            <Link
              href={`/testimonials?filter=${encodeURIComponent(k)}`}
              className="group flex h-full flex-col items-center justify-center gap-2 border border-zinc-200 bg-white p-3 text-center transition-all hover:border-zinc-900 sm:gap-3 sm:p-5"
              title={meta.description}
            >
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center text-zinc-400 transition-colors group-hover:text-zinc-900 sm:h-9 sm:w-9"
              >
                <Icon size={28} strokeWidth={1.5} />
              </span>
              <span className="text-sm font-bold uppercase leading-tight tracking-tight text-zinc-900 sm:text-base">
                {keywordLabel(k)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
