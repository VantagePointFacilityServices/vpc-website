import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import worker, {
  signQuoteToken, verifyQuoteToken, verifyTurnstile, deriveLeadChannel,
  extractUtmFields, upsertContactInGHL, addTagsInGHL, SERVICE_ZONE_POSTCODES,
} from "../worker.js";

const WWW = "https://www.vantagepointcleaning.com.au";
const env = {
  GHL_VPC_API_KEY: "k", GHL_VPC_LOCATION_ID: "loc", QUOTE_TOKEN_SECRET: "sek",
  GHL_PIPELINE_ID: "pipe", GHL_STAGE_NEW_ENQUIRY_ID: "st-new",
};
const good = { first_name: " Ann ", last_name: "Lee", email: "a@b.co", phone: "0400000000", postcode: SERVICE_ZONE_POSTCODES[0] };

let calls;
function mockFetch(handler) {
  calls = [];
  globalThis.fetch = vi.fn(async (url, init) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
    return handler(url, init);
  });
}
const okGhl = (url) =>
  String(url).endsWith("/upsert")
    ? new Response(JSON.stringify({ contact: { id: "c1" } }))
    : new Response("{}");
const post = (body, headers = {}, path = "/lead") =>
  worker.fetch(new Request("https://w.test" + path, { method: "POST", headers: { Origin: WWW, ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }), env);
const tagsCall = () => calls.find((c) => c.url.endsWith("/tags"));

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

describe("POST /lead", () => {
  beforeEach(() => mockFetch(okGhl));

  it("upserts, tags and returns contact_id + verifiable token", async () => {
    const res = await post({ ...good, conversion_page: "home", utm_source: "google", utm_medium: "cpc", marketing_consent: true });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.contact_id).toBe("c1");
    expect(await verifyQuoteToken(body.quote_token, env)).toEqual({ contactId: "c1" });
    const up = calls[0].body;
    expect(up.locationId).toBe("loc");
    expect(up.firstName).toBe("Ann");
    const f = Object.fromEntries(up.customFields.map((x) => [x.key, x.field_value]));
    expect(f).toMatchObject({ postcode: good.postcode, conversion_page: "home", lead_channel: "paid_search", utm_source: "google", marketing_consent: "Yes" });
    expect(tagsCall().body.tags).toEqual(["website-lead"]);
  });

  it("tags out-of-area but still accepts", async () => {
    const res = await post({ ...good, postcode: "2000" });
    expect(res.status).toBe(200);
    expect(tagsCall().body.tags).toEqual(["website-lead", "out-of-area"]);
  });

  it("creates the Opportunity in New Enquiry for an in-area lead", async () => {
    const res = await post(good);
    expect(res.status).toBe(200);
    const search = calls.find((c) => c.url.includes("/opportunities/search"));
    expect(search.url).toContain("contact_id=c1");
    expect(search.url).toContain("pipeline_id=pipe");
    const create = calls.find((c) => c.url.endsWith("/opportunities/"));
    expect(create.body).toEqual({
      pipelineId: "pipe", pipelineStageId: "st-new", status: "open", monetaryValue: 0,
      locationId: "loc", contactId: "c1", name: "Website instant quote",
    });
  });

  it("never moves an existing Opportunity (a returning client stays where they are)", async () => {
    mockFetch((url) =>
      String(url).includes("/opportunities/search")
        ? new Response(JSON.stringify({ opportunities: [{ id: "o9" }] }))
        : okGhl(url));
    expect((await post(good)).status).toBe(200);
    expect(calls.some((c) => c.url.includes("/opportunities/o9"))).toBe(false);
    expect(calls.some((c) => c.url.endsWith("/opportunities/"))).toBe(false);
  });

  it("no Opportunity for an out-of-area lead", async () => {
    await post({ ...good, postcode: "2000" });
    expect(calls.some((c) => c.url.includes("/opportunities"))).toBe(false);
  });

  it("still succeeds if the Opportunity search or create fails", async () => {
    mockFetch((url) => (String(url).includes("/opportunities") ? new Response("x", { status: 500 }) : okGhl(url)));
    const res = await post(good);
    expect(res.status).toBe(200);
    expect((await res.json()).contact_id).toBe("c1");
    mockFetch((url) => (String(url).endsWith("/opportunities/") ? new Response("x", { status: 500 }) : okGhl(url)));
    expect((await post(good)).status).toBe(200);
  });

  it.each(["first_name", "email", "phone", "postcode"])("400 when %s missing", async (k) => {
    const res = await post({ ...good, [k]: "  " });
    expect(res.status).toBe(400);
    expect(calls.length).toBe(0);
  });

  it("honeypot returns ok without GHL", async () => {
    for (const k of ["website_url", "company"]) {
      const res = await post({ ...good, [k]: "x" });
      expect(await res.json()).toEqual({ ok: true });
    }
    expect(calls.length).toBe(0);
  });

  it("502 when upsert fails (status, thrown, or no id)", async () => {
    mockFetch(() => new Response("no", { status: 500 }));
    expect((await post(good)).status).toBe(502);
    mockFetch(() => { throw new Error("net"); });
    expect((await post(good)).status).toBe(502);
    mockFetch(() => new Response(JSON.stringify({})));
    expect((await post(good)).status).toBe(502);
  });

  it("still succeeds if tagging fails", async () => {
    mockFetch((url) => (String(url).endsWith("/upsert") ? okGhl(url) : new Response("x", { status: 500 })));
    expect((await post(good)).status).toBe(200);
    mockFetch((url) => { if (String(url).endsWith("/upsert")) return okGhl(url); throw new Error("x"); });
    expect((await post(good)).status).toBe(200);
  });

  it("400 on invalid JSON / non-object; 405; 404; 500 JSON on crash", async () => {
    expect((await post("{nope")).status).toBe(400);
    expect((await post("[1]")).status).toBe(400);
    expect((await post("null")).status).toBe(400);
    expect((await worker.fetch(new Request("https://w.test/lead"), env)).status).toBe(405);
    expect((await post(good, {}, "/other")).status).toBe(404);
    const res = await worker.fetch({ method: "POST", url: "https://w.test/lead", json: async () => good, headers: { get: vi.fn().mockImplementationOnce(() => { throw new Error("boom"); }).mockReturnValue(null) } }, env);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal error" });
  });

  it("omits token when secret unset", async () => {
    const res = await worker.fetch(new Request("https://w.test/lead", { method: "POST", body: JSON.stringify(good) }), { ...env, QUOTE_TOKEN_SECRET: "" });
    expect((await res.json()).quote_token).toBeNull();
  });
});

