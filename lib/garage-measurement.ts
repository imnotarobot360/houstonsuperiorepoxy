import {
  GARAGE_MINIMUM_PROJECT_USD,
  GARAGE_RATE_PER_SQFT_USD,
  type GarageSize,
  TYPICAL_SQFT,
} from '@/lib/pricing-config'

/*
  How a garage turns into a square footage, and a square footage into a rough
  estimate.

  WHY IT IS A MODULE AND NOT A COMPONENT. Three rules decide whether the number
  a customer sees is right, and all three are easy to get wrong in JSX:

    1. A measurement the customer actually took BEATS a preset. Always.
    2. A number that is missing, zero, negative, not a number, or not
       physically a garage produces an ERROR, never a price.
    3. The price is max(sqft x rate, minimum) and nothing else — no condition
       multiplier, no damage adder, no silent rounding of the rate.

  Keeping them here means they can be tested without rendering anything, and
  means the component cannot quietly grow a fourth rule.

  Everything below is pure. No React, no DOM, no clock.
*/

/* ----------------------------------------------------------------- the input */

/*
  THREE WAYS TO ANSWER "how big is it", which is one more than a form usually
  wants but matches how people actually know their garage: some have measured
  it, some have the square footage from a floor plan, and most just know it
  is a two-car.
*/
export const MEASUREMENT_MODES = ['preset', 'dimensions', 'area'] as const
export type MeasurementMode = (typeof MEASUREMENT_MODES)[number]

export type MeasurementInput = {
  mode: MeasurementMode
  /* Used by 'preset'. */
  preset: GarageSize | null
  /* Used by 'dimensions'. Raw strings — these come straight from inputs. */
  lengthFt: string
  widthFt: string
  /* Used by 'area'. Raw string, same reason. */
  squareFeet: string
}

export const EMPTY_MEASUREMENT: MeasurementInput = {
  mode: 'preset',
  preset: null,
  lengthFt: '',
  widthFt: '',
  squareFeet: '',
}

/* ---------------------------------------------------------------- the output */

export type MeasurementErrors = Partial<Record<'lengthFt' | 'widthFt' | 'squareFeet' | 'preset', string>>

export type Measurement =
  | {
      ok: true
      squareFeet: number
      /* Where the number came from, which decides whether it is labelled approximate. */
      source: MeasurementMode
      approximate: boolean
      /* Present only when the customer gave dimensions, so the card can show the math. */
      lengthFt: number | null
      widthFt: number | null
      errors: Record<string, never>
    }
  | { ok: false; squareFeet: null; source: MeasurementMode; approximate: false; lengthFt: null; widthFt: null; errors: MeasurementErrors }

/* ------------------------------------------------------------- plausibility

  NOT arbitrary limits — they are the boundary between "a garage" and "a typo".

  A single garage bay is about 10 ft wide and 20 ft deep. 3 ft is narrower than
  a doorway and 200 ft is longer than the building; a 5-digit square footage is
  a warehouse, and this is the garage estimator. Anything outside these is a
  slipped decimal or an extra zero, and quoting it would produce a number that
  embarrasses whoever has to walk it back.

  A value outside the range is REFUSED, not clamped. Clamping would show a
  price for a garage the customer did not describe.
*/
export const MIN_DIMENSION_FT = 3
export const MAX_DIMENSION_FT = 200
export const MIN_AREA_SQFT = 20
export const MAX_AREA_SQFT = 20_000

/*
  Parses one typed field.

  Rejects an empty string, anything non-numeric, and anything not finite. Note
  that Number('') is 0 and Number(' ') is 0, which is why the blank check comes
  first — without it a blank box would price as zero square feet.
*/
function parseNumber(raw: string): { value: number | null; reason: 'blank' | 'nan' | null } {
  const trimmed = raw.trim()
  if (!trimmed) return { value: null, reason: 'blank' }
  /* Number() accepts '0x10', '1e3' and Infinity; a tape measure does not. */
  if (!/^\d{1,7}(\.\d{1,3})?$/.test(trimmed)) return { value: null, reason: 'nan' }
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return { value: null, reason: 'nan' }
  return { value: n, reason: null }
}

function dimensionError(raw: string, label: string): string | null {
  const { value, reason } = parseNumber(raw)
  if (reason === 'blank') return `Enter the ${label} in feet.`
  if (reason === 'nan' || value == null) return `Enter the ${label} as a number, in feet.`
  if (value <= 0) return `The ${label} has to be more than zero.`
  if (value < MIN_DIMENSION_FT) return `${value} ft is smaller than any garage — check the ${label}.`
  if (value > MAX_DIMENSION_FT) return `${value} ft is larger than any garage — check the ${label}.`
  return null
}

