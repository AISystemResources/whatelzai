"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getKeywordMeta, keywordLabel } from "./keyword-meta";

// Five prestigious keyword cards. Click one to filter /testimonials to only
// rows tagged with that keyword. Click the active one again to clear the
// filter. State lives in the URL (?filter=…) so it's shareable + SSR-friendly.
export function KeywordCards({
  keywords,
}: {
  keywords: { word: string; count: number }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get("filter");

  function toggle(word: string) {
    const next = new URLSearchParams(params);
    if (active === word) {
      next.delete("filter");
    } else {
      next.set("filter", word);
    }
    const qs = next.toString();
    router.push(`/testimonials${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  if (keywords.length === 0) return null;

  return (
    <section className="mt-14">
      <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
        What people say most · click to filter
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {keywords.map((k) => {
          const meta = getKeywordMeta(k.word);
          const Icon = meta.Icon;
          const isActive = active === k.word;
          return (
            <li key={k.word}>
              <button
                type="button"
                onClick={() => toggle(k.word)}
                aria-pressed={isActive}
                className={`group flex h-full w-full flex-col items-center gap-4 border p-6 text-center transition-all sm:p-7 ${
                  isActive
                    ? "border-zinc-900 shadow-lg"
                    : "border-zinc-200 bg-white hover:border-zinc-400"
                }`}
                style={
                  isActive
                    ? { backgroundColor: "var(--accent)" }
                    : undefined
                }
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center transition-transform group-hover:scale-110 sm:h-14 sm:w-14 ${
                    isActive ? "text-zinc-900" : "text-zinc-500"
                  }`}
                  aria-hidden
                >
                  <Icon size={40} strokeWidth={1.5} />
                </span>
                <div>
                  <p
                    className={`font-mono text-xs tracking-widest uppercase sm:text-sm ${
                      isActive ? "text-zinc-900" : "text-zinc-900"
                    }`}
                  >
                    {keywordLabel(k.word)}
                  </p>
                  <p
                    className={`mt-1 font-mono text-[10px] tracking-widest uppercase ${
                      isActive ? "text-zinc-700" : "text-zinc-400"
                    }`}
                  >
                    ×{k.count}
                  </p>
                </div>
                <p
                  className={`mt-1 text-xs leading-relaxed sm:text-sm ${
                    isActive ? "text-zinc-800" : "text-zinc-500"
                  }`}
                >
                  {meta.description}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
      {active && (
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          Showing testimonials tagged “{keywordLabel(active)}”.{" "}
          <button
            type="button"
            onClick={() => toggle(active)}
            className="underline underline-offset-4 hover:text-zinc-900"
          >
            Clear filter
          </button>
        </p>
      )}
    </section>
  );
}
