# Residential Operating System — Contradiction & Soundness Audit
**Date:** August 2026 · **Scope:** Volumes 1–5, the four companion documents, and the website in `site/`
**Method:** full read of all nine documents, cross-reference resolution, and independent re-computation of every figure in the financial model

---

## Verdict

**The core thesis is sound. The seams between documents are not.**

The strategic foundation holds up under scrutiny. `residential-direct-competitor-market-analysis.md` is the strongest document in the suite — specific, sourced, honest about the difference between confirmed facts and marketing claims — and it identifies a real, verified gap: the Premium price / Specialised structure quadrant is occupied by only three competitors across all five zones, none of whom publish any form of verifiable quality data. The SafetyCulture inspection differentiator is genuine and defensible. The zone-density strategy is well-reasoned. The 20-customer segment gate is unusually well-designed, being an operational proof point rather than a revenue milestone, with a stated rationale for the threshold.

The problems sit between the documents. The volumes were evidently derived from a shared commercial/residential framework and then edited independently, so they now disagree with each other on three things that matter: **the product's central mechanism**, **Year 1's economics**, and **who does the work at launch**.

Nothing found here invalidates the business. Several things found here would have caused real damage if built as written.

| Severity | Count | Character |
|---|---|---|
| Strategic | 4 | Would misdirect the business if acted on |
| Launch-blocking | 3 | Work cannot start without resolving |
| Compliance | 3 | Require professional advice |
| Contradiction | 11 | Documents disagree; an implementer must guess |
| Unsupported | 3 | Asserted without basis |

---

# 1. Strategic findings

## S1 — Year 1's revenue target is unreachable under Year 1's own segment restriction

**Severity: critical.** This is a closed logical loop between three sections of Volume 1.

- §10.3 states the $250,000 Year 1 target "depends on contract value tracking near the High scenario" — **$3,500/month** average.
- §2.6 sets the Premium band at **$300–500+ per visit**.
- $3,500/month at weekly cadence (4.333 visits) implies **$808 per visit**. That is not the Premium band. It is squarely inside §2.6's **Luxury** band ($600–1,500+).
- §2.2a **defers Luxury Homes until 20 recurring Home Care customers**, and §10.1 places that gate in **Year 2**.

**Year 1 is required to hit a number that only Year 2's product line can produce.**

The Mid scenario fails for the same reason, less obviously: $2,000/month implies $462/visit **weekly, for every customer**. §2.3 sells Essential and Signature as "weekly/fortnightly." Any fortnightly customers at all and the Mid case is out of reach too.

Modelled properly — Home Care pricing, a realistic frequency mix, and a stated churn rate — Year 1 lands as follows:

| Scenario | Per visit | Weekly mix | Plan value | Year 1 revenue | Net profit | Margin |
|---|---|---|---|---|---|---|
| Conservative | $300 | 30% | $845/mo | **$75,494** | $22,757 | 30.1% |
| Planning case | $380 | 50% | $1,235/mo | **$110,332** | $36,082 | 32.7% |
| Upside | $450 | 70% | $1,657/mo | **$148,072** | $50,518 | 34.1% |

*(Acquisition at the §9.2 pace improved to 1.5 new plans/month from Month 6; 5% monthly churn; the cost structure as it stood at audit time — 50% subcontractor split, 5% supplies, $600/month fixed, 15% marketing reinvestment.)*

> **Net-profit figures above are superseded.** The workforce model later moved from a 50% profit split to a $50/hour cleaner rate, taking labour to 38.5% of revenue. Revenue and margin percentages in Vol 1 §10.2 are the current figures — planning case net is now **$46,903 at 42.5%**, not $36,082 at 32.7%. The revenue analysis and the S1 finding itself are unaffected.

**What $250,000 would actually take.** Not a stretch of the current plan — a different plan:

