// vpc-lead-worker — POST /lead (Stage 1 of the instant-quote flow).
// Upserts the contact in the VPC GHL sub-account and returns a signed
// quote_token that /quote (issue 08) verifies with verifyQuoteToken().
// Ported from VPFS handleLead; shares no Worker, token or secret with VPFS.

import { PACKAGES, ROTATION_EXTRAS, personalQuoteReason, priceQuote } from "./pricing.js";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const TURNSTILE_SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const WEBSITE_LEAD_TAG = "website-lead";
const OUT_OF_AREA_TAG = "out-of-area";
const QUOTE_OUTCOME_TAGS = ["quote-priced", "quote-personal"];
const TURNSTILE_UNVERIFIED_TAG = "turnstile-unverified";

const QUOTE_TOKEN_TTL_MS = 60 * 60 * 1000;

// PLACEHOLDER service-area postcodes (zones 1-5) until issue 01 confirms the list.
export const SERVICE_ZONE_POSTCODES = [
  "4000", "4005", "4006", "4007", "4008", "4010", "4011", "4012", "4013", "4017",
  "4030", "4031", "4051", "4053", "4054", "4059", "4060", "4064", "4065", "4066",
  "4067", "4068", "4069", "4070", "4101", "4102", "4103", "4104", "4105", "4106",
  "4151", "4152", "4153", "4169", "4170", "4171", "4172", "4173", "4178",
];

const ALLOWED_ORIGINS = ["https://www.vantagepointcleaning.com.au"];
const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function corsHeaders(request) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
  const origin = request.headers.get("Origin");
  if (origin && (ALLOWED_ORIGINS.includes(origin) || LOCALHOST_ORIGIN.test(origin))) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function withCors(request, response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request))) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const fail = (status, error) => json({ error }, status);

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
    try {
      return withCors(request, await route(request, env));
    } catch {
      return withCors(request, fail(500, "Internal error"));
    }
  },
};

async function route(request, env) {
  if (request.method !== "POST") return fail(405, "Method not allowed");
  const url = new URL(request.url);
  if (url.pathname !== "/lead" && url.pathname !== "/quote") return fail(404, "Not found");
  let payload;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "Invalid JSON");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fail(400, "Invalid JSON");
  }
  return url.pathname === "/quote" ? handleQuote(payload, env) : handleLead(payload, env, request);
}

const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function extractUtmFields(payload) {
  return {
    utm_source: str(payload.utm_source),
    utm_medium: str(payload.utm_medium),
    utm_campaign: str(payload.utm_campaign),
    utm_term: str(payload.utm_term),
    utm_content: str(payload.utm_content),
  };
}

function extractLeadFields(payload) {
  return {
    firstName: str(payload.first_name, 100),
    lastName: str(payload.last_name, 100),
    email: str(payload.email, 254),
    phone: str(payload.phone, 30),
    postcode: str(payload.postcode, 10),
    conversionPage: str(payload.conversion_page),
    honeypot: str(payload.website_url) || str(payload.company),
    marketingConsent: payload.marketing_consent === true,
    gclid: str(payload.gclid),
    gbraid: str(payload.gbraid),
    wbraid: str(payload.wbraid),
    msclkid: str(payload.msclkid),
    fbclid: str(payload.fbclid),
    referrerHost: str(payload.referrer_host),
    ...extractUtmFields(payload),
  };
}

// ---- Lead channel (GA4-style channel groups) ------------------------------
const CLICK_IDS_PAID_SEARCH = ["gclid", "gbraid", "wbraid", "msclkid"];
const PAID_SEARCH_MEDIUM = /^(cpc|ppc|paid|paid[_-]?search|sem)$/;
const PAID_SOCIAL_MEDIUM = /^paid[_-]?social$/;
const SOCIAL_SOURCE = /^(facebook|fb|instagram|ig|meta|linkedin|twitter|x|tiktok|youtube|pinterest|reddit|threads)$/;
const SOCIAL_MEDIUM = /^(social|social[_-]?media|organic[_-]?social|sm)$/;
const EMAIL_MEDIUM = /^(email|e-mail|newsletter)$/;
const SEARCH_HOST = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|baidu|yandex)(\.[a-z]{2,3}){1,2}$|^search\.brave\.com$/;
const SOCIAL_HOST = /(^|\.)(facebook|instagram|linkedin|twitter|tiktok|youtube|pinterest|reddit|threads)\.(com|net)$|^(t\.co|x\.com|lnkd\.in)$/;

