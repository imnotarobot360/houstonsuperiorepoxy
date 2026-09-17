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
  only to echo "calculated square footage" back to the customer when they do
  not enter exact dimensions. They never drive a published dollar figure while
  `calculatorEnabled` is false. Labeled "approx." wherever shown. Confirm and
  refine at the same time the pricing matrix is approved.
*/
export const TYPICAL_SQFT: Record<GarageSize, number | null> = {
  '1-Car': 240,
  '2-Car': 400,
  '3-Car': 620,
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
