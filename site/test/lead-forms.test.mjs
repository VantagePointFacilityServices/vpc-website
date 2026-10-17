import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');
const lead = createRequire(import.meta.url)('../assets/js/lead.js');
const LEAD_PAGES = ['index', 'signature-home-care', 'reserve-home-care', 'service-areas', 'contact', 'why-us', 'about'];
// PRD D2: forms are public on these pages; why-us/about keep theirs hidden, estate-care has none.
const ON_PAGES = ['index', 'signature-home-care', 'reserve-home-care', 'service-areas', 'contact'];
const SITEKEY = '0x4AAAAAAFZN2if54_39FaOz';
const ALL = ['index', 'signature-home-care', 'reserve-home-care', 'service-areas', 'contact', 'why-us', 'about', 'estate-care', 'privacy', 'terms'];

test('lead pages have fields, honeypots, turnstile container, notice, conversion_page', () => {
  for (const p of LEAD_PAGES) {
    const h = read(`${p}.html`);
    const form = h.match(/<form class="assessment-form" data-lead-form( hidden)?>[\s\S]*?<\/form>/)?.[0];
    assert.ok(form, p);
    assert.equal(/data-lead-form hidden>/.test(form), !ON_PAGES.includes(p), `${p}: hidden`);
    for (const n of ['first_name', 'last_name', 'email', 'phone', 'postcode', 'website_url', 'company', 'conversion_page'])
      assert.match(form, new RegExp(`name="${n}"`), `${p}: ${n}`);
    assert.doesNotMatch(form, /name="suburb"/, p);
    assert.match(form, /class="turnstile-widget" data-sitekey=""/, p);
    assert.match(form, /privacy\.html#collection-notice/, p);
    assert.match(form, /class="form-error" role="alert" hidden/, p);
    assert.match(form, new RegExp(`name="conversion_page" value="/${p}\\.html"`), p);
  }
});

test('every lead form matches the VPFS contact form: name row, email row, phone + postcode row, with icons', () => {
  const icon = (id) => new RegExp(`<label for="${id}">[^<]+</label>\\s*<div class="input-icon-wrap">\\s*<svg [^>]*aria-hidden="true">[\\s\\S]*?</svg>\\s*<input id="${id}"`);
  for (const p of LEAD_PAGES) {
    const form = read(`${p}.html`).match(/<form class="assessment-form"[\s\S]*?<\/form>/)[0];
    const pre = p === 'service-areas' ? 'na-' : '';
    const rows = [...form.matchAll(/<div class="form-row( single)?">([\s\S]*?)\n\s*<\/div>\n(?=\s*<(?:div class="form-row|input|div class="hp-field))/g)];
    assert.equal(rows.length, 3, `${p}: three field rows`);
    assert.match(rows[0][2], new RegExp(`id="${pre}fname"[\\s\\S]*id="${pre}lname"`), `${p}: names`);
    assert.equal(rows[1][1], ' single', `${p}: email row is full width`);
    assert.match(rows[1][2], icon(`${pre}email`), `${p}: email icon`);
    assert.match(rows[2][2], icon(`${pre}phone`), `${p}: phone icon`);
    assert.match(rows[2][2], icon(`${pre}postcode`), `${p}: postcode icon`);
    assert.doesNotMatch(form, /<select/, `${p}: no extra fields`);
  }
  assert.match(read('assets/css/style.css'), /\.input-icon-wrap svg \{[^}]*position: absolute/);
});

test('estate-care stays email/phone only; forms on for D2 pages only; booking off everywhere', () => {
  assert.doesNotMatch(read('estate-care.html'), /<form[^>]*data-lead-form|name="postcode"/);
  for (const p of ALL) {
    const on = ON_PAGES.includes(p) ? 'on' : 'off';
    assert.match(read(`${p}.html`), new RegExp(`<body data-lead-forms="${on}" data-booking="off">`), p);
  }
});

test('the VPC Turnstile site key lives in lead.js, the one shared place', () => {
  assert.equal(lead.TURNSTILE_SITEKEY, SITEKEY);
  for (const p of ALL) assert.doesNotMatch(read(`${p}.html`), /data-sitekey="0x/, `${p}: key belongs in lead.js only`);
});

function fakeWidgetDoc() {
  const widget = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] || ''; } };
  const d = fakeDoc(true);
  const qsa = d.doc.querySelectorAll;
  d.doc.querySelectorAll = (s) => (s === '.assessment-form .turnstile-widget' ? [widget] : qsa(s));
  return { ...d, widget };
}

test('switch on: widget gets the site key and renders for action "lead"; a failed submit resets the single-use token', async () => {
  const d = fakeWidgetDoc();
  const rendered = [], resets = [];
  const turnstile = { render: (el, o) => { rendered.push(o); return 'w1'; }, reset: (id) => resets.push(id) };
  lead.init(d.doc, { win: { ...win, turnstile }, fetch: async () => ({ ok: false, status: 403 }), CustomEvent: class {} });
  assert.equal(d.widget.attrs['data-sitekey'], SITEKEY);
  assert.equal(rendered.length, 1);
  assert.equal(rendered[0].sitekey, SITEKEY);
  assert.equal(rendered[0].action, 'lead');
  await d.listeners.submit({ preventDefault() {} }); await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(resets, ['w1']);
});