export function deriveLeadChannel(f) {
  if (CLICK_IDS_PAID_SEARCH.some((id) => f[id])) return "paid_search";
  const medium = (f.utm_medium || "").toLowerCase();
  const source = (f.utm_source || "").toLowerCase();
  if (PAID_SOCIAL_MEDIUM.test(medium)) return "paid_social";
  if (PAID_SEARCH_MEDIUM.test(medium)) {
    return SOCIAL_SOURCE.test(source) || f.fbclid ? "paid_social" : "paid_search";
  }
  if (EMAIL_MEDIUM.test(medium)) return "email";
  if (SOCIAL_MEDIUM.test(medium)) return "organic_social";
  if (medium === "organic") return "organic_search";
  if (medium === "referral") return "referral";
  if (SOCIAL_SOURCE.test(source)) return "organic_social";
  if (medium || source || f.utm_campaign || f.utm_term || f.utm_content) return "unassigned";
  if (f.fbclid) return "organic_social";
  const host = (f.referrerHost || "").toLowerCase();
  if (!host) return "direct";
  if (SEARCH_HOST.test(host)) return "organic_search";
  if (SOCIAL_HOST.test(host)) return "organic_social";
  return "referral";
}

// ---- Quote token: base64url("contact_id.exp") + "." + base64url(HMAC) ------
function b64urlEncode(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s) {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("bad base64url");
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function hmacKey(env, usage) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.QUOTE_TOKEN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function signQuoteToken(contactId, env, now = Date.now()) {
  if (!env.QUOTE_TOKEN_SECRET) return null;
  const payload = b64urlEncode(new TextEncoder().encode(`${contactId}.${now + QUOTE_TOKEN_TTL_MS}`));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(env, "sign"), new TextEncoder().encode(payload));
  return `${payload}.${b64urlEncode(new Uint8Array(sig))}`;
}

// Returns { contactId } for a valid, unexpired token; null otherwise.
export async function verifyQuoteToken(token, env, now = Date.now()) {
  if (!env.QUOTE_TOKEN_SECRET || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(env, "verify"),
      b64urlDecode(parts[1]),
      new TextEncoder().encode(parts[0])
    );
    if (!ok) return null;
    const text = new TextDecoder().decode(b64urlDecode(parts[0]));
    const dot = text.lastIndexOf(".");
    const contactId = text.slice(0, dot);
    const exp = Number(text.slice(dot + 1));
    if (dot < 1 || !contactId || !Number.isFinite(exp) || now >= exp) return null;
    return { contactId };
  } catch {
    return null;
  }
}

// ---- Turnstile -------------------------------------------------------------
// "passed" | "rejected" | "unverified" (Cloudflare unreachable; fail open) | "skipped"
export async function verifyTurnstile(token, remoteIp, env) {
  if (!env.TURNSTILE_SECRET_KEY) return "skipped";
  if (!token || typeof token !== "string") return "rejected";
  try {
    const res = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
    if (!res.ok) return "unverified";
    const data = await res.json();
    return data.success ? "passed" : "rejected";
  } catch {
    return "unverified";
  }
}

