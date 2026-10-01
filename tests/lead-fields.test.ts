import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeEstimate, type EstimatorAnswers } from '../lib/estimate-calc'
import { calculatorEnabled, RECOMMENDED_FINISH } from '../lib/pricing-config'
import { buildDesignerLeadFields, describeEstimate } from '../lib/visualizer/lead-fields'

/*
  The lead payload, and the estimator rules it must not break.

  The visualizer is allowed to add context to a lead. It is NOT allowed to
  change what the estimator says, invent a figure, or turn a job the rules send
  to inspection into one with a price on it. Those are the assertions here.
*/

const BASE: EstimatorAnswers = {
  garageSize: '2-Car',
  coatingCondition: 'Bare Concrete',
  damage: [],
  addedSurfaces: [],
  finish: 'Full-Broadcast Flake System',
  squareFeetEntered: null,
  zip: '77077',
  timeframe: 'As Soon as Possible',
}

function ctx(over: Partial<Parameters<typeof buildDesignerLeadFields>[0]> = {}) {
  return {
    blendName: 'Cabin Fever',
    blendFamily: 'Neutral',
    blendTone: 'mid',
    finish: RECOMMENDED_FINISH,
    lighting: 'bright' as const,
    garageSize: '2-Car',
    slabCondition: 'Bare Concrete',
    estimate: computeEstimate(BASE),
    ...over,
  }
}

/* ------------------------------------------------- estimator rules preserved */

test('the pricing calculator is still gated', () => {
  /* If this flips, every assertion below about "no invented price" needs
     rechecking against the approved matrix — fail loudly rather than quietly. */
  assert.equal(calculatorEnabled, false)
})

test('the lead reports the estimator headline verbatim, never a derived price', () => {
  const estimate = computeEstimate(BASE)
  const fields = buildDesignerLeadFields(ctx({ estimate }))
  assert.equal(fields.estimate_headline, estimate.headline)
  assert.match(fields.details, new RegExp(estimate.headline.replace(/[$.*+?^{}()|[\]\\]/g, '\\$&')))
})

test('a size the rules price after inspection is not given a number', () => {
  /* "Other / Not Sure" has no typical square footage, so the engine cannot
     produce a band — the lead must say so rather than guess. */
  const estimate = computeEstimate({ ...BASE, garageSize: 'Other / Not Sure' })
  const fields = buildDesignerLeadFields(ctx({ estimate, garageSize: 'Other / Not Sure' }))
  assert.equal(estimate.low, null)
  assert.equal(estimate.high, null)
  assert.equal(fields.estimate_sqft, undefined, 'no square footage should be claimed')
})

test('no estimate at all is reported as absent, not as zero', () => {
  const fields = buildDesignerLeadFields(ctx({ estimate: null }))
  assert.match(fields.details, /No estimate shown/)
  assert.equal(fields.estimate_headline, undefined)
  assert.equal(fields.estimate_sqft, undefined)
  assert.doesNotMatch(fields.details, /\$0/)
})

test('describeEstimate reports the mode the engine chose', () => {
  const estimate = computeEstimate(BASE)
  assert.match(describeEstimate(estimate), /gated/)
})

/* --------------------------------------------------------- lead submission */

test('the details line carries blend, garage, slab and estimate', () => {
  const fields = buildDesignerLeadFields(ctx())
  assert.match(fields.details, /Cabin Fever/)
  assert.match(fields.details, /Garage: 2-Car/)
  assert.match(fields.details, /Slab: Bare Concrete/)
  assert.match(fields.details, /Estimate:/)
})

test('unanswered questions say so instead of being dropped', () => {
  const fields = buildDesignerLeadFields(ctx({ garageSize: null, slabCondition: null }))
  assert.match(fields.details, /Garage: not answered/)
  assert.match(fields.details, /Slab: not answered/)
})

test('a generated preview is referenced by pathname, never by image data', () => {
  const fields = buildDesignerLeadFields(
    ctx({ visualizationPathname: 'visualizations/1730-cabin-fever-abc.png', visualizationAttempted: true }),
  )
  assert.match(fields.details, /visualizations\/1730-cabin-fever-abc\.png/)
  assert.match(fields.details, /AI visualization/)
  assert.doesNotMatch(fields.details, /^data:/m)
  assert.doesNotMatch(fields.details, /base64/)
})

test('a failed preview is still recorded, so the lead is not silently thinner', () => {
  const fields = buildDesignerLeadFields(ctx({ visualizationPathname: null, visualizationAttempted: true }))
  assert.match(fields.details, /could not be generated/)
})

test('no photo attempt adds no preview line at all', () => {
  const fields = buildDesignerLeadFields(ctx({ visualizationPathname: null, visualizationAttempted: false }))
  assert.doesNotMatch(fields.details, /Garage photo preview/)
})

test('a failed preview never blocks the rest of the lead', () => {
  /* The regression this guards: an exception path that returned early and lost
     the blend, the size and the estimate along with the image. */
  const fields = buildDesignerLeadFields(ctx({ visualizationPathname: null, visualizationAttempted: true }))
  assert.match(fields.details, /Cabin Fever/)
  assert.match(fields.details, /Garage: 2-Car/)
  assert.ok(fields.estimate_headline, 'the estimate must still reach the office')
})

test('every field is a string, because FormData carries nothing else', () => {
  const fields = buildDesignerLeadFields(ctx({ visualizationPathname: 'visualizations/x.png' }))
  for (const [key, value] of Object.entries(fields)) {
    assert.equal(typeof value, 'string', `${key} must be a string`)
  }
})
