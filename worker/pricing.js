// Pure instant-quote pricing. The ladder, increments and extras come from the
// vpos pricing data file (synced by scripts/sync-pricing.mjs); nothing is hard-coded.
import DATA from "./pricing-data.json";

export const PACKAGES = Object.keys(DATA.tiers);
export const LADDER = DATA.ladder;
export const INCREMENTS = DATA.increments;
export const EXTRAS = DATA.extras;

const essentialOnly = (k) => Boolean(EXTRAS[k].essential_only);

// Oven/fridge are in the Signature/Reserve rotation, so those packages reject them.
export const ROTATION_EXTRAS = ["oven", "fridge"].filter(essentialOnly);
// Priced on Essential only (included above it): input key -> extras key.
const EXTRA_KEY = {
  oven: "oven", fridge: "fridge", cabinets: "cabinets", interior_glass: "interior_glass",
  laundry_loads: "laundry_load", linen_beds: "linen_bed", ironing_blocks: "ironing_block", reset_blocks: "reset_block",
};

// Nearest lower configuration: the highest-priced rung that fits inside the home.
export function pickConfiguration(bedrooms, bathrooms) {
  let best = null;
  for (const rung of LADDER) {
    if (rung.bedrooms <= bedrooms && rung.bathrooms <= bathrooms) best = rung;
  }
  return best;
}

// Floor-aware: max(computed rung + increments, tier minimum).
export function packagePrice(pkg, h) {
  const cfg = pickConfiguration(h.bedrooms, h.bathrooms);
  const inc = (k) => INCREMENTS[k][pkg];
  let price = cfg.computed[pkg];
  price += (h.bedrooms - cfg.bedrooms) * inc("extra_bedroom");
  price += (h.bathrooms - cfg.bathrooms) * inc("extra_bathroom");
  price += h.powder_rooms * inc("powder_room");
  price += Math.max(0, h.living_areas - cfg.living_areas) * inc("extra_living_area");
  if (h.study) price += inc("study");
  if (h.media_room) price += inc("media_room");
  if (h.multi_level) price += inc("multi_level");
  if (h.outdoor_alfresco) price += inc("outdoor_alfresco");
  if (h.pool_surrounds) price += inc("pool_surrounds");
  if (h.garage_serviced) price += inc("garage_serviced");
  price += h.balconies_count * inc("balcony");
  price += h.walk_in_robes_count * inc("walk_in_robe");
  return Math.max(price, DATA.tiers[pkg].minimum);
}

export function extrasPrice(pkg, e) {
  let total = 0;
  for (const [input, key] of Object.entries(EXTRA_KEY)) {
    if (essentialOnly(key) && pkg !== "essential") continue;
    total += Number(e[input] || 0) * EXTRAS[key].price;
  }
  return total;
}

export const FIRST_VISIT_MULTIPLE = DATA.first_visit_multiple;

export function priceQuote(pkg, home, extras) {
  const package_price = packagePrice(pkg, home);
  const extras_price = extrasPrice(pkg, extras);
  return {
    package_price,
    extras_price,
    per_visit_price: package_price + extras_price,
    first_visit_price: FIRST_VISIT_MULTIPLE * package_price + extras_price,
  };
}

// Returns a reason string when the home gets a personal quote, else null.
export function personalQuoteReason(h) {
  if (h.bedrooms > 5) return "over_5_bed";
  if (h.bathrooms > 4) return "over_4_bath";
  if (h.property_condition === "high") return "condition_high";
  if (h.weekend) return "weekend";
  return null;
}
