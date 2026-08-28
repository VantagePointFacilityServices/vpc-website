# VANTAGE POINT CLEANING
## Residential Operating System — Volume 4: AI Operating System & Technology Architecture
Version 1.0 — Residential-Only Edition | Gold Coast, QLD, Australia
**CONFIDENTIAL — INTERNAL USE ONLY**

---

## 1. Introduction
Vantage Point Cleaning runs on a deliberately small Phase 1 technology stack, most on entry tier, and adds the AI Operating System (AIOS) on top only once the business's financial phasing supports it (Volume 1). No tool is adopted, and no AI role is switched on, without someone having answered: what does this replace, what does it cost, and who is accountable for it.

---

## 2. Technology Architecture
Every platform below carries the same fields. "Upgrade trigger" is a specific, checkable condition — never "when we can afford it" alone.

### 2.1 GitHub
Purpose: version-controlled master repository for SOPs and documents. Owner: CEO. Cost: $0. Upgrade trigger: private collaborator seats beyond free tier. Backup: git history plus quarterly export. Security: MFA required.

### 2.2 GitHub Pages
Purpose: hosts lightweight internal reference pages at no cost. Owner: CEO. Cost: $0. Security: never used for client or employee data.

### 2.3 GitHub Actions
Purpose: automates repository housekeeping (e.g. flagging SOPs overdue for review). Owner: CEO. Cost: $0 within free minutes.

### 2.4 Google Workspace
Purpose: business email, shared drive, calendar, document collaboration. Owner: CEO. Cost: entry-tier per-user; one seat at launch. Upgrade trigger: add a seat the moment a new hire needs a company email/calendar. Security: MFA required for every seat from day one.

### 2.5 GoHighLevel (GHL)
Purpose: CRM, pipelines, funnels, marketing/nurture automation — the backbone of Volume 3, running the private home care assessment flow (Volume 1, Section 5). Owner: CEO, then Sales/Marketing Manager. Cost: starter tier at launch, scales with contact volume.

### 2.5a GHL Local Phone Number + Native AI Voice Agent (Agent Studio)
Purpose: a dedicated local phone number for sales and support, answered by GoHighLevel's native AI Voice Agent whenever a human isn't available — including all after-hours calls — so a warm lead is never lost to voicemail.

> **⚠️ Capability unverified.** The feature list below was asserted in the v1.0 draft as "confirmed 2026 GHL capability" with no source or date. Volume 1 §4.3 builds the company's headline competitive advantage on it, and the tech-stack plan already treats this product's *pricing* as an explicit known-unknown — the capability claim deserves the same scepticism. **Confirm each capability directly with GoHighLevel, in writing, before Phase 2a of the build plan and before Volume 1 §4.3's claim is used in any marketing.**

Claimed capability, pending confirmation: answers calls in real time with natural, interruption-tolerant conversation rather than an IVR menu; sees live GoHighLevel calendar availability and can book an assessment directly on the call; qualifies the caller (name, service needed, address, basic property details, preferences) and writes it straight into the CRM contact record with a full transcript logged; answers FAQs by referencing the website content and an uploaded service document; escalates to a human on configured trigger words ("emergency," "complaint," "urgent") by transferring to the CEO's/on-call mobile immediately; runs 24/7.

**Residential-specific configuration — the agent quotes from the published ladder, and only from the published ladder.** It captures the Volume 3 Section 5.1 property details verbally, returns the published package price, captures the Terms & Conditions acknowledgement into the transcript, and books the first clean against live calendar availability.

**It has no pricing discretion.** No discounts, no rounding, no "I could probably do it for", no derived figures for configurations not on the ladder. Estate Care, properties beyond 5 bed / 4 bath, and any property whose condition is rated High receive **no price** and route to a human. **Adversarially tested before go-live** — try to talk it into a discount or an off-ladder quote, and confirm it refuses (tech-stack plan, Phase 9).

Owner: CEO (Sales Manager once hired). Cost: GHL Voice AI Agent Studio and local number are priced as an add-on on top of the starter tier — confirm current per-minute/per-agent pricing directly with GoHighLevel before committing, since this is a recently added feature and pricing may still be evolving. **Note this cost is absent from the Section 2.15 launch-stage estimate below.**

### 2.5b Website Chatbot (GHL Conversational AI)
Purpose: a text-based equivalent of the phone agent, embedded on the website for visitors who prefer not to call — answers FAQs, handles support questions, runs the same instant-quote flow and books against live calendar availability. **Same constraint as the voice agent: published ladder only, no discretion** (Volume 4, Section 3). Shares the same underlying FAQ/service knowledge base as the Voice Agent (Section 2.5a) so answers stay consistent across channels. Owner: Marketing Manager (CEO pre-hire). Cost: typically bundled within the same GHL Voice AI/Agent Studio add-on — confirm current bundling with GoHighLevel.

