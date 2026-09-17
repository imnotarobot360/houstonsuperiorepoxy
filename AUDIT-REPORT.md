# Houston Superior Epoxy — Instant-Estimate Funnel & SEO/Tracking Audit

_Last updated: 2026-09-10_

## 0. Enhancement pass (2026-09-10) — MyGarageFloors-style conversion upgrade

Applied on top of the funnel below, keeping the premium black/charcoal/orange design and the
estimate-before-contact promise. All changes verified in-browser (320px→desktop, dark), `tsc`
clean, CLS 0.0 / LCP ~192ms, and a full submit confirmed a correctly-mapped Neon row.

- **App-like mobile wizard** — sticky bottom Back/Next bar, auto-scroll to each question,
  persistent answers on Back, larger tap targets, zero horizontal overflow at 320px.
- **Price result copy** — "Your Preliminary Garage Floor Estimate", "Estimated investment:
  $LOW–$HIGH" (calculated mode) and "Based on approximately X sq. ft."; still **gated** to the
  confirmed anchors until a matrix is approved.
- **Social-proof bar** above Step 1 — written 5-year warranty, $2M insured, no upfront payment,
  Greater Houston service area. Google rating/count are **gated** (see outstanding items).
- **Outcome-based systems** — Full-Broadcast Flake (Recommended), Solid-Color, Metallic, and
  "Not Sure — Recommend One", each with a one-line description.
- **Soft ZIP qualification** — supported ZIP shows a green "Great — we serve your area."; an
  unsupported ZIP shows "We may still be able to help. Continue for confirmation." and is never
  rejected.
- **Trimmed contact form** — first name, last name, phone, email only; CTA "Send My Written
  Estimate"; privacy microcopy; the estimate stays visible above the form; no full address.
- **Tracking additions** — `ViewEstimator`, `ZipQualified`, `LeadFormStarted`, `PhoneClick`
  (Meta) and `Schedule`/`schedule_inspection` on booking; GA4 mirror events; non-PII params
  only (garage_size, calculated_sqft, floor_condition, selected_system, estimate_low/high,
  timeline). A self-disabling **Google Tag Manager** container was added (`NEXT_PUBLIC_GTM_ID`).
- **Attribution** — now persists **both first-touch and last-touch** utm/gclid/fbclid/landing/
  referrer; last-touch is saved with the lead.

**Outstanding owner inputs (still gated — nothing fabricated ships):**
1. **Pricing matrix** — per-sqft low/high by system + condition/damage/surface adders. Fill
   `UNAPPROVED_MATRIX` in `lib/pricing-config.ts` and flip `calculatorEnabled` to activate the
   live $LOW–$HIGH range.
