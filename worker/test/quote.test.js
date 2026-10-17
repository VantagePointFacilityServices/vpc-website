import { describe, it, expect, afterEach } from "vitest";
import { vi } from "vitest";
import worker, { signQuoteToken, SERVICE_ZONE_POSTCODES } from "../worker.js";
import { pickConfiguration, priceQuote, extrasPrice } from "../pricing.js";

const WWW = "https://www.vantagepointcleaning.com.au";
const env = {
  GHL_VPC_API_KEY: "k", GHL_VPC_LOCATION_ID: "loc", QUOTE_TOKEN_SECRET: "sek",
  GHL_PIPELINE_ID: "pipe", GHL_STAGE_QUOTED_ID: "st-quoted", GHL_STAGE_NEEDS_QUOTE_ID: "st-needs",
  GHL_POSTCODE_FIELD_ID: "pc-id",
};
const base = {
  package: "essential", bedrooms: 3, bathrooms: 2, powder_rooms: 0, living_areas: 2,
  study: false, media_room: false, multi_level: false, outdoor_alfresco: false, pool_surrounds: false,
  garage_serviced: false, balconies_count: 0, walk_in_robes_count: 0, property_condition: "medium",
  preferred_frequency: "weekly", weekend: false, extras: {},
};

let calls;
let contact;
let opps;
let failOn;
function mockGhl() {
  calls = [];
  globalThis.fetch = vi.fn(async (url, init) => {
    const u = String(url);
    const method = init?.method || "GET";
    calls.push({ url: u, method, body: init?.body ? JSON.parse(init.body) : null });
    if (failOn && failOn(u, method)) return new Response("no", { status: 500 });
    if (u.includes("/opportunities/search")) return new Response(JSON.stringify({ opportunities: opps }));
    if (u.includes("/contacts/") && method === "GET") return new Response(JSON.stringify({ contact }));
    return new Response("{}");
  });
}
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; failOn = null; });

async function quote(body, { token, e = env } = {}) {
  const t = token === undefined ? await signQuoteToken("c1", e) : token;
  return worker.fetch(new Request("https://w.test/quote", {
    method: "POST", headers: { Origin: WWW }, body: JSON.stringify({ quote_token: t, ...body }),
  }), e);
}
const reset = (pc = SERVICE_ZONE_POSTCODES[0]) => {
  contact = { id: "c1", customFields: [{ id: "pc-id", value: pc }] };
  opps = [];
  mockGhl();
};
const fieldsOf = () => Object.fromEntries(calls.find((c) => c.method === "PUT" && c.url.endsWith("/contacts/c1")).body.customFields.map((f) => [f.key, f.field_value]));
const tags = () => calls.find((c) => c.method === "POST" && c.url.endsWith("/tags")).body.tags;
const removedTags = () => calls.find((c) => c.method === "DELETE" && c.url.endsWith("/contacts/c1/tags"))?.body.tags;

// Independent oracle typed by hand from the PRD (do not import the data file here).
// [bedrooms, bathrooms, living_areas, essential, signature, reserve]
const TABLE = [
  [0, 1, 1, 179, 279, 449],
  [1, 1, 1, 179, 279, 449],
  [2, 1, 1, 179, 279, 499],
  [2, 2, 1, 209, 339, 589],
  [3, 2, 2, 269, 419, 699],
  [4, 2, 2, 299, 459, 759],
  [3, 3, 2, 309, 479, 789],
  [4, 3, 2, 339, 519, 849],
  [5, 3, 3, 399, 599, 959],
  [5, 4, 3, 449, 659, 1049],
];

