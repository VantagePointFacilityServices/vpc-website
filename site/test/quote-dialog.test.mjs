import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const q = createRequire(import.meta.url)('../assets/js/quote.js');
const tick = () => new Promise((r) => setTimeout(r, 0));

test('pages default booking off and load quote.js after lead.js', () => {
  for (const f of readdirSync(root).filter((x) => x.endsWith('.html'))) {
    const h = readFileSync(join(root, f), 'utf8');
    if (/<meta http-equiv="refresh"/.test(h)) continue;
    assert.match(h, /<body data-lead-forms="off" data-booking="off">/, f);
    assert.match(h, /lead\.js"><\/script>\s*<script src="assets\/js\/quote\.js"><\/script>/, f);
  }
});

test('formatAUD', () => {
  assert.equal(q.formatAUD(599), '$599 incl. GST');
  assert.equal(q.formatAUD(1259), '$1,259 incl. GST');
});

// --- fakes ---
function fakeForm(v = {}) {
  return { querySelector: (s) => { const n = s.match(/name="([^"]+)"/)[1]; if (!(n in v)) return null; return typeof v[n] === 'boolean' ? { checked: v[n] } : { value: v[n] }; } };
}
function fakeEl() {
  const l = {};
  return { hidden: false, innerHTML: '', l, attrs: {}, addEventListener(e, f) { l[e] = f; }, setAttribute(k, x) { this.attrs[k] = x; }, getAttribute(k) { return this.attrs[k]; }, focus() { this.focused = true; }, querySelector: () => null };
}
function fakeDialog() {
  const els = { '[data-quote-form]': fakeEl(), '[data-error]': fakeEl(), '[data-result]': fakeEl(), '[data-fields]': fakeEl(), '[data-close]': fakeEl(), '[data-inclusions]': fakeEl() };
  els['[data-error]'].hidden = true;
  els['[data-result]'].hidden = true;
  const d = fakeEl();
  d.closed = 0; d.close = () => { d.closed++; };
  d.querySelector = (s) => els[s] || null;
  d.querySelectorAll = () => [];
  return { d, els };
}

test('body: Signature default, D7 shape, essential-only extras suppressed', () => {
  const b = q.buildQuoteBody(fakeForm({ package: 'signature', bedrooms: '4', bathrooms: '2', oven: true, linen_beds: '3', cabinets: true, laundry_loads: '2', day_type: 'weekday', special_requests: 'x' }), 'tok');
  assert.equal(b.quote_token, 'tok');
  assert.equal(b.package, 'signature');
  assert.equal(b.bedrooms, 4);
  assert.equal(b.weekend, false);
  assert.equal(b.extras.oven, false);
  assert.equal(b.extras.linen_beds, 0);
  assert.equal(b.extras.cabinets, true);
  assert.equal(b.extras.laundry_loads, 2);
  assert.equal(b.special_requests, 'x');
  assert.equal('pets_on_site' in b, false);
  const e = q.buildQuoteBody(fakeForm({ package: 'essential', oven: true, linen_beds: '3', day_type: 'weekend' }), 't');
  assert.equal(e.extras.oven, true);
  assert.equal(e.extras.linen_beds, 3);
  assert.equal(e.weekend, true);
  assert.equal(typeof e.garage_serviced, 'boolean');
});

test('renderOutcome: priced off/on, personal, out_of_area, error', () => {
  const p = { outcome: 'priced', package_price: 599, extras_price: 129, per_visit_price: 728, first_visit_price: 1327 };
  const off = q.renderOutcome(p, false);
  assert.match(off.html, /\$728 incl\. GST/);
  assert.match(off.html, /\$1,327 incl\. GST/);
  assert.match(off.html, /\$129 incl\. GST/);
  assert.match(off.html, /Blake will call to confirm your First Clean/);
  assert.doesNotMatch(off.html, /data-terms|data-book/);
  const on = q.renderOutcome(p, true);
  assert.match(on.html, /data-terms/);
  assert.match(on.html, /data-book/);
  assert.doesNotMatch(on.html, /Blake will call/);
  assert.doesNotMatch(q.renderOutcome({ ...p, extras_price: 0 }, false).html, /extras/);
  const pq = q.renderOutcome({ outcome: 'personal_quote', reason: 'weekend' }, false);
  assert.match(pq.html, /Blake will be in touch within one business day/);
  assert.doesNotMatch(pq.html, /\$/);
  const oa = q.renderOutcome({ outcome: 'out_of_area' }, false, 'Byron Bay');
  assert.match(oa.html, /We don.t clean in Byron Bay yet/);
  assert.equal(q.renderOutcome({}, false).kind, 'error');
});

function run(fetch, bookingAttr = 'off') {
  const { d, els } = fakeDialog();
  const doc = { body: { getAttribute: () => bookingAttr } };
  const opener = fakeEl();
  const ctl = q.wire(d, 'tok', { doc, fetch, opener }, 'Burleigh');
  els['[data-quote-form]'].querySelector = fakeForm({ package: 'signature' }).querySelector;
  return { ctl, els, d, opener };
}

test('submit posts to /quote and renders priced result, hiding fields', async () => {
  let call;
  const r = run(async (u, o) => { call = { u, o }; return { ok: true, json: async () => ({ outcome: 'priced', package_price: 599, extras_price: 0, per_visit_price: 599, first_visit_price: 1198 }) }; });
  await r.ctl.submit({ preventDefault() {} });
  assert.equal(call.u, 'https://worker.vantagepointcleaning.com.au/quote');
  assert.equal(JSON.parse(call.o.body).quote_token, 'tok');
  assert.match(r.els['[data-result]'].innerHTML, /\$599 incl\. GST/);
  assert.equal(r.els['[data-result]'].hidden, false);
  assert.equal(r.els['[data-fields]'].hidden, true);
  assert.equal(r.els['[data-error]'].hidden, true);
  assert.equal(r.els['[data-result]'].focused, true);
});

test('result region is focusable so focus lands on it, not lost with the hidden fields', () => {
  assert.match(q.dialogHTML(), /<div class="quote-result" data-result[^>]*tabindex="-1"/);
});

test('booking on: terms checkbox gates the booking button', async () => {
  const terms = fakeEl(); const book = fakeEl();
  const r = run(async () => ({ ok: true, json: async () => ({ outcome: 'priced', package_price: 1, extras_price: 0, per_visit_price: 1, first_visit_price: 2 }) }), 'on');
  r.els['[data-result]'].querySelector = (s) => (s === '[data-terms]' ? terms : s === '[data-book]' ? book : null);
  await r.ctl.submit({ preventDefault() {} });
  assert.match(r.els['[data-result]'].innerHTML, /data-terms/);
  assert.equal(book.attrs['aria-disabled'], 'true');
  terms.checked = true; terms.l.change();
  assert.equal(book.attrs['aria-disabled'], 'false');
  terms.checked = false; terms.l.change();
  assert.equal(book.attrs['aria-disabled'], 'true');
  let prevented = false;
  book.l.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
});

test('errors (network, non-2xx, bad shape) keep inputs and show fallback', async () => {
  for (const f of [async () => { throw new Error('net'); }, async () => ({ ok: false, status: 401 }), async () => ({ ok: true, json: async () => ({}) })]) {
    const r = run(f);
    await r.ctl.submit({ preventDefault() {} });
    assert.equal(r.els['[data-error]'].hidden, false);
    assert.notEqual(r.els['[data-fields]'].hidden, true);
    assert.equal(r.els['[data-result]'].hidden, true);
  }
  assert.match(q.dialogHTML(), /hello@vantagepointcleaning\.com\.au/);
  assert.match(q.dialogHTML(), /07 5651 2257/);
});

test('close button closes and returns focus; cancel (Escape) returns focus', () => {
  const r = run(async () => {});
  r.els['[data-close]'].l.click();
  assert.equal(r.d.closed, 1);
  assert.equal(r.opener.focused, true);
  r.opener.focused = false;
  r.d.l.cancel();
  assert.equal(r.opener.focused, true);
});

test('dialog opens only on /lead success with a token — never on honeypot or error', () => {
  let opened = 0;
  const doc = {
    body: { getAttribute: () => 'off', appendChild() {} },
    createElement: () => { const e = fakeDialog().d; e.showModal = () => { opened++; }; return e; },
  };
  const deps = { fetch: async () => {} };
  assert.equal(q.handleLeadSubmitted(doc, { ok: true, caught: true }, deps), null);
  assert.equal(q.handleLeadSubmitted(doc, {}, deps), null);
  assert.equal(q.handleLeadSubmitted(doc, undefined, deps), null);
  assert.equal(opened, 0);
  assert.ok(q.handleLeadSubmitted(doc, { contact_id: 'c', quote_token: 'q' }, deps));
  assert.equal(opened, 1);
});

test('dialog markup: Signature preselected, ranges, extras flagged essential-only, no price copy', () => {
  const h = q.dialogHTML();
  assert.match(h, /value="signature" checked/);
  assert.match(h, /<option value="0" >?[^<]*Studio|Studio/);
  assert.match(h, /6\+/);
  assert.match(h, /5\+/);
  for (const n of ['oven', 'fridge', 'interior_glass', 'linen_beds']) assert.match(h, new RegExp(`data-extra-for="essential"[^]*?name="${n}"`));
  assert.doesNotMatch(h, /most popular/i);
});
