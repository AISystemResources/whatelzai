# Product reference catalogue

The member app `/catalogue` is a signed-in research reference for Malaysia and Singapore. Search names, brand or SKU, filter categories/brands, and switch markets. It has no checkout. The admin Network Marketing area links to it.

## Findings checked 9 October 2026

- **PV is Point Value, not USD.** Amway assigns it to products and uses monthly group PV to determine the performance-bonus percentage.
- **BV is assigned Business Volume.** It is a monetary figure related to prices, used in bonus calculations. Preserve market-specific published values; never calculate it from exchange rates or a fixed multiplier.
- **AP is ABO Price; RP is Retail Price.** Prices are not commissions or guaranteed earnings.
- **Singapore:** AP and RP include 9% GST. Removing GST with AP/1.09 often approximates listed BV for core products, but is not a universal rule. Double X: AP S$76, BV69.7; squeeze bottle: AP S$3, BV1.4 (tax-exclusive AP approximately S$2.75).
- **Malaysia:** uses SST rather than GST. The April list has Double X 52 PV/208 BV (4×), Soy Protein 25.5/121.5 (4.76×), Cal Mag D 12/69.5 (5.79×). ROSYSHINE has AP RM60 but BV30. Do not use AP or PV×4 as a substitute for listed BV.
- Explicit dashes for points remain “No points”; zero remains 0; missing values are not fabricated. Pack ranges retain both endpoints.

## Provenance and coverage

| Market    | Price-list edition       | Imported listings | Extraction exceptions |
| --------- | ------------------------ | ----------------: | --------------------: |
| Malaysia  | April 2026               |               406 |                    25 |
| Singapore | Effective 1 October 2026 |               319 |                    34 |

Malaysia's April list is the most recent price list verified in this session. It is older than the supplied July product catalogue. Its prices are deliberately labelled a dated snapshot; they are not presented as live or definitive current prices. Website prices take precedence. Singapore's landing page supplies a short-lived signed PDF URL; store the stable landing URL, not the signed query.

The import scans all product-price pages, handles numeric cells and ranges, expands explicit shared shade cells, and rejects incomplete or conflicting rows. Exceptions include business materials, some merged cells and a repeated Malaysian shade SKU. They remain in the source's database review queue, excluded from published results. This is not a claim of complete market inventory or real-time stock coverage.

Sources retain edition, retrieval time, SHA-256 checksum, page numbers, raw numeric cells and review queue. Future imports create separate checksum-backed snapshots; no historical snapshots are deleted. July MY/SG catalogue text and knowledge records remain in ignored `supabase/private/` files for further enrichment. Ingredients, suitability, allergens and customer-profile recommendations are future work; no medical claims are inferred from product names or PV.

## Refresh

1. Download an official price list and verify its edition, table legend and representative rows visually.
2. Extract: `python scripts/catalogue/extract_prices.py MY source.pdf output.json` (or SG). Requires pdfplumber and Poppler. Review rejected cells and cross-check representative SKUs, zero/dash values, ranges and accessories against the PDF.
3. Update the source metadata in `scripts/catalogue/seed.ts` for the new edition/URL. Never label a new file with the prior edition.
4. Import using server credentials: `node --env-file=.env.local --import tsx scripts/catalogue/seed.ts /path/my.json /path/sg.json`.
5. Verify row counts, RLS/grants, examples and the authenticated browser flow. Do not commit credentials, signed download URLs or complete source PDFs.

The three product_catalogue tables are server-only: RLS enabled, no anon/authenticated grants, service-role read/import access. The page and loader independently require a verified application user. Source-backed educational notes are stored in Supabase alongside the references. No customer information is part of this import.

## Official references

- [Amway PV/BV definitions](https://support.msb.amway.com/hc/en-us/articles/27112356422804-Definitions-of-PV-and-BV)
- [Malaysia April 2026 price list](https://assets.contentstack.io/v3/assets/bltf1dd6317cb2088d3/blt9ef95d8f21077f19/69deebb04ec8c321f11eb5e8/ABO_Price_List_202604.pdf)
- [Singapore current price-list download](https://www.amway.sg/abopricelist)
- [Non-PV/BV items](https://support.msb.amway.com/hc/en-us/articles/46898025427220-Which-Products-Are-Considered-Non-PV-BV-Items)
- [IRAS GST rate](https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/basics-of-gst/current-gst-rates)
- [Malaysia Customs SST](https://mysst.customs.gov.my/)