/* Cents, not dollars: the rate has a half-cent in it, so rounding anywhere
   coarser than this drifts. */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/*
  THE PRECEDENCE RULE, in one function.

  'dimensions' and 'area' are things the customer measured, so they are exact.
  'preset' is this codebase's assumption about a typical bay, so it is
  approximate and says so. There is no mode in which a preset overrides a
  measurement — the customer standing in the garage with a tape knows more
  than TYPICAL_SQFT does.
*/
export function resolveSquareFeet(input: MeasurementInput): Measurement {
  const fail = (errors: MeasurementErrors): Measurement => ({
    ok: false,
    squareFeet: null,
    source: input.mode,
    approximate: false,
    lengthFt: null,
    widthFt: null,
    errors,
  })

  if (input.mode === 'dimensions') {
    const errors: MeasurementErrors = {}
    const lengthError = dimensionError(input.lengthFt, 'length')
    const widthError = dimensionError(input.widthFt, 'width')
    if (lengthError) errors.lengthFt = lengthError
    if (widthError) errors.widthFt = widthError
    if (lengthError || widthError) return fail(errors)

    const lengthFt = Number(input.lengthFt.trim())
    const widthFt = Number(input.widthFt.trim())
    const squareFeet = round2(lengthFt * widthFt)

    /* Both sides can be plausible on their own and still multiply to something
       that is not a garage — 200 x 200 is four acres. */
    if (squareFeet > MAX_AREA_SQFT) {
      return fail({
        lengthFt: `${lengthFt} ft × ${widthFt} ft is ${squareFeet.toLocaleString('en-US')} sq ft — larger than we estimate online. Call us and we will measure it.`,
      })
    }
    if (squareFeet < MIN_AREA_SQFT) {
      return fail({ lengthFt: `${lengthFt} ft × ${widthFt} ft is only ${squareFeet} sq ft — check the measurements.` })
    }

    return { ok: true, squareFeet, source: 'dimensions', approximate: false, lengthFt, widthFt, errors: {} }
  }

  if (input.mode === 'area') {
    const { value, reason } = parseNumber(input.squareFeet)
    if (reason === 'blank') return fail({ squareFeet: 'Enter the square footage.' })
    if (reason === 'nan' || value == null) return fail({ squareFeet: 'Enter the square footage as a number.' })
    if (value <= 0) return fail({ squareFeet: 'Square footage has to be more than zero.' })
    if (value < MIN_AREA_SQFT) return fail({ squareFeet: `${value} sq ft is smaller than any garage — check the figure.` })
    if (value > MAX_AREA_SQFT) {
      return fail({
        squareFeet: `${value.toLocaleString('en-US')} sq ft is larger than we estimate online. Call us and we will measure it.`,
      })
    }
    return { ok: true, squareFeet: round2(value), source: 'area', approximate: false, lengthFt: null, widthFt: null, errors: {} }
  }

  /* preset */
  if (!input.preset) return fail({ preset: 'Choose a garage size, or enter your measurements.' })
  const typical = TYPICAL_SQFT[input.preset]
  if (typical == null) {
    /*
      "Larger" and "Other / Not Sure" have no assumed area on purpose. This is
      not an error the customer made, so it reads as an instruction rather than
      a complaint — and it is the honest answer: we cannot price it from a
      label.
    */
    return fail({ preset: 'Enter your measurements and we can price it — this size varies too much to assume.' })
  }
  return { ok: true, squareFeet: typical, source: 'preset', approximate: true, lengthFt: null, widthFt: null, errors: {} }
}

/* ------------------------------------------------------------------- pricing */

export type RoughEstimate = {
  squareFeet: number
  ratePerSqFtUsd: number
  /* sqft x rate, before the floor is applied. Shown so the math is checkable. */
  calculatedUsd: number
  /* What the customer is quoted: the calculated figure or the minimum. */
  totalUsd: number
  minimumUsd: number
  minimumApplied: boolean
}

/*
  max(sqft x rate, minimum).

  The ONE arithmetic rule. Nothing in this function reads slab condition,
  damage, finish or timeframe, and nothing may be added that does — the spec
  calls that a hidden multiplier, and it is: the customer cannot see it, cannot
  check it, and finds out at the quote.
*/
export function roughEstimate(squareFeet: number): RoughEstimate {
  const calculatedUsd = round2(squareFeet * GARAGE_RATE_PER_SQFT_USD)
  const minimumApplied = calculatedUsd < GARAGE_MINIMUM_PROJECT_USD
  return {
    squareFeet,
    ratePerSqFtUsd: GARAGE_RATE_PER_SQFT_USD,
    calculatedUsd,
    totalUsd: minimumApplied ? GARAGE_MINIMUM_PROJECT_USD : calculatedUsd,
    minimumUsd: GARAGE_MINIMUM_PROJECT_USD,
    minimumApplied,
  }
}

/* --------------------------------------------------------------- formatting */

/* Always two decimals. "$1,800" and "$1,800.00" are the same number, but the
   second one reads as a price rather than a round-number guess. */
export function usd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* Areas are whole numbers unless the customer gave a fractional dimension. */
export function sqft(n: number): string {
  return `${Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { maximumFractionDigits: 2 })} sq ft`
}

/*
  The arithmetic as one line of text, e.g.

    "20 ft × 20 ft = 400 sq ft × $4.50/sq ft = $1,800.00"

  Shown to the customer and written onto the lead, so the office and the
  customer are reading the same sentence.
*/
export function explainMath(m: Measurement, estimate: RoughEstimate): string {
  const dims = m.ok && m.lengthFt != null && m.widthFt != null ? `${m.lengthFt} ft × ${m.widthFt} ft = ` : ''
  const area = `${sqft(estimate.squareFeet)}${m.ok && m.approximate ? ' (approx.)' : ''}`
  const base = `${dims}${area} × ${usd(estimate.ratePerSqFtUsd)}/sq ft = ${usd(estimate.calculatedUsd)}`
  if (!estimate.minimumApplied) return base
  return `${base}, below the ${usd(estimate.minimumUsd)} minimum — so ${usd(estimate.totalUsd)}`
}
