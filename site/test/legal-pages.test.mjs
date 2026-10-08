import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = fs.readdirSync(siteDir).filter((f) => f.endsWith('.html')).sort();
const read = (f) => fs.readFileSync(path.join(siteDir, f), 'utf8');

test('site has pages to check', () => {
  assert.ok(pages.includes('privacy.html'));
  assert.ok(pages.length >= 9);
});

for (const page of pages) {
  test(`${page}: footer Privacy Policy link points at privacy.html`, () => {
    const links = [...read(page).matchAll(/<a\s+href="([^"]*)"[^>]*>\s*Privacy Policy\s*<\/a>/g)];
    assert.ok(links.length > 0, 'has a Privacy Policy link');
    for (const m of links) assert.equal(m[1], 'privacy.html');
  });
}

test('privacy.html content', () => {
  const h = read('privacy.html');
  for (const s of ['ACN 700 018 775', 'ABN 89 700 018 775', 'hello@vantagepointcleaning.com.au',
    '<strong>Last updated:</strong> 8 October 2026 · Version 1.0', '<h2>1. About this policy</h2>', '<h2>11. Changes</h2>',
    '<link rel="canonical" href="https://www.vantagepointcleaning.com.au/privacy.html">']) {
    assert.ok(h.includes(s), `missing: ${s}`);
  }
  assert.ok(!h.includes('blake@vantagepointfacilityservices.com'));
  assert.ok(!/draft|interim|Lawpath/i.test(h));
});

for (const page of pages) {
  test(`${page}: footer Terms & Conditions link points at terms.html`, () => {
    const links = [...read(page).matchAll(/<a\s+href="([^"]*)"[^>]*>\s*Terms (?:&amp;|&) Conditions\s*<\/a>/g)];
    assert.ok(links.length > 0, 'has a Terms & Conditions link');
    for (const m of links) assert.equal(m[1], 'terms.html');
  });
}

const plain = (h) => h.replace(/<\/(p|li|h[1-6]|blockquote|ul|div|section)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const draftClause = (n) => fs.readFileSync(path.join(siteDir, 'test', 'fixtures', `draft-clause-${n}.md`), 'utf8')
  .replace(/^>\s?/gm, '').replace(/\*\*|\*/g, '').replace(/\s+/g, ' ').trim();

test('terms.html content', () => {
  const h = read('terms.html');
  for (let i = 1; i <= 14; i++) assert.ok(new RegExp(`<h2>${i}\\. `).test(h), `missing clause ${i}`);
  for (const s of ['<h2>Using this website</h2>', 'ACN 700 018 775', 'ABN 89 700 018 775',
    'hello@vantagepointcleaning.com.au', 'https://www.vantagepointcleaning.com.au',
    'Our services come with guarantees that cannot be excluded under the Australian Consumer Law',
    'You can cancel by email or phone', 'href="privacy.html"', 'clause 14',
    'Last updated: 8 October 2026 · Version 1.0',
    '<link rel="canonical" href="https://www.vantagepointcleaning.com.au/terms.html">']) {
    assert.ok(plain(h).includes(s) || h.includes(s), `missing: ${s}`);
  }
  assert.ok(!/\[[^\]]*\]/.test(plain(h)), 'no [placeholders]');
  const body = h.split('<!-- ============ POLICY')[1].split('<!-- ============ FOOTER')[0];
  assert.ok(!body.includes('(07) 5500 0000') && !body.includes('0755000000'));
  assert.ok(!h.includes('blake@vantagepointfacilityservices.com'));
  assert.ok(!/draft|interim|Lawpath|Drafting note/i.test(body));
});

test('terms.html clauses 4 and 6 match the draft word for word', () => {
  const t = plain(read('terms.html'));
  for (const n of [4, 6]) {
    const text = draftClause(n);
    assert.ok(t.includes(text), `clause ${n} differs from draft`);
  }
});

test('sitemap.xml lists terms.html', () => {
  assert.ok(read('sitemap.xml').includes('<loc>https://www.vantagepointcleaning.com.au/terms.html</loc>'));
});

test('sitemap.xml lists privacy.html', () => {
  assert.ok(read('sitemap.xml').includes('<loc>https://www.vantagepointcleaning.com.au/privacy.html</loc>'));
});

