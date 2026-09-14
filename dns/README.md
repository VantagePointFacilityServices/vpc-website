# Cloudflare config (DNS)

`dns/zones/<domain>.yaml` is the desired state for one Cloudflare zone —
its DNS records. `sync-dns.mjs` diffs the file against the live zone and
applies the difference: plain REST API calls, no Terraform install or
state file.

## Setup

```bash
cd dns
npm install
cp .env.example .env   # fill in CLOUDFLARE_API_TOKEN — see .env.example for scopes
```

## Usage

```bash
node --env-file=.env sync-dns.mjs                    # dry run — prints the plan, changes nothing
node --env-file=.env sync-dns.mjs --apply             # creates/updates records
node --env-file=.env sync-dns.mjs --apply --prune     # also deletes DNS records not listed
```

Always run the dry run first and read the plan. `--prune` is the dangerous
one — it deletes any DNS record in the live zone that isn't in this file,
including records set up by hand outside this repo (e.g. a future email
setup). It prints what it would delete even without `--apply`, so you can
catch a mistake before it does anything.

## Zone file format

```yaml
zone: example.com

records:
  - type: A          # A, AAAA, CNAME, TXT, MX, etc.
    name: example.com  # fully-qualified hostname — bare domain for the apex, not "@"
    content: 192.0.2.1
    ttl: 1             # seconds, or 1 for "Auto" (default: 1)
    proxied: false     # true = orange-cloud (Cloudflare proxy/CDN/WAF) (default: false)
    priority: 10       # MX/SRV only
```

A/AAAA/MX/TXT/SRV can have several records at the same name (e.g. the four
GitHub Pages apex IPs below) — each is tracked independently by its exact
content. CNAME can only have one value per name and is updated in place.

`sync-dns.mjs` also supports a `redirects:` block for whole-domain
redirects via Cloudflare's Single Redirects (Rulesets) API — see
`vpfs-website/dns/README.md` for that format. Unused here: this zone has
no `redirects:` entries and none are planned, since (unlike
`vantagepointfacilityservices.com`) there's no second domain that needs to
redirect into this one.

## Current zones

- **`vantagepointcleaning.com.au`** — the live site. Apex and `www` both
  point at GitHub Pages, but `www` is canonical — `site/CNAME` is
  `www.vantagepointcleaning.com.au`, matching every page's
  `<link rel="canonical">`/`og:url` and `sitemap.xml`, so GitHub redirects
  the bare apex to `www` rather than the other way round (deployed by
  `.github/workflows/deploy-website.yml`).

## Testing

```bash
npm test   # runs test/sync-dns.test.js with coverage (see vitest.config.js)
```

`sync-dns.mjs`'s pure logic and its API-calling functions all have unit
tests, with `fetch` mocked so nothing hits the real Cloudflare API.
`loadZoneFiles` is also tested directly against the real `zones/`
directory, so a change that breaks the committed zone file's YAML fails
the suite too. `vitest.config.js` enforces a 95% coverage floor
(statements, branches, functions, lines).

## CI

`.github/workflows/sync-dns.yml` has two jobs: `test` (runs the suite
above, coverage-gated) always runs first, then `sync` — dry run
automatically on any PR touching `dns/zones/**`; actual apply is manual
only (`workflow_dispatch`, with an `apply`/`prune` checkbox), never
automatic on push.