| New plans/month | Conservative | Planning | Upside |
|---|---|---|---|
| 1.5 (current) | $75k | $110k | $148k |
| 3.0 | $106k | $155k | $208k |
| **4.5** | $151k | $221k | **$268k** |

$250,000 requires roughly **4.5 new plans every month, sustained for a year, at the top of the Premium band** — three times the pace §9.2 describes, reaching 30 active plans by Month 12. No document in the suite contains an acquisition plan capable of that, and Phase 10 of the tech-stack plan explicitly withholds paid marketing until after the first organic client.

**Recommendation — applied.** Year 1 re-based to the planning case. Years 2–5 re-scaled from that base and marked as targets requiring their own bottom-up model.

## S2 — The instant-quote engine is a Value-quadrant mechanism on a Premium-quadrant brand

> **⚠️ SUPERSEDED, August 2026.** Instant quoting was reinstated for Essential and Signature as published flat-rate packages — see `residential-package-and-pricing-model.md`. **The analysis below has not changed and was not refuted; the commercial decision changed.** It is retained because the market evidence remains valid and the decision may be revisited.
>
> What the reversal accepted: at $379 the 3-bed/2-bath sits 1.20× the market ceiling and the 4-bed at 1.02× — top-of-band prices, not obviously-premium ones, so the price cannot do the positioning work. The bounded inclusions, the same-cleaner promise and the SafetyCulture record carry it instead. What the reversal restored: self-declared scope as the pricing basis, and with it OPS-16 and the mandatory T&Cs acknowledgement.
>
> Estate Care remained excluded from instant quoting, consistent with the finding below.

**Severity: critical.** Your own competitor analysis settles this, and the suite did not notice.

`residential-direct-competitor-market-analysis.md:15` defines the market's positioning axis:

