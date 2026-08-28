# Vantage Point — Tech Stack Execution Plan & MVP Automation Checklist
## Instant Quotes & Bookings → CRM | Residential + Commercial | Cost-Minimised Build Sequence

---

## How to Use This Document
A chronological, checkbox-driven build plan to get both brands from zero to a working instant-quote/consultation-request → CRM → booking flow, at the lowest sustainable monthly cost, without spending on paid marketing before the tooling is proven and a first client is secured organically. Residential and commercial share almost the entire foundation layer — build that once, not twice — then diverge where the two brands' quoting models genuinely differ (residential is instant-price; commercial is consultation-request, per Volume 3 of each suite).

**The single biggest cost-saving decision in this plan:** Vantage Point Cleaning is a trading name of the same legal entity as Vantage Point Facility Services Pty Ltd (Commercial Volume 1, Section 2.9 / Residential Volume 1, Section 3.9) — it is **not** a separate company. That means most of the platform layer below should be **one subscription shared across both brands**, not two. Two GoHighLevel *sub-accounts* under one account (per the original combined-suite design), one Xero organisation with tracking categories per brand, one Google Workspace domain with brand-specific addresses. Only genuinely brand-specific things (the two websites/landing page sets, the two sets of ad campaigns) need to be built twice. This alone roughly halves the platform layer of the monthly running cost estimate below.

---

## Phase 0 — Legal & Financial Foundation (Week 0–1)
*Shared. Nothing below can legally trade without this. $0 in tooling spend yet.*

- [ ] Director ID obtained via ABRS
- [ ] Company registered (ACN), ABN obtained for Vantage Point Facility Services Pty Ltd
- [ ] "Vantage Point Cleaning" registered as a trading name against the same ABN
- [ ] GST registration lodged
- [ ] Dedicated business transaction account opened
- [ ] Xero account created (one organisation, not two) and linked to the business account
- [ ] Chart of accounts configured with tracking categories: `Commercial` / `Residential` — this is what lets one Xero subscription serve both brands with clean P&L separation
- [ ] Public liability insurance first instalment arranged
- [ ] Lawpath subscription started; core templates drafted: service agreements, employment/contractor agreements, privacy policy, Terms & Conditions (residential — include the Condition Variance clause from `docs/scope-and-variance-protection.md`, and the Privacy Policy / Collection Notice required by Volume 3, Section 5.8)

**Running cost at end of Phase 0:** Lawpath (~$99/month, shared) + insurance instalment. No CRM/website spend yet.

---

## Phase 1 — Shared Core Infrastructure (Week 1)
*Shared. Build once.*

- [ ] Domain(s) registered — two domains (one per brand), since the websites and positioning are fully separate even though the backend isn't
- [ ] One Google Workspace account created; brand-specific addresses/aliases set up under it (e.g. `hello@vantagepointcommercial.com.au`, `hello@vantagepointcleaning.com.au` can both route through one Workspace tenant if domains are added as secondary domains — check current Workspace domain-alias support before committing; if not supported cleanly, fall back to one paid seat per brand, which is still cheaper than two full separate tenants)
- [ ] MFA enabled on every account from day one (Google Workspace, Xero, GoHighLevel, Lawpath)
- [ ] GitHub repositories created (per the existing two-repo structure — `vantagepoint-commercial-aios`, `vantagepoint-cleaning-aios`), free tier
- [ ] SOP/document library pushed to each repo from the finalised Volume 1–5 suites

**Running cost at end of Phase 1:** Google Workspace entry tier (1–2 seats) + Lawpath. GitHub, GA4, Tag Manager, Search Console all remain $0.

---

## Phase 2 — CRM Foundation (Week 1–2)
*Shared platform, brand-separated configuration.*

- [ ] One GoHighLevel account created, **starter tier** (one subscription, not two)
- [ ] Two sub-accounts configured within it: `Vantage Point Commercial` and `Vantage Point Cleaning` — visually and operationally distinct (own pipeline logic, own tags, own automations) but billed once
- [ ] Core pipelines built (empty shells first, automation wired in Phase 7):
  - Residential: Residential, Dream 100, Referral, Recruitment, Supplier, Lost Opportunity, Renewal, Win-Back
  - Commercial: Commercial, Dream 100, Referral, Recruitment, Supplier, Lost Opportunity, Renewal, Win-Back, Community & Government, NDIS/Aged Care/Community Care
