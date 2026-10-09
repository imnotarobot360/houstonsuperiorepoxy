/*
  THE WARRANTY, DEFINED ONCE.

  Every warranty claim this site publishes comes from here. Before this file
  existed the term was retyped on fourteen pages, and the proof is in what the
  audit found: three pages were still promising "five-year written workmanship
  warranty" weeks after the term changed, on /about, /service-areas and in the
  FAQ rail. Nobody noticed, because nothing could notice.

  TWO RULES FOR ANYTHING ADDED BELOW.

  1. A duration is a promise. Do not publish one that is not in a signed
     document. Three of the four category terms deliberately state NO duration,
     and that is not an oversight to tidy up.

  2. The word "Lifetime" is the whole risk on this site. It is the one term a
     reader will hear as "forever and everything". It is never used bare: every
     appearance carries "Limited", every appearance is scoped to qualifying
     RESIDENTIAL installations, and whose lifetime it refers to is stated
     rather than implied.

  scripts/verify-site.mjs enforces both against the built site and against
  production, so a reintroduced "5-year" or a bare "lifetime warranty" fails a
  check rather than reaching a customer.
*/

/* ------------------------------------------------------------------ the term */

/*
  The official short wording, owner-confirmed 2026-10-09. Title case, and
  "residential" is NOT inside it — the term is the term, and the residential
  scope is carried by the sentence around it. Writing "Limited Lifetime
  residential workmanship warranty" made the scope look like part of the
  product name, which then had to be re-explained every time it appeared
  somewhere a commercial reader might be.
*/
export const WARRANTY_TERM = 'Limited Lifetime Workmanship Warranty'

/* The expanded wording, for anywhere with room for a sentence. Owner-supplied
   verbatim; do not paraphrase. */
export const WARRANTY_EXPANDED =
  'Our Limited Lifetime Workmanship Warranty remains valid for as long as the original contracting homeowner owns the property. It covers qualifying installation and adhesion failures caused by our workmanship, subject to the written warranty’s limitations and exclusions.'

/*
  THE CONTROLLING-DOCUMENT DISCLOSURE, verbatim and prominent.

  This is the sentence that keeps /warranty a summary rather than an offer. A
  webpage a customer reads before signing, describing coverage, is exactly the
  kind of thing that gets argued about later — so the page says in its own
  words that it is not the agreement.
*/
export const WARRANTY_CONTROLLING_DISCLOSURE =
  'The signed warranty document provided with your project is the controlling agreement. This webpage is a plain-language summary and does not replace the signed warranty terms.'

/*
  EFFECTIVE DATE — NOT SUPPLIED, AND NOT INVENTED.

  The policy is not retroactive: contracts signed before the effective date
  keep the five-year term they were sold. That makes the date a term of a
  contract, not a detail, and guessing it would misstate which warranty a real
  customer holds.

  Null until the owner confirms it. See OWNER_VERIFICATION_REQUIRED.md. While
  it is null the page says the date is being confirmed and points to the signed
  document, which is true and commits the business to nothing.
*/
export const WARRANTY_EFFECTIVE_DATE: string | null = null

/* ----------------------------------------------------------- scope by surface

  What is being coated decides the term. The residential Limited Lifetime term
  must never leak onto a warehouse, a patio or a commercial slab: nobody has
  agreed to underwrite a lifetime promise on industrial traffic, and a reader
  on those pages should not have to spot a qualifier to avoid being misled.
*/

export const WARRANTY_RESIDENTIAL_SCOPE =
  'qualifying residential garage floor installations'

export const WARRANTY_COMMERCIAL_STATEMENT =
  'Commercial warranty terms are provided in the written project proposal and vary by coating system, substrate condition and intended use.'

/* ------------------------------------------------------------------ coverage */

/*
  Owner-confirmed covered workmanship. Every entry names a failure caused by
  OUR work — which is the line the whole warranty sits on, and the reason the
  bubbling entry carries its own qualifier.
*/
export const WARRANTY_COVERED = [
  'Peeling or delamination caused by improper surface preparation',
  'Adhesion failure caused by improper installation',
  'Application defects attributable to Houston Superior Epoxy',
  'Failure of repairs we performed, when caused by defective workmanship',
  'Bubbling or blistering proven to result from installation error rather than slab moisture or another excluded condition',
] as const

