"use client";
import { useMemo, useRef, useState } from "react";
import type {
  CatalogueSource,
  Listing,
  Market,
  ReferenceNote,
} from "@/lib/catalogue/model";
import { displayValue, filterListings } from "@/lib/catalogue/model";
const PAGE_SIZE = 24;
export function CatalogueBrowser({
  sources,
  listings,
  notes,
}: {
  sources: CatalogueSource[];
  listings: Listing[];
  notes: ReferenceNote[];
}) {
  const resultsHeading = useRef<HTMLParagraphElement>(null);
  function changePage(next: number) {
    setPage(next);
    requestAnimationFrame(() =>
      resultsHeading.current?.scrollIntoView({ block: "start" }),
    );
  }
  const [market, setMarket] = useState<Market>("MY");
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState(""),
    [brand, setBrand] = useState(""),
    [page, setPage] = useState(1);
  const source = sources.find((s) => s.market === market);
  const available = useMemo(
    () => listings.filter((r) => r.source_id === source?.id),
    [listings, source?.id],
  );
  const categories = useMemo(
    () => [...new Set(available.map((r) => r.category))].sort(),
    [available],
  );
  const brands = useMemo(
    () =>
      [
        ...new Set(
          available
            .filter((r) => !category || r.category === category)
            .map((r) => r.brand),
        ),
      ].sort(),
    [available, category],
  );
  const results = useMemo(
    () => filterListings(listings, source?.id ?? "", query, category, brand),
    [listings, source?.id, query, category, brand],
  );
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const shownPage = Math.min(page, pages);
  const currency = market === "MY" ? "RM" : "S$";
  function price(r: Listing, key: "ap" | "rp") {
    if (r[`${key}_status`] === "not_applicable") return "Not offered";
    const v = displayValue(r[key], r[`${key}_max`], r[`${key}_status`]);
    return r[key] === null ? v : `${currency}${v}`;
  }
  if (!source)
    return <p>No published reference is available for this market yet.</p>;
  const edition = new Date(
    source.edition_date + "T00:00:00Z",
  ).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <div className="space-y-8">
      <div className="flex gap-2" role="group" aria-label="Product market">
        {(["MY", "SG"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={market === m}
            onClick={() => {
              setMarket(m);
              setCategory("");
              setBrand("");
              setPage(1);
            }}
            className={`rounded-full border px-5 py-3 text-sm font-medium ${market === m ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700"}`}
          >
            {m === "MY" ? "Malaysia · MYR" : "Singapore · SGD"}
          </button>
        ))}
      </div>
      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">
          {edition} reference · {source.verified_count} listings
        </p>
        <p className="mt-2 leading-relaxed">{source.notes}</p>
        <a
          href={source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block underline underline-offset-4"
        >
          Open official price list ↗
        </a>
      </aside>
      <details className="rounded-2xl border border-zinc-200 p-5">
        <summary className="cursor-pointer font-semibold">
          Understanding prices, PV and BV
        </summary>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {notes.map((n) => (
            <section key={n.id}>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {n.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                {n.citations.map((c) => (
                  <a
                    key={c.url}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline underline-offset-4"
                  >
                    {c.label} ↗
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </details>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <label className="block text-sm font-medium">
          Search products
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Name, brand or SKU"
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal"
          />
        </label>
        <label className="block text-sm font-medium">
          Category
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setBrand("");
              setPage(1);
            }}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Brand
          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setPage(1);
            }}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-normal"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p ref={resultsHeading} role="status" className="text-sm text-zinc-600">
          {results.length} matching products · {edition}
        </p>
        {(query || category || brand) && (
          <button
            onClick={() => {
              setQuery("");
              setCategory("");
              setBrand("");
              setPage(1);
            }}
            className="text-sm underline"
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {results
          .slice((shownPage - 1) * PAGE_SIZE, shownPage * PAGE_SIZE)
          .map((r) => (
            <article
              key={r.sku}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <p className="text-xs font-medium tracking-wide text-zinc-500">
                {r.brand} · {r.category}
              </p>
              <h2 className="mt-2 text-lg font-semibold leading-snug">
                {r.name}
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                SKU {r.sku}
                {r.pack ? ` · ${r.pack}` : ""}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-100 pt-4">
                <div>
                  <dt className="text-xs text-zinc-500">ABO price · AP</dt>
                  <dd className="mt-1 font-semibold">{price(r, "ap")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Retail price · RP</dt>
                  <dd className="mt-1 font-semibold">{price(r, "rp")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Point Value · PV</dt>
                  <dd className="mt-1 font-semibold">
                    {displayValue(r.pv, r.pv_max, r.pv_status)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">
                    Business Volume · BV ({market})
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {displayValue(r.bv, r.bv_max, r.bv_status)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                {edition} price list · page {r.source_page}
                {[r.pv_status, r.bv_status, r.ap_status, r.rp_status].includes(
                  "range",
                )
                  ? " · Values vary by pack or option."
                  : ""}
              </p>
            </article>
          ))}
      </div>
      {!results.length && (
        <p className="rounded-2xl border border-zinc-200 p-8 text-zinc-600">
          No matches. Try a shorter name or clear the filters.
        </p>
      )}
      <nav
        aria-label="Product pages"
        className="flex items-center justify-center gap-4"
      >
        <button
          disabled={shownPage <= 1}
          onClick={() => changePage(shownPage - 1)}
          className="rounded-xl border border-zinc-300 px-4 py-2 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {shownPage} of {pages}
        </span>
        <button
          disabled={shownPage >= pages}
          onClick={() => changePage(shownPage + 1)}
          className="rounded-xl border border-zinc-300 px-4 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </nav>

      <p className="text-xs leading-relaxed text-zinc-500">
        Coverage: {source.verified_count} listings with checked table values.{" "}
        {source.review_queue.length} extraction exceptions are retained for
        review, including shared cells and business materials; they are excluded
        from the results. This reference is not a live stock check. Choose
        products by customer needs and suitability, not points alone.
      </p>
    </div>
  );
}
