// Deploy-time cache busting for the static site.
//
// GitHub Pages serves files with Cache-Control: max-age=600, so for up to 10
// minutes after a deploy a browser can pair new HTML with old cached CSS/JS.
// Run against the deploy copy of site/ just before upload (see
// .github/workflows/deploy-website.yml), this appends ?v=<commit> to every
// local stylesheet/script URL in the pages. Repo source files are never changed.
//
// Usage: node site/scripts/cache-bust.mjs <site-dir> <version>

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML_ASSET = /((?:href|src)=")(\/?assets\/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?(")/g;

export function bustHtml(html, version) {
  return html.replace(HTML_ASSET, `$1$2?v=${version}$3`);
}

export function bustSite(siteDir, version) {
  if (!version) throw new Error('cache-bust: a version (e.g. the commit SHA) is required');
  for (const e of readdirSync(siteDir, { withFileTypes: true })) {
    if (!e.isFile() || !e.name.endsWith('.html')) continue;
    const file = join(siteDir, e.name);
    const before = readFileSync(file, 'utf8');
    const after = bustHtml(before, version);
    if (after !== before) writeFileSync(file, after);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [siteDir, version] = process.argv.slice(2);
  bustSite(siteDir, version);
  console.log(`cache-bust: versioned ${siteDir} assets as ?v=${version}`);
}