### 2.6 Connecteam
Purpose: field workforce app — scheduling, timesheets, GPS, mobile SOPs. **Booking availability shown on the website comes from the GoHighLevel native calendar, not Connecteam** — see Section 2.5 and the tech-stack plan, which specifies no separate booking tool at MVP. Connecteam handles crew scheduling once a job exists; GHL handles prospect-facing availability. Owner: Operations Manager (CEO/Cleaning Supervisor pre-hire). Cost: free tier at launch; paid as headcount grows.

### 2.7 Employment Hero
Purpose: HR platform — employee records, onboarding, award interpretation. Owner: HR Lead (CEO pre-hire). Cost: per-employee; adopted at first direct employee hire.

### 2.8 Xero
Purpose: accounting, invoicing, payroll, GST/BAS, and cleaner-rate tracking (Volume 1, Section 9.1) — the financial system of record. Owner: Finance Lead (CEO/bookkeeper pre-hire). Cost: entry-tier plan at launch.

### 2.9 Stripe
Purpose: payment processing for residential bookings. Owner: Finance Lead (CEO/bookkeeper pre-hire). Cost: $0 subscription, transaction-fee based. Security: PCI compliance via Stripe-hosted fields — card data never touches Vantage Point systems.

### 2.10 SafetyCulture
Purpose: digital inspection checklists — the core competitive differentiator for premium home care. Owner: Quality Assurance Supervisor (Cleaning Supervisor pre-hire). Cost: free tier at launch; paid as volume grows.

### 2.11 Lawpath
Purpose: legal document templates and review. Owner: CEO. Cost: entry-tier subscription at launch.

### 2.12 Google Analytics 4 (GA4)
Purpose: website and funnel analytics. Owner: Marketing Manager (CEO pre-hire). Cost: $0.

### 2.13 Google Tag Manager
Purpose: manages tracking tags across the website. Owner: Marketing Manager (CEO pre-hire). Cost: $0.

### 2.14 Google Search Console
Purpose: monitors organic search performance and technical SEO. Owner: Marketing Manager (CEO pre-hire). Cost: $0.

### 2.15 Consolidated Monthly Cost Summary
| Stage | Approx. monthly tech spend | Note |
|---|---|---|
| Launch (Phase 1) | $300–700/month **plus Voice Agent usage** | Google Workspace, GoHighLevel starter, Xero entry, Lawpath, Stripe fees. Connecteam and SafetyCulture are free-tier. **The Section 2.5a Voice Agent add-on is not included and is not yet priced** — treat it as a known unknown, not a rounding error. |
| After VA/Supervisor hire | $500–900/month | Connecteam and SafetyCulture move to paid tiers. |
| After Operations Manager | $900–1,500/month | Employment Hero adopted, GoHighLevel usage tier increases. |
| Enterprise ($1M+) | $1,500–3,000+/month | Full seat count; AIOS tooling layered on top. |

---

## 3. AI Operating System (AIOS)
Every role below is **advisory and reporting-only**: it drafts, summarises, forecasts, and flags, but a named human role makes every decision, and every client- or staff-facing action passes through a human before it goes out.

**Activation timing.** The reporting and forecasting roles activate once the business's financial phasing supports it — not on day one. **The Customer Service AI is the exception and is live from launch**, because the voice agent and chatbot are a Phase 2a build item (tech-stack plan, Week 2), OPS-13 is a day-one SOP, and Volume 1 §4.3 names 24/7 live answering as the company's measurable competitive edge. Earlier drafts said AIOS was "not day one" while simultaneously requiring this role at launch; the exception is now explicit rather than contradictory.

**Activation rule:** run any new AI role in parallel with the existing manual process for at least one full reporting cycle before relying on it solely. For the Customer Service AI this means a human answers alongside it during business hours for at least one full week before it runs unattended after-hours.

| Role | Purpose | Human checkpoint |
|---|---|---|
| Executive AI | Synthesises the dashboard into a weekly CEO brief. | CEO reads and acts; the brief never triggers an action on its own. |
| Sales AI | Drafts assessment follow-ups, flags stalled proposals. | Sales Manager reviews and sends every follow-up above the standard pricing band; routine nudges may run automatically. |
| Marketing AI | Drafts ad copy and campaign performance summaries. | Marketing Manager approves all copy and spend reallocation before it goes live. |
| Operations AI | Flags scheduling gaps and labour-cost/profitability outliers. | Operations Manager actions every roster/cost decision; AI never reassigns a job automatically. |
| HR AI | Drafts onboarding communications, flags compliance review dates. | HR Lead approves all employee-facing communication and compliance action. |
| Finance AI | Drafts the 90-day cash flow forecast, flags DSO/margin movement. | Finance Lead reviews and confirms every forecast; no payment/invoice action is automated. |
| Customer Service AI **(live at launch)** | Handles first-response triage via the GHL Voice Agent (Section 2.5a) and Website Chatbot (Section 2.5b), **quotes Essential and Signature from the published ladder**, and books the first clean against live calendar availability. | **A bounded exception to the advisory-only rule, widened in August 2026 when instant quoting was reinstated.** The agent may quote and book — but **only prices that appear in the published ladder**, with no discretion to discount, derive, or round. Estate Care, configurations beyond 5 bed / 4 bath, and High-condition properties receive no price and transfer to a human, as does any escalation trigger word (emergency, complaint, dispute, injury). **AI-05 must be re-run before activation** — the exception is materially wider than the one previously approved. |
| Reporting AI | Assembles the executive dashboard and quarterly SOP health check summary. | CEO/General Manager reviews before it's treated as complete. |

