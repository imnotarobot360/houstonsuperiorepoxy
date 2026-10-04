import type { RoughEstimate } from '@/lib/garage-measurement'
import type { MeasurementMode } from '@/lib/garage-measurement'

/*
  WHEN a lead conversion may fire, and WHAT it carries.

  WHY THIS IS NOT JUST AN `if` IN THE SUBMIT HANDLER. A conversion event is the
  number an ad platform spends money against. Fire it early and the account
  learns to buy people who click; fire it twice and the cost per lead halves on
  paper while the phone rings exactly as often as before. Neither failure shows
  up in the UI — the page looks perfect in both cases — so the rule has to live
  somewhere a test can reach it.

  The decision is a pure function of four facts. The component owns the ref and
  the actual gtag/fbq calls; it does not own the rule.
*/

export type SubmitOutcome =
  | { kind: 'not_submitted' }
  | { kind: 'validation_failed' }
  | { kind: 'server_rejected' }
  | { kind: 'accepted'; stored: boolean }

export type ConversionDecision = { fire: true } | { fire: false; reason: string }

/*
  The one rule, stated once.

  `accepted` means the server action returned ok — the lead reached the
  business, either as a database row or as a notification email the owner will
  act on. Both are a customer. A conversion claims "someone asked us to quote
  their garage", and in both cases someone did.

  Everything else is NOT a conversion:
    - not_submitted     — looking at the estimate is not a lead. The most
                          common way to inflate this number is to fire on the
                          estimate appearing, because that is when the page
                          feels successful.
    - validation_failed — a missing phone number is not a customer.
    - server_rejected   — neither is a lead the server refused.
    - already fired     — the same customer twice is a lie about volume. React
                          development mode double-invokes, and a customer who
                          corrects a server-side error submits this handler
                          more than once.
*/
export function decideConversion(input: {
  outcome: SubmitOutcome
  alreadyFired: boolean
}): ConversionDecision {
  if (input.alreadyFired) return { fire: false, reason: 'already_fired' }
  switch (input.outcome.kind) {
    case 'not_submitted':
      return { fire: false, reason: 'not_submitted' }
    case 'validation_failed':
      return { fire: false, reason: 'validation_failed' }
    case 'server_rejected':
      return { fire: false, reason: 'server_rejected' }
    case 'accepted':
      return { fire: true }
  }
}

/*
  What rides along with the conversion.

  CONTAINS NO PERSONAL DATA, deliberately and permanently. Name, phone, email,
  address and ZIP are absent — GA4 forbids sending them and Meta would hash
  them, and neither is needed to value a lead. What is here is the job: what it
  is worth, how big it is, and whether the square footage was measured or
  assumed, so a later look at which leads converted can tell those apart.

  `value` is the ROUGH estimate, not revenue. It is the right number to
  optimise toward — a 600 sq ft garage is worth more than a 200 — but it is not
  what the customer will be invoiced, and any revenue reporting built on it
  needs to know that.
*/
export function leadConversionParams(input: {
  estimate: RoughEstimate
  measuredBy: MeasurementMode
  blendName: string
  stored: boolean
}): Record<string, string | number | boolean> {
  return {
    currency: 'USD',
    value: input.estimate.totalUsd,
    square_feet: input.estimate.squareFeet,
    rate_per_sqft: input.estimate.ratePerSqFtUsd,
    minimum_applied: input.estimate.minimumApplied,
    measured_by: input.measuredBy,
    blend: input.blendName,
    form_location: 'floor_designer',
    /*
      False when the row failed and only the notification email went out. The
      conversion still fires — the owner has the customer — but the discrepancy
      between conversions and rows in the database is then visible in the
      report instead of being a mystery.
    */
    lead_stored: input.stored,
  }
}