describe("price ladder", () => {
  const rungs = TABLE.flatMap(([bed, bath, liv, e, s, r]) => [
    [bed, bath, liv, "essential", e], [bed, bath, liv, "signature", s], [bed, bath, liv, "reserve", r],
  ]);
  it("has 30 rungs", () => expect(rungs.length).toBe(30));
  it.each(rungs)("%i bed %i bath (living %i) %s = %i", async (bed, bath, liv, pkg, price) => {
    reset();
    const res = await quote({ ...base, package: pkg, bedrooms: bed, bathrooms: bath, living_areas: liv });
    expect(await res.json()).toEqual({
      outcome: "priced", package_price: price, extras_price: 0, per_visit_price: price, first_visit_price: 2 * price,
    });
  });
});

describe("nearest-lower + floor-aware increments", () => {
  it("3 bed + 1 bath → 2+1 computed rung (169) plus one bedroom", () => {
    expect(pickConfiguration(3, 1)).toMatchObject({ bedrooms: 2, bathrooms: 1 });
    expect(priceQuote("essential", { ...base, bedrooms: 3, bathrooms: 1, living_areas: 1 }, {}).package_price).toBe(169 + 30);
  });
  it("4 bed + 4 bath → 4+3 plus one bathroom", () => {
    expect(priceQuote("signature", { ...base, bedrooms: 4, bathrooms: 4, living_areas: 2 }, {}).package_price).toBe(519 + 60);
  });
  it("studio with 2 bath: computed 119 + 45 is below the minimum → $179", () => {
    expect(priceQuote("essential", { ...base, bedrooms: 0, bathrooms: 2, living_areas: 1 }, {}).package_price).toBe(179);
  });
  it("1 bed + 2 bath Essential: increments on the computed rung (139 + 45), not the floored 179 + 45 = 224", () => {
    const p = priceQuote("essential", { ...base, bedrooms: 1, bathrooms: 2, living_areas: 1 }, {}).package_price;
    expect(p).toBe(184);
    expect(p).not.toBe(224);
  });
  it("floor still applies when increments do not clear the minimum", () => {
    expect(priceQuote("reserve", { ...base, bedrooms: 0, bathrooms: 1, living_areas: 1, walk_in_robes_count: 1 }, {}).package_price).toBe(449);
  });
});

