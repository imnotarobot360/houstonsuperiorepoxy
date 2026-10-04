/*
  SINGLE SOURCE OF TRUTH for every number the garage-floor estimator uses.

  The spec is explicit on two points that shape this whole file:
    1. "Create a single editable pricing configuration. Do not spread numbers
       through multiple components." — so every dollar figure, rate and area
       assumption lives HERE and nowhere else. The estimator UI imports values;
       it never hardcodes its own.
    2. "Do not invent unapproved adjustments. If no complete approved pricing
       matrix exists, build the configuration structure and identify every
       value that requires owner approval before activating the calculator."

  WHAT IS CONFIRMED (owner-supplied, safe to render as real figures):
    - One-car garage:                        starting at $1,000
    - Qualifying standard two-car garage:    starting at $1,800
      (bare, sound concrete; no existing-coating removal or major repairs)

  WHAT IS NOT CONFIRMED (structure only, value = null, must NOT be rendered):
    - per-square-foot rates by finish system
    - condition / damage adjustments
    - added-surface pricing (stem walls, steps, apron)
    - any high end of a numeric range

  THE GATE: `calculatorEnabled` is false. While false, the estimator shows the
  two confirmed STARTING points (or "priced after inspection" for sizes with no
  confirmed anchor) and never fabricates a low–high range. When the owner
  approves a full matrix, fill the null values and flip this one flag — the
  computed range activates everywhere at once, no component changes required.

  This mirrors the existing withdrawn-price policy in lib/site.ts: unconfirmed
  money is a structural placeholder, never published text.
*/

export const calculatorEnabled = false

/* ------------------------------------------- APPROVED rough-estimate pricing

  OWNER-APPROVED 2026-10-04 and therefore NOT gated: a flat rate and a floor.
  These are the only two numbers behind the Floor Designer's rough estimate.

    rough estimate = max(square feet x $4.50, $1,000)

  WHY THIS SITS BESIDE THE GATED MATRIX RATHER THAN REPLACING IT. The matrix
  above models a low–high band that varies by finish, slab condition, damage
  and added surfaces, and none of those numbers are approved. This is a
  different and deliberately blunter instrument: one rate, one minimum, no
  adjustments. Slab condition and damage still get ASKED — they go on the lead
  and they are why the notice says the price can move — but they must never
  silently change the arithmetic. A customer who answers "existing coating"
  and watches the number jump has been quoted, not estimated.

  Changing the rate or the floor is a one-line edit here. Nothing else in the
  codebase may hold either figure.
*/
export const GARAGE_RATE_PER_SQFT_USD = 4.5
export const GARAGE_MINIMUM_PROJECT_USD = 1000

/*
  VERBATIM owner-supplied wording. Shown beside the price AND again above the
  lead form — both placements are required, because the two are far enough
  apart on a phone that a customer can reach the form without ever having had
  the qualifier on screen.

  Do not paraphrase, shorten or split this.
*/
export const ROUGH_ESTIMATE_NOTICE =
  'Rough estimate only. This estimate is based on the garage’s measured square footage at $4.50 per sq ft, with a $1,000 minimum. The final price may change based on the condition of the concrete, existing coatings, repairs, moisture, and other site conditions. We’ll confirm the final written price after inspecting the garage.'

/*
  The standard system, in the owner's words. Used beside the rough estimate so
  the number is attached to what it buys.

  It describes the system and NOTHING ELSE. Removal of old coatings, repairs,
  moisture treatment, stem walls and steps are deliberately absent: naming them
  here would read as "included", and they are exactly the things that move the
  final price after inspection.
*/
export const ROUGH_ESTIMATE_SYSTEM = [
  'Diamond-ground concrete',
  'Epoxy base coat',
  'Full flake broadcast',
  'Polyaspartic topcoat',
] as const

/*
  What the rough estimate does NOT cover. Stated plainly rather than left to
  the notice, because "may change based on site conditions" is vague and these
  four are the specific, common, expensive ones.
*/
export const ROUGH_ESTIMATE_EXCLUSIONS = [
  'Removing existing coatings',
  'Significant concrete repairs',
  'Moisture treatment',
  'Stem walls, steps and other added surfaces',
] as const

/* ----------------------------------------------------------- confirmed anchors */

