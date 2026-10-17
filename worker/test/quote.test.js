import { describe, it, expect, afterEach } from "vitest";
import { vi } from "vitest";
import worker, { signQuoteToken, SERVICE_ZONE_POSTCODES } from "../worker.js";
import { LADDER, pickConfiguration, priceQuote, extrasPrice, ESSENTIAL_ONLY_PRICED } from "../pricing.js";

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

describe("price ladder", () => {
  const rungs = LADDER.flatMap((r) => ["essential", "signature", "reserve"].map((p) => [r.bedrooms, r.bathrooms, p, r[p]]));
  it("has 30 rungs", () => expect(rungs.length).toBe(30));
  it.each(rungs)("%i bed %i bath %s = %i", async (bed, bath, pkg, price) => {
    reset();
    const res = await quote({ ...base, package: pkg, bedrooms: bed, bathrooms: bath, living_areas: bed <= 2 ? 1 : bed <= 4 ? 2 : 3 });
    expect(await res.json()).toEqual({
      outcome: "priced", package_price: price, extras_price: 0, per_visit_price: price, first_visit_price: 2 * price,
    });
  });
});

describe("D15 exact table (independent copy)", () => {
  const table = [
    [0,1,199,349,629],[1,1,199,369,659],[2,1,249,419,719],[2,2,309,499,799],[3,2,399,599,919],
    [4,2,439,649,979],[3,3,459,669,999],[4,3,509,729,1059],[5,3,589,829,1179],[5,4,659,899,1259],
  ];
  it("matches", () => {
    expect(LADDER.map((r) => [r.bedrooms, r.bathrooms, r.essential, r.signature, r.reserve])).toEqual(table);
  });
});

describe("nearest-lower + increments", () => {
  it("3 bed + 1 bath → 2+1 plus one bedroom", () => {
    expect(pickConfiguration(3, 1)).toMatchObject({ bedrooms: 2, bathrooms: 1 });
    expect(priceQuote("essential", { ...base, bedrooms: 3, bathrooms: 1, living_areas: 1 }, {}).package_price).toBe(249 + 45);
  });
  it("4 bed + 4 bath → 4+3 plus one bathroom", () => {
    expect(priceQuote("signature", { ...base, bedrooms: 4, bathrooms: 4, living_areas: 2 }, {}).package_price).toBe(729 + 65);
  });
  it("studio with 2 bath → studio+1 plus bath", () => {
    expect(priceQuote("essential", { ...base, bedrooms: 0, bathrooms: 2, living_areas: 1 }, {}).package_price).toBe(199 + 65);
  });
});

describe("increments and extras", () => {
  const full = { ...base, bedrooms: 3, bathrooms: 2, powder_rooms: 2, living_areas: 4, study: true, media_room: true,
    multi_level: true, outdoor_alfresco: true, pool_surrounds: true, garage_serviced: true, balconies_count: 2, walk_in_robes_count: 3 };
  it("prices every increment", () => {
    // 399 + 60 + 2*40 + 25+30+40+45+40+40 + 40 + 45
    expect(priceQuote("essential", full, {}).package_price).toBe(399 + 60 + 80 + 25 + 30 + 40 + 45 + 40 + 40 + 40 + 45);
  });
  it("prices every Essential extra; first-visit maths", () => {
    const ex = { oven: true, fridge: true, cabinets: true, interior_glass: true, laundry_loads: 2, linen_beds: 3, ironing_blocks: 1, reset_blocks: 2 };
    const r = priceQuote("essential", base, ex);
    const extras = 129 + 65 + 99 + 65 + 90 + 60 + 65 + 130;
    expect(r).toEqual({ package_price: 399, extras_price: extras, per_visit_price: 399 + extras, first_visit_price: 798 + extras });
  });
  it("Signature/Reserve: linen and glass included, others priced", () => {
    const ex = { cabinets: true, interior_glass: true, linen_beds: 4, laundry_loads: 1, ironing_blocks: 2, reset_blocks: 1 };
    expect(priceQuote("reserve", base, ex).extras_price).toBe(99 + 45 + 130 + 65);
  });
  it.each(ESSENTIAL_ONLY_PRICED)("ESSENTIAL_ONLY_PRICED %s: priced on Essential only", (k) => {
    const ex = { laundry_loads: 0, linen_beds: 0, ironing_blocks: 0, reset_blocks: 0, [k]: 1 };
    expect(extrasPrice("essential", ex)).toBeGreaterThan(0);
    expect(extrasPrice("signature", ex)).toBe(0);
    expect(extrasPrice("reserve", ex)).toBe(0);
  });
  it("via the endpoint, writes extras summary and quoted fields", async () => {
    reset();
    const res = await quote({ ...base, extras: { oven: true, laundry_loads: 1 } });
    expect((await res.json()).extras_price).toBe(129 + 45);
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
      quoted_package_price: "424", first_visit_price: "848",
    });
    expect(f.non_standard_reason).toBe("");
    expect(tags()).toEqual(["quote-priced"]);
    expect(removedTags()).toEqual(["quote-personal"]);
    const search = calls.find((c) => c.url.includes("/opportunities/search"));
    expect(search.url).toContain("contact_id=c1");
    const create = calls.find((c) => c.method === "POST" && c.url.endsWith("/opportunities/"));
    expect(create.body).toEqual({
      pipelineId: "pipe", pipelineStageId: "st-quoted", status: "open", monetaryValue: 424,
      locationId: "loc", contactId: "c1", name: "Website instant quote",
    });
  });

  it("updates an existing Opportunity", async () => {
    reset();
    opps = [{ id: "o9" }];
    await quote({ ...base, pets_on_site: true });
    const upd = calls.find((c) => c.method === "PUT" && c.url.endsWith("/opportunities/o9"));
    expect(upd.body).toMatchObject({ pipelineStageId: "st-quoted", monetaryValue: 399 });
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
