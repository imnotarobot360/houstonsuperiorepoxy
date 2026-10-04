import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  EMPTY_MEASUREMENT,
  explainMath,
  type MeasurementInput,
  MAX_AREA_SQFT,
  resolveSquareFeet,
  roughEstimate,
  usd,
} from '../lib/garage-measurement'
import { calculatorEnabled, GARAGE_MINIMUM_PROJECT_USD, GARAGE_RATE_PER_SQFT_USD } from '../lib/pricing-config'

/*
  The arithmetic a customer is shown, and the arithmetic the office has to
  honour. Worth testing precisely because it is simple: a flat rate and a floor
  are easy to write and easy to get subtly wrong — a rate read from the wrong
  place, a minimum compared after rounding, a blank box priced as zero.

  The three worked examples at the top are the owner's own, quoted in the
  spec. If one of them ever fails, the published price is wrong.
*/

const input = (over: Partial<MeasurementInput>): MeasurementInput => ({ ...EMPTY_MEASUREMENT, ...over })

/* ------------------------------------------------------- the owner's examples */

test('200 sq ft calculates to $900, so the $1,000 minimum applies', () => {
  const e = roughEstimate(200)
  assert.equal(e.calculatedUsd, 900)
  assert.equal(e.minimumApplied, true)
  assert.equal(e.totalUsd, 1000)
})

test('400 sq ft is $1,800', () => {
  const e = roughEstimate(400)
  assert.equal(e.calculatedUsd, 1800)
  assert.equal(e.minimumApplied, false)
  assert.equal(e.totalUsd, 1800)
})

test('600 sq ft is $2,700', () => {
  assert.equal(roughEstimate(600).totalUsd, 2700)
})

/* ------------------------------------------------------------- the minimum */

test('the minimum is a floor, never a surcharge', () => {
  /* The failure this guards: adding the minimum to the calculated figure
     instead of replacing it, which would make a small garage $1,900. */
  assert.equal(roughEstimate(222).totalUsd, GARAGE_MINIMUM_PROJECT_USD)
  assert.equal(roughEstimate(223).totalUsd, 1003.5)
})

test('the boundary is exact to the cent', () => {
  /* 222.23 sq ft is $1,000.035 -> $1,000.04, a cent over the floor. The
     comparison must happen on the rounded figure, or this prices at $1,000
     and the one below it prices at $1,000 too, hiding an off-by-one. */
  assert.equal(roughEstimate(222.22).totalUsd, 1000)
  assert.equal(roughEstimate(222.23).calculatedUsd, 1000.04)
  assert.equal(roughEstimate(222.23).minimumApplied, false)
})

test('money is rounded to cents, never left with floating-point dust', () => {
  const e = roughEstimate(333.33)
  assert.equal(e.calculatedUsd, 1499.99)
  assert.equal(usd(e.totalUsd), '$1,499.99')
})

test('the rate and the minimum come from the config, not from this file', () => {
  /* So that changing the owner's rate in one place changes the whole app. */
  assert.equal(roughEstimate(1000).ratePerSqFtUsd, GARAGE_RATE_PER_SQFT_USD)
  assert.equal(roughEstimate(1).minimumUsd, GARAGE_MINIMUM_PROJECT_USD)
})

/* ------------------------------------------------------------- measurements */

test('length x width becomes square footage', () => {
  const m = resolveSquareFeet(input({ mode: 'dimensions', lengthFt: '20', widthFt: '20' }))
  assert.equal(m.ok, true)
  assert.equal(m.squareFeet, 400)
  assert.equal(m.approximate, false)
})

test('square footage can be entered directly', () => {
  const m = resolveSquareFeet(input({ mode: 'area', squareFeet: '528' }))
  assert.equal(m.ok, true)
  assert.equal(m.squareFeet, 528)
  assert.equal(m.approximate, false)
})

test('a preset gives an approximate area', () => {
  const m = resolveSquareFeet(input({ mode: 'preset', preset: '2-Car' }))
  assert.equal(m.ok, true)
  assert.equal(m.squareFeet, 400)
  assert.equal(m.approximate, true, 'a preset is an assumption and must say so')
})

test('the presets are the owner’s figures', () => {
  const at = (p: '1-Car' | '2-Car' | '3-Car') => resolveSquareFeet(input({ mode: 'preset', preset: p })).squareFeet
  assert.equal(at('1-Car'), 200)
  assert.equal(at('2-Car'), 400)
  assert.equal(at('3-Car'), 600)
})

test('a real measurement beats the preset for the same garage', () => {
  /* The precedence rule. Someone who picks "2-Car" and then measures 24x24
     must be priced on 576, not on 400. */
  const preset = resolveSquareFeet(input({ mode: 'preset', preset: '2-Car' }))
  const measured = resolveSquareFeet(input({ mode: 'dimensions', preset: '2-Car', lengthFt: '24', widthFt: '24' }))
  assert.equal(preset.squareFeet, 400)
  assert.equal(measured.squareFeet, 576)
  assert.equal(roughEstimate(measured.squareFeet!).totalUsd, 2592)
})