export const CONFIRMED = {
  oneCarStartingUsd: 1000,
  /*
    The $1,800 two-car figure is CONDITIONAL. It applies only to a qualifying
    slab; anything else is "priced after inspection" rather than shown against
    this anchor. `qualifiesForTwoCarAnchor()` below is the single gate for that
    condition so the rule cannot drift between the result card and the copy.
  */
  twoCarQualifyingStartingUsd: 1800,
} as const

/* --------------------------------------------------------- estimator question sets

  These option unions are shared by the estimator UI and the (gated) compute
  function so the two cannot disagree about what a valid answer is. Labels are
  the exact strings shown to the customer.
*/

export const GARAGE_SIZES = ['1-Car', '2-Car', '3-Car', 'Larger', 'Other / Not Sure'] as const
export type GarageSize = (typeof GARAGE_SIZES)[number]

export const COATING_CONDITIONS = [
  'Bare Concrete',
  'Newly Poured Concrete',
  'Existing Epoxy or Coating',
  'Paint or Sealer',
  'Not Sure',
] as const
export type CoatingCondition = (typeof COATING_CONDITIONS)[number]

/* Multi-select. Any selection means the two-car qualifying anchor no longer applies. */
export const DAMAGE_INDICATORS = [
  'Cracks',
  'Pitting or Spalling',
  'Oil or Chemical Stains',
  'Moisture or Efflorescence',
  'None That I Can See',
] as const
export type DamageIndicator = (typeof DAMAGE_INDICATORS)[number]

/* Multi-select add-ons. */
export const ADDED_SURFACES = [
  'Stem Walls',
  'Steps',
  'Apron / Driveway Transition',
  'None',
] as const
export type AddedSurface = (typeof ADDED_SURFACES)[number]

/*
  Outcome-based system choices (spec item 4). The customer picks by result, not
  by chemistry — so the labels describe what they get, and `FINISH_META` carries
  the recommendation flag and one-line explanation shown beside each option.
  `Full-Broadcast Flake System` is the recommended default.

  These labels are the canonical finish vocabulary: the estimator renders them,
  the compute function keys the (gated) rate matrix on them, and leads.ts folds
  them into the server's accepted-values union. Renaming one means updating it
  here only.
*/
export const FINISHES = [
  'Full-Broadcast Flake System',
  'Solid-Color System',
  'Metallic Epoxy',
  'Not Sure — Recommend One',
] as const
export type Finish = (typeof FINISHES)[number]

export const RECOMMENDED_FINISH: Finish = 'Full-Broadcast Flake System'

export const FINISH_META: Record<Finish, { recommended?: boolean; blurb: string }> = {
  'Full-Broadcast Flake System': {
    recommended: true,
    blurb:
      'Mechanical preparation, an epoxy base, a full flake broadcast and a UV-stable polyaspartic topcoat. Our most durable and most requested finish.',
  },
  'Solid-Color System': {
    blurb: 'A clean, single-color coating — the most economical way to seal and protect the slab.',
  },
  'Metallic Epoxy': {
    blurb: 'A high-end, marbled metallic look. Most often chosen for showrooms and feature spaces.',
  },
  'Not Sure — Recommend One': {
    blurb: 'Tell us how the space is used and we will recommend the right system at your inspection.',
  },
}

export const TIMEFRAMES = [
  'As Soon as Possible',
  'Within 2 Weeks',
  'Within 30 Days',
  'Within 1–3 Months',
  'Just Researching',
] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

/* -------------------------------------------------- typical areas (assumptions)

  These are dimensional ASSUMPTIONS, not prices — a rough square footage used
  when the customer picks a garage size instead of measuring. Set to the
  owner's figures on 2026-10-04: 200 / 400 / 600. They were 240 / 400 / 620,
  which were this file's own guesses.

  THEY ARE NOW LOAD-BEARING. Before the rough estimate existed these only
  echoed an approximate area back; now a preset feeds the price directly, so a
  wrong number here is a wrong dollar figure in front of a customer. They are
  labelled "approx." everywhere they appear, and ANY measurement the customer
  actually enters overrides them — see resolveSquareFeet in
  lib/garage-measurement.ts, which is the only place that precedence lives.

  Null for "Larger" and "Other / Not Sure" on purpose: those cannot be turned
  into a number without measuring, so they produce no price at all rather than
  a made-up one.
*/
export const TYPICAL_SQFT: Record<GarageSize, number | null> = {
  '1-Car': 200,
  '2-Car': 400,
  '3-Car': 600,
  Larger: null,
  'Other / Not Sure': null,
}