2. **Epoxy-division Google reviews** — the division's OWN verified rating, review count, and
   Business Profile URL. Fill `REVIEWS` in `lib/pricing-config.ts` to light up the proof-bar
   rating (kept blank to avoid the parent company's reviews being false-attributed).
3. **Real Houston project photo** for the proof area, and the booking platform's exact prefill
   param names.

## 1. Executive summary

The site already implemented roughly 60% of the 10-phase spec at production quality
(redirects, structured data, Meta Pixel + Conversions API with `event_id` dedup, GA4,
attribution capture, answer-first SEO content, image optimization, and an empty-safe
project-detail system). This build delivered the genuinely-new work:

- A one-question-at-a-time **instant-estimate funnel** at `/garage-floor-estimator-houston/`
  that reveals a **gated** preliminary price _before_ asking for contact details, then
  captures a lead and hands off to the booking calendar with optional photo upload.
- A **single, editable pricing configuration** (`lib/pricing-config.ts`) that publishes only
  the two owner-confirmed starting anchors ($1,000 one-car, $1,800 qualifying two-car) and
  keeps every unconfirmed number as a `null` placeholder behind a master `calculatorEnabled`
  flag — so nothing invented can render.
- The Phase-4 tracking delta: `StartEstimator`, `EstimatorStepCompleted`, `EstimateGenerated`
  custom events, `Lead` fired only after the database confirms the row (shared `event_id` for
  CAPI dedup), and a **development-only event debugger**.
- 301 migration of the old `/lp/garage-floor` funnel onto the new estimator.

**Absolute rule honored throughout: no invented prices, reviews, ratings, addresses, or
photos.** The one price the estimator shows is an owner-confirmed anchor; every computed range
is disabled until a full matrix is approved.

## 2. Files created / modified

**New**
- `lib/pricing-config.ts` — single source of truth for all estimator numbers (gated).
- `lib/estimate-calc.ts` — pure gated/calculated estimate computation.
- `app/garage-floor-estimator-houston/page.tsx` — the estimator landing page (noindex).
- `components/lp/estimator-funnel.tsx` — 8-step funnel → result → lead → booking/photos.
- `components/lp/estimate-result.tsx` — the price-reveal card.
- `components/lp/estimator-fallback.tsx` — static never-blank fallback (form + call/text/book).
- `components/lp/estimator-error-boundary.tsx` — swaps in the fallback if the funnel throws.
- `components/lp/event-debugger.tsx` — dev-only tracking inspector.
- `app/actions/estimate-photos.ts` — appends photos to an existing lead (post-capture).

**Modified**
- `lib/meta-events.ts` — added the three estimator events, a refresh/repeat-safe `trackMetaOnce`,
  and the dev debug bus.
- `app/actions/estimate.ts` — returns Meta CAPI status/`event_id` so the debugger can show
  browser/server/both.
- `lib/leads.ts` — extended `ACCEPTED_CONDITIONS`/`ACCEPTED_TIMEFRAMES` to accept the estimator's
  vocabulary (validation stays single-sourced).
- `next.config.mjs` — 301 redirects for the old funnel URLs.
- `components/marketing-chrome.tsx` — estimator path is chromeless like `/lp`.

**Removed** (orphaned after migration)
- `app/lp/garage-floor/page.tsx`, `app/lp/garage-floor/thank-you/page.tsx`,
  `components/lp/funnel-form.tsx`, `components/lp/thank-you.tsx`, `lib/funnel.ts`.

## 3. Redirects

Added to `next.config.mjs` (verified live, dev server):

| From (canonical) | To | Status |
|---|---|---|
| `/lp/garage-floor/` | `/garage-floor-estimator-houston/` | 301 |
| `/lp/garage-floor/thank-you/` | `/garage-floor-estimator-houston/` | 301 |

Sources are slashless per the repo's `trailingSlash: true` convention; a slashless request
308-normalizes to the trailing-slash URL first, which then 301s to the estimator (confirmed:
`curl -L /lp/garage-floor` resolves to `/garage-floor-estimator-houston/` with a 200).

Pre-existing redirects (unchanged): `/book`→`/schedule/`, `/sitemap.xml`→`/sitemap-index.xml`,
and the resource-guide consolidations.

## 4. Structured data

No changes were required — the existing `lib/schema.ts` graph (Organization + LocalBusiness +
Service + Breadcrumb + WebSite/WebPage, `areaServed`, `sameAs`, parent-company relationship, **no
address, no fake reviews**) already satisfies Phase 3. The estimator page is intentionally
chromeless and noindexed, so it does **not** emit the site-wide LocalBusiness graph (correct for a
paid-traffic page).

## 5. Environment variables (all optional, self-disabling)

| Variable | Purpose | Behavior when unset |
|---|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel (browser) | No Pixel loads; no browser events sent |
| `META_CAPI_ACCESS_TOKEN` | Meta Conversions API (server) | CAPI inert; status reports `not_configured` |
| `META_CAPI_TEST_EVENT_CODE` | CAPI Test Events tab | Production events only |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 | GA4 disabled |
| `CRM_WEBHOOK_URL` | CRM lead push | CRM push skipped |

The lead pipeline (`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `LEAD_NOTIFY_TO`)
is already provisioned. A just-connected integration's env vars can take a few seconds to appear —
that is normal, not a failure.

## 6. Tracking events implemented

| Event | Type | Fires when | Notes |
|---|---|---|---|
| `StartEstimator` | custom | first question answered | once per session |
| `EstimatorStepCompleted` | custom | each step | carries a `step` param |
| `EstimateGenerated` | custom | price range shown | **explicitly not a Lead** |
| `Lead` | standard | after DB confirms the row | shared `event_id` → Pixel + CAPI dedup |
| `PhotoUploaded` | custom | photo attached post-lead | |
| `Schedule` | standard | **not yet fired** | requires a booking-platform confirmation signal (see §12) |

Dedup: the browser `Lead` and the server CAPI `Lead` share one `event_id`. Refresh/repeat-click
safety is enforced by `trackMetaOnce` (sessionStorage-keyed) plus a submit guard.

**Dev event debugger** (`components/lp/event-debugger.tsx`): a fixed overlay listing event name,
`event_id`, and whether each was seen browser-side, server-side, or both. Hard-gated to
`NODE_ENV !== 'production'`, so it never ships. Verified live during the walkthrough.

## 7. CRM payload example

`lib/crm.ts` POSTs JSON to `CRM_WEBHOOK_URL`:

```json
{
  "leadId": 21,
  "submittedAt": "2026-09-09T00:00:00.000Z",
  "name": "Jane Homeowner",
  "phone": "(346) 782-0903",
  "email": null,
  "zip": "77024",
  "garageSize": "2-Car",
  "floorCondition": "Bare Concrete",
  "timeline": "As Soon as Possible",
  "leadScore": "hot",
  "leadScoreReasons": ["Provided ZIP in service area", "Ready to start ASAP"],
  "leadSource": "Instant Estimator",
  "landingPath": "/garage-floor-estimator-houston",
  "utmSource": "facebook", "utmMedium": "paid", "utmCampaign": "garage-q3",
  "utmContent": null, "utmTerm": null, "fbclid": "…",
  "deviceType": "mobile",
  "appointmentStatus": "not_booked",
  "photoUploadStatus": "none"
}
```

## 8. Pricing configuration location

**`lib/pricing-config.ts` is the single source of truth.** It holds the two confirmed anchors as
real numbers, the disclaimer verbatim, the included-steps list, and an `UNAPPROVED_MATRIX` whose
every value is `null` with a `REQUIRES OWNER APPROVAL` note. `lib/estimate-calc.ts` consumes it and
refuses to compute a range while any required value is null or `calculatorEnabled` is false. **To go
live with a computed range: fill the matrix numbers and flip `calculatorEnabled` to `true` — one
file, no component edits.**

## 9. Pages consolidated

The old multi-step funnel (`/lp/garage-floor/` + its thank-you page) was replaced by the single
estimator page and its supporting components deleted. Shared LP sections (`LpHero`,
`LpBeforeAfter`, `LpSystem`, `LpServiceArea`, `LpHeader`) are reused by the estimator page.

## 10. Performance (measured, dev mode, `agent-browser vitals`)

Route `/garage-floor-estimator-houston/`, desktop 1759×817, dark:
- **LCP: 532 ms** (hero image `/lp/garage-hero.png`)
- **CLS: 0.0**
- **FCP: 532 ms**, **TTFB: 246 ms**, hydration ~60 ms

All within "good" Core Web Vitals thresholds. These are lab numbers in dev mode; a production build
will typically be equal or better. Recommend re-measuring INP against production once the Pixel is
live.

## 11. Mobile

Verified at 390×844 (dark). The simplified header (logo, click-to-call, CTA), hero, and the
one-question-at-a-time estimator with large tap targets and a progress bar all render cleanly with
no overflow or layout shift.

## 12. Remaining owner decisions

1. **Full pricing matrix** — the computed low/high range is disabled. Approve per-sqft rates by
   finish, condition/damage adjustments, and added-surface pricing (all listed as `null` in
   `UNAPPROVED_MATRIX`), then flip `calculatorEnabled`. Until then the estimator shows only the two
   confirmed starting anchors.
2. **Booking-platform prefill parameters** — the calendar handoff appends `name`/`zip` as a
   best-effort prefill; confirm the exact query-parameter names the scheduler accepts so fields are
   truly pre-populated.
3. **`Schedule` event** — cannot fire honestly until the booking platform provides a confirmation
   callback/redirect. Wire `trackMeta('Schedule', …)` to that signal when available. It is
   intentionally NOT fired on the "open calendar" click.
4. **Estimator indexation** — currently `noindex,nofollow` (paid LP). Keep as-is unless you want it
   to rank organically.

## 13. Meta Ads destination URL

Point ads at:

```
https://<domain>/garage-floor-estimator-houston/?utm_source=facebook&utm_medium=paid&utm_campaign=<campaign>&utm_content=<ad>
```

UTMs and `fbclid`/`_fbp`/`_fbc` are captured client-side and posted back with the lead for CRM and
CAPI attribution.

## 14. Phase 7 — real project proof (blocked on owner content)

The reusable project-detail system **already exists** (`lib/content/projects.ts` +
`app/projects/` + `app/projects/[slug]/`) with an **intentionally empty** registry: add one real
job object and the detail page, archive, sitemap, and static params all pick it up. It renders no
pages while empty, so nothing fake is ever published. The homepage hero was left as-is.

**Real assets still needed (owner):** completed-job photos (before / preparation / installation /
completed) stored at `/images/projects/*.webp`, per-project slab condition + prep + coating system,
real project city, and any verified Google review excerpts + a Google reviews link. Do not
substitute stock or AI imagery.

## 15. External / non-code actions (documented, not done here)

- Google Business Profile edits, directory citations.
- `www`→apex and `epoxy.houstonsuperiorpainting.com`→primary redirects (DNS/host-level).
- Submitting the estimator URL as the Meta Ads destination and adding the Pixel/CAPI env vars in
  the Vercel project.