test('sizes with no assumed area refuse to price rather than guess', () => {
  for (const preset of ['Larger', 'Other / Not Sure'] as const) {
    const m = resolveSquareFeet(input({ mode: 'preset', preset }))
    assert.equal(m.ok, false)
    assert.equal(m.squareFeet, null)
    assert.match(m.errors.preset!, /measurements/i)
  }
})

/* -------------------------------------------------------------- validation */

test('a blank box is an error, never zero square feet', () => {
  /* Number('') is 0. Without the blank check this prices an empty form at the
     $1,000 minimum, which looks like a working estimate. */
  const dims = resolveSquareFeet(input({ mode: 'dimensions', lengthFt: '', widthFt: '20' }))
  assert.equal(dims.ok, false)
  assert.ok(dims.errors.lengthFt)
  const area = resolveSquareFeet(input({ mode: 'area', squareFeet: '   ' }))
  assert.equal(area.ok, false)
  assert.ok(area.errors.squareFeet)
})

test('zero, negative and nonnumeric values are refused', () => {
  const cases: [string, string][] = [
    ['0', 'zero'],
    ['-20', 'negative'],
    ['twenty', 'words'],
    ['1e3', 'exponent notation'],
    ['0x10', 'hex'],
    ['20ft', 'a unit suffix'],
    ['Infinity', 'infinity'],
  ]
  for (const [raw, why] of cases) {
    const m = resolveSquareFeet(input({ mode: 'area', squareFeet: raw }))
    assert.equal(m.ok, false, `${why} (${raw}) must not produce a price`)
    assert.ok(m.errors.squareFeet, `${why} needs a field-level message`)
  }
})

test('implausible dimensions are refused rather than clamped', () => {
  /* Clamping would price a garage the customer never described. */
  const tiny = resolveSquareFeet(input({ mode: 'dimensions', lengthFt: '1', widthFt: '20' }))
  assert.equal(tiny.ok, false)
  const huge = resolveSquareFeet(input({ mode: 'dimensions', lengthFt: '900', widthFt: '20' }))
  assert.equal(huge.ok, false)
  assert.equal(huge.squareFeet, null, 'must not fall back to a capped value')
})

test('two plausible sides can still multiply into something that is not a garage', () => {
  const m = resolveSquareFeet(input({ mode: 'dimensions', lengthFt: '200', widthFt: '200' }))
  assert.equal(m.ok, false, '40,000 sq ft is a warehouse')
  assert.ok(m.errors.lengthFt)
})

test('the area ceiling is enforced on direct entry too', () => {
  const m = resolveSquareFeet(input({ mode: 'area', squareFeet: String(MAX_AREA_SQFT + 1) }))
  assert.equal(m.ok, false)
})

test('an error carries a message for the field that caused it', () => {
  /* Field-level, so the form can put it under the right box instead of
     printing one generic line at the top. */
  const m = resolveSquareFeet(input({ mode: 'dimensions', lengthFt: '20', widthFt: 'abc' }))
  assert.equal(m.ok, false)
  assert.equal(m.errors.lengthFt, undefined, 'the valid field must stay clean')
  assert.ok(m.errors.widthFt)
})

/* ------------------------------------------------------------ the math line */

test('the math line shows every step for a measured garage', () => {
  const m = resolveSquareFeet(input({ mode: 'dimensions', lengthFt: '20', widthFt: '20' }))
  const line = explainMath(m, roughEstimate(m.squareFeet!))
  assert.match(line, /20 ft/)
  assert.match(line, /400 sq ft/)
  assert.match(line, /\$4\.50\/sq ft/)
  assert.match(line, /\$1,800\.00/)
})

test('the math line says when the minimum took over', () => {
  const m = resolveSquareFeet(input({ mode: 'preset', preset: '1-Car' }))
  const line = explainMath(m, roughEstimate(m.squareFeet!))
  assert.match(line, /\$900\.00/, 'the calculated figure stays visible')
  assert.match(line, /minimum/)
  assert.match(line, /\$1,000\.00/)
})

test('an approximate area is labelled in the math line', () => {
  const m = resolveSquareFeet(input({ mode: 'preset', preset: '2-Car' }))
  assert.match(explainMath(m, roughEstimate(400)), /approx/i)
})

test('a measured area is not labelled approximate', () => {
  const m = resolveSquareFeet(input({ mode: 'area', squareFeet: '400' }))
  assert.doesNotMatch(explainMath(m, roughEstimate(400)), /approx/i)
})

/* ------------------------------------------------- the two engines stay apart */

test('the rough estimate does not go through the unapproved pricing matrix', () => {
  /*
    Two pricing engines now live in this codebase and they must not be
    confused for one another:

      - This one. A flat $4.50 and a $1,000 floor, approved by the owner, used
        by the Floor Designer.
      - lib/estimate-calc.ts. A low-high band that varies by finish, slab
        condition, damage and added surfaces, every value of which is still
        null and gated behind `calculatorEnabled`.

    If `calculatorEnabled` is ever flipped without filling the matrix, that
    engine starts treating nulls as numbers. This test does not stop that — it
    makes sure somebody notices, and documents that the Floor Designer's price
    is unaffected either way because it never reads the matrix at all.
  */
  assert.equal(calculatorEnabled, false, 'the low-high matrix is still unapproved')
  const e = roughEstimate(400)
  assert.equal(e.totalUsd, 1800, 'the rough estimate must not change when the gate does')
})
