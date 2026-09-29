# Deploying vantagepointcleaning.com.au

One-time cutover that takes `vantagepointcleaning.com.au` off GoDaddy and makes this repo's site
live at `https://www.vantagepointcleaning.com.au`. It's the VPC copy of
`vpfs-website/docs/DEPLOYMENT.md`, the runbook VPFS went live on, rewritten for this domain.
It includes the fixes VPFS only found after launch (GoDaddy leftover records and the SPF include).

## Where things stand (checked 2026-09-30)

| Item | State |
|---|---|
| Nameservers | **GoDaddy** (`ns73`/`ns74.domaincontrol.com`), not Cloudflare |
| Apex + `www` | Serve a **GoDaddy Website Builder** page (`76.223.105.230`, `13.248.243.5`); `www` 301s to the apex |
| GitHub Pages | Enabled (`build_type: workflow`), custom domain `www.vantagepointcleaning.com.au`, HTTPS not enforced. It can't get a cert until DNS points at GitHub |
| Email | Google Workspace MX is live. SPF uses GoDaddy's `_spfm` include, which breaks after the move. No Google DKIM. DMARC is `p=quarantine`, with reports going to GoDaddy |
| Zone file | `dns/zones/vantagepointcleaning.com.au.yaml` has the website records, the email records and the fixed SPF |
| `vantagepointcleaning.com` | **Not ours.** It belongs to an unrelated US company ("Vantage Point Cleaning and Maintenance", GreenGeeks DNS). There's no `.com` redirect to build, unlike VPFS |

## Part 1 — Add the domain to Cloudflare

1. Cloudflare → **Add a Site** → `vantagepointcleaning.com.au` → **Free** plan. Use the same
   Cloudflare account as the VPFS zones.
2. Cloudflare's import scan copies GoDaddy's records. Look for the GoDaddy parking/Website
   Builder A records (`76.223.105.230`, `13.248.243.5`) and any `_domainconnect`,
   `domaincontrol.com` or `_spfm` entries. Those are the records that hijacked the VPFS apex.
   Leave them for now. Part 5 removes them with `--prune`.
3. Copy the two nameservers Cloudflare gives you. **Don't switch GoDaddy yet.**

## Part 2 — API token

Add `vantagepointcleaning.com.au` to the zone resources of the DNS token (`Zone:Zone:Read`,
`Zone:DNS:Edit`, `Zone:Single Redirect:Edit`). You can extend the VPFS token or create a VPC-only
token. A separate token is better, since the brands are meant to stay separate. Then:

```bash
cd dns && npm install && cp .env.example .env   # CLOUDFLARE_API_TOKEN=...
gh secret set CLOUDFLARE_API_TOKEN --repo VantagePointFacilityServices/vpc-website
```

## Part 3 — Make the Cloudflare zone correct *before* the switch

The zone is already created (status **Pending**), so you can sync it before any traffic moves:

```bash
node --env-file=.env sync-dns.mjs --prune          # dry run, read CREATE and DELETE
node --env-file=.env sync-dns.mjs --apply --prune  # once the plan is right
```

Expected: CREATE for the 4 GitHub A records, the `www` CNAME, 5 MX, SPF, DMARC and
site-verification. DELETE for the GoDaddy A records, the old `_spfm` SPF and any other GoDaddy
leftovers. If DELETE lists anything you don't recognise (for example a mail or verification
record added by hand in GoDaddy), **add it to the zone file first**, then re-run.

## Part 4 — Point GoDaddy at Cloudflare

GoDaddy → My Products → `vantagepointcleaning.com.au` → DNS → **Nameservers → Change → custom** →
paste the two Cloudflare nameservers and save. Then click **Check nameservers** in Cloudflare.
Wait for **Active** (a few hours, up to 48). If the domain is on a GoDaddy Website Builder plan,
cancel that plan **after** the site is verified in Part 7.

> `.com.au` domains: the registrant details and ABN must be valid for the domain to stay
> registered. Changing nameservers doesn't touch them.

## Part 5 — GitHub Pages

Pages is already configured. Once the zone is Active:

1. Repo → **Settings → Pages → Custom domain** → re-save `www.vantagepointcleaning.com.au` to
   re-run the DNS check.
2. Wait for the check to go green, then tick **Enforce HTTPS**.
3. `gh workflow run deploy-website.yml --repo VantagePointFacilityServices/vpc-website`

## Part 6 — Email after the move

1. Send a test email to and from a `@vantagepointcleaning.com.au` mailbox. Check that SPF shows
   **pass** in "Show original".
2. Google Admin → Gmail → **Authenticate email** → generate DKIM for this domain → paste it into
   the zone file's commented `google._domainkey` record → apply → **Start authentication**.
3. Change the DMARC `rua` to a mailbox you read, and consider VPFS's strict policy
   (`p=reject pct=10 adkim=s aspf=s`) once DKIM passes.

## Part 7 — Verify

```bash
curl -I https://www.vantagepointcleaning.com.au              # 200 from GitHub.com
curl -I https://vantagepointcleaning.com.au                  # 301 → https://www.vantagepointcleaning.com.au/
curl -sL https://vantagepointcleaning.com.au | grep -o '<title>[^<]*'   # the VPC title, NOT "vantagepointcleaning.com.au" (GoDaddy)
cd dns && node --env-file=.env sync-dns.mjs --prune          # dry run: no CREATE, no DELETE
```

## Part 8 — The Worker and GHL

Not built yet. It needs the `vantagepointcleaning` GHL sub-account first. Build `/lead` first:
Flow 1's Stage 1 capture (plan D1) upserts the contact, adds the `website-lead` tag and returns
the contact ID. Add the Estates endpoints after launch (D2), following
`vpos/residential/docs/estate-lead-gate-and-worker-spec.md`. Build it as `worker/` in this repo,
copying the layout of `vpfs-website/worker/` (wrangler.toml with its own `GHL_LOCATION_ID`,
the `GHL_API_KEY` secret, `deploy-worker.yml` gated on tests) and `vpfs-website/docs/WORKER.md` §8
for the setup order. Don't share a Worker, token or secret with VPFS.

## Troubleshooting

See `vpfs-website/docs/DEPLOYMENT.md` → Troubleshooting. Every problem listed there also applies
here, most of all the GoDaddy leftovers, the `_spfm` SPF include, CAA records blocking Let's
Encrypt, and "No Cloudflare zone found" while nameservers are still pending.
