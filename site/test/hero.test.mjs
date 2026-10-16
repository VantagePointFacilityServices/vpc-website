import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const css = readFileSync(join(root, 'assets/css/style.css'), 'utf8');

test('every page except the redirect stub uses the shared hero', () => {
  assert.ok(pages.length > 5);
  for (const p of pages) {
    const html = readFileSync(join(root, p), 'utf8');
    if (/<meta http-equiv="refresh"/.test(html)) continue;
    assert.match(html, /<section class="hero hero-form-page( hero-form-single)?">/, p);
    assert.doesNotMatch(html, /page-hero|hero-single|hero-copy/, p);
  }
});

test('hero CSS: one height, padding and H1 size; old rules gone', () => {
  assert.match(css, /min-height: 602px/);
  assert.match(css, /clamp\(1\.6rem, 6\.8cqi, 2\.75rem\)/);
  assert.doesNotMatch(css, /\.page-hero\s*\{|3\.6rem|\.hero-single\s*\{|\.hero-copy\s*\{/);
});