describe("increments and extras", () => {
  // [flag/override, essential, signature, reserve] on a 3 bed + 2 bath home (rung 269 / 419 / 699).
  const INC = [
    ["powder_rooms", 1, 20, 25, 40],
    ["living_areas", 3, 25, 35, 50],
    ["study", true, 20, 25, 35],
    ["media_room", true, 20, 30, 45],
    ["multi_level", true, 25, 35, 50],
    ["outdoor_alfresco", true, 30, 40, 60],
    ["pool_surrounds", true, 25, 35, 50],
    ["garage_serviced", true, 25, 35, 50],
    ["balconies_count", 1, 15, 20, 25],
    ["walk_in_robes_count", 1, 10, 15, 20],
  ];
  const RUNG = { essential: 269, signature: 419, reserve: 699 };
  const cases = INC.flatMap(([k, v, ...amts]) => ["essential", "signature", "reserve"].map((pkg, i) => [k, pkg, v, amts[i]]));
  it.each(cases)("increment %s on %s", (k, pkg, v, amt) => {
    expect(priceQuote(pkg, { ...base, [k]: v }, {}).package_price).toBe(RUNG[pkg] + amt);
  });
  it.each([
    ["essential", 30, 45], ["signature", 40, 60], ["reserve", 60, 85],
  ])("extra bedroom / bathroom on %s", (pkg, bed, bath) => {
    const rung = { essential: [169, 309], signature: [279, 479], reserve: [499, 789] }[pkg];
    expect(priceQuote(pkg, { ...base, bedrooms: 3, bathrooms: 1, living_areas: 1 }, {}).package_price).toBe(rung[0] + bed);
    expect(priceQuote(pkg, { ...base, bedrooms: 3, bathrooms: 4, living_areas: 2 }, {}).package_price).toBe({ essential: 309, signature: 479, reserve: 789 }[pkg] + bath);
  });
  it("prices every increment together on Essential", () => {
    const full = { ...base, powder_rooms: 2, living_areas: 4, study: true, media_room: true,
      multi_level: true, outdoor_alfresco: true, pool_surrounds: true, garage_serviced: true, balconies_count: 2, walk_in_robes_count: 3 };
    expect(priceQuote("essential", full, {}).package_price).toBe(269 + 40 + 50 + 20 + 20 + 25 + 30 + 25 + 25 + 30 + 30);
  });
  it("prices every Essential extra; first-visit maths", () => {
    const ex = { oven: true, fridge: true, cabinets: true, interior_glass: true, laundry_loads: 2, linen_beds: 3, ironing_blocks: 1, reset_blocks: 2 };
    const r = priceQuote("essential", base, ex);
    const extras = 109 + 65 + 69 + 65 + 90 + 60 + 45 + 130;
    expect(r).toEqual({ package_price: 269, extras_price: extras, per_visit_price: 269 + extras, first_visit_price: 538 + extras });
  });
  it("3b2b Essential + one laundry load = $314 per visit / $583 first visit", () => {
    expect(priceQuote("essential", base, { laundry_loads: 1 })).toEqual({
      package_price: 269, extras_price: 45, per_visit_price: 314, first_visit_price: 583,
    });
  });
  it.each(["essential", "signature", "reserve"])("housekeeping add-ons priced on %s", (pkg) => {
    expect(extrasPrice(pkg, { laundry_loads: 1 })).toBe(45);
    expect(extrasPrice(pkg, { linen_beds: 2 })).toBe(40);
    expect(extrasPrice(pkg, { ironing_blocks: 1 })).toBe(45);
    expect(extrasPrice(pkg, { cabinets: true })).toBe(69);
    expect(extrasPrice(pkg, { reset_blocks: 1 })).toBe(65);
  });
  it.each(["oven", "fridge", "interior_glass"])("%s is Essential-only: priced there, not on Signature/Reserve", (k) => {
    const price = { oven: 109, fridge: 65, interior_glass: 65 }[k];
    expect(extrasPrice("essential", { [k]: true })).toBe(price);
    expect(extrasPrice("signature", { [k]: true })).toBe(0);
    expect(extrasPrice("reserve", { [k]: true })).toBe(0);
  });
  it("Signature/Reserve: linen priced, glass included, others priced", () => {
    const ex = { cabinets: true, interior_glass: true, linen_beds: 4, laundry_loads: 1, ironing_blocks: 2, reset_blocks: 1 };
    expect(priceQuote("reserve", base, ex).extras_price).toBe(69 + 80 + 45 + 90 + 65);
  });
  it.each(["signature", "reserve"])("endpoint accepts linen on %s and prices it", async (pkg) => {
    reset();
    const res = await quote({ ...base, package: pkg, extras: { linen_beds: 3 } });
    expect(res.status).toBe(200);
    expect((await res.json()).extras_price).toBe(60);
  });
  it.each([["signature", "oven"], ["signature", "fridge"], ["reserve", "oven"], ["reserve", "fridge"]])("endpoint rejects %s %s", async (pkg, k) => {
    reset();
    expect((await quote({ ...base, package: pkg, extras: { [k]: true } })).status).toBe(400);
  });
  it("via the endpoint, writes extras summary and quoted fields", async () => {
    reset();
    const res = await quote({ ...base, extras: { oven: true, laundry_loads: 1 } });
    expect((await res.json()).extras_price).toBe(109 + 45);
    expect(fieldsOf().quote_extras).toBe("oven, laundry_loads=1");
  });
});

