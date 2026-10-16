import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const read = (f) => readFileSync(join(root, f), 'utf8');
const PHONE_TEL = 'tel:+61756512257';
const ESTATE_LINE = 'Have a larger estate, or need more than Reserve covers? <a href="estate-care.html" class="text-link">Estate Care is arranged through a private walkthrough &rarr;</a>';
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
  for (const p of pages) assert.doesNotMatch(read(p).replace(ESTATE_LINE, ''), /<a [^>]*href="estate-care\.html"[^>]*>\s*Estate Care/, p);
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

const VPFS = 'https://www.vantagepointfacilityservices.com.au';

test('footer Careers and Subcontractors link to the shared VPFS recruiting pages', () => {
  for (const p of pages.filter((f) => !/<meta http-equiv="refresh"/.test(read(f)))) {
    const h = read(p), footer = h.slice(h.lastIndexOf('<footer'));
    assert.ok(footer.includes(`<a href="${VPFS}/career.html">Careers</a>`), `${p}: Careers`);
    assert.ok(footer.includes(`<a href="${VPFS}/subcontractor.html">Subcontractors</a>`), `${p}: Subcontractors`);
    assert.ok(!/href="careers\.html"/.test(read(p)), `${p}: no link to the old careers.html`);
  }
});

test('careers.html redirects to the VPFS careers page, keeping query and hash', () => {
  const h = read('careers.html');
  assert.ok(h.includes(`location.replace("${VPFS}/career.html" + location.search + location.hash)`));
  assert.ok(h.includes(`<meta http-equiv="refresh" content="0; url=${VPFS}/career.html">`));
  assert.ok(h.includes('<meta name="robots" content="noindex">'));
});


test('Estate line appears on index and reserve pages only, nav/footer stay Estate-free', () => {
  for (const p of pages) {
    const h = read(p);
    const has = h.includes(ESTATE_LINE);
    assert.equal(has, ['index.html', 'reserve-home-care.html'].includes(p), p);
    const nav = h.match(/<header[\s\S]*?<\/header>/), footer = h.slice(h.lastIndexOf('<footer'));
    if (nav) assert.doesNotMatch(nav[0], /estate-care/, `${p}: nav`);
    assert.doesNotMatch(footer, /estate-care/, `${p}: footer`);
  }
});

test('no testimonial or review markup on any page (terms legal quotes excluded)', () => {
  for (const p of pages.filter((f) => f !== 'terms.html')) {
    const h = read(p).replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(h, /quiet-quote|testimonial|class="attrib"|Private client/i, p);
    if (p !== 'about.html') assert.doesNotMatch(h, /<blockquote/, p);
  }
});

test('estate-care.html makes no Supervisor claims', () => {
  assert.doesNotMatch(read('estate-care.html'), /supervisor/i);
});

test('every cancellation-window mention says 48h', () => {
  for (const p of pages.filter((f) => f !== 'terms.html')) {
    assert.doesNotMatch(read(p), /24[ -]hours?/i, p);
  }
});
