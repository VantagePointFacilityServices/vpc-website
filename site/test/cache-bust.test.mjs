import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bustHtml, bustSite } from '../scripts/cache-bust.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('versions local css/js, leaves external alone, replaces old version', () => {
  assert.equal(bustHtml('<link href="assets/css/style.css"><script src="assets/js/main.js?v=old"></script>', 'abc'),
    '<link href="assets/css/style.css?v=abc"><script src="assets/js/main.js?v=abc"></script>');
  const ext = '<script src="https://x.com/a.js"></script><img src="assets/img/a.svg">';
  assert.equal(bustHtml(ext, 'abc'), ext);
});

test('bustSite versions every page, including utm.js', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cb-'));
  try {
    cpSync(root, dir, { recursive: true, filter: (s) => !s.includes('/test') });
    bustSite(dir, 'deadbeef');
    const pages = readdirSync(dir).filter((f) => f.endsWith('.html'));
    assert.ok(pages.length > 5);
    for (const p of pages) {
      const html = readFileSync(join(dir, p), 'utf8');
      if (/<meta http-equiv="refresh"/.test(html)) continue; // redirect stub, loads no assets
      assert.match(html, /assets\/js\/utm\.js\?v=deadbeef/, p);
      assert.doesNotMatch(html, /assets\/(css|js)\/[^"?]+"/, p);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('requires a version', () => assert.throws(() => bustSite(root, '')));

test('deploy workflow runs cache-bust before upload', () => {
  const y = readFileSync(join(root, '..', '.github/workflows/deploy-website.yml'), 'utf8');
  const a = y.indexOf('cache-bust.mjs'), b = y.indexOf('upload-pages-artifact');
  assert.ok(a > 0 && a < b);
});