> **Price orientation:** *Value* (competes on affordability/**instant online pricing**) vs. **Premium** (competes on trust, presentation, discretion; **price not the lead message**).

Line 26 names the target quadrant as Premium/Specialised. Every premium competitor profiled shows "Published pricing: None found." The only two competitors running instant pricing tools — Simply Maid and Calibre Cleaning — are both classified **Value price / Standard structure**, the exact quadrant the brand exists to avoid.

The instant-quote engine is therefore the single largest unforced strategic error in the suite: `tech-stack-execution-plan-and-mvp-checklist.md:79` calls it "the highest-priority build item for this brand," and it is a Value-quadrant signal.

The suite was already split three ways on it:

| Source | Home Care form | Price shown before assessment? |
|---|---|---|
| Vol 1 §5.3 | property details → walkthrough → proposal | **No** — CTA "never 'Get a Quote'" |
| `landing-page-content-brief.md:31` | short form, 7 fields | **No** — "don't put a $/hr number on this page at all" |
| Vol 3 §4.2 / §5.1, scope-protection doc | **19-field** detailed intake | **Yes** — "locked at booking" |

`site/` implements rows 1–2. Volume 3 and the scope-protection document are the outliers.

Volume 3 §2.1 was internally incoherent as a result: it carried both flows in one pipeline with no rule for which a web submission follows — routing either to "Assessment Booked → Proposal Sent" or "skipping straight to the Booked stage." An implementer had no way to choose.

`landing-page-content-brief.md:45` shows the tension was noticed and left unresolved: *"No 'book online in minutes' language anywhere on this page (that's the Absolute Domestics/Simply Maid playbook — the opposite of what this buyer wants) — but the instant estimate itself stays."*

**Recommendation — applied.** Resolved to assessment-first, no price shown, per Vol 1 §5.3. This also eliminates the pricing-accuracy risk, most of the OPS-16 machinery, and the need for Lawpath-reviewed variance T&Cs before the first booking. **It validates the existing website**, which already works this way.

## S3 — The subcontractor model contains a structural contradiction

**Severity: critical. Requires employment-law advice — this is a flag, not a legal conclusion.**

Volume 2 §2.12 requires subcontractors to be genuinely independent: own ABN, own equipment, own insurance, own operating methods, and **"retain the right to delegate."** REC-01 step 2 reinforces it — "Screen for genuine independence — ABN, own equipment, works for other clients — all three required."

Simultaneously, the business:

- promises clients **"the same cleaner or team every visit"** (Vol 1 §2.3; the #1 trust point on `site/index.html:106`),
- rosters them centrally in Connecteam (OPS-02),
- imposes a uniform and presentation standard (CLN-20),
- requires them to work to company CLN and QUA service standards (§2.12),
- inspects their work against those standards (QUA-01),
- and pays a fixed 50% profit split.

**Right-to-delegate and same-cleaner-every-visit cannot both be true.** The first is a defining marker of independent contracting; the second is the brand's lead marketing promise. The remaining items are conventional indicia of control.

COM-05 (Sham-Contracting Risk Review) and COM-11 (Classification Review) acknowledge the risk. But the risk is not something the SOPs mitigate — the business model as designed **creates** it.

## S4 — The financial model assumes zero churn in a business whose core metric is MRR

**Severity: high.**

Volume 1 §2.8 states "the core KPI is recurring MRR per customer." Volume 3 operates Renewal (§2.7) and Win-Back (§2.8) pipelines. Volume 4 §4 alerts on "churn trending up 2 consecutive months."

Yet §10.2's plan counts rise monotonically — 1, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14 — with no attrition at any point, and **no volume anywhere states a churn assumption.**

Churn is the single most sensitive input in the model:

| Monthly churn | Year 1 revenue | Active plans at M12 |
|---|---|---|
| 0% (as modelled) | $138,320 | 17.5 |
| 3% | $120,637 | 14.5 |
| 5% | $110,332 | 12.8 |
| 8% | $96,776 | 10.7 |

A 30% revenue swing sits inside a range no document commits to. It also determines when the 20-customer gate clears — at 1.5 plans/month with 5% churn, **the gate is not reached until Month 24**, not Year 2 as §10.1 assumes.

**Related omission:** no document states a target CAC, an expected lead-to-assessment rate, or an assessment-to-plan conversion rate. Volume 4 §4 alerts on CAC and Volume 3 §8 reports it, but nothing forecasts it. Year 1's entire acquisition plan rests on warm network and Dream 100 with no stated conversion assumptions.

---

# 2. Launch-blocking gaps

## L1 — The entire launch workforce has no onboarding path

**Severity: blocking.**

Volume 1 §9.1 runs on subcontractors for the first 6–12 months. Volume 5 §2 disposes of them in one sentence — *"Subcontractors receive the Subcontractor Agreement instead"* — and they never appear again.

Everything Volume 5 delivers is employee-only: the induction program (§3), the core training modules (§4.1), the certification tracking (§4.3), the buddy system (§3.4), the performance framework (§6). **Volume 5 delivers nothing usable for the first year of trading.**

Meanwhile Vol 2 §2.12 requires subcontractors to perform "to the same CLN and QUA SOP standards as employees." There is no documented mechanism to train them to those standards, verify they understand them, or record that it happened.

**This compounds S3.** Volume 5 §4.1 specifies in-person, shadowed training for "All Cleaning Roles" — but delivering company training on company methods is itself an indicium of control that sits badly against §2.12's "under their own operating methods."

## L2 — CLN-21 and CLN-22 are unwritten and unowned

**Severity: blocking.**

Vol 2 §4.9 is explicit: *"write out CLN-21 and CLN-22 first and in full before hiring or training any crew — these are the only two service standards needed to service Home Care at launch."*

Both sit under "indexed — planned." Neither exists. Both are owned by the Cleaning Supervisor, who §2.3 says activates "once MRR consistency is proven" — i.e. not at launch.

The two documents that define what the company actually sells are missing, and assigned to someone who has not been hired.

## L3 — QUA-01 has no launch owner

**Severity: blocking.**

Inspection data is named as *the* competitive differentiator three separate times (Vol 1 §4.2, §4.3, §3.6). QUA-01 — Site Inspection via SafetyCulture — is the SOP that produces it.

Its owner is the Quality Assurance Supervisor, who Vol 2 §2.9 activates "in the Scale stage."

Vol 2 §3.1 provides interim "(CEO until hired)" fallbacks for SAL, MKT, OPS, HR, FIN and REC — but **not for QUA**, and not for PAY, CLN, VEH or EQP. The §5 full-SOP headers compound it by naming only end-state roles.

At launch, nobody owns the mechanism the entire market position rests on.

---

# 3. Compliance flags

*Stated as risks with citations. These require professional advice; none is a legal conclusion.*

## C1 — Effective subcontractor rates at the stated floor

Vol 1 §9.2 Month 1: *"1 contract, 3–5 cleans/week"* at *"$1,000+"*.

| Reading | Result |
|---|---|
| One customer, 3–5 visits/week, $1,000/month | $46–77 per visit. A 50% split gives the subcontractor $23–38 per visit — **$12–19/hour** at two hours. Below §4.4's own Budget column ($140–180 for a 3-bed) and below the "mid-$20s to $30" Award range §4.1 cites. |
| 3–5 visits/week being the subcontractor's total workload | Month 1 revenue should be $5,200–8,680, not "$1,000+". The §10.2 model contradicts it. |

**Either reading breaks something.** The unit in that column is undefined — the root cause addressed in `CONTEXT.md`.

Even at the "ideal" $3,000–5,000/month, five visits a week yields $138–231 per visit, landing in §4.4's *Market average* column — not the High-ticket/Premium column §4.4 says the brand occupies.

## C2 — Review gating

Vol 3 §3.2's 3Rs program *"asks a satisfaction question first; positive responses routed to a public review request; negative responses routed privately."*

Selective solicitation of positive reviews is prohibited under Google's review policies and has drawn ACCC attention as potentially misleading conduct under the Australian Consumer Law. Vol 5 §5.3 compounds it by tying subcontractor incentive payments to "verified Google reviews."

The underlying intent — catching dissatisfaction early — is sound. The mechanism needs restructuring so that *all* customers are invited to review and the private routing is an internal service-recovery trigger rather than a filter on who gets asked.

## C3 — No privacy collection notice

Vol 3 §5.1 collects suburb/address, detailed property composition, condition ratings, access notes and **interior photographs**. Vol 2 COM-06 covers retention of "client home details, access codes" in principle, but:

- no collection notice is specified on any form (APP 5 requires notification at the point of collection),
- no retention or deletion period is stated for property photographs anywhere in the suite,
- `site/index.html:294` links the Privacy Policy to `href="#"` — the live site collects personal information with no policy behind it.

---

# 4. Cross-document contradictions

| # | Contradiction | Sources | Resolution |
|---|---|---|---|
| X1 | Quote model — three incompatible descriptions | Vol 1 §5.3 · brief:31 · Vol 3 §4.2/§5.1 | Resolved to one flow; **later reversed** to published flat rates for Essential/Signature (see S2 note) |
| X2 | Booking calendar — Connecteam vs GHL native | Vol 1 §5.1, Vol 4 §2.6 vs `tech-stack:84,100` | GHL native — **applied** |
| X3 | CEO and scheduling, within one section | Vol 1 §6.1 "not responsible for... scheduling" vs §6.2 "CEO manages... initial scheduling" | **applied** |
| X4 | AIOS activation timing | Vol 4 §3 "not on day one" vs Vol 1 §4.3 + OPS-13 + `tech-stack` Phase 2a (Week 2) | **applied** — resolved as a side effect of S2 |
| X5 | KPI dashboard location | Vol 1 §11.1 & `tech-stack:89,104` → "Vol 1 §8" · Vol 3 §8 → "Vol 1 §10/11" · OPS-13 → "Vol 4 §4" · Vol 4 §4 → "Vol 1 §10–11" | Vol 4 §4 is the only real location — **applied** |
| X6 | Indigenous procurement half-moved to commercial | Vol 1 §8 moves it; Vol 1 §1 & §3.7 still claim it; Vol 3 §7 retains the full pipeline citing non-existent "Vol 1 §8.3"; Vol 2 keeps COM-13 | **applied** |
| X7 | Bond/end-of-lease cleaning | Vol 1 §2.2 "Avoid as core" vs Vol 3 §4.3 ad-funded service line; Vol 2 CLN-05 miscites §2.2 (the acquisition-product row is "One-off / deep cleans") | **applied** |
| X8 | Emergency cleaning service line | Vol 3 §4.3 gives it always-on Google Ads; appears in no segment strategy in Vol 1 | **flagged** — off-position for a premium recurring brand |
| X9 | Broken reference — profit waterfall | `tech-stack:229` → "Vol 1 §6.3" (§6.3 is CEO Time Allocation; the waterfall exists only as FIN-03) | **applied** |
| X10 | Broken reference — launch capital | Vol 1 §2.2a → "Section 6 of this Volume" (§6 is the CEO Playbook) | **applied** |
| X11 | Segment/tier naming collision | "Home Care" is both segment and tier family; "Estate Care"/"Estates" is both tier and segment | `CONTEXT.md` — **applied** |
| X12 | Broken reference — model revisit | `residential-direct-competitor-market-analysis.md:241` → "Vol 1 §10.4" (never existed) | **applied** — found by the checker, not by reading |
| X13 | Ambiguous "Volume 1" in a shared document | `tech-stack-...md` cites Commercial Vol 1 §2.7a/§2.8 without saying so; the residential Vol 1 has neither section | **applied** — disambiguated to "Commercial Volume 1" |

---

# 5. Unsupported claims

**U1 — "Confirmed 2026 GHL capability."** Vol 4 §2.5a asserts a detailed feature list for the GoHighLevel AI Voice Agent with no source or date, and Vol 1 §4.3 builds the headline competitive advantage on it. `tech-stack:74` treats the same product's *pricing* as an explicit known-unknown requiring direct confirmation — the capability claim deserves the same treatment. **Applied:** marked unverified.

**U2 — Years 2–5 targets.** $500k → $1M → $2M → $5M has no bottom-up support. Year 5 at $5M implies roughly 320 concurrent recurring plans and a workforce near 100; no headcount model extends past Month 12. **Applied:** re-scaled and marked as targets, not forecasts.

**U3 — The employee transition is never costed.** Vol 1 §9.1 commits to moving from subcontractors to employees. §10.2 assumes a 50% labour cost permanently. Fully loaded, a direct employee costs materially more:

| Loading | Cost per $100 of revenue |
|---|---|
| Subcontractor 50% split | $50 |
| + superannuation (12%) | $56 |
| + WorkCover | $57 |
| + leave accrual | $62 |
| + ~15% non-billable time | **$72** |

Labour moving from 50% to ~72% of revenue takes the planning-case net margin from **32.7% to roughly 14%**. The transition the strategy commits to would more than halve profitability, and no document models it. **Flagged** — needs a decision on whether the transition is still intended.

---

# 6. Arithmetic

The §10.2 model's **internal** arithmetic is clean. Every scenario total, quarterly cumulative and cost line was re-computed independently and reconciles exactly ($98,000 / $196,000 / $343,000; net $31,365 / $68,850 / $125,078). The model's problem is its assumptions against the rest of the strategy, not its maths.

**One error found.** Vol 1 §2.8: *"a $349 fortnightly recurring plan is worth roughly $8,376/year."* That is $349 × 24. A year contains **26** fortnights — the correct figure is **$9,074**. *(Applied.)*

The same sentence also illustrates S1: $349 fortnightly is a plan value of $756/month, against a Mid scenario assuming $2,000/month.

---

# 7. Open items — requiring your decision

Items below were **not** changed. Each needs either your input or outside advice.

| # | Item | Needs |
|---|---|---|
| O1 | Subcontractor classification (S3) | Employment lawyer. Same-cleaner-every-visit vs right-to-delegate is a business-model decision, not a wording fix. |
| O2 | Effective rates at the §9.2 floor (C1) | Your call on the corrected Month 1 economics now that the plan/visit unit is defined. |
| O3 | Employee transition cost (U3) | Decide whether the transition still stands; if so it needs modelling before Year 2 planning. |
| O4 | Review gating (C2) | Legal review, then a restructured 3Rs mechanism. |
| O5 | Subcontractor onboarding program (L1) | A substantial piece of writing — proposed as the next work item. |
| O6 | CLN-21 / CLN-22 (L2) | Your service definitions. Blocking for crew training. |
| O7 | Churn and conversion assumptions (S4) | Placeholders inserted at 5% / TBD; replace with real figures once Month 1–3 data exists. |
| O8 | Emergency cleaning service line (X8) | Keep or drop — currently unsupported by any segment strategy. |
| O9 | Privacy policy and collection notice (C3) | Lawpath, plus a site change. The live site currently has neither. |

---

## Changes applied

- **`CONTEXT.md`** created — segment/tier/plan/visit vocabulary, the pricing decision, and the document map.
- **Volumes 1–5** edited per §1–§6 above; every applied item is marked in the tables.
- **`instant-quote-scope-protection-mechanism.md` → `scope-and-variance-protection.md`**, rewritten around walkthrough-agreed scope. OPS-16 rescoped from declared-scope error to condition variance.
- **`tech-stack-execution-plan-and-mvp-checklist.md`** — the instant-quote pricing engine, previously the largest build item in the plan, is removed from scope entirely.
- **`landing-page-content-brief.md`** — Luxury Homes dual-path pricing choice removed; launch-status section added.
- **`scripts/check-crossrefs.py`** added — see below.

Nothing in `site/` was changed. The assessment-first decision leaves the existing pages correct as built, with one exception carried forward: `site/estate-care.html` is published and linked in the main navigation of all three pages, which contradicts the Vol 1 §2.2a segment gate.

---

## Verification performed

| Check | Result |
|---|---|
| **Cross-reference integrity** — every `Volume N, Section X.Y` pointer resolved against actual headings | **Pass.** Found and fixed X12 and X13, neither of which surfaced on a careful read. Script kept at `scripts/check-crossrefs.py`; run it from the repo root after any section renumbering. |
| **Financial model** — every scenario, plan value, cost line, margin, churn-sensitivity and stretch figure recomputed independently and matched against the text of Volume 1 | **Pass**, 17/17 figures reconcile. Two rounding slips of my own in the §10.2.2 quarterly table were caught and corrected. |
| **Original model arithmetic** — the retired §10.2 recomputed to confirm the audit's claim that its internal maths was sound | **Pass** — $98,000 / $196,000 / $343,000 and net $31,365 / $68,850 / $125,078 all reproduce exactly. |
| **Term consistency** — retired "contract" unit swept from the residential volumes | **Pass** after fixing the Sales Manager KPI in Vol 2 §2.5. |
| **Decision trace** — no document shows a price before an assessment; one booking flow, not two | **Pass** after fixing a stale document reference in the tech-stack plan's Lawpath checklist. |
| **Booking-source consistency** — GHL calendar vs Connecteam | **Pass.** |

**A note on the checker.** On its first run it reported a clean pass while silently finding zero files — it had been invoked from the wrong working directory. A guard now makes it exit non-zero unless it loads all five volumes. A verification step that cannot fail is worse than no verification step, and this one nearly shipped that way.

**Not verified:** the compliance flags (C1–C3) and open items O1–O9 rest on legal and commercial judgement, not arithmetic. Nothing here substitutes for the professional advice those items call for.
