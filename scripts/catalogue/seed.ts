import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const state = z.enum(["assigned", "range", "not_applicable", "unknown"]);
const n = z.number().nonnegative().nullable();
const row = z
  .object({
    market: z.enum(["MY", "SG"]),
    sku: z.string().regex(/^\d{5,8}[A-Z]?$/),
    name: z.string().min(1),
    brand: z.string().min(1),
    category: z.string().min(1),
    pack: z.string().default(""),
    source_page: z.number().int().positive(),
    raw_values: z.record(z.string(), z.string()),
    pv: n,
    pv_max: n,
    pv_status: state,
    bv: n,
    bv_max: n,
    bv_status: state,
    ap: n,
    ap_max: n,
    ap_status: state,
    rp: n,
    rp_max: n,
    rp_status: state,
  })
  .superRefine((r, c) => {
    for (const k of ["pv", "bv", "ap", "rp"] as const) {
      const status = r[`${k}_status`],
        hi = r[`${k}_max`],
        v = r[k];
      if (
        (status === "range") !== (hi !== null) ||
        ["range", "assigned"].includes(status) !== (v !== null) ||
        (hi !== null && (v === null || hi < v))
      )
        c.addIssue({ code: "custom", message: `Invalid ${k} state` });
    }
  });
const input = z.object({
  market: z.enum(["MY", "SG"]),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  rows: z.array(row).min(1),
  review_queue: z.array(z.unknown()),
});
async function main() {
  const paths = process.argv.slice(2);
  if (paths.length !== 2)
    throw new Error("Provide the extracted MY and SG JSON files");
  const parsed = await Promise.all(
    paths.map(async (p) => input.parse(JSON.parse(await readFile(p, "utf8")))),
  );
  if (new Set(parsed.map((p) => p.market)).size !== 2)
    throw new Error("Both markets required");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !url.includes("tnjujbkpepchhgyqwmtb"))
    throw new Error("Expected Whatelz project credentials");
  const db = createClient(url, key, { auth: { persistSession: false } });
  for (const p of parsed) {
    if (
      p.rows.some((r) => r.market !== p.market) ||
      new Set(p.rows.map((r) => r.sku)).size !== p.rows.length
    )
      throw new Error("Mixed market or duplicate SKU");
    const my = p.market === "MY",
      date = my ? "2026-04-01" : "2026-10-01";
    const id = `${p.market}-${date}-${p.sha256.slice(0, 12)}`;
    const source = {
      id,
      market: p.market,
      currency: my ? "MYR" : "SGD",
      title: my
        ? "Malaysia & Brunei ABO price list — April 2026"
        : "Singapore ABO price list — October 2026",
      edition_date: date,
      sha256: p.sha256,
      verified_count: p.rows.length,
      review_queue: p.review_queue,
      source_url: my
        ? "https://assets.contentstack.io/v3/assets/bltf1dd6317cb2088d3/blt9ef95d8f21077f19/69deebb04ec8c321f11eb5e8/ABO_Price_List_202604.pdf"
        : "https://www.amway.sg/abopricelist",
      notes: my
        ? "April 2026 reference snapshot. A newer Malaysian price list has not been verified. Prices may differ from the July 2026 product catalogue and current website."
        : "Effective 1 October 2026. AP and RP include 9% GST. Prices and promotions may change.",
    };
    let result = await db.from("product_catalogue_sources").upsert(source);
    if (result.error) throw result.error;
    for (let i = 0; i < p.rows.length; i += 100) {
      const batch = p.rows.slice(i, i + 100).map((record) => {
        const { market, ...listing } = record;
        if (market !== p.market) throw new Error("Unexpected market");
        return { source_id: id, ...listing };
      });
      result = await db.from("product_catalogue_listings").upsert(batch);
      if (result.error) throw result.error;
    }
    const count = await db
      .from("product_catalogue_listings")
      .select("sku", { count: "exact", head: true })
      .eq("source_id", id);
    if (count.error || count.count !== p.rows.length)
      throw new Error("Row-count verification failed");
    console.log(
      `${p.market}: ${count.count} source-backed listings, ${p.review_queue.length} extraction exceptions retained for review`,
    );
  }
  const definitions =
    "https://support.msb.amway.com/hc/en-us/articles/27112356422804-Definitions-of-PV-and-BV";
  const notes = [
    {
      id: "01-pv",
      title: "PV is points, not US dollars",
      body: "PV is Point Value assigned by Amway. Group PV determines the performance-bonus percentage. It is not a USD price or an exchange-rate conversion. The same SKU can have different PV in Malaysia and Singapore.",
      citations: [{ label: "Official PV / BV definitions", url: definitions }],
    },
    {
      id: "02-bv",
      title: "BV is assigned business volume",
      body: "BV is a monetary figure assigned by Amway for bonus calculations. Keep the published market-specific BV. Do not substitute AP, retail price, currency conversion or a fixed PV multiplier. In Malaysia, Double X lists 52 PV / 208 BV (4×), Soy Protein 25.5 / 121.5 (4.76×), and Cal Mag D 12 / 69.5 (5.79×). These examples are from April 2026.",
      citations: [
        { label: "Official definitions", url: definitions },
        {
          label: "Malaysia April 2026 price list",
          url: "https://assets.contentstack.io/v3/assets/bltf1dd6317cb2088d3/blt9ef95d8f21077f19/69deebb04ec8c321f11eb5e8/ABO_Price_List_202604.pdf",
        },
      ],
    },
    {
      id: "03-tax",
      title: "AP ÷ (1 + GST) is not a universal BV formula",
      body: "Singapore AP and RP include 9% GST. AP ÷ 1.09 removes GST; for many core products it approximates BV after rounding. Double X AP S$76 gives S$69.72 before GST, versus listed BV69.7. Exceptions matter: the squeeze bottle has AP S$3 and BV1.4, versus S$2.75 before GST. Malaysia uses SST rather than GST, so do not apply a blanket GST divisor to Malaysian prices.",
      citations: [
        {
          label: "Singapore official price list",
          url: "https://www.amway.sg/abopricelist",
        },
        {
          label: "IRAS GST rate",
          url: "https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/basics-of-gst/current-gst-rates",
        },
        { label: "Malaysia Customs SST", url: "https://mysst.customs.gov.my/" },
      ],
    },
    {
      id: "04-prices",
      title: "Read AP, RP and no-points items separately",
      body: "AP means ABO Price; RP means Retail Price. Neither is guaranteed earnings. “No points” preserves an explicit dash in the source; a published zero remains 0. Some accessories and business materials carry no PV/BV. Ranges depend on the selected pack or option. This is a dated product reference, with no purchasing or income guarantee.",
      citations: [
        {
          label: "Official non-PV/BV explanation",
          url: "https://support.msb.amway.com/hc/en-us/articles/46898025427220-Which-Products-Are-Considered-Non-PV-BV-Items",
        },
      ],
    },
  ].map((n) => ({ ...n, checked_on: "2026-10-09" }));
  const result = await db.from("product_catalogue_notes").upsert(notes);
  if (result.error) throw result.error;
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Catalogue import failed");
  process.exitCode = 1;
});
