# Operating knowledge — Vantage Point Cleaning website

The VPC counterpart of `vpfs-website/docs/KNOWLEDGE.md`. It records what's live, what isn't, and
which lessons from the VPFS build apply here. Read it before touching DNS, GHL, or a Worker.

| Need | Go to |
|---|---|
| Domain cutover (GoDaddy → Cloudflare → GitHub Pages), email-safe | [`DEPLOYMENT.md`](DEPLOYMENT.md) |
| DNS zone file and sync script | [`../dns/README.md`](../dns/README.md) |
| Estates Worker spec (`/capture`, `/gate`, `/enrich`) | `vpos` → `residential/docs/specs/estate-lead-gate-and-worker-spec.md` |
| GHL build (fields, tags, pipelines, calendars, workflows) | `vpos` → `residential/integrations/gohighlevel/KNOWLEDGE.md` |
| Full step-by-step build plan | `vpos` → `residential/docs/playbooks/vpc-quick-scale-build-plan.md` |
| The VPFS original of every pattern here | `vpfs-website/docs/` (ARCHITECTURE, WORKER, KNOWLEDGE) |

## 1. Where things live

| Thing | Value |
|---|---|
| Canonical site | `https://www.vantagepointcleaning.com.au` — **not live yet** (GoDaddy page today) |
| DNS | GoDaddy today → Cloudflare after cutover; desired state in `dns/zones/` |
| Email | Google Workspace MX live; SPF must be fixed during cutover; no DKIM |
| GHL sub-account | `vantagepointcleaning` — **not created**; location ID `—` |
| Worker | `worker.vantagepointcleaning.com.au` (`vpc-lead-worker`) — **not built**. `/lead` comes first (Flow 1, D1). `/capture`, `/gate` and `/enrich` for Estates come after launch (D2) |
| Phone | VPC Number A (07, voice) / Number B (04, SMS) — **not purchased** |
| Legal pages | `site/privacy.html` (Privacy Policy and collection notice) and `site/terms.html` (residential T&Cs, **interim v1.0**) — linked from every page footer |
| Secrets | `CLOUDFLARE_API_TOKEN` (repo) now; later `CLOUDFLARE_WORKER_API_TOKEN` (repo), `GHL_API_KEY` (Worker) |

### Before switch-over

- **Lawpath must review the residential T&Cs** (`site/terms.html`, interim v1.0) before the domain
  is pointed at this site.
- **The phone number goes into `terms.html` and `privacy.html`** with the VPC Number A swap.

### Where the business docs live

The business docs are no longer copied into this repo. They live in `vpos`:

| Former `docs/` file | `vpos` path |
|---|---|
| `volume-1-business-plan-and-growth-strategy.md` … `volume-5-hr-training-and-employee-handbook.md` | `residential/docs/plan/` |
| `tech-stack-execution-plan-and-mvp-checklist.md` | `residential/docs/plan/` |
| `residential-package-and-pricing-model.md` | `residential/docs/specs/` |
| `scope-and-variance-protection.md` | `residential/docs/specs/` |
| `landing-page-content-brief.md` | `residential/docs/specs/` |
| `residential-operating-system-audit.md` | `residential/docs/research/` |
| `residential-direct-competitor-market-analysis.md` | `residential/docs/research/` |

## 2. Lessons from VPFS that apply unchanged

- **GoDaddy leftovers hijack the apex.** Always dry-run `sync-dns.mjs --prune` and read DELETE.
- **The `_spfm` SPF include breaks when DNS leaves GoDaddy.** The zone file already has the
  fix.
- **A TXT value change plans as CREATE + DELETE**, so apply it with `--prune`, or two SPF
  records stay live.
- **The zone file must list every live record, email included,** before `--prune`.
- **GitHub Pages caches for 10 minutes.** Port `vpfs-website/site/scripts/cache-bust.mjs` and
  its deploy step before the site has any JS that must stay in sync with a Worker.
- **Two-step forms:** never put `required` on a hidden Step 2 field. Use `aria-required` and
  validate in JS (`vpfs-website/site/test/page-forms.test.js` guards this).
- **GHL silently drops unknown field keys and options.** Only the contact record proves a
  write worked.
- **Create contacts with `POST /contacts/upsert` + `locationId`**, and add tags through
  `POST /contacts/{id}/tags`. Tag Added fires once per contact.
- **Inbound Webhook triggers are premium (per run) and can't return a contact ID.** That's why
  Flow 1's Stage 1 posts to this repo's Worker `/lead` (decided 2026-09-30, plan D1), the same
  pattern VPFS uses.
- **The Worker secret is named exactly `GHL_API_KEY`**. A `401 Invalid JWT` means it's
  missing or wrong. Private Integration tokens are created inside the sub-account.
- **Test with marker contacts** ("Claude Test Lead - delete me",
  `blake+claude-test-<n>@…`, `0491 570 006`) and delete them afterwards.

## 3. Differences from VPFS

- There's **no second domain** to redirect. `vantagepointcleaning.com` belongs to someone else.
- The site is **brand-separate.** It must never reference a VPFS number, calendar, pipeline,
  Worker or GHL ID.
- **Flow 1 quotes instantly** (GHL survey Math Calculation). VPFS never quotes. **Flow 2 (Estates)**
  mirrors the VPFS `/gate` pattern with its own rules (under $2,000/visit, less than monthly, or
  out of zone → nurture).