describe("no-price outcomes", () => {
  it.each([
    [{ bedrooms: 6 }, "over_5_bed"],
    [{ bathrooms: 5 }, "over_4_bath"],
    [{ property_condition: "high" }, "condition_high"],
    [{ weekend: true }, "weekend"],
  ])("%j → personal quote %s", async (over, reason) => {
    reset();
    const res = await quote({ ...base, ...over });
    expect(await res.json()).toEqual({ outcome: "personal_quote", reason });
    expect(tags()).toEqual(["quote-personal"]);
    expect(fieldsOf().non_standard_reason).toBe(reason);
    const opp = calls.find((c) => c.url.endsWith("/opportunities/"));
    expect(opp.body.pipelineStageId).toBe("st-needs");
  });

  it("out of area: no price, tag, fields, no opportunity", async () => {
    reset("2000");
    const res = await quote(base);
    expect(await res.json()).toEqual({ outcome: "out_of_area" });
    expect(tags()).toEqual(["out-of-area"]);
    expect(removedTags()).toEqual(["quote-priced", "quote-personal"]);
    expect(fieldsOf().non_standard_reason).toBe("out_of_area");
    expect(calls.some((c) => c.url.includes("/opportunities"))).toBe(false);
  });

  it("postcode falls back to postalCode / key", async () => {
    reset();
    contact = { id: "c1", postalCode: SERVICE_ZONE_POSTCODES[0] };
    expect((await (await quote(base)).json()).outcome).toBe("priced");
    contact = { id: "c1", customFields: [{ key: "postcode", field_value: "2000" }] };
    expect((await (await quote(base)).json()).outcome).toBe("out_of_area");
  });
});

describe("GHL writes for priced quote", () => {
  it("writes fields, tag and creates an Opportunity at Quoted", async () => {
    reset();
    const res = await quote({ ...base, pets_on_site: "dog", parking_access_notes: " Street parking ", special_requests: "Mind the cat", study: true });
    expect(res.status).toBe(200);
    const f = fieldsOf();
    expect(f).toMatchObject({
      service_tier: "essential", bedrooms: "3", bathrooms: "2", powder_rooms: "0", living_areas: "2",
      preferred_frequency: "weekly", property_condition: "medium", multi_level: "No", study: "Yes",
      balconies_count: "0", walk_in_robes_count: "0", garage_serviced: "No", pets_on_site: "dog",
      parking_access_notes: "Street parking", special_requests: "Mind the cat",
      quoted_package_price: "289", first_visit_price: "578",
    });
    expect(f.non_standard_reason).toBe("");
    expect(tags()).toEqual(["quote-priced"]);
    expect(removedTags()).toEqual(["quote-personal"]);
    const search = calls.find((c) => c.url.includes("/opportunities/search"));
    expect(search.url).toContain("contact_id=c1");
    const create = calls.find((c) => c.method === "POST" && c.url.endsWith("/opportunities/"));
    expect(create.body).toEqual({
      pipelineId: "pipe", pipelineStageId: "st-quoted", status: "open", monetaryValue: 289,
      locationId: "loc", contactId: "c1", name: "Website instant quote",
    });
  });

  it("updates an existing Opportunity", async () => {
    reset();
    opps = [{ id: "o9" }];
    await quote({ ...base, pets_on_site: true });
    const upd = calls.find((c) => c.method === "PUT" && c.url.endsWith("/opportunities/o9"));
    expect(upd.body).toMatchObject({ pipelineStageId: "st-quoted", monetaryValue: 269 });
    expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/opportunities/"))).toBe(false);
    expect(fieldsOf().pets_on_site).toBe("true");
  });

  it("search returning no list creates", async () => {
    reset();
    opps = undefined;
    await quote(base);
    expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/opportunities/"))).toBe(true);
  });
});

describe("auth", () => {
  it("401 for missing, forged, expired token", async () => {
    reset();
    expect((await quote(base, { token: null })).status).toBe(401);
    expect((await quote(base, { token: "abc.def" })).status).toBe(401);
    const other = await signQuoteToken("c1", { QUOTE_TOKEN_SECRET: "other" });
    expect((await quote(base, { token: other })).status).toBe(401);
    const old = await signQuoteToken("c1", env, Date.now() - 2 * 3600 * 1000);
    expect((await quote(base, { token: old })).status).toBe(401);
    expect(calls.length).toBe(0);
  });
});

