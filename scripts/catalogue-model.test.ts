import assert from "node:assert/strict";
import { test } from "node:test";
import {
  displayValue,
  filterListings,
  type Listing,
} from "../lib/catalogue/model";

test("explicit no-points, missing values and numeric zero remain distinct", () => {
  assert.equal(displayValue(null, null, "not_applicable"), "No points");
  assert.equal(displayValue(null, null, "unknown"), "Not listed");
  assert.equal(displayValue(0, null, "assigned"), "0");
  assert.equal(displayValue(82.8, 86.3, "range"), "82.8–86.3");
});
test("product search never mixes market snapshots and combines filters", () => {
  const rows = [
    {
      source_id: "MY",
      sku: "000123",
      name: "Protein Powder",
      brand: "Nutrilite",
      category: "Nutrition",
      pack: "450g",
    },
    {
      source_id: "SG",
      sku: "000123",
      name: "Protein Powder",
      brand: "Nutrilite",
      category: "Nutrition",
      pack: "450g",
    },
    {
      source_id: "MY",
      sku: "000456",
      name: "Body Lotion",
      brand: "G&H",
      category: "Personal Care",
      pack: "400ml",
    },
  ] as Listing[];
  assert.equal(
    filterListings(rows, "MY", "protein 450g", "Nutrition", "Nutrilite").length,
    1,
  );
  assert.equal(filterListings(rows, "MY", "000123", "", "")[0].source_id, "MY");
  assert.equal(
    filterListings(rows, "MY", "protein", "Personal Care", "").length,
    0,
  );
  assert.equal(filterListings(rows, "SG", "", "", "G&H").length, 0);
});