- [ ] Stripe account created — **one account**, not two (no monthly fee either way, so no cost saving from splitting, but one account simplifies reconciliation); statement descriptor and product naming differentiate brand per transaction
- [ ] Stripe connected to GoHighLevel and Xero

**Running cost at end of Phase 2:** GoHighLevel starter (~$170/month) + Phase 0–1 costs. Stripe remains $0 fixed (transaction-fee only).

---

## Phase 2a — Local Phone Numbers, AI Voice Agent & Website Chatbot (Week 2)
*Shared feature (GHL Agent Studio), brand-separated numbers and scripts. This is genuinely one of the highest-leverage items in this plan — build it early, not as an afterthought, since every day without it is a day after-hours leads go to voicemail. Leads contacted within five minutes are roughly 21× more likely to qualify than those left thirty, and 78% of buyers go with whichever business responds first (Lead Response Management Study; MIT/Harvard Business Review) — this phase is what captures that 78% instead of losing it.*

- [ ] Two local phone numbers provisioned within GoHighLevel (one per brand/sub-account) — a caller needs to hear the right brand name answer, even though the backend is shared
- [ ] GHL AI Voice Agent (Agent Studio) configured per brand:
  - [ ] Residential: greets as Vantage Point Cleaning; can run the Home Care instant-quote flow live (same fields as Volume 3, Section 5.1) and book the first clean directly if the caller accepts, capturing verbal T&Cs acknowledgement in the transcript
  - [ ] Commercial: greets as Vantage Point Commercial; qualifies the caller and books a Facility Consultation directly against live calendar availability — **never quotes a price on the call**, consistent with the consultation-first positioning (except the secondary instant-quote service lines, which may be quoted using existing published pricing)
- [ ] FAQ/pricing reference document uploaded per brand for the agent to draw on (residential: service tiers, T&Cs summary, zone coverage; commercial: target verticals, consultation process, published secondary-service pricing)
- [ ] Calendar connected live (GoHighLevel native calendar, same one used for walkthrough/consultation bookings elsewhere in this plan)
- [ ] Escalation rules configured per brand — trigger words (emergency, complaint, dispute, injury, urgent) transfer the call live to the CEO's/on-call mobile immediately, not queued
- [ ] Every call captures name, email, and mobile number at minimum and writes it straight into the CRM contact record, tagged, and routed into the sales/follow-up pipeline (Residential or Commercial, Volume 3 Section 2.1) with zero manual re-entry
- [ ] Full call transcript logged against every contact record
- [ ] Website chatbot (GHL Conversational AI) embedded on both websites, sharing the same FAQ/pricing knowledge base as its brand's Voice Agent — residential runs the instant-quote flow in chat; commercial books a consultation in chat, same pricing rule as the phone agent
- [ ] AI-05 (Advisory-Only Boundary Review, Volume 2 both suites) completed and signed off before either agent goes live — this is a deliberate, bounded exception to the advisory-only AIOS rule (booking within pre-approved rules only, no pricing discretion beyond published rates) and needs an explicit sign-off, not a silent assumption
- [ ] Both agents run in parallel with a human answering during business hours for at least one full week before being trusted to run unattended after-hours (Volume 4 AIOS activation rule, both suites)

**Running cost:** GHL Voice AI Agent Studio and local numbers are a paid add-on on top of the starter tier — **confirm current GoHighLevel pricing directly before committing**, since this is a recently added feature and per-minute/per-agent pricing may still be evolving. Budget for this explicitly rather than assuming it's included in the starter tier already accounted for in Phase 2.

---

## Phase 3 — Residential MVP: Instant Quote Engine (Week 2–4)
*Residential-specific. This is the highest-priority build item for this brand — it's the core product mechanism. **Launch scope is Home Care only (Volume 1, Section 2.2a)** — build all four pages now to avoid a second build cycle, but publish and market Home Care alone until 20 recurring Home Care customers are reached.*

