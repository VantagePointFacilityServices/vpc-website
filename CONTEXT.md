# CONTEXT — Vantage Point Cleaning (Residential)

Shared vocabulary for the residential operating system (`docs/volume-1` … `volume-5`), its companion documents, and the website in `site/`.

Three terms in the original suite carried two meanings each, and most of the cross-document contradictions found in the August 2026 audit trace back to that overloading. The definitions below are now authoritative. Where a volume disagrees, the volume is wrong.

---

## The two axes

The suite describes the business along two independent axes that were previously conflated. **Who is buying** is a segment. **What gets delivered** is a package or service standard. They are not the same list and do not map one-to-one.

### Segment — a buyer type, one landing page each

A segment is defined by who the buyer is, what alternatives they are comparing against, and what proof converts them. Each segment gets its own landing page, its own CTA, its own nurture track, and its own GHL tag. Segments are the unit that launch phasing gates on (Vol 1 §2.2a).

| Segment | GHL tag | Buyer | Launch status |
|---|---|---|---|
| **Home Care** | `home-care` | Time-poor professionals and families, Zones 1–5 | Live at launch — sells the Essential, Signature and Reserve packages |
| **Luxury Homes** | `luxury-homes` | Higher-ticket homeowners, larger properties — Zones 2, 4, 5 | Built, gated until 20 active Home Care plans |
| **Estates** | `estates` | Dedicated-team properties; compared against estate managers, not cleaners | Gated further — after Luxury Homes is proven |
| **Turnover** | `turnover-pm` | Premium property/holiday-let management companies — never individual hosts | Gated further — after Luxury Homes is proven |

### Package and service standard — one CLN SOP each

A **package** is a published, instant-quoted, flat-rate level of the Home Care segment: Essential, Signature or Reserve Home Care. A **service standard** is what the crew actually does in the home, and each has one CLN SOP that checklists and crew training attach to. **Estate Care is a service standard but not a package**: it is walkthrough-quoted and sits outside the package ladder.

| Package / service | SOP | Scope |
|---|---|---|
| **Essential Home Care** (package) | CLN-21 | Kitchen (incl. microwave interior), bathrooms, floors, dusting, surfaces, beds made, bins, high-touch areas, same cleaner or team, inspection and before-and-after photos |
| **Signature Home Care** (package) | CLN-22 | Essential plus linen changed (client-supplied), one laundry load, interior glass at reachable height, detailed kitchen, one rotational deep-clean task per visit, consumable monitoring, priority booking window |
| **Reserve Home Care** (package) | CLN-24 | Signature plus two rotational tasks per visit, up to two laundry loads, detailed bathrooms every visit, 48-hour priority reschedule guarantee. No Supervisor element |
| **Estate Care** (service, not a package) | CLN-23 | Dedicated team, detailed program, rotational maintenance, priority scheduling, supervisor inspection, concierge communication |
| **Turnover** | CLN-14 | Turnover scope contracted with the property manager — not self-declared per visit |

### How they map

Segments sell packages and services. The relationship is many-to-many, which is exactly why they need separate names:

- **Home Care** segment sells the Essential, Signature and Reserve packages.
- **Luxury Homes** segment sells Signature or Reserve, at higher touch and higher scope.
- **Estates** segment sells Estate Care, a separate walkthrough-only service.
- **Turnover** segment sells the Turnover service.

> **Naming trap:** "Home Care" alone is ambiguous — it is both a segment and the family name shared by three packages. Always qualify: *the Home Care segment* or *the Essential/Signature/Reserve packages*. Likewise **Estate Care** is the service; **Estates** is the segment. Estate Care is never called a package or a "tier" in the ladder, and is never presented as a step above Reserve. `site/estate-care.html` is the Estates *segment* page, named after the tier — a legacy filename, not a second meaning.

---

## Commercial units

