import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { priceQuote } from "../pricing.js";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const quote = createRequire(import.meta.url)(join(repo, "site/assets/js/quote.js"));
const data = JSON.parse(readFileSync(join(repo, "worker/pricing-data.json"), "utf8"));

const base = { bedrooms: 3, bathrooms: 2, powder_rooms: 0, living_areas: 1, balconies_count: 0, walk_in_robes_count: 0, study: false, media_room: false, multi_level: false, outdoor_alfresco: false, pool_surrounds: false, garage_serviced: false };
const cases = [
  ["essential", {}, { laundry_loads: 1 }],
  ["essential", { bedrooms: 4, study: true }, { oven: 1, cabinets: 1, linen_beds: 2, reset_blocks: 1 }],
  ["reserve", { bedrooms: 4, bathrooms: 3, powder_rooms: 1, multi_level: true }, { linen_beds: 2, ironing_blocks: 1, oven: 1 }],
  ["signature", { bedrooms: 0, bathrooms: 1 }, {}],
  ["reserve", { bedrooms: 1, bathrooms: 1 }, {}],
];

describe("dialog running total matches the Worker", () => {
  it.each(cases)("%s %j %j", (pkg, home, extras) => {
    const h = { ...base, ...home };
    const mine = quote.computeTotal(data, { package: pkg, ...h, extras });
    expect(mine).toEqual(priceQuote(pkg, h, extras));
  });
  it("3b2b Essential + one laundry load is $314 / $583", () => {
    const r = priceQuote("essential", base, { laundry_loads: 1 });
    expect([r.per_visit_price, r.first_visit_price]).toEqual([314, 583]);
  });
});