---

## 4. Executive Dashboard
**This section is the single source of truth for KPI definitions and alert thresholds across the whole suite.** Earlier drafts of Volumes 1, 2 and 3 pointed at a "KPI dashboard" in Volume 1 §8, §10 or §11 — none of which contained one. Every such reference now points here.

| Panel | KPIs shown | Alert threshold | Escalates to |
|---|---|---|---|
| Financial | Gross/net profit margin, MRR, DSO, LTV | DSO > 30 days; margin drops 2 consecutive months | Finance Lead / CEO |
| Marketing efficiency | CAC, CPA, CPL, CPC, ROI | CAC exceeds 1 month of average plan value | Marketing Manager (CEO pre-hire) |
| Marketing engagement | CTR, CR, ROAS, assessment-to-job, churn | Churn trending up 2 consecutive months | CEO / Sales Manager |
| Operations | Labour cost %, turnover, unbilled hours, job profitability | Labour cost % outside target band | Operations Manager |
| Pipeline health | Stage conversion rates per pipeline | Any stage conversion drops 20%+ month-on-month | Sales Manager |
| Call & chat capture | Answer rate (calls answered live vs. missed), after-hours call volume, Voice Agent/chatbot booking-completion rate, escalation count and reason | Answer rate below 95%; any escalation left unactioned past 30 minutes | CEO / Sales Manager |
| **Segment gate** | Active recurring Home Care plans, against the 20-plan threshold (Vol 1 §2.2a) | Net plan count flat or falling for 2 consecutive months | CEO |
| **Retention** | Monthly churn %, average plan lifetime | Churn above the Vol 1 §10.2 planning assumption (5%) for 2 consecutive months | CEO |
| Role & SOP health | Vacant roles, overdue SOP reviews, **SOPs with no interim owner** | Any SOP overdue by more than one full review cycle | CEO |

**Two panels matter most in Year 1** — Segment gate and Retention. Volume 1 §10.3 shows retention is the cheapest lever available before paid marketing opens, and churn is currently an assumption rather than a measurement (Vol 1 §10.2.4). Measure it from Month 3.

**Build sequence:** Phase 1 dashboard is manual — a monthly spreadsheet pull, reviewed by hand. Once Reporting AI has run in parallel with the manual process for one full quarter with no material discrepancy, the live dashboard replaces the manual pull.

---

## 5. IT Governance

### 5.1 Access Provisioning & Revocation
New hires get access only to the platforms their role profile lists under "technology ownership" — never blanket access by default. Access is revoked on the last day, not at the next convenient admin session.

### 5.2 Backup Standard
Every platform has a stated backup approach. As a floor: anything costly or impossible to recreate (financial records, client history, the SOP library) is exported and stored outside its source platform at least quarterly.

### 5.3 Password & MFA Standard
MFA is enabled on every platform that supports it, for every user, from their first day. No shared logins; shared/service accounts are documented with a named owner.

### 5.4 Software Adoption Checklist
Before any new tool is adopted, it is checked against the rule (generates revenue, reduces labour, or replaces another subscription) and given a Section 2-style profile before go-live.

---

## 6. Forecasting & Decision Support
AIOS moves from reporting what happened to informing what to do next — always as a recommendation a named human role acts on.

### 6.1 Cash Flow Forecasting
Finance AI maintains the rolling 90-day forecast that the delegation trigger and MRR-consistency test are checked against. The forecast is a draft until the Finance Lead confirms it.

### 6.2 Revenue & Headcount Forecasting
Reporting AI projects revenue trajectory against the Volume 1, Section 10.2 scenarios and the Section 9.2 acquisition plan, flagging when actual performance would justify accelerating or delaying the next hire — a recommendation the CEO decides on.

### 6.3 Decision Support, Not Decision-Making
Every forecast and recommendation is framed as decision support. Expanding any AI role beyond advisory-and-reporting is a specific, documented decision — not a default it drifts into.

---
*End of Residential Volume 4 — AI Operating System & Technology Architecture. This is a living document; review quarterly and before any new tool or AI role is adopted.*
