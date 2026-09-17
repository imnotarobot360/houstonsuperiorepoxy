import {
  ADDED_SURFACES,
  type AddedSurface,
  calculatorEnabled,
  type CoatingCondition,
  CONFIRMED,
  type DamageIndicator,
  ESTIMATE_DISCLAIMER,
  type Finish,
  type GarageSize,
  INCLUDED_STEPS,
  TYPICAL_SQFT,
  UNAPPROVED_MATRIX,
} from '@/lib/pricing-config'

/*
  Turns a set of estimator answers into the result card's contents.

  Two modes, chosen by `calculatorEnabled` in the pricing config:

  - GATED (current): never invents a low–high range. It reports the CONFIRMED
    starting anchor when one applies to the answers ($1,000 one-car, $1,800
    qualifying two-car), and otherwise says the job is priced after inspection.
    This is the honest behaviour while the pricing matrix is unapproved.

  - CALCULATED (after owner approval): multiplies square footage by the approved
    per-sqft finish rate and adds the approved condition/damage/surface
    adjustments to produce a real low–high band. Guarded so that if ANY required
    matrix value is still null it refuses to compute and falls back to gated,
    rather than treating null as zero and publishing a wrong number.

  The result object is deliberately verbose because the spec requires the card
  to explain calculated sqft, the selected system, what is included, what could
  move the price, and that an onsite inspection is still required.
*/

export type EstimatorAnswers = {
  garageSize: GarageSize
  /* Exact area if the customer entered it; otherwise null and we use the typical area. */
  squareFeetEntered: number | null
  coatingCondition: CoatingCondition
  damage: DamageIndicator[]
  addedSurfaces: AddedSurface[]
  finish: Finish
  zip: string
  timeframe: string
}

export type EstimateResult = {
  mode: 'gated' | 'calculated'
  /* Big headline, e.g. "Starting at $1,800" or "Priced after inspection". */
  headline: string
  /* Numeric band — both null in gated mode unless a single starting anchor applies. */
  low: number | null
  high: number | null
  startingAnchorUsd: number | null
  qualifiesForTwoCarAnchor: boolean
  squareFeet: number | null
  squareFeetApproximate: boolean
  finishLabel: string
  includedSteps: readonly string[]
  factorsThatMayChangePrice: string[]
  disclaimer: string
  generatedAtISO: string
}

/*
  The two-car $1,800 anchor is conditional. It applies ONLY to a standard
  two-car garage on bare, sound concrete with no existing coating and no visible
  damage. This single predicate is the only place that rule lives.
*/
export function qualifiesForTwoCarAnchor(a: EstimatorAnswers): boolean {
  if (a.garageSize !== '2-Car') return false
  if (a.coatingCondition !== 'Bare Concrete' && a.coatingCondition !== 'Newly Poured Concrete') {
    return false
  }
  const hasDamage = a.damage.some((d) => d !== 'None That I Can See')
  if (hasDamage) return false
  const hasAddedSurfaces = a.addedSurfaces.some((s) => s !== 'None')
  if (hasAddedSurfaces) return false
  return true
}

/* Human-readable list of what, given the answers, could still move the price. */
function factorsFrom(a: EstimatorAnswers): string[] {
  const factors: string[] = []
  if (a.coatingCondition === 'Existing Epoxy or Coating' || a.coatingCondition === 'Paint or Sealer') {
    factors.push('Removing the existing coating before the new system goes down')
  }
  if (a.coatingCondition === 'Not Sure') {
    factors.push('Confirming what is currently on the slab during inspection')
  }
  for (const d of a.damage) {
    if (d === 'Cracks') factors.push('Crack and joint repair')
    if (d === 'Pitting or Spalling') factors.push('Filling pitted or spalled areas')
    if (d === 'Oil or Chemical Stains') factors.push('Degreasing and treating stained concrete')
    if (d === 'Moisture or Efflorescence') factors.push('Moisture mitigation if slab testing calls for it')
  }
  for (const s of a.addedSurfaces) {
    if (s !== 'None') factors.push(`Coating the ${s.toLowerCase()}`)
  }
  factors.push('Final square footage and slab hardness measured onsite')
  return factors
}

function resolveSquareFeet(a: EstimatorAnswers): { sqft: number | null; approximate: boolean } {
  if (a.squareFeetEntered && a.squareFeetEntered > 0) {
    return { sqft: Math.round(a.squareFeetEntered), approximate: false }
  }
  const typical = TYPICAL_SQFT[a.garageSize]
  return { sqft: typical, approximate: typical != null }
}

function usd(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}

/*
  Attempts the approved-matrix calculation. Returns null (→ caller falls back to
  gated) if the calculator is disabled OR any required value is still null, so a
  missing approval can never silently become a $0 term in the total.
*/
function tryCalculate(a: EstimatorAnswers, sqft: number | null): { low: number; high: number } | null {
  if (!calculatorEnabled || sqft == null) return null

  const rate = UNAPPROVED_MATRIX.perSqFtByFinish[a.finish]
  if (!rate || rate.low == null || rate.high == null) return null

  let low = sqft * rate.low
  let high = sqft * rate.high

  const condAdj = UNAPPROVED_MATRIX.conditionAdjustmentUsd[a.coatingCondition]
  if (a.coatingCondition in UNAPPROVED_MATRIX.conditionAdjustmentUsd) {
    if (condAdj == null) return null
    low += condAdj
    high += condAdj
  }

  for (const d of a.damage) {
    if (d in UNAPPROVED_MATRIX.damageAdjustmentUsd) {
      const adj = UNAPPROVED_MATRIX.damageAdjustmentUsd[d]
      if (adj == null) return null
      high += adj
    }
  }

  for (const s of a.addedSurfaces) {
    if (s in UNAPPROVED_MATRIX.addedSurfaceUsd) {
      const adj = UNAPPROVED_MATRIX.addedSurfaceUsd[s]
      if (adj == null) return null
      low += adj
      high += adj
    }
  }

  return { low: Math.round(low), high: Math.round(high) }
}

export function computeEstimate(a: EstimatorAnswers): EstimateResult {
  const { sqft, approximate } = resolveSquareFeet(a)
  const qualifies = qualifiesForTwoCarAnchor(a)
  const calculated = tryCalculate(a, sqft)

  const base = {
    squareFeet: sqft,
    squareFeetApproximate: approximate,
    finishLabel: a.finish,
    includedSteps: INCLUDED_STEPS,
    factorsThatMayChangePrice: factorsFrom(a),
    disclaimer: ESTIMATE_DISCLAIMER,
    generatedAtISO: new Date().toISOString(),
  }

  /* CALCULATED mode — a real band from the approved matrix. */
  if (calculated) {
    return {
      ...base,
      mode: 'calculated',
      headline: `${usd(calculated.low)} – ${usd(calculated.high)}`,
      low: calculated.low,
      high: calculated.high,
      startingAnchorUsd: null,
      qualifiesForTwoCarAnchor: qualifies,
    }
  }

  /* GATED mode — confirmed starting anchors only, never an invented range. */
  let headline = 'Priced after your free inspection'
  let anchor: number | null = null
  if (a.garageSize === '1-Car') {
    anchor = CONFIRMED.oneCarStartingUsd
    headline = `Starting at ${usd(anchor)}`
  } else if (qualifies) {
    anchor = CONFIRMED.twoCarQualifyingStartingUsd
    headline = `Starting at ${usd(anchor)}`
  }

  return {
    ...base,
    mode: 'gated',
    headline,
    low: anchor,
    high: null,
    startingAnchorUsd: anchor,
    qualifiesForTwoCarAnchor: qualifies,
  }
}