/*
  Owner-confirmed exclusions, published in full rather than summarised.

  A warranty page that lists what is covered and hides what is not is the
  pattern this company competes against. The list is long because the honest
  one is long.
*/
export const WARRANTY_EXCLUDED = [
  'Normal wear or gradual loss of gloss',
  'Scratches, chips, impact or abuse',
  'Damage from tools, equipment, tires, dragging objects or dropped items',
  'Damage caused by chemicals outside the coating system’s rated resistance',
  'New cracks or movement in the concrete',
  'Structural movement, settlement or expansive Houston soil',
  'Moisture vapor, hydrostatic pressure or slab conditions outside the installed system’s limitations',
  'Concrete or substrate failure beneath the coating',
  'Flooding, fire, storms or other external events',
  'Improper cleaning, maintenance or customer-applied products',
  'Work, repairs or modifications performed by another contractor',
  'Damage resulting from use before the approved return-to-service time',
  'Color variation, fading or yellowing that is not caused by defective workmanship',
  'Conditions documented and disclosed to you before installation',
] as const

/*
  Who it is for. Each line is a condition of coverage, so each is stated
  plainly rather than folded into a paragraph a reader skims.
*/
export const WARRANTY_QUALIFIES = [
  'The original contracting residential customer, for as long as they own the property where we installed the coating.',
  'Coating systems we installed and that have been fully paid for.',
  'Contracts signed after the policy’s effective date. Earlier contracts keep the term they were signed under — this is not retroactive.',
  'Non-transferable to a new owner unless a signed contract explicitly says otherwise.',
] as const

/*
  THE REMEDY, stated as narrowly as it actually is.

  Repair or recoat the affected area, at our discretion, after we have looked
  at it. Not replacement of the whole floor, not cash, not consequential
  damages — and the page says so, because a customer who assumes otherwise
  finds out at the worst possible moment.
*/
export const WARRANTY_REMEDY =
  'For a qualifying workmanship claim, the remedy is repair or recoating of the affected area, at Houston Superior Epoxy’s discretion, subject to the signed warranty terms and applicable law.'

export const WARRANTY_REMEDY_EXCLUDES = [
  'Replacement of the entire floor in every case',
  'Cash refunds',
  'Consequential or incidental damages',
  'Materials supplied or installed by others',
  'Anything beyond the written warranty agreement',
] as const

/*
  Maintenance is a CONDITION of the warranty, not advice. Improper cleaning and
  customer-applied products are both excluded above, so the page has to say
  what proper looks like — otherwise the exclusion is a trap.
*/
export const WARRANTY_MAINTENANCE = [
  'Keep the floor clean. Sweep or dust-mop grit, and rinse or damp-mop with a pH-neutral cleaner.',
  'Do not use acids, solvents, bleach, citrus strippers or abrasive pads, and do not apply waxes, sealers or coatings of your own over ours.',
  'Wipe up fuel, brake fluid, battery acid and other automotive chemicals rather than leaving them to sit.',
  'Put something under jack stands, bike kickstands, ladders and dropped-point loads, and avoid dragging toolboxes and appliances across the surface.',
  'Respect the return-to-service times we give you in writing at the walkthrough. Parking on a coating before it has cured is the most common way a new floor is damaged.',
] as const

/* The claim procedure, as steps rather than prose, because somebody reading it
   has a problem and wants to know what to do. */
export const WARRANTY_CLAIM_STEPS = [
  'Call or text us and describe what the floor is doing, when you first noticed it and where it is.',
  'Send photographs if you can — a wide shot of the area and a close-up of the failure.',
  'We arrange a time to inspect the floor in person.',
] as const

export const WARRANTY_INSPECTION_STEPS = [
  'We have the right to inspect the floor before determining whether a claim qualifies, and we will want to.',
  'We look at the failure itself, the surrounding coating and the slab, and compare what we find against what was documented at the original inspection.',
  'We tell you what we think caused it and whether it qualifies under the signed warranty — including when the answer is that it does not, and why.',
] as const
