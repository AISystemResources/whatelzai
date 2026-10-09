export type Market = "MY" | "SG";
export type ValueStatus = "assigned" | "range" | "not_applicable" | "unknown";
export type Listing = {
  source_id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  pack: string;
  source_page: number;
  pv: number | null;
  pv_max: number | null;
  pv_status: ValueStatus;
  bv: number | null;
  bv_max: number | null;
  bv_status: ValueStatus;
  ap: number | null;
  ap_max: number | null;
  ap_status: ValueStatus;
  rp: number | null;
  rp_max: number | null;
  rp_status: ValueStatus;
};
export type CatalogueSource = {
  id: string;
  market: Market;
  currency: "MYR" | "SGD";
  title: string;
  edition_date: string;
  source_url: string;
  retrieved_at: string;
  verified_count: number;
  review_queue: unknown[];
  notes: string;
};
export type ReferenceNote = {
  id: string;
  title: string;
  body: string;
  citations: { label: string; url: string }[];
  checked_on: string;
};
export function displayValue(
  value: number | null,
  max: number | null,
  status: ValueStatus,
): string {
  if (status === "not_applicable") return "No points";
  if (status === "unknown" || value === null) return "Not listed";
  const format = (n: number) =>
    n.toLocaleString("en", { maximumFractionDigits: 2 });
  return max === null ? format(value) : `${format(value)}–${format(max)}`;
}
export function filterListings(
  rows: Listing[],
  sourceId: string,
  query: string,
  category: string,
  brand: string,
) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter(
    (r) =>
      r.source_id === sourceId &&
      (!category || r.category === category) &&
      (!brand || r.brand === brand) &&
      words.every((w) =>
        `${r.name} ${r.sku} ${r.brand} ${r.pack}`
          .toLocaleLowerCase()
          .includes(w),
      ),
  );
}