test('.gitignore ignores .scratch/ and .coding-crew/', () => {
  const g = fs.readFileSync(path.join(siteDir, '..', '.gitignore'), 'utf8').split('\n');
  assert.ok(g.includes('.scratch/') && g.includes('.coding-crew/'));
});

const purposes = {
  'index.html': ['prepare your quote', 'prepare your quote and contact you about it', "we can't prepare your quote"],
  'reserve-home-care.html': ['prepare your quote', 'prepare your quote and contact you about it', "we can't prepare your quote"],
  'signature-home-care.html': ['prepare your quote', 'prepare your quote and contact you about it', "we can't prepare your quote"],
  'estate-care.html': ['assess your property and offer a walkthrough', 'assess your property and offer a walkthrough', "we can't assess your property or book a walkthrough"],
  'contact.html': ['respond to your enquiry', 'respond to your enquiry', "we can't respond to your enquiry"],
  'service-areas.html': ['tell you when we cover your area', 'tell you when we cover your area', "we can't let you know when we cover your area"],
  'careers.html': ["assess your application, including any screening checks a client site requires (we'll ask first)",
    'assess your application, check your right to work and, where a client site requires it, run screening checks', "we can't consider your application"],
};

test('every page with an assessment form has a collection-notice purpose mapped', () => {
  const formPages = pages.filter((p) => /class="assessment-form"/.test(read(p)));
  assert.deepEqual(formPages.filter((p) => !(p in purposes)), [], 'form pages missing from purposes');
});

for (const [page, [short]] of Object.entries(purposes)) {
  test(`${page}: one short collection notice before the submit button`, () => {
    const h = read(page);
    const forms = [...h.matchAll(/<form class="assessment-form"[\s\S]*?<\/form>/g)].map((m) => m[0]);
    assert.equal(forms.length, 1);
    const f = forms[0];
    const notices = [...f.matchAll(/<p class="form-privacy-notice">([\s\S]*?)<\/p>/g)];
    assert.equal(notices.length, 1);
    assert.ok(f.indexOf('form-privacy-notice') < f.indexOf('type="submit"'), 'notice before submit');
    assert.ok(notices[0][1].includes('<a href="privacy.html#collection-notice">'));
    assert.ok(/<a href="privacy\.html">/.test(notices[0][1]));
    assert.equal(plain(notices[0][0]).trim(),
      `We collect these details to ${short}. How we handle them: collection notice · Privacy Policy.`);
    assert.ok(!/type="checkbox"/.test(notices[0][0]));
  });
}

test('privacy.html collection notice section', () => {
  const h = read('privacy.html');
  const sec = h.split('id="collection-notice"')[1];
  assert.ok(sec, 'has #collection-notice');
  const t = plain(sec.split('<h2>1. About this policy</h2>')[0]);
  assert.ok(h.indexOf('id="collection-notice"') < h.indexOf('<h2>1. About this policy</h2>'));
  assert.ok(t.includes('Collection notice'));
  assert.ok(t.includes('Vantage Point Facility Services Pty Ltd (trading as Vantage Point Cleaning) collects these details to'));
  assert.ok(t.includes('hello@vantagepointcleaning.com.au'));
  assert.ok(t.includes("We'll ask for your consent before any check."));
  assert.ok(t.includes('Some client sites, such as schools, childcare and NDIS services, require police, Blue Card or NDIS worker screening.'));
  const rows = [...new Set(Object.values(purposes).map((p) => p.slice(1).join('|')))];
  assert.equal(rows.length, 5);
  for (const [, [, p, c]] of Object.entries(purposes)) {
    assert.ok(t.includes(p) && t.includes(c), `row missing: ${p}`);
  }
  assert.equal((sec.split('<h2>1. About')[0].match(/<tr>/g) || []).length, 6);
});

test('docs/ holds only DEPLOYMENT.md and KNOWLEDGE.md', () => {
  const docsDir = path.resolve(siteDir, '..', 'docs');
  assert.deepEqual(fs.readdirSync(docsDir).sort(), ['DEPLOYMENT.md', 'KNOWLEDGE.md']);
});