The original Vol 1 §9.2 used **contract** to mean three different things — one client, one subcontractor's weekly workload, and one recurring agreement — which made its economics unresolvable. "Contract" is commercial-suite language and is **retired from the residential suite**.

| Term | Definition |
|---|---|
| **Customer** | A household or entity in a commercial relationship with Vantage Point. Holds one or more plans. The unit the 20-customer gate counts. |
| **Plan** | One recurring agreement: one customer, one property, one package, one frequency. The unit MRR sums over. Replaces "contract" everywhere in the residential suite. |
| **Plan value** | The monthly revenue of a single plan. Always monthly, never per-visit. Replaces "contract value". |
| **Visit** (or **clean**) | One service delivery at one property. The unit crews are scheduled against and per-visit pricing is quoted in. |
| **Frequency** | Weekly (4.33 visits/month) or fortnightly (2.17 visits/month). Plan value = per-visit price × visits per month. |

**Worked example:** a Signature plan at $420/visit, fortnightly, is a plan value of $911/month ($420 × 2.17). One customer, one plan, 26 visits a year.

---

## Pricing vocabulary

| Term | Definition |
|---|---|
| **Pricing band** | Internal reference range in Vol 1 §2.6 — Premium $300–500+, Luxury $600–1,500+, Estate $1,500–3,000+. Per visit. Superseded as the operative pricing reference by the published ladder; retained for internal sanity-checking only. |
| **Assessment** | The in-home visit that produces a scope record and a price. Required for Estate Care only; Essential, Signature and Reserve are instant quoted. Customer-facing name: *Private Home Care Assessment*. |
| **Proposal** | The scope- and value-based document issued after an Estate Care walkthrough. |
| **Package price** | The published flat rate for a declared property configuration. Binding for the declared scope, subject to the variance clause. |
| **Increment** | A published add-on price for a room or feature beyond the base configuration. |
| **Minimum job price** | $199. Below ~1.5 hours a job cannot carry its own travel and setup. |

### The pricing decision (August 2026, revised)

**Essential, Signature and Reserve are sold as published flat-rate packages with instant quoting. Estate Care is not instant quoted** — it is reached through a paid walkthrough ($100, credited on booking) and custom quotes from $2,000 per visit. Pricing is per visit and uniform across all five zones.

Full ladder, room model, increments and bounded inclusions: `docs/residential-package-and-pricing-model.md`. **Price per hour = $65 loaded labour cost × 2 = $130, GST-inclusive** (so a 2-hour job is $260); the $65 is the cost cap, not a price. Pay bands, the cost model, weekend rates and the subcontractor policy live in the vpos doc `residential-pay-and-workforce-model.md`; the research behind the three-package ladder and the Reserve name is in `residential-tier-structure-market-research.md`.

**This revises an earlier decision in the same month.** The audit first resolved the suite to *assessment-first, no price shown*, on the evidence that instant online pricing is a Value-quadrant signal (`residential-direct-competitor-market-analysis.md`, Positioning Axis) and that no premium competitor in Zones 1–5 publishes pricing. That evidence still stands; the commercial decision changed. Audit finding S2 is retained and marked superseded rather than deleted.

Two things follow, and both matter:

- **Self-declared scope is the pricing basis.** A price is issued before anyone visits, so OPS-16 governs *declared-scope* variance and the mandatory timestamped T&Cs acknowledgement sits at form submission.
- **The price does not carry the positioning.** At $379 the 3-bed/2-bath is 1.20× the verified market ceiling; the 4-bed at $419 is 1.02×. These are top-of-band prices, not obviously-premium ones. The bounded inclusions, the same-cleaner promise and the SafetyCulture record carry the premium claim instead.

