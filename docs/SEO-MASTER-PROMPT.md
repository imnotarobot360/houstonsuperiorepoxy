# SEO / AEO / GEO master prompt — houstonsuperiorepoxy.com

Paste this whole file to the agent doing the work. It is written to be executed
against this repository as it exists today, not as a generic SEO brief.

---

## 0. HARD CONSTRAINTS — these override anything later in this document

**0.1 The warranty is settled. Do not reopen it.**

The term is **Limited Lifetime Workmanship Warranty** (title case; "residential"
is *not* part of the name — scope is carried by the surrounding sentence).

Never, for any SEO reason:
- restore or re-authorise the 5-year workmanship warranty
- remove or soften "Limited Lifetime" wording
- rewrite approved warranty terms, or flag them as unverified
- alter the historical-contracts paragraph on `/warranty/` (the policy is **not**
  retroactive and the page says so deliberately)
- extend the residential term to commercial, warehouse or exterior work

Every warranty claim on the site interpolates from `lib/content/warranty.ts`.
Do not retype a warranty sentence into a page. Change the constant or nothing.

**0.2 Never fabricate.** No invented reviews, ratings, review counts, photos,
certifications, prices, credentials, awards, years-in-business or project
counts. If a fact is not already in the repo and confirmed, it does not go on
the site — add it to `OWNER_VERIFICATION_REQUIRED.md` instead.

The 4.9 rating / 200+ reviews belong to **Houston Superior Painting**, the
parent company. This entity has its own Google profile with few reviews.
`content/reviews.ts` ships empty on purpose. Do not borrow the parent's numbers
for schema, copy, or an AI summary.

**0.3 Prices come from one place.** `lib/pricing-config.ts` holds the rate
(`$4.50/sq ft`) and the minimum (`$1,000`); `lib/site.ts` derives the published
figures; `lib/garage-measurement.ts` holds the arithmetic. No page, FAQ, schema
node, meta description or `llms.txt` line may contain a hardcoded dollar amount.
A hardcoded `$1,800` once survived a price withdrawal on the ad landing page for
weeks — that is the failure mode this rule exists for.

Any published rate must travel with its minimum and the words "rough estimate".

**0.4 Verification is a gate, not a report.** Before you finish:

```
node scripts/verify-site.mjs
node scripts/verify-site.mjs https://houstonsuperiorepoxy.com
npx tsc --noEmit
npm test
npx next build
```

All five must pass. The URL run is the one that counts — source can be correct
while production serves a stale build.

**0.5 Do not submit the real lead form against production.** It creates a real
lead row, a real notification email and a real conversion event. Test forms
locally.

---

## 1. WHAT ALREADY EXISTS — do not rebuild these

Read before planning. Duplicating any of this is a regression, not progress.

| Area | State |
|---|---|
| Routes | 29, centralised in `lib/routes.ts` with title + meta description per route |
| Sitemaps | 5 segmented + index (`app/sitemap-*.xml`), `/sitemap.xml` 301s to the index |
| robots | `app/robots.ts`; `/admin`, `/lp`, `/app/`, `/catalog/` disallowed |
| Structured data | `lib/schema.ts` — Organization, LocalBusiness, WebSite, Service, BlogPosting, Project, FAQPage, BreadcrumbList. One graph per page, entities declared once |
| AEO | `lib/content/answers.ts` — 40–70 word quick answers per route, with a dev-time word-count guard in `components/aeo.tsx` |
| GEO / AI | `/llms.txt`, generated from the same constants the pages use (`lib/llms.ts`) |
| City pages | 9: richmond, katy, sugar-land, cypress, fulshear, pearland, the-woodlands, magnolia, memorial-river-oaks (`lib/content/cities.ts`) |
| Resource articles | 22 (`lib/content/resources.ts`) |
| Specs / authority | `lib/content/specs.ts` (per-system spec blocks, warranty split by surface), `lib/content/authority.ts` |
| Analytics | GA4 `G-GSEQHCDCPL` (production only) and Meta Pixel `908445922031813`, both live. `generate_lead` fires once after a confirmed lead (`lib/conversion.ts`) |
| Floor Designer | Live: 27 blends, AI photo visualizer, 3-way measurement, rough estimate with the arithmetic shown |

**Known content gaps, in order of how much they cost:**

1. **One project page.** `content/projects/` has a single job. This is the
   biggest organic and trust gap on the site — project pages are the proof,
   the local relevance and the image surface all at once.
2. **No reviews.** `content/reviews.ts` is empty by design until this entity
   has its own.
3. **9 city pages** against a metro with far more searchable communities.

---

## 2. WORK STREAMS

Do them in this order. Each has a definition of done that can be checked.

### 2.1 Technical SEO