- [ ] Home Care landing page — **already built** at `site/index.html` and `site/signature-home-care.html`, with the correct short assessment-request form (Volume 3, Section 5.1). Remaining work: wire the form to GoHighLevel, replace the placeholder phone number, and publish a real Privacy Policy. **Published and marketed at launch**
- [ ] Instant-quote logic built in GoHighLevel — a **lookup against the published ladder**, not a calculation engine (`docs/residential-package-and-pricing-model.md`). Ten base configurations per tier plus twelve fixed increments; a workflow/table, not custom development, so it stays inside the starter-tier workflow builder. **No discretion, no derived prices**: configurations outside the ladder return no price and route to a human.
- [ ] Luxury Homes landing page built with the same assessment-request form, higher-touch framing, no dual-path pricing choice (Volume 3, Section 4.2) — **build now, keep unpublished/unlinked until the 20-plan gate clears**
- [ ] Assessment booking calendar configured (GoHighLevel native calendar — no separate booking tool at MVP; **not** Connecteam, which handles crew scheduling only) — **needed at launch for Home Care**, not just Luxury Homes
- [ ] Estates landing page built — enquiry form only, routes to CEO/Sales Manager task queue, no instant pricing (by design) — **build now, keep unpublished until Phase 3 of Vol.1 §2.2a (after Luxury Homes is proven)**
- [ ] Turnover (property manager) landing page built — company/portfolio-focused form, manual qualification, no automation on submit — **build now, keep unpublished until the same later gate**
- [ ] T&Cs acknowledgement captured at **quote form submission**, timestamped, logged against the booking, and **blocking** — this is the moment the scope-variance clause becomes operative (`docs/scope-and-variance-protection.md`)
- [ ] **Privacy Collection Notice on every public form, and a real Privacy Policy published** (Volume 3, Section 5.8) — currently `href="#"` on the live site. Blocking for go-live.
- [ ] OPS-16 on-site scope variance workflow documented in Connecteam (even before Connecteam is paid-tier, the free tier supports this — see Phase 5)
- [ ] Active recurring Home Care **plan** counter added to the executive dashboard (Volume 4, Section 4) as its own tracked figure — this gates the remaining three segment pages, so it must be visible, not inferred from MRR
- [ ] **Churn measurement in place from Month 3** (Volume 4, Section 4, Retention panel) — Volume 1 §10.2 runs on a 5% assumption that swings Year 1 revenue by 30% across its plausible range

**Running cost:** no new subscription — this phase is built inside the GoHighLevel starter tier already active from Phase 2.

---

## Phase 4 — Commercial MVP: Consultation-Request Funnel (Week 2–4, parallel to Phase 3)
*Commercial-specific. Note the model is deliberately different from residential — the primary CTA is "Request a Facility Consultation," not an instant price (Commercial Volume 1, Section 2.8; Commercial Volume 3, Section 4.1), consistent with the boutique/value positioning. True instant quoting is limited to the secondary service-line pages. **Launch scope is six simple/office-type verticals only (Commercial Volume 1, Section 2.7a)** — build all ten primary pages now, but publish and market only the Phase 1 six until 5 contracts are signed.*

- [ ] Six Phase 1 vertical landing pages built and **published/marketed at launch** (Volume 3, Section 4.1): Professional Offices, Corporate Offices, Law & Accounting Firms, Financial Services, Premium Retail, High-End Body Corporate/Strata (common-area scope only) — all sharing the Commercial Quote Request Form (Section 5.1) and the "Request a Facility Consultation" CTA
- [ ] Four Phase 2 vertical landing pages built, **kept unpublished/unlinked** until the 5-contract gate clears: Medical & Specialist Clinics, Dental Practices, Gyms & Wellness Facilities, Boutique Hospitality
- [ ] Consultation booking calendar link configured (GoHighLevel native calendar)
- [ ] Secondary/opportunistic vertical pages built (Section 4.2) — the only pages on the commercial site that carry a genuine "Instant Quote" CTA (carpet, pressure, solar, window cleaning) — these are simple-scope and can launch alongside Phase 1
- [ ] NDIS/Aged Care/Community Care intake form built separately, **kept unpublished** until the same 5-contract gate clears (compliance-gated per COM-13, and requires the enhanced-hygiene/care-sector training deferred under Commercial Volume 1, Section 2.7a)
- [ ] Community & Government pipeline enquiry path built (manual/relationship-led, no automated form-to-quote path) — lower priority than the six Phase 1 verticals; can proceed in parallel if capacity allows, but not required for MVP go-live
- [ ] Signed-contract counter added to the executive dashboard (Volume 4, Section 4) as its own tracked figure, separate from MRR — this is what actually gates the four Phase 2 vertical pages and the NDIS/Aged Care pipeline going live

**Running cost:** no new subscription — built inside the same GoHighLevel starter tier.

---

## Phase 5 — Booking, Scheduling & Field Ops Minimum Layer (Week 3–4)
*Shared platform, brand-separated schedules.*

