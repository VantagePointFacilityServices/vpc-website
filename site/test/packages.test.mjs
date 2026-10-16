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
  oven: '$129', fridge: '$65', cabinets: '$99', laundry_loads: '$45',
  linen_beds: '$20 per bed', interior_glass: '$65', ironing_blocks: '$65 per 30 min', reset_blocks: '$65 per 30 min',
};

test('D14 inclusions on cards and package pages', () => {
  const idx = read('index.html');
  const card = (name) => idx.match(new RegExp(`<article class="package-card[^"]*">[\\s\\S]*?<h3>${name}[\\s\\S]*?</article>`))[0];
  assert.match(text(card('Essential')), /Dishes/);
  assert.match(text(card('Essential')), /Linen change and interior glass available as extras/);
  assert.match(text(card('Signature')), /includes oven and fridge interiors/);
  const reserve = text(card('Reserve'));
  for (const re of [/Ironing up to 30 minutes/, /Presentation finish/, /Replacement-cleaner guarantee/]) assert.match(reserve, re);
  const rp = text(read('reserve-home-care.html'));
  for (const re of [/Ironing up to 30 minutes/, /Presentation finish/, /Replacement-cleaner guarantee/]) assert.match(rp, re);
  assert.match(text(read('signature-home-care.html')), /oven and fridge interiors/);
});

test('extras list with approved prices on homepage and package pages', () => {
  for (const p of ['index.html', 'signature-home-care.html', 'reserve-home-care.html']) {
    const h = read(p);
    for (const [key, price] of Object.entries(EXTRAS)) {
      assert.match(h, new RegExp(`<li data-extra="${key}">[^]*?<strong>${price.replace('$', '\\$')}</strong>`), `${p} ${key}`);
    }
    assert.match(text(h), /Carpet steam cleaning and upper-level exterior glass are quoted separately/, p);
  }
});

test('extras prices are the only dollar figures on marketing pages', () => {
  for (const p of pages.filter((x) => !['terms.html', 'privacy.html'].includes(x))) {
    const h = read(p);
    const body = h.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '');
    const outside = body.replace(/<ul class="extras-list">[\s\S]*?<\/ul>/, '');
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