describe("Turnstile", () => {
  const tenv = { ...env, TURNSTILE_SECRET_KEY: "ts" };
  const SOLVED = { success: true, action: "lead", hostname: "www.vantagepointcleaning.com.au" };
  const tpost = (body, headers) => worker.fetch(new Request("https://w.test/lead", { method: "POST", headers, body: JSON.stringify(body) }), tenv);

  it("403 when token missing or rejected", async () => {
    mockFetch(() => new Response(JSON.stringify({ success: false })));
    expect((await tpost(good)).status).toBe(403);
    expect((await tpost({ ...good, "cf-turnstile-response": "t" })).status).toBe(403);
  });

  it("passes and forwards remote ip", async () => {
    mockFetch((url) => (String(url).includes("siteverify") ? new Response(JSON.stringify(SOLVED)) : okGhl(url)));
    const res = await tpost({ ...good, "cf-turnstile-response": "t" }, { "CF-Connecting-IP": "1.2.3.4" });
    expect(res.status).toBe(200);
    expect(calls[0].body.remoteip).toBe("1.2.3.4");
    expect(tagsCall().body.tags).toEqual(["website-lead"]);
  });

  it("403 when the token was solved for another action or hostname", async () => {
    for (const bad of [{ action: "quote" }, { hostname: "evil.example" }, { hostname: "localhost" }, { action: undefined }]) {
      mockFetch((url) => (String(url).includes("siteverify") ? new Response(JSON.stringify({ ...SOLVED, ...bad })) : okGhl(url)));
      expect((await tpost({ ...good, "cf-turnstile-response": "t" })).status).toBe(403);
    }
    mockFetch((url) => (String(url).includes("siteverify") ? new Response(JSON.stringify({ ...SOLVED, hostname: "vantagepointcleaning.com.au" })) : okGhl(url)));
    expect((await tpost({ ...good, "cf-turnstile-response": "t" })).status).toBe(200);
  });

  it("fail-open tags turnstile-unverified", async () => {
    mockFetch((url) => (String(url).includes("siteverify") ? new Response("x", { status: 500 }) : okGhl(url)));
    expect((await tpost({ ...good, "cf-turnstile-response": "t" })).status).toBe(200);
    expect(tagsCall().body.tags).toContain("turnstile-unverified");
    mockFetch((url) => { if (String(url).includes("siteverify")) throw new Error("x"); return okGhl(url); });
    expect(await verifyTurnstile("t", null, tenv)).toBe("unverified");
    expect(calls[0].body.remoteip).toBeUndefined();
  });

  it("skipped without secret", async () => {
    expect(await verifyTurnstile("t", null, env)).toBe("skipped");
  });
});