- [ ] Connecteam account created — **free tier**, sufficient at launch team size for both brands (confirm current free-tier seat limit before assuming this covers both brands' initial crews; if not, this is the first likely upgrade trigger)
- [ ] GoHighLevel dispatch pipeline connected to Connecteam scheduling
- [ ] Recurring clean scheduling workflow built (OPS-02 equivalent for each brand)
- [ ] Access/site requirements intake wired for commercial (Section 5.3/5.4 forms) and home-access notes for residential

**Running cost at end of Phase 5:** still within Phase 0–2 totals — Connecteam free tier adds $0.

---

## Phase 6 — Payments & Invoicing Integration (Week 3–4)
*Shared platform.*

- [ ] Stripe-hosted payment fields embedded in residential booking flow (Payment Secured stage) — card data never touches GoHighLevel/Xero directly (PCI compliance, both suites Section 5.2/5.3)
- [ ] Stripe ↔ Xero reconciliation connection tested
- [ ] Commercial billing workflow built — invoice generation triggered on job completion (FIN-01 in both suites), 14–30 day terms for commercial, immediate/recurring-date billing for residential
- [ ] Overdue-invoice follow-up automation built (FIN-02 in both suites)

**Running cost:** no new subscription — Xero and Stripe already active.

---

## Phase 7 — Automation Wiring: Pipelines, Tags, Nurture (Week 4–5)
*The step that turns the empty pipeline shells from Phase 2 into the actual "lead → CRM → booking" automation this whole plan exists to build.*

- [ ] Auto-reply SMS/email wired to every form (both brands) — under 60 seconds from submission
- [ ] Lead scoring/tagging wired per segment (residential: `home-care` / `luxury-homes` / `estates` / `turnover-pm`; commercial: per-vertical tags plus manual-quote flagging for Non-Standard Requests)
- [ ] Pre-visit/pre-clean reminder sequences built (24h + 2h SMS, both brands)
- [ ] 3Rs review-generation automation built (both brands) — positive responses to public review request, negative routed privately
- [ ] Commercial-specific: Account Manager introduction step wired into onboarding (Volume 3, Section 3.1); quarterly service review (SAL-11) auto-scheduling; OPS-18 24/7 issue acknowledgement automation
- [ ] Residential-specific: recurring-plan upsell offer (7 days post one-off clean); anniversary/loyalty touch; satisfaction dip detection task creation
- [ ] Lost Opportunity, Renewal, and Win-Back pipeline automations built for both brands

**Running cost:** no new subscription.

---

## Phase 8 — QA/Compliance Minimum Layer (Week 4–5)
*Shared platform, brand-separated checklists. Lower priority than the quote/booking flow above for a pure MVP, but required before the first real job runs.*

- [ ] SafetyCulture account created — **free tier**
- [ ] Site/home inspection checklist templates built for **launch-scope services only**: residential Essential/Signature (CLN-21/22); commercial CLN-01 Standard Commercial Office Clean. Enhanced-hygiene templates (residential Estate Care CLN-23; commercial CLN-06 medical/dental) are built later, alongside their respective phase gates clearing — building them now is wasted effort if the gate takes months to reach
- [ ] SafetyCulture ↔ Connecteam integration confirmed
- [ ] Subcontractor compliance register set up in GoHighLevel/Connecteam (COM-02 both suites) — Certificate of Currency, ABN, Subcontractor Agreement, police check, with expiry-tracking reminders
- [ ] NDIS/Aged Care COM-13 register (Worker Screening Check, Aged Care Worker Screening) is **not required at MVP launch** — deferred alongside the NDIS/Aged Care pipeline itself (Volume 1, Section 9) until the commercial 5-contract gate clears

**Running cost:** no new subscription — SafetyCulture free tier.

---

## Phase 9 — Pre-Launch Testing & Go-Live Checklist (Week 5–6)
*Shared discipline, run separately per brand.*

- [ ] Submit a test lead through every landing page (both brands) and confirm: auto-reply timing, correct tag applied, correct pipeline stage, correct owner assigned
- [ ] Test the instant quoter against all 10 base configurations and a sample of increment combinations; confirm every returned price matches the published ladder exactly, that base-plus-increment paths reconcile within $5, and that no configuration falls below the $65/labour-hour floor
- [ ] Test the OPS-16 scope-variance conversation flow end-to-end (simulate a variance, confirm the $100/hour and fixed-price-priority-order options both function operationally, not just in the T&Cs text)
- [ ] Confirm the T&Cs acknowledgement checkbox is mandatory, timestamped, and logged against the booking record — not just present, but actually blocking submission if unchecked
- [ ] Test Stripe payment flow end-to-end with a real (small) transaction
- [ ] Test the commercial consultation-booking calendar link and confirm CEO calendar availability is genuinely current before go-live (Volume 1, Section 4 — CEO owns this personally pre-Account Manager hire)
- [ ] Call both brand phone numbers from outside business hours and confirm the Voice Agent answers, correctly identifies the brand, and behaves as scripted — do this test personally, don't rely on a colleague's report
- [ ] Test the residential Voice Agent/chatbot end-to-end: confirm it books an assessment that lands correctly in the CRM and calendar, and — critically — **try hard to make it quote a price, and confirm the guardrail holds** (Volume 4 §2.5a). This is the same adversarial test the commercial agent gets below.
- [ ] Test the commercial Voice Agent/chatbot end-to-end: confirm it books a Facility Consultation correctly and, critically, confirm it does **not** quote a price under any conversational pressure — try to get it to quote and verify the guardrail holds
- [ ] Test every configured escalation trigger word on both agents and confirm the live transfer actually reaches the CEO's/on-call mobile, not just a notification
- [ ] Confirm MFA is active on every platform (Section 5.3 IT Governance, both Volume 4 suites)
- [ ] Confirm backup exports are scheduled (Section 5.2 IT Governance, both suites) — quarterly at minimum, even at MVP stage

---

## Phase 10 — Launch Sequencing: Manual-First, Paid-Marketing-Last (Week 6+)
*This is the strategy section, not a build step — how running costs and client acquisition are deliberately sequenced against each other.*

- [ ] **Do not activate paid marketing spend yet.** Both brands' own Volume 1 documents already establish this sequencing (Residential Section 11.1: "land the Month 1 contract through the warm-network and Dream 100 channels before spending on paid marketing"). The tooling above should be proven on warm-network leads first.
- [ ] Commercial: work the Dream 100 list (strata/real estate managers, luxury property managers) and direct outreach to target-vertical businesses personally, using the now-live consultation booking flow, before any Google Ads spend
- [ ] Residential: work Phase 0 (warm launch — family/friends/existing network) through the now-live instant-quote flow, generating the first reviews and case-study-quality service delivery before paid acquisition begins (Residential Volume 1, Section 7.1)
- [ ] Confirm the automation actually holds up under 5–10 real (not test) leads per brand before turning on paid channels — this is the real go-live gate, not a calendar date

---

## Cost vs. Revenue Bridge — Balancing Running Costs with Client Acquisition

### Minimum Viable Monthly Running Cost (Both Brands, Shared Platform)
| Item | Monthly cost | Notes |
|---|---|---|
| Google Workspace | ~$15–20/seat | 1–2 seats at launch |
| GoHighLevel (starter, shared across both brands) | ~$170 | One subscription serving both sub-accounts |
| GHL AI Voice Agent (Agent Studio) + 2 local numbers | **Confirm current pricing directly with GoHighLevel** | Recently added feature; likely per-minute/per-agent, not a flat add-on — do not assume this is covered by the starter tier above |
| Xero (entry tier, one organisation) | ~$30–65 | Tracking categories separate the two brands' P&L |
| Lawpath | ~$99 (first month, drops after) | Legal templates |
| Connecteam | $0 | Free tier at launch team size |
| SafetyCulture | $0 | Free tier at launch volume |
| GitHub, GA4, Tag Manager, Search Console | $0 | Free tiers throughout |
| Stripe | $0 fixed | Transaction-fee only |
| **Total shared platform cost** | **~$300–450/month + Voice Agent usage cost** | Materially below the ~$600–1,400/month it would cost to run two fully separate stacks, even after adding the Voice Agent line |

This is lower than either brand's own Volume 4 estimate of $300–700/month **individually** even before the Voice Agent is added, because the platform layer is shared rather than duplicated — the saving is real and compounds every month. **The Voice Agent's usage-based cost is the one line in this table that can't be estimated confidently without current GoHighLevel pricing** — treat it as a known unknown to resolve in Phase 2a, not a rounding error to ignore. Given the 78%-first-responder statistic above, this is very likely worth the spend regardless of the exact number, but it should be a deliberate decision made with real pricing in hand, not an assumption.

### The Sequencing Rule
Running cost is fixed and starts accruing from Phase 2 onward, regardless of revenue. Client acquisition should **not** wait for a "fully polished" launch, but paid marketing spend should wait for two things to both be true:
1. **The automation has been proven** on real (not test) leads — Phase 9's testing catches build errors, but only real leads catch the errors testing can't (a customer entering scope information differently than expected, a pricing edge case, a booking-flow drop-off point).
2. **At least one client has been acquired through zero-cost channels** (warm network, Dream 100, direct outreach) — this is both a cash-flow discipline and a proof-of-concept discipline: if the boutique/premium positioning and instant-quote mechanism can't convert a warm lead, paid traffic won't fix that, it will just make the problem more expensive.

### Segment Gates — a Second Layer of Sequencing, on Top of the Marketing Gate
Both brands now carry an explicit scope gate in addition to the paid-marketing gate above (Residential Volume 1, Section 2.2a; Commercial Volume 1, Section 2.7a). These are not the same gate:
- **The paid-marketing gate** (Phase 10 above) asks *"has the flow been proven on any real lead, and is at least one client already signed?"* — it governs when to spend on ads at all.
- **The segment gate** asks *"which pages, service standards, and training are live right now?"* — it governs breadth, independently of whether marketing is paid or organic. A brand can clear the marketing gate and still be running Phase 1-only scope for months while the segment gate is worked toward.
- **Residential:** Home Care only, until 20 recurring Home Care customers. Luxury Homes, Estates, and Turnover are built (Phase 3 above) but stay dark.
- **Commercial:** six simple/office-type verticals only, until 5 signed contracts. Medical, Dental, Gyms & Wellness, Boutique Hospitality, and the entire NDIS/Aged Care/Community Care pipeline are built (Phase 4, Phase 8 above) but stay dark.
- **Why this matters for running cost specifically:** the segment gate is what keeps Phase 8's QA/training build lean — writing and training crew against CLN-06 (enhanced hygiene) or CLN-23 (Estate Care) before there's a client needing them is pure sunk cost with no revenue attached. Deferring that build to when the gate clears is itself a cost-minimisation decision, not just a go-to-market one.

### Break-Even Framing
Using each brand's own established figures:
- **Commercial:** a single client at the low end of the target range (~$2,000/month, Volume 1 Section 2.7) covers roughly 4–7× the shared monthly platform cost on its own. Even one signed account from the Dream 100/direct-outreach phase (Phase 10) puts the tech stack solidly in the black before any paid marketing is switched on.
- **Residential:** the Month 1 target is a single subcontractor booked at 3–5 cleans/week (Volume 1, Section 9.2), with contract value from $1,000/month (stated floor) up to $3,000–5,000/month (ideal). Even the stated floor scenario covers the shared platform cost within the first 1–2 signed clients.

In both cases, the shared-stack cost-minimisation in this plan means **breakeven arrives before paid marketing is even switched on** — the tooling pays for itself on organic/warm-network clients alone, which is exactly the validation Phase 10 requires before spending on ads.

### Funding the Next Layer — Upgrade Triggers, Not Defaults
Every platform's upgrade trigger (both Volume 4 suites, Section 2) is a specific, checkable condition, never "when we can afford it." As revenue arrives, it moves through each brand's own profit-allocation waterfall (residential: Volume 2, FIN-03) — GST/tax set-aside, subcontractor payments, operating expenses, **then** the 15–20% marketing reinvestment. The tech stack's own upgrades sit inside "operating expenses," ahead of marketing spend, and are triggered by usage hitting a ceiling, not a revenue milestone:

| Trigger | What upgrades |
|---|---|
| GoHighLevel contact volume/automation complexity exceeds starter tier, or either sub-account needs dedicated workflow capacity | GoHighLevel tier |
| Connecteam headcount or feature need (e.g. GPS geofencing) exceeds free tier | Connecteam paid tier |
| SafetyCulture inspection volume or client-facing automated reporting need exceeds free tier | SafetyCulture paid tier |
| First direct employee hire (either brand) | Employment Hero adopted |
| Xero payroll employee-count or transaction volume exceeds entry tier | Xero tier |

Only once the MVP flow above is live, tested on real leads, and has produced at least one paying client per brand should Phase 10's paid-marketing gate be opened — at which point the 15–20% marketing reinvestment band (funded from actual profit, not launch capital) becomes the growth lever, not the tech stack itself.
