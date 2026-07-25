// Two-column benefit comparison for services with a founding tier. Founding
// column is brand-yellow accented (the intended sale); regular column is muted
// grey (the anchor). Rows are simple {label, founding, regular} triples where
// each cell can be a boolean (renders ✓ / —), a string, or a React node.

import type { ReactNode } from "react";

export interface ComparisonRow {
  label: string;
  founding: ReactNode | boolean;
  regular: ReactNode | boolean;
  highlight?: boolean;
}

function Cell({
  value,
  emphasized,
}: {
  value: ReactNode | boolean;
  emphasized: boolean;
}) {
  if (value === true) {
    return (
      <span
        aria-label="Included"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
        style={{
          background: emphasized
            ? "var(--accent)"
            : "color-mix(in srgb, var(--accent) 15%, transparent)",
          color: "#09090b",
        }}
      >
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span aria-label="Not included" className="text-zinc-300">
        —
      </span>
    );
  }
  return (
    <span
      className={emphasized ? "font-medium text-zinc-900" : "text-zinc-500"}
    >
      {value}
    </span>
  );
}

export function ComparisonTable({
  foundingLabel,
  foundingSubLabel,
  foundingPrice,
  foundingPriceAnchor,
  foundingCta,
  regularLabel,
  regularSubLabel,
  regularPrice,
  regularCta,
  rows,
}: {
  foundingLabel: string;
  foundingSubLabel: string;
  foundingPrice: string;
  foundingPriceAnchor?: string;
  foundingCta: { label: string; href: string };
  regularLabel: string;
  regularSubLabel: string;
  regularPrice: string;
  regularCta: { label: string; href: string };
  rows: ComparisonRow[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Founding column — brand accent */}
      <div
        className="flex flex-col border-2 bg-white p-6 sm:p-8"
        style={{ borderColor: "var(--accent)" }}
      >
        <div>
          <p
            className="font-mono text-[10px] tracking-widest uppercase"
            style={{ color: "var(--accent-text)" }}
          >
            {foundingLabel}
          </p>
          <p className="mt-1 text-sm text-zinc-600">{foundingSubLabel}</p>
          <div className="mt-6 flex items-baseline gap-3">
            {foundingPriceAnchor && (
              <span className="font-mono text-lg text-zinc-400 line-through">
                {foundingPriceAnchor}
              </span>
            )}
            <span className="text-4xl font-semibold text-zinc-900 sm:text-5xl">
              {foundingPrice}
            </span>
          </div>
        </div>

        <ul className="mt-8 space-y-4 border-t border-zinc-100 pt-6">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-start justify-between gap-4"
            >
              <span
                className={`text-sm ${r.highlight ? "font-medium text-zinc-900" : "text-zinc-700"}`}
              >
                {r.label}
              </span>
              <div className="shrink-0">
                <Cell value={r.founding} emphasized={true} />
              </div>
            </li>
          ))}
        </ul>

        <a
          href={foundingCta.href}
          className="mt-8 inline-flex items-center justify-center gap-2 border-2 px-6 py-4 font-mono text-xs tracking-widest uppercase text-zinc-900 transition-colors hover:text-white"
          style={{
            borderColor: "var(--accent)",
            background: "var(--accent)",
          }}
          onMouseEnter={undefined}
        >
          {foundingCta.label}
          <span aria-hidden>→</span>
        </a>
      </div>

      {/* Regular column — muted */}
      <div className="flex flex-col border border-zinc-200 bg-zinc-50/50 p-6 sm:p-8">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-400">
            {regularLabel}
          </p>
          <p className="mt-1 text-sm text-zinc-500">{regularSubLabel}</p>
          <div className="mt-6 flex items-baseline">
            <span className="text-4xl font-semibold text-zinc-500 sm:text-5xl">
              {regularPrice}
            </span>
          </div>
        </div>

        <ul className="mt-8 space-y-4 border-t border-zinc-100 pt-6">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-start justify-between gap-4"
            >
              <span className="text-sm text-zinc-500">{r.label}</span>
              <div className="shrink-0">
                <Cell value={r.regular} emphasized={false} />
              </div>
            </li>
          ))}
        </ul>

        <a
          href={regularCta.href}
          className="mt-8 inline-flex items-center justify-center gap-2 border border-zinc-300 bg-white px-6 py-4 font-mono text-xs tracking-widest uppercase text-zinc-600 transition-colors hover:border-zinc-900 hover:text-zinc-900"
        >
          {regularCta.label}
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