test('placeholder handler and TODO are gone; lead.js loads before main.js', () => {
  const m = read('assets/js/main.js');
  assert.doesNotMatch(m, /TODO|placeholder|data-lead-ready/);
  for (const p of ALL) assert.match(read(`${p}.html`), /lead\.js"><\/script>\s*<script src="assets\/js\/pricing-data\.js"><\/script>\s*<script src="assets\/js\/quote\.js"><\/script>\s*<script src="assets\/js\/main\.js"/, p);
});

// --- behaviour with a minimal fake form / document ---
function fakeForm(values) {
  return { querySelector: (sel) => { const m = sel.match(/name="([^"]+)"/); return m && values[m[1]] !== undefined ? { value: values[m[1]] } : null; } };
}
const good = { first_name: 'A', last_name: 'B', email: 'a@b.co', phone: '0400000000', postcode: '4220', conversion_page: '/index.html', 'cf-turnstile-response': 'tok' };
const win = { location: { pathname: '/index.html' }, vpcUtm: { read: () => ({ utm_source: 'g', landing_page: '/x' }) } };

test('submitLead POSTs the D5 body with utms and resolves the token', async () => {
  let call;
  const fetch = async (url, opts) => { call = { url, opts }; return { ok: true, json: async () => ({ contact_id: 'c1', quote_token: 'q1', extra: 1 }) }; };
  const r = await lead.submitLead(fakeForm(good), { win, fetch });
  assert.deepEqual(r, { contact_id: 'c1', quote_token: 'q1' });
  assert.equal(call.url, 'https://worker.vantagepointcleaning.com.au/lead');
  assert.equal(call.opts.method, 'POST');
  const body = JSON.parse(call.opts.body);
  assert.equal(body.postcode, '4220');
  assert.equal(body['cf-turnstile-response'], 'tok');
  assert.equal(body.utm_source, 'g');
  assert.equal(body.landing_page, undefined);
  assert.equal(body.conversion_page, '/index.html');
});

test('honeypot: no POST, success-looking result', async () => {
  let called = false;
  const r = await lead.submitLead(fakeForm({ ...good, company: 'bot' }), { win, fetch: async () => { called = true; } });
  assert.equal(called, false);
  assert.equal(r.caught, true);
});

test('non-2xx rejects', async () => {
  await assert.rejects(lead.submitLead(fakeForm(good), { win, fetch: async () => ({ ok: false, status: 502 }) }));
});

function fakeDoc(on) {
  const listeners = {};
  const err = { hidden: true };
  const fields = { style: {} };
  const success = { classList: { added: [], add(c) { this.added.push(c); } } };
  const cta = { classList: { contains: (c) => c === 'contact-cta' }, hidden: false };
  const btn = { disabled: false };
  const form = {
    hidden: true, previousElementSibling: cta,
    addEventListener: (e, fn) => { listeners[e] = fn; },
    dispatchEvent: () => true,
    querySelector: (s) => ({ '.form-fields': fields, '.form-success': success, '.form-error': err, '[type="submit"]': btn })[s] || fakeForm(good).querySelector(s),
  };
  const doc = {
    body: { getAttribute: () => (on ? 'on' : 'off') },
    querySelectorAll: (s) => (s === 'form[data-lead-form]' ? [form] : []),
  };
  return { doc, form, cta, err, fields, success, listeners, btn };
}

test('switch off: form stays hidden, contact box shows, nothing wired to POST', () => {
  const d = fakeDoc(false);
  lead.applySwitch(d.doc);
  assert.equal(d.form.hidden, true);
  assert.equal(d.cta.hidden, false);
});

test('switch on: form shows, contact box hidden; error keeps fields and shows message; success hides fields', async () => {
  const d = fakeDoc(true);
  let ok = false;
  const fetch = async () => (ok ? { ok: true, json: async () => ({ contact_id: 'c', quote_token: 'q' }) } : { ok: false, status: 502 });
  lead.init(d.doc, { win, fetch, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o.detail; } } });
  assert.equal(d.form.hidden, false);
  assert.equal(d.cta.hidden, true);
  const tick = () => new Promise((r) => setTimeout(r, 0));
  await d.listeners.submit({ preventDefault() {} }); await tick();
  assert.equal(d.err.hidden, false);
  assert.equal(d.fields.style.display, undefined);
  ok = true;
  await d.listeners.submit({ preventDefault() {} }); await tick();
  assert.equal(d.err.hidden, true);
  assert.equal(d.fields.style.display, 'none');
  assert.deepEqual(d.success.classList.added, ['show']);
});

test('double submit while in flight sends one POST; button disabled, re-enabled on error', async () => {
  const d = fakeDoc(true);
  let calls = 0;
  let settle;
  const fetch = () => { calls++; return new Promise((r) => { settle = r; }); };
  lead.init(d.doc, { win, fetch, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o.detail; } } });
  const tick = () => new Promise((r) => setTimeout(r, 0));
  d.listeners.submit({ preventDefault() {} });
  d.listeners.submit({ preventDefault() {} });
  await tick();
  assert.equal(calls, 1);
  assert.equal(d.btn.disabled, true);
  settle({ ok: false, status: 502 }); await tick();
  assert.equal(d.btn.disabled, false);
  assert.equal(d.err.hidden, false);
  d.listeners.submit({ preventDefault() {} }); await tick();
  assert.equal(calls, 2);
  settle({ ok: true, json: async () => ({ contact_id: 'c', quote_token: 'q' }) }); await tick(); await tick();
  assert.deepEqual(d.success.classList.added, ['show']);
});

test('service-areas success panel matches its coverage-check purpose; tick is decorative', () => {
  const s = read('service-areas.html').match(/<div class="form-success">[\s\S]*?<\/div>/)[0];
  assert.match(s, /let you know as soon as we cover your area/);
  assert.doesNotMatch(s, /assessment/);
  assert.match(s, /<svg [^>]*stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"/);
});
