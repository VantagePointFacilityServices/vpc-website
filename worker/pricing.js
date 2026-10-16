// Pure instant-quote pricing (PRD D8, D15, D16). Ladder and increments are
// data so vpos (check-residential-ladder.js) and the Worker can be compared.

export const PACKAGES = ["essential", "signature", "reserve"];

// Ordered by price (ascending). [bedrooms, bathrooms, essential, signature, reserve]
export const LADDER = [
  { bedrooms: 0, bathrooms: 1, essential: 199, signature: 349, reserve: 629 },
  { bedrooms: 1, bathrooms: 1, essential: 199, signature: 369, reserve: 659 },
  { bedrooms: 2, bathrooms: 1, essential: 249, signature: 419, reserve: 719 },
  { bedrooms: 2, bathrooms: 2, essential: 309, signature: 499, reserve: 799 },
  { bedrooms: 3, bathrooms: 2, essential: 399, signature: 599, reserve: 919 },
  { bedrooms: 4, bathrooms: 2, essential: 439, signature: 649, reserve: 979 },
  { bedrooms: 3, bathrooms: 3, essential: 459, signature: 669, reserve: 999 },
  { bedrooms: 4, bathrooms: 3, essential: 509, signature: 729, reserve: 1059 },
  { bedrooms: 5, bathrooms: 3, essential: 589, signature: 829, reserve: 1179 },
  { bedrooms: 5, bathrooms: 4, essential: 659, signature: 899, reserve: 1259 },
];

export const INCREMENTS = {
  extra_bedroom: 45,
  extra_bathroom: 65,
  powder_room: 30,
  extra_living_area: 40,
  study: 25,
  media_room: 30,
  multi_level: 40,
  outdoor_alfresco: 45,
  pool_surrounds: 40,
  balcony: 20,
  walk_in_robe: 15,
  garage_serviced: 40,
};

export const EXTRAS = {
  oven: 129,
  fridge: 65,
  cabinets: 99,
  interior_glass: 65,
  laundry_load: 45,
  linen_bed: 20,
  ironing_block: 65,
  reset_block: 65,
};

// Oven/fridge are in the Signature/Reserve rotation; linen and interior glass
// are included above Essential.
export const ESSENTIAL_ONLY_PRICED = ["linen_beds", "interior_glass"];
export const ROTATION_EXTRAS = ["oven", "fridge"];
// Input key → unit price (linen_beds is a count, interior_glass a flag).
const ESSENTIAL_ONLY_RATES = { linen_beds: EXTRAS.linen_bed, interior_glass: EXTRAS.interior_glass };

const assumedLiving = (beds) => (beds <= 2 ? 1 : beds <= 4 ? 2 : 3);

// Nearest lower configuration: the highest-priced rung that fits inside the home.
export function pickConfiguration(bedrooms, bathrooms) {
  let best = null;
  for (const rung of LADDER) {
    if (rung.bedrooms <= bedrooms && rung.bathrooms <= bathrooms) best = rung;
  }
  return best;
}

export function packagePrice(pkg, h) {
  const cfg = pickConfiguration(h.bedrooms, h.bathrooms);
  let price = cfg[pkg];
  price += (h.bedrooms - cfg.bedrooms) * INCREMENTS.extra_bedroom;
  price += (h.bathrooms - cfg.bathrooms) * INCREMENTS.extra_bathroom;
  price += h.powder_rooms * INCREMENTS.powder_room;
  price += Math.max(0, h.living_areas - assumedLiving(cfg.bedrooms)) * INCREMENTS.extra_living_area;
  if (h.study) price += INCREMENTS.study;
  if (h.media_room) price += INCREMENTS.media_room;
  if (h.multi_level) price += INCREMENTS.multi_level;
  if (h.outdoor_alfresco) price += INCREMENTS.outdoor_alfresco;
  if (h.pool_surrounds) price += INCREMENTS.pool_surrounds;
  if (h.garage_serviced) price += INCREMENTS.garage_serviced;
  price += h.balconies_count * INCREMENTS.balcony;
  price += h.walk_in_robes_count * INCREMENTS.walk_in_robe;
  return price;
}

export function extrasPrice(pkg, e) {
  let total = 0;
  if (e.oven) total += EXTRAS.oven;
  if (e.fridge) total += EXTRAS.fridge;
  if (e.cabinets) total += EXTRAS.cabinets;
  total += e.laundry_loads * EXTRAS.laundry_load;
  total += e.ironing_blocks * EXTRAS.ironing_block;
  total += e.reset_blocks * EXTRAS.reset_block;
  if (pkg === "essential") {
    for (const k of ESSENTIAL_ONLY_PRICED) total += Number(e[k] || 0) * ESSENTIAL_ONLY_RATES[k];
  }
  return total;
}

export function priceQuote(pkg, home, extras) {
  const package_price = packagePrice(pkg, home);
  const extras_price = extrasPrice(pkg, extras);
  return {
    package_price,
    extras_price,
    per_visit_price: package_price + extras_price,
    first_visit_price: 2 * package_price + extras_price,
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
