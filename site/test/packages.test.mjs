import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const text = (h) => h.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const EXTRAS = {
  oven: '$109', fridge: '$65', cabinets: '$69', laundry_loads: '$45 per load',
  linen_beds: '$20 per bed', interior_glass: '$65', ironing_blocks: '$45 per 30 min', reset_blocks: '$65 per 30 min',
};
const INCLUDED = { oven: [1, 2], fridge: [1, 2], interior_glass: [1, 2] }; // Signature, Reserve column indexes

test('D14 inclusions on cards and package pages', () => {
  const idx = read('index.html');
  const card = (name) => idx.match(new RegExp(`<article class="package-card[^"]*">[\\s\\S]*?<h3>${name}[\\s\\S]*?</article>`))[0];
  assert.match(text(card('Essential')), /Dishes/);
  assert.match(text(card('Essential')), /Linen change and interior glass available as extras/);
  assert.match(text(card('Signature')), /includes oven and fridge interiors/);
  assert.match(text(card('Signature')), /Detail and rotating care/);
  const reserve = text(card('Reserve'));
  for (const re of [/Presentation finish/, /Replacement-cleaner guarantee/]) assert.match(reserve, re);
  const rp = text(read('reserve-home-care.html'));
  for (const re of [/Presentation finish/, /Replacement-cleaner guarantee/]) assert.match(rp, re);
  assert.match(text(read('signature-home-care.html')), /oven and fridge interiors/);
});

test('laundry, linen and ironing are not Signature or Reserve inclusions', () => {
  const idx = read('index.html');
  const card = (name) => text(idx.split('<article').find((a) => a.includes(`<h3>${name}`)).split('</article>')[0]);
  for (const n of ['Signature', 'Reserve']) assert.doesNotMatch(card(n), /laundry|linen|ironing/i);
  const q = read('assets/js/quote.js').match(/var INCLUSIONS = \{[\s\S]*?\};/)[0];
  assert.doesNotMatch(q, /laundry|linen|ironing/i);
  for (const f of ['signature-home-care.html', 'reserve-home-care.html']) {
    const html = read(f);
    const grid = html.match(/<div class="inclusions-grid">[\s\S]*?<\/div>\s*<\/div>/g).join('');
    assert.doesNotMatch(grid, /laundry|linen|ironing/i);
    assert.doesNotMatch(html.match(/<meta name="description"[^>]*>/)[0], /laundry|linen|ironing/i);
  }
});

test('extras list with approved prices on homepage and package pages', () => {
  for (const p of ['index.html', 'signature-home-care.html', 'reserve-home-care.html']) {
    const h = read(p);
    for (const [key, price] of Object.entries(EXTRAS)) {
      assert.match(h, new RegExp(`<tr data-extra="${key}">[^]*?<strong>${price.replace('$', '\\$')}</strong>`), `${p} ${key}`);
      const cells = [...h.match(new RegExp(`<tr data-extra="${key}">[^]*?</tr>`))[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => text(m[1]).trim());
      assert.equal(cells.length, 3, `${p} ${key} cells`);
      cells.forEach((c, i) => {
        if ((INCLUDED[key] || []).includes(i)) assert.equal(c, 'Included', `${p} ${key} col ${i}`);
        else assert.equal(c, price, `${p} ${key} col ${i}`);
      });
    }
    assert.match(text(h), /Housekeeping add-ons/, p);
    assert.match(text(h), /Detail extras/, p);
    assert.match(text(h), /Carpet steam cleaning and upper-level exterior glass are quoted separately/, p);
  }
});

test('extras prices are the only dollar figures on marketing pages', () => {
  for (const p of pages.filter((x) => !['terms.html', 'privacy.html'].includes(x))) {
    const h = read(p);
    const body = h.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '');
    const outside = body.replace(/<table class="extras-table">[\s\S]*?<\/table>/, '');
    assert.doesNotMatch(outside, />[^<]*\$\d/, `${p} has $ outside extras`);
    assert.doesNotMatch(h, /most popular|detail-clean rotation/i, p);
  }
});

test('no unqualified same-cleaner promise', () => {
  for (const p of pages) {
    const t = text(read(p));
    for (const m of t.matchAll(/same (?:dedicated )?cleaners?(?: or team)?[^.?!]*/gi)) {
      assert.match(m[0], /wherever possible/i, `${p}: "${m[0]}"`);
    }
  }
  for (const p of pages) {
    const t = text(read(p));
    for (const m of t.matchAll(/same (?:team|faces)(?! as)[^.?!]*/gi)) {
      assert.match(m[0], /wherever possible/i, `${p}: "${m[0]}"`);
    }
  }
  assert.match(text(read('index.html')), /the same cleaner wherever possible, with a briefed replacement/i);
});

test('no doubled "the the" on any page, including commented-out copy', () => {
  for (const p of pages) {
    const raw = read(p).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert.doesNotMatch(raw, /\bthe the\b/i, p);
  }
});

test('housekeeping callouts and card links', () => {
  const idx = read('index.html');
  assert.equal((idx.match(/Add housekeeping →|Add housekeeping &rarr;/g) || []).length, 3);
  for (const f of ['signature-home-care.html', 'reserve-home-care.html']) {
    assert.match(text(read(f)), /Make it a housekeeping visit/, f);
  }
});
