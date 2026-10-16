import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const hiddenPages = ['why-us.html', 'about.html'];

test('why-us and about are noindex with a relist comment', () => {
  for (const p of hiddenPages) {
    const h = read(p);
    assert.match(h, /<meta name="robots" content="noindex">/, p);
    assert.match(h, /To relist/, p);
  }
});

test('no page has a live href to why-us or about; hidden data-href links remain', () => {
  for (const p of pages) {
    const h = read(p);
    assert.doesNotMatch(h, /(?<![-\w])href="(?:\.\/)?(?:why-us|about)\.html"/, p);
    if (p === 'careers.html') continue; // redirect stub, no nav
    for (const t of hiddenPages) {
      assert.match(h, new RegExp(`<a data-href="${t}"[^>]*hidden>`), `${p} -> ${t}`);
    }
  }
});

test('sitemap excludes why-us and about', () => {
  const s = read('sitemap.xml');
  assert.doesNotMatch(s, /why-us\.html|about\.html/);
});