/* ------------------------------------------------------ UNAPPROVED pricing matrix

  EVERY value here is null and MUST stay null until the owner approves it. The
  shape is intentionally complete so approval is a matter of filling numbers,
  not re-designing. `calculatorEnabled` must not be flipped to true until none
  of these are null.
*/
export const UNAPPROVED_MATRIX = {
  /* USD per square foot, by finish system. REQUIRES OWNER APPROVAL. */
  perSqFtByFinish: {
    'Full-Broadcast Flake System': { low: null, high: null },
    'Solid-Color System': { low: null, high: null },
    'Metallic Epoxy': { low: null, high: null },
    'Not Sure — Recommend One': { low: null, high: null },
  } as Record<Finish, { low: number | null; high: number | null }>,

  /* Flat or per-sqft adders by slab condition. REQUIRES OWNER APPROVAL. */
  conditionAdjustmentUsd: {
    'Existing Epoxy or Coating': null,
    'Paint or Sealer': null,
  } as Record<string, number | null>,

  /* Per-damage-type adders. REQUIRES OWNER APPROVAL. */
  damageAdjustmentUsd: {
    Cracks: null,
    'Pitting or Spalling': null,
    'Oil or Chemical Stains': null,
    'Moisture or Efflorescence': null,
  } as Record<string, number | null>,

  /* Added-surface pricing. REQUIRES OWNER APPROVAL. */
  addedSurfaceUsd: {
    'Stem Walls': null,
    Steps: null,
    'Apron / Driveway Transition': null,
  } as Record<string, number | null>,
} as const

/* ------------------------------------------------------------------- disclaimer

  VERBATIM from the spec. Do not paraphrase — this is the legally-worded
  qualifier shown with every result.
*/
export const ESTIMATE_DISCLAIMER =
  'This preliminary range is based on the information you provided and is not a binding proposal. Final pricing requires a free onsite inspection to evaluate moisture, concrete hardness, cracks, surface damage, existing coatings and required preparation. You will receive the final scope and price in writing before any work begins.'

/* What every job includes, regardless of price. Process facts, not figures. */
export const INCLUDED_STEPS = [
  'Mechanical surface preparation (diamond grinding)',
  'Crack and joint treatment as needed',
  'Full coating system with broadcast and topcoat layers',
  'Onsite moisture and slab inspection before scheduling',
] as const

/* ------------------------------------------------------------- service area (ZIP)

  ZIP qualification is intentionally SOFT (spec item 5): a supported ZIP gets a
  green "we serve your area" confirmation, and an unsupported ZIP is never
  rejected — it gets "we may still be able to help, continue for confirmation."
  So this list only drives which message shows; it never blocks a submission.

  Seeded with Greater Houston ZIP prefixes (all 3-digit ZIP areas that Houston
  metro falls under). This is a coverage HEURISTIC, not a pricing figure —
  refine it with the owner's exact serviced ZIPs when available. `770–775` and
  `77xxx`/`78xxx`-adjacent metro prefixes cover Harris, Fort Bend, Montgomery,
  Brazoria, Galveston and Waller counties.
*/
export const SUPPORTED_ZIP_PREFIXES = ['770', '771', '772', '773', '774', '775', '776', '777'] as const

export function isSupportedZip(zip: string): boolean {
  const z = zip.trim()
  if (!/^\d{5}$/.test(z)) return false
  return SUPPORTED_ZIP_PREFIXES.some((p) => z.startsWith(p))
}

export const ZIP_SUPPORTED_MESSAGE = 'Great — we serve your area.'
export const ZIP_UNSUPPORTED_MESSAGE = 'We may still be able to help. Continue for confirmation.'

/* ------------------------------------------------------------------- reviews

  GATED exactly like pricing. A star rating and review count may only be shown
  if they genuinely belong to THIS entity (the epoxy division), never borrowed
  from the parent company — publishing another entity's reviews as your own is
  false attribution that Google issues manual actions for.

  Until the owner supplies the epoxy division's OWN verified numbers, `rating`
  and `count` stay null and the proof bar shows a "Read our Google reviews" link
  with no numeric claim. Fill these (and only then) to light up the rating; the
  proof bar and any AggregateRating structured data read from here.
*/
export const REVIEWS: {
  rating: number | null
  count: number | null
  profileUrl: string | null
} = {
  rating: null,
  count: null,
  profileUrl: null,
}

export const reviewsEnabled = REVIEWS.rating != null && REVIEWS.count != null