// ---- /lead -----------------------------------------------------------------
async function handleLead(payload, env, request) {
  const f = extractLeadFields(payload);

  // Honeypot: look successful, never touch GHL.
  if (f.honeypot) return json({ ok: true });

  const turnstile = await verifyTurnstile(
    payload["cf-turnstile-response"],
    request.headers.get("CF-Connecting-IP"),
    env
  );
  if (turnstile === "rejected") return fail(403, "Verification failed");

  if (!f.firstName || !f.email || !f.phone || !f.postcode) {
    return fail(400, "Missing required field: first_name, email, phone and postcode are required");
  }

  const result = await upsertContactInGHL(f, env);
  if (!result.success) return fail(502, "Could not save your details");

  const tags = [WEBSITE_LEAD_TAG];
  if (!SERVICE_ZONE_POSTCODES.includes(f.postcode)) tags.push(OUT_OF_AREA_TAG);
  if (turnstile === "unverified") tags.push(TURNSTILE_UNVERIFIED_TAG);
  // The contact exists already; a failed tag call must not block step 2.
  await addTagsInGHL(result.contactId, tags, env);

  const quoteToken = await signQuoteToken(result.contactId, env);
  return json({ contact_id: result.contactId, quote_token: quoteToken });
}

function ghlHeaders(env) {
  return {
    Authorization: `Bearer ${env.GHL_API_KEY}`,
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
  };
}

export async function upsertContactInGHL(f, env) {
  const customFields = Object.entries({
    postcode: f.postcode,
    conversion_page: f.conversionPage,
    lead_channel: deriveLeadChannel(f), // VPFS key (vpfs-website worker.js)
    utm_source: f.utm_source,
    utm_medium: f.utm_medium,
    utm_campaign: f.utm_campaign,
    utm_term: f.utm_term,
    utm_content: f.utm_content,
  })
    .filter(([, v]) => v)
    .map(([key, value]) => ({ key, field_value: String(value) }));

  if (f.marketingConsent) {
    customFields.push(
      { key: "marketing_consent", field_value: "Yes" },
      { key: "marketing_consent_at", field_value: new Date().toISOString() }
    );
  }

  try {
    const res = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: ghlHeaders(env),
      body: JSON.stringify({
        locationId: env.GHL_LOCATION_ID,
        firstName: f.firstName,
        lastName: f.lastName,
        email: f.email,
        phone: f.phone,
        customFields,
      }),
    });
    if (!res.ok) return { success: false, status: res.status };
    const data = await res.json();
    const contactId = data.contact?.id;
    return contactId ? { success: true, contactId } : { success: false, status: 502 };
  } catch {
    return { success: false, status: 502 };
  }
}

// Additive — appends to existing tags (upsert could overwrite them).
export async function addTagsInGHL(contactId, tags, env) {
  try {
    const res = await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
      method: "POST",
      headers: ghlHeaders(env),
      body: JSON.stringify({ tags }),
    });
    return { success: res.ok };
  } catch {
    return { success: false };
  }
}

