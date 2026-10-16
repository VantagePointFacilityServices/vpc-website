import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const utm = createRequire(import.meta.url)('../assets/js/utm.js');

function win(search, path = '/about.html', storage = new Map()) {
  return {
    location: { search, pathname: path },
    sessionStorage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
  };
}

test('stores utms and landing page; read returns them on later pages', () => {
  const store = new Map();
  utm.capture(win('?utm_source=google&utm_medium=cpc&utm_campaign=c&utm_term=t&utm_content=x&other=1', '/about.html', store));
  utm.capture(win('', '/contact.html', store)); // later page without utms keeps the landing
  const saved = JSON.parse(store.get(utm.KEY));
  assert.deepEqual(saved, { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'c', utm_term: 't', utm_content: 'x', landing_page: '/about.html' });
});

test('a new campaign link replaces the stored arrival', () => {
  const store = new Map();
  utm.capture(win('?utm_source=a', '/', store));
  utm.capture(win('?utm_source=b', '/x.html', store));
  assert.equal(JSON.parse(store.get(utm.KEY)).utm_source, 'b');
});

test('storage failures never throw', () => {
  const throwing = { location: { search: '?utm_source=a', pathname: '/' }, get sessionStorage() { throw new Error('blocked'); } };
  assert.doesNotThrow(() => utm.capture(throwing));
  const badSet = { location: { search: '?utm_source=a', pathname: '/' }, sessionStorage: { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } } };
  assert.doesNotThrow(() => utm.capture(badSet));
});

test('every page loads utm.js', () => {
  for (const p of readdirSync(root).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(root, p), 'utf8');
    if (/<meta http-equiv="refresh"/.test(html)) continue; // redirect stub, not a page
    assert.match(html, /<script src="assets\/js\/utm\.js"><\/script>/, p);
  }
});