describe("validation → 400", () => {
  const bad = [
    ["package", { package: "gold" }],
    ["bedrooms high", { bedrooms: 10 }],
    ["bedrooms float", { bedrooms: 1.5 }],
    ["bathrooms 0", { bathrooms: 0 }],
    ["powder", { powder_rooms: 4 }],
    ["living", { living_areas: 0 }],
    ["balconies", { balconies_count: 4 }],
    ["bool", { study: "yes" }],
    ["condition", { property_condition: "meh" }],
    ["frequency", { preferred_frequency: "monthly" }],
    ["extras array", { extras: [] }],
    ["extras null", { extras: null }],
    ["extras range", { extras: { linen_beds: 7 } }],
    ["extras bool", { extras: { oven: 1 } }],
    ["oven on signature", { package: "signature", extras: { oven: true } }],
    ["fridge on reserve", { package: "reserve", extras: { fridge: true } }],
    ["pets type", { pets_on_site: 5 }],
    ["notes type", { special_requests: 5 }],
    ["notes long", { special_requests: "x".repeat(501) }],
    ["door code", { parking_access_notes: "Door code 1234" }],
    ["alarm pin", { special_requests: "alarm pin: 9876" }],
  ];
  it.each(bad)("%s", async (_n, over) => {
    reset();
    const res = await quote({ ...base, ...over });
    expect(res.status).toBe(400);
    expect(typeof (await res.json()).error).toBe("string");
    expect(calls.length).toBe(0);
  });
  it("accepts exactly 500 chars and null notes; defaults optional counts", async () => {
    reset();
    const { powder_rooms, balconies_count, walk_in_robes_count, extras, ...rest } = base;
    const res = await quote({ ...rest, special_requests: "x".repeat(500), parking_access_notes: null });
    expect(res.status).toBe(200);
  });
});

describe("re-quote for the same contact", () => {
  it("personal quote then priced quote clears the reason and the personal tag", async () => {
    reset();
    await quote({ ...base, weekend: true });
    expect(removedTags()).toEqual(["quote-priced"]);
    expect(tags()).toEqual(["quote-personal"]);
    expect(fieldsOf().non_standard_reason).toBe("weekend");

    mockGhl();
    const res = await quote(base);
    expect((await res.json()).outcome).toBe("priced");
    expect(fieldsOf().non_standard_reason).toBe("");
    expect(removedTags()).toEqual(["quote-personal"]);
    expect(tags()).toEqual(["quote-priced"]);
    const del = calls.findIndex((c) => c.method === "DELETE" && c.url.endsWith("/tags"));
    const add = calls.findIndex((c) => c.method === "POST" && c.url.endsWith("/tags"));
    expect(del).toBeLessThan(add);
  });
});

describe("GHL failure → 502", () => {
  it("contact GET fails / returns no contact / throws", async () => {
    reset(); failOn = (u, m) => m === "GET" && u.includes("/contacts/");
    expect((await quote(base)).status).toBe(502);
    reset(); contact = undefined;
    expect((await quote(base)).status).toBe(502);
    reset(); globalThis.fetch = vi.fn(async () => { throw new Error("net"); });
    expect((await quote(base)).status).toBe(502);
  });
  it("contact PUT fails", async () => {
    reset(); failOn = (u, m) => m === "PUT" && u.includes("/contacts/");
    expect((await quote(base)).status).toBe(502);
  });
  it("tag fails", async () => {
    reset(); failOn = (u) => u.endsWith("/tags");
    expect((await quote(base)).status).toBe(502);
    reset(); failOn = (u, m) => m === "DELETE" && u.endsWith("/tags");
    expect((await quote(base)).status).toBe(502);
  });
  it("opportunity search / write fails", async () => {
    reset(); failOn = (u) => u.includes("/opportunities/search");
    expect((await quote(base)).status).toBe(502);
    reset(); failOn = (u, m) => m === "POST" && u.endsWith("/opportunities/");
    expect((await quote(base)).status).toBe(502);
  });
});