// ---- /quote ----------------------------------------------------------------
const NOTE_MAX = 500;
// Door/alarm codes must never be stored in GHL.
const CODE_LIKE = /\b(door|alarm|gate|lock|keypad|key\s?safe|lockbox|garage)\s*(code|pin|passcode)\b|\b(pin|passcode|alarm code|door code)\b\s*[:=#]?\s*\d/i;
const BOOL_KEYS = ["study", "media_room", "multi_level", "outdoor_alfresco", "pool_surrounds", "garage_serviced", "weekend"];
const EXTRA_BOOL_KEYS = ["oven", "fridge", "cabinets", "interior_glass"];

class InvalidInput extends Error {}

function intIn(v, min, max, name, dflt) {
  if (v === undefined && dflt !== undefined) return dflt;
  if (!Number.isInteger(v) || v < min || v > max) throw new InvalidInput(`Invalid ${name}`);
  return v;
}

function bool(v, name) {
  if (v === undefined) return false;
  if (typeof v !== "boolean") throw new InvalidInput(`Invalid ${name}`);
  return v;
}

function note(v, name) {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string" || v.trim().length > NOTE_MAX) throw new InvalidInput(`Invalid ${name}`);
  const t = v.trim();
  if (CODE_LIKE.test(t)) throw new InvalidInput(`Do not include door or alarm codes in ${name}`);
  return t;
}

export function validateQuoteInput(p) {
  const pkg = p.package;
  if (!PACKAGES.includes(pkg)) throw new InvalidInput("Invalid package");
  const home = {
    bedrooms: intIn(p.bedrooms, 0, 9, "bedrooms"),
    bathrooms: intIn(p.bathrooms, 1, 9, "bathrooms"),
    powder_rooms: intIn(p.powder_rooms, 0, 3, "powder_rooms", 0),
    living_areas: intIn(p.living_areas, 1, 6, "living_areas"),
    balconies_count: intIn(p.balconies_count, 0, 3, "balconies_count", 0),
    walk_in_robes_count: intIn(p.walk_in_robes_count, 0, 3, "walk_in_robes_count", 0),
  };
  for (const k of BOOL_KEYS) home[k] = bool(p[k], k);
  if (!["low", "medium", "high"].includes(p.property_condition)) throw new InvalidInput("Invalid property_condition");
  home.property_condition = p.property_condition;
  if (!["weekly", "fortnightly"].includes(p.preferred_frequency)) throw new InvalidInput("Invalid preferred_frequency");
  home.preferred_frequency = p.preferred_frequency;

  const x = p.extras === undefined ? {} : p.extras;
  if (!x || typeof x !== "object" || Array.isArray(x)) throw new InvalidInput("Invalid extras");
  const extras = {
    laundry_loads: intIn(x.laundry_loads, 0, 3, "laundry_loads", 0),
    linen_beds: intIn(x.linen_beds, 0, 6, "linen_beds", 0),
    ironing_blocks: intIn(x.ironing_blocks, 0, 4, "ironing_blocks", 0),
    reset_blocks: intIn(x.reset_blocks, 0, 4, "reset_blocks", 0),
  };
  for (const k of EXTRA_BOOL_KEYS) extras[k] = bool(x[k], k);
  if (pkg !== "essential" && ROTATION_EXTRAS.some((k) => extras[k])) {
    throw new InvalidInput("Oven and fridge are in the Signature and Reserve rotation");
  }
  const pets = p.pets_on_site;
  if (pets !== undefined && typeof pets !== "boolean" && typeof pets !== "string") throw new InvalidInput("Invalid pets_on_site");
  return {
    pkg,
    home,
    extras,
    pets: pets === undefined ? "" : String(pets),
    parking: note(p.parking_access_notes, "parking_access_notes"),
    requests: note(p.special_requests, "special_requests"),
  };
}

function extrasSummary(pkg, e) {
  const parts = [];
  for (const k of EXTRA_BOOL_KEYS) if (e[k]) parts.push(k);
  for (const k of ["laundry_loads", "linen_beds", "ironing_blocks", "reset_blocks"]) if (e[k]) parts.push(`${k}=${e[k]}`);
  return parts.join(", ");
}

async function ghl(path, method, env, body) {
  try {
    const res = await fetch(`${GHL_API_BASE}${path}`, {
      method,
      headers: ghlHeaders(env),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function contactPostcode(contactId, env) {
  const data = await ghl(`/contacts/${contactId}`, "GET", env);
  if (!data || !data.contact) return null;
  const c = data.contact;
  const field = (c.customFields || []).find((f) => f.id === env.GHL_POSTCODE_FIELD_ID || f.key === "postcode");
  return String(field?.value ?? field?.field_value ?? c.postalCode ?? "").trim();
}

async function upsertOpportunity(contactId, stageId, price, env) {
  const q = new URLSearchParams({ location_id: env.GHL_LOCATION_ID, pipeline_id: env.GHL_PIPELINE_ID, contact_id: contactId });
  const found = await ghl(`/opportunities/search?${q}`, "GET", env);
  if (!found) return false;
  const existing = (found.opportunities || [])[0];
  const common = { pipelineId: env.GHL_PIPELINE_ID, pipelineStageId: stageId, status: "open", monetaryValue: price };
  const res = existing
    ? await ghl(`/opportunities/${existing.id}`, "PUT", env, common)
    : await ghl("/opportunities/", "POST", env, {
        ...common, locationId: env.GHL_LOCATION_ID, contactId, name: "Website instant quote",
      });
  return Boolean(res);
}

async function handleQuote(payload, env) {
  const verified = await verifyQuoteToken(payload.quote_token, env);
  if (!verified) return fail(401, "Invalid or expired quote token");
  let q;
  try {
    q = validateQuoteInput(payload);
  } catch (e) {
    return fail(400, e.message);
  }
  const { contactId } = verified;

  const postcode = await contactPostcode(contactId, env);
  if (postcode === null) return fail(502, "Could not load your details");

  let outcome;
  let reason = "";
  let prices = null;
  if (!SERVICE_ZONE_POSTCODES.includes(postcode)) {
    outcome = "out_of_area";
  } else if ((reason = personalQuoteReason(q.home))) {
    outcome = "personal_quote";
  } else {
    outcome = "priced";
    prices = priceQuote(q.pkg, q.home, q.extras);
  }

  const h = q.home;
  const fields = {
    service_tier: q.pkg,
    bedrooms: h.bedrooms,
    bathrooms: h.bathrooms,
    powder_rooms: h.powder_rooms,
    living_areas: h.living_areas,
    preferred_frequency: h.preferred_frequency,
    property_condition: h.property_condition,
    multi_level: h.multi_level ? "Yes" : "No",
    outdoor_alfresco: h.outdoor_alfresco ? "Yes" : "No",
    pool_surrounds: h.pool_surrounds ? "Yes" : "No",
    balconies_count: h.balconies_count,
    walk_in_robes_count: h.walk_in_robes_count,
    study: h.study ? "Yes" : "No",
    media_room: h.media_room ? "Yes" : "No",
    garage_serviced: h.garage_serviced ? "Yes" : "No",
    pets_on_site: q.pets,
    parking_access_notes: q.parking,
    special_requests: q.requests,
    quote_extras: extrasSummary(q.pkg, q.extras),
    ...(prices ? { quoted_package_price: prices.package_price, first_visit_price: prices.first_visit_price } : {}),
  };
  const customFields = Object.entries(fields)
    .filter(([, v]) => v !== "")
    .map(([key, value]) => ({ key, field_value: String(value) }));
  // Always sent ("" when priced) so a re-quote clears a stale reason.
  const nonStandardReason = outcome === "personal_quote" ? reason : outcome === "out_of_area" ? "out_of_area" : "";
  customFields.push({ key: "non_standard_reason", field_value: nonStandardReason });

  const updated = await ghl(`/contacts/${contactId}`, "PUT", env, { customFields });
  // Re-quote: drop the quote outcome tags that no longer apply. `out-of-area`
  // is never removed here — /lead sets it from the postcode.
  const tag = outcome === "priced" ? "quote-priced" : outcome === "personal_quote" ? "quote-personal" : OUT_OF_AREA_TAG;
  const stale = QUOTE_OUTCOME_TAGS.filter((t) => t !== tag);
  const untagged = await ghl(`/contacts/${contactId}/tags`, "DELETE", env, { tags: stale });
  const tagged = untagged ? await addTagsInGHL(contactId, [tag], env) : { success: false };
  if (!updated || !tagged.success) return fail(502, "Could not save your quote");

  if (outcome !== "out_of_area") {
    const stage = outcome === "priced" ? env.GHL_STAGE_QUOTED_ID : env.GHL_STAGE_NEEDS_QUOTE_ID;
    if (!(await upsertOpportunity(contactId, stage, prices ? prices.per_visit_price : 0, env))) {
      return fail(502, "Could not save your quote");
    }
  }

  if (outcome === "priced") return json({ outcome, ...prices });
  return json(outcome === "personal_quote" ? { outcome, reason } : { outcome });
}