describe("CORS", () => {
  const opt = (origin) => worker.fetch(new Request("https://w.test/lead", { method: "OPTIONS", headers: origin ? { Origin: origin } : {} }), env);
  it("allows www and localhost only", async () => {
    expect((await opt(WWW)).headers.get("Access-Control-Allow-Origin")).toBe(WWW);
    expect((await opt("http://localhost:3000")).headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    expect((await opt("https://evil.example")).headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect((await opt("https://vantagepointcleaning.com.au")).headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect((await opt()).headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect((await opt(WWW)).status).toBe(204);
  });
  it("applies to POST responses", async () => {
    mockFetch(okGhl);
    expect((await post(good)).headers.get("Access-Control-Allow-Origin")).toBe(WWW);
  });
});

describe("quote token", () => {
  const T0 = 1_000_000;
  it("round-trips and expires at 60 min", async () => {
    const t = await signQuoteToken("abc.def", env, T0);
    expect(await verifyQuoteToken(t, env, T0 + 59 * 60000)).toEqual({ contactId: "abc.def" });
    expect(await verifyQuoteToken(t, env, T0 + 60 * 60000)).toBeNull();
  });
  it("rejects forged signature, wrong secret, tampered payload", async () => {
    const t = await signQuoteToken("c1", env, Date.now());
    const [p, s] = t.split(".");
    expect(await verifyQuoteToken(`${p}.${s.slice(0, -2)}AA`, env)).toBeNull();
    expect(await verifyQuoteToken(t, { QUOTE_TOKEN_SECRET: "other" })).toBeNull();
    const forgedPayload = btoa("c2." + (Date.now() + 1e7)).replace(/=+$/, "");
    expect(await verifyQuoteToken(`${forgedPayload}.${s}`, env)).toBeNull();
  });
  it("rejects malformed tokens", async () => {
    for (const bad of [undefined, null, 5, "", "abc", "a.b.c", "!!.!!", "a.b"]) {
      expect(await verifyQuoteToken(bad, env)).toBeNull();
    }
    expect(await verifyQuoteToken("a.b", {})).toBeNull();
    expect(await signQuoteToken("c", {})).toBeNull();
  });
  it("rejects validly signed but malformed payloads", async () => {
    async function signed(text) {
      const p = btoa(text).replace(/=+$/, "");
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.QUOTE_TOKEN_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(p)));
      return `${p}.${btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
    }
    expect(await verifyQuoteToken(await signed("nodot"), env)).toBeNull();
    expect(await verifyQuoteToken(await signed("c1.notanumber"), env)).toBeNull();
    expect(await verifyQuoteToken(await signed(".123"), env)).toBeNull();
    expect(await verifyQuoteToken(await signed("c1.99999999999999"), env)).toEqual({ contactId: "c1" });
  });
});

describe("helpers", () => {
  it("deriveLeadChannel", () => {
    const d = (o) => deriveLeadChannel(o);
    expect(d({ gclid: "x" })).toBe("paid_search");
    expect(d({ utm_medium: "paid_social" })).toBe("paid_social");
    expect(d({ utm_medium: "cpc", utm_source: "facebook" })).toBe("paid_social");
    expect(d({ utm_medium: "cpc", fbclid: "1" })).toBe("paid_social");
    expect(d({ utm_medium: "cpc" })).toBe("paid_search");
    expect(d({ utm_medium: "email" })).toBe("email");
    expect(d({ utm_medium: "social" })).toBe("organic_social");
    expect(d({ utm_medium: "organic" })).toBe("organic_search");
    expect(d({ utm_medium: "referral" })).toBe("referral");
    expect(d({ utm_source: "instagram" })).toBe("organic_social");
    expect(d({ utm_campaign: "x" })).toBe("unassigned");
    expect(d({ fbclid: "1" })).toBe("organic_social");
    expect(d({})).toBe("direct");
    expect(d({ referrerHost: "www.google.com.au" })).toBe("organic_search");
    expect(d({ referrerHost: "l.facebook.com" })).toBe("organic_social");
    expect(d({ referrerHost: "example.org" })).toBe("referral");
  });
  it("extractUtmFields trims and ignores non-strings", () => {
    expect(extractUtmFields({ utm_source: " g ", utm_medium: 5 })).toMatchObject({ utm_source: "g", utm_medium: "" });
  });
  it("direct GHL helpers handle network errors", async () => {
    mockFetch(() => { throw new Error("x"); });
    expect(await addTagsInGHL("c", ["t"], env)).toEqual({ success: false });
    expect((await upsertContactInGHL({}, env)).success).toBe(false);
  });
});
