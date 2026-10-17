# vpc-lead-worker

Cloudflare Worker at `https://worker.vantagepointcleaning.com.au` (code in `worker/`).
Separate from the VPFS Worker: it shares no Worker, token or secret with it.

## Endpoints

### `POST /lead`
Body (JSON): `first_name`, `last_name`, `email`, `phone`, `postcode`, `cf-turnstile-response`,
optional `utm_*`, `conversion_page`, `marketing_consent`, click ids, `referrer_host`;
honeypots `website_url` / `company`.

| Result | Meaning |
|---|---|
| `200 {contact_id, quote_token}` | Contact upserted in the VPC GHL location; tags `website-lead`, plus `out-of-area` (postcode not in `SERVICE_ZONE_POSTCODES`) and `turnstile-unverified` (Cloudflare unreachable, fail-open) |
| `200 {ok:true}` | Honeypot filled — no GHL call |
| `400` | Missing first name / email / phone / postcode, or invalid JSON |
| `403` | Turnstile rejected: missing or invalid token, or a token solved for another `action` (must be `lead`) or hostname (must be `vantagepointcleaning.com.au` or `www.`; never `localhost`) |
| `502` | GHL upsert failed |

All errors are JSON `{error}`. `quote_token` = base64url(`contact_id.exp`) + `.` + HMAC-SHA256 signature
(secret `QUOTE_TOKEN_SECRET`), valid 60 minutes. `/quote` (issue 08) reuses `verifyQuoteToken` from `worker.js`.

CORS: only `https://www.vantagepointcleaning.com.au` and `http://localhost[:port]`.

`SERVICE_ZONE_POSTCODES` in `worker.js` is the VPFS launch area: Gold Coast 4207–4230 + Tweed Shire 2484–2490.

## Vars (`wrangler.toml`, not secret)
- `GHL_VPC_LOCATION_ID` — VPC GHL sub-account Location ID (`J81Ybf7bB8Eo2jfKD095`).

## Secrets (`wrangler secret put <NAME>`, run in `worker/`)
- `GHL_VPC_API_KEY` — GHL Private Integration "VPC – Cloudflare Worker – Lead Gate & Quote", created inside the VPC sub-account; scopes `contacts.write`, `contacts.readonly`, `opportunities.write`, `opportunities.readonly`. Locally: one line `GHL_VPC_API_KEY=...` in `worker/.env` (gitignored; never `.dev.vars`, which is not).
- `QUOTE_TOKEN_SECRET` — random string (e.g. `openssl rand -hex 32`).
- `TURNSTILE_SECRET_KEY` — secret of the Turnstile widget "VPC – Website Lead Forms" (site key `0x4AAAAAAFZN2if54_39FaOz`, set in `site/assets/js/lead.js`).

Repo secrets for CI: `CLOUDFLARE_WORKER_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Setup order
1. Create the VPC GHL sub-account, token, custom fields and tags (issue 01); set `GHL_VPC_LOCATION_ID`.
2. Add the repo secrets above; merge to `main` so `deploy-worker.yml` deploys the Worker.
3. `wrangler secret put GHL_VPC_API_KEY`, then `QUOTE_TOKEN_SECRET`.
4. Set `TURNSTILE_SECRET_KEY` **last** — with the secret set but no widget on the site, every lead is rejected.
   (Without it the Worker skips the bot check.)

## CI
`.github/workflows/deploy-worker.yml` runs `npm test` on PRs and pushes; vitest enforces 95% coverage
(lines, functions, branches, statements). Deploy runs only on push to `main` after tests pass.

## Develop
`cd worker && npm ci && npm test`. All `fetch` calls are mocked; no live calls.
