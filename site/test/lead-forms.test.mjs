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
const ALL = ['index', 'signature-home-care', 'reserve-home-care', 'service-areas', 'contact', 'why-us', 'about', 'estate-care', 'privacy', 'terms'];

test('lead pages have fields, honeypots, turnstile container, notice, conversion_page', () => {
  for (const p of LEAD_PAGES) {
    const h = read(`${p}.html`);
    const form = h.match(/<form class="assessment-form" data-lead-form hidden>[\s\S]*?<\/form>/)?.[0];
    assert.ok(form, p);
    for (const n of ['first_name', 'last_name', 'email', 'phone', 'postcode', 'website_url', 'company', 'conversion_page'])
      assert.match(form, new RegExp(`name="${n}"`), `${p}: ${n}`);
    assert.doesNotMatch(form, /name="suburb"/, p);
    assert.match(form, /class="turnstile-widget" data-sitekey=""/, p);
    assert.match(form, /privacy\.html#collection-notice/, p);
    assert.match(form, /class="form-error" role="alert" hidden/, p);
    assert.match(form, new RegExp(`name="conversion_page" value="/${p}\\.html"`), p);
  }
});

test('estate-care stays email/phone only; every page defaults the switch off', () => {
  assert.doesNotMatch(read('estate-care.html'), /<form[^>]*data-lead-form|name="postcode"/);
  for (const p of ALL) assert.match(read(`${p}.html`), /<body data-lead-forms="off" data-booking="off">/, p);
});

test('placeholder handler and TODO are gone; lead.js loads before main.js', () => {
  const m = read('assets/js/main.js');
  assert.doesNotMatch(m, /TODO|placeholder|data-lead-ready/);
  for (const p of ALL) assert.match(read(`${p}.html`), /lead\.js"><\/script>\s*<script src="assets\/js\/quote\.js"><\/script>\s*<script src="assets\/js\/main\.js"/, p);
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