- Audit Core Web Vitals on real pages (mobile first). The Floor Designer and
  `/colors/` carry the most images; look there first.
- Verify every route has a canonical, a unique title under ~60 chars and a
  unique meta description under ~155. `lib/routes.ts` is the single place to
  fix them.
- Confirm internal linking: every page reachable within 3 clicks of home, no
  orphans, `RelatedLinks` blocks pointing somewhere useful rather than
  decoratively.
- Check image weight and `next/image` usage. Flake swatches and project photos
  are the heavy ones.
- Confirm `trailingSlash: true` is honoured consistently in every internal link,
  sitemap entry and canonical.

**Done when:** no 404s or redirect chains in the sitemaps, Lighthouse mobile
performance and SEO reported per template, and `verify-site.mjs` passes.

### 2.2 Local SEO

- Expand city coverage beyond the current 9. Candidates: Spring, Tomball,
  Conroe, Humble, Kingwood, Friendswood, League City, Missouri City, Stafford,
  Bellaire, West University, Jersey Village.
- **A city page must say something true and specific about that city's slabs** —
  housing stock age, soil, typical garage size, builder practice. Read
  `lib/content/cities.ts` first: the existing nine follow this rule and the file
  documents it. A templated page with the name swapped is worse than no page.
- Service-area schema: confirm `areaServed` matches the published list.
- Google Business Profile is **not** in this repo. Report what should change
  there; do not claim to have changed it.

**Done when:** each new city page carries at least two city-specific facts, is
in `sitemap-locations.xml`, and is linked from `/service-areas/`.

### 2.3 AEO — answer engines

- Every route with commercial intent should have a 40–70 word quick answer in
  `lib/content/answers.ts` that answers the question *as asked*, with the
  qualifier attached.
- FAQ content should mirror real queries ("how much does a 2-car garage floor
  cost in Houston", "does epoxy peel in Houston heat", "how long before I can
  park on it").
- Keep FAQPage schema in sync with visible FAQs. A rich result for a question
  not on the page is a violation.

**Done when:** every quick answer passes the word-count guard, and every FAQ in
schema is visibly on the page.

### 2.4 GEO — AI visibility

- `/llms.txt` exists and is generated. Extend it rather than replacing it, and
  never hardcode a figure into it.
- Qualifiers must travel with facts, because an AI answer is quoted off-site
  where we cannot correct it: the rate never without its minimum, the warranty
  never as a bare "lifetime warranty".
- Establish a baseline: ask ChatGPT, Claude, Gemini and Perplexity the ten
  queries that matter ("best garage floor coating Houston", "epoxy garage floor
  cost Houston", etc.), record verbatim what they say and whether this business
  appears. **Record the baseline before changing anything**, or improvement is
  unmeasurable.

**Done when:** a dated baseline table exists in `docs/`, with the exact prompts
used so it can be re-run.

### 2.5 Structured data

- Validate every template against Google's Rich Results Test and Schema.org.
- Do **not** add `aggregateRating` (no reviews of this entity) or
  `priceRange` beyond the confirmed `$1,000+` already on LocalBusiness.
- Consider: `Service` nodes per system page, `HowTo` on `/our-process/`,
  `ImageObject` on project pages. Only where the page genuinely contains that
  content.

**Done when:** zero errors and zero warnings that represent a real claim, on
every template.

### 2.6 Content

- **Project pages are the priority.** Each needs real photos, a real city, real
  scope and a real blend. No invented jobs. If photos do not exist, say so and
  stop — this is the gap, and a fake case study is the worst possible fix.
- Resource articles: audit the 22 for thin or overlapping coverage; consolidate
  rather than adding more.
- Every claim must trace to something in the repo or to an owner-confirmed fact.

### 2.7 Floor Designer and conversion

- The funnel is live and instrumented. Do not restructure it for SEO.
- Safe to improve: copy clarity, step friction, mobile layout at 375px, image
  weight, the empty-state of the photo visualizer.
- `generate_lead` must keep firing exactly once after a confirmed lead. If you
  touch `app/actions/estimate.ts`, `lib/conversion.ts` or the submit handlers,
  `tests/conversion.test.ts` must still pass.

### 2.8 Measurement

- GA4 and Meta Pixel are live; `META_CAPI_ACCESS_TOKEN` is not set, so
  browser-blocked conversions are lost. Flag, do not fake.
- Set up Search Console baselines for impressions, clicks and average position
  by template before changes land.

---

## 3. HOW TO REPORT

For every change: what you changed, which file, why, and the verification output
that proves it. For everything you did not do: say so plainly and why.

Never report completion without the production run of `verify-site.mjs`.

If a task in this document conflicts with section 0, section 0 wins — say so in
the report rather than quietly resolving it.
