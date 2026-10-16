import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const read = (f) => readFileSync(join(root, f), 'utf8');
const PHONE_TEL = 'tel:+61756512257';
const EMAIL = 'hello@vantagepointcleaning.com.au';

test('there are 11 pages', () => assert.equal(pages.length, 11));

test('no dummy phone number anywhere', () => {
  for (const p of pages) assert.doesNotMatch(read(p), /5500 0000|0755000000|755000000/, p);
});

test('JSON-LD telephone matches the displayed number', () => {
  for (const p of pages) {
    const h = read(p);
    const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!m) continue;
    assert.equal(JSON.parse(m[1]).telephone, '+61756512257', p);
    assert.match(h, /07 5651 2257/, p);
    assert.ok(h.includes(PHONE_TEL), p);
  }
});

test('no placeholder social links', () => {
  for (const p of pages) assert.doesNotMatch(read(p), /<a href="#"/, p);
});

test('Estate Care is not promoted but still exists', () => {
  for (const p of pages) assert.doesNotMatch(read(p), /<a [^>]*href="estate-care\.html"[^>]*>\s*Estate Care/, p);
  assert.doesNotMatch(readFileSync(join(root, 'sitemap.xml'), 'utf8'), /estate-care/);
  assert.ok(existsSync(join(root, 'estate-care.html')));
});

test('no visible From $ price; package note has no instant-quote promise', () => {
  for (const p of pages) {
    const h = read(p);
    assert.doesNotMatch(h, /From\s*(<[^>]*>\s*)*\$\d/i, p);
    assert.doesNotMatch(h, /starts from \$\d/i, p);
    assert.doesNotMatch(h, /class="package-price"[^>]*><span class="from"/, p);
  }
  const note = read('index.html').match(/<p class="package-note">([\s\S]*?)<\/p>/)[1];
  assert.doesNotMatch(note, /instant|before you book/i);
  assert.match(read('index.html'), /Get your quote/);
});

test('forms are hidden and each location shows email + phone', () => {
  for (const p of pages) {
    const h = read(p);
    const forms = [...h.matchAll(/<form class="assessment-form"([^>]*)>/g)];
    for (const f of forms) assert.match(f[1], /\bhidden\b/, p);
    const ctas = [...h.matchAll(/<div class="contact-cta">[\s\S]*?<\/div>/g)];
    assert.equal(ctas.length, forms.length, p);
    for (const c of ctas) {
      assert.ok(c[0].includes(`mailto:${EMAIL}`), p);
      assert.ok(c[0].includes(PHONE_TEL), p);
    }
  }
});

test('no visible CTA promises an instant quote while forms are hidden', () => {
  for (const p of pages) {
    const visible = read(p).replace(/<form class="assessment-form"[^>]*\bhidden\b[\s\S]*?<\/form>/g, '');
    assert.doesNotMatch(visible, /<(a|button)[^>]*>\s*Get Instant Quote\s*<\/\1>/i, p);
  }
});