The CTA remains **"Request Your Private Home Care Assessment"** for Estate Care. Essential, Signature and Reserve lead with the price and a booking; **Signature is shown as "Recommended"** (never "Most popular", which can't be substantiated at launch).

---

## Gates

Two independent gates control launch breadth. They are not the same gate and neither implies the other.

| Gate | Question | Threshold |
|---|---|---|
| **Segment gate** (Vol 1 §2.2a) | Which segment pages are live and marketed? | 20 customers holding an active recurring Home Care plan → Luxury Homes opens. Luxury Homes proven → Estates and Turnover open. |
| **Paid-marketing gate** (tech-stack plan, Phase 10) | Are we spending on ads at all? | Automation proven on real leads **and** at least one customer acquired through zero-cost channels. |

A brand can clear the marketing gate and still be running Home Care-only scope for months.

---

## Roles

Every role in Vol 2 §2 activates on a delegation trigger, not a date. Until a role activates, its SOPs are owned by an **interim owner** — in practice the CEO, sometimes the VA or bookkeeper. Roles referenced before activation: Cleaning Supervisor, Operations Manager, Sales Manager, Marketing Manager, HR Lead, Finance Lead, Quality Assurance Supervisor, General Manager.

| Term | Definition |
|---|---|
| **Interim owner** | Who holds an SOP before its end-state role is hired. Must be named on every SOP — the audit found QUA, PAY, CLN, VEH and EQP had none. |
| **Subcontractor** | Independent business under a subcontractor agreement. Own ABN, equipment, insurance. **A time-boxed stopgap only** (90 days, Essential visits, one-offs and overflow, when no employee can be rostered) — **not the launch workforce.** Paid a per-job fee of hours × $50. Policy: `residential-pay-and-workforce-model.md`. |
| **Employee** | Direct hire under the Cleaning Services Award 2020 (MA000022). **Casual employees are the launch workforce**, converting to part-time and full-time as hours are proven; pay bands are Award-aligned (about +20% for casual and full-time). |

> **Open risk, not a definition:** Vol 2 §2.12 requires subcontractors to retain a right to delegate, while Vol 1 §2.3 and the website promise the same cleaner every visit. These cannot both hold. See the audit report — this needs employment-law advice, not a glossary entry.

---

## Zones

Service territory is five micro-territories (Vol 1 §2.7), worked for density rather than coverage. Zone 1 Burleigh/Miami/Mermaid/Broadbeach · Zone 2 Palm Beach/Tugun/Currumbin · Zone 3 Robina/Varsity Lakes/Mudgeeraba/Reedy Creek · Zone 4 Main Beach/Surfers Paradise/Bundall/Broadbeach Waters · Zone 5 Paradise Point/Runaway Bay/Hope Island/Sanctuary Cove.

---

## Document map

| Document | Authority over |
|---|---|
| `docs/volume-1-...` | Strategy, positioning, pricing bands, segment phasing, financial model |
| `docs/volume-2-...` | Org structure, SOP library, role activation triggers |
| `docs/volume-3-...` | Pipelines, funnels, forms, nurture automation |
| `docs/volume-4-...` | Technology stack, AIOS, **KPI definitions (§4)** |
| `docs/volume-5-...` | Employee handbook, induction, training, incentives |
| `docs/residential-direct-competitor-market-analysis.md` | Market structure and competitive positioning evidence |
| `docs/landing-page-content-brief.md` | Page-by-page copy direction |
| `docs/residential-package-and-pricing-model.md` | **Packages, prices, increments, bounded inclusions, quote logic** |
| vpos `residential/docs/residential-pay-and-workforce-model.md` | Award-aligned pay bands, cost model, weekend rates, workforce and subcontractor policy |
| vpos `residential/docs/residential-tier-structure-market-research.md` | Three-package and naming research, market rates |
| `docs/scope-and-variance-protection.md` | T&Cs variance clause and OPS-16 |
| `docs/tech-stack-execution-plan-and-mvp-checklist.md` | Build sequence and running costs (covers both brands) |
| `docs/residential-operating-system-audit.md` | August 2026 audit findings and open items |

**KPI definitions live in Volume 4 §4 only.** Four documents previously pointed at a KPI dashboard in Volume 1 (§8, §10, §11); it never existed there.
