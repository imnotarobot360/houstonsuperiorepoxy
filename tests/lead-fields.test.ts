import assert from 'node:assert/strict'
import { test } from 'node:test'
import { explainMath, resolveSquareFeet, roughEstimate, EMPTY_MEASUREMENT } from '../lib/garage-measurement'
import { GARAGE_RATE_PER_SQFT_USD, RECOMMENDED_FINISH } from '../lib/pricing-config'
import { buildDesignerLeadFields, describeMeasurement } from '../lib/visualizer/lead-fields'

/*
  The lead payload.

  This is the only artefact of the whole funnel that a human being reads: the
  person who picks up the phone sees `details` and nothing else. So the
  assertions here are about whether that sentence is complete, honest about
  where its numbers came from, and short enough to survive validation.
*/

const measured = resolveSquareFeet({ ...EMPTY_MEASUREMENT, mode: 'preset', preset: '2-Car' })
const estimate = roughEstimate(400)

function ctx(over: Partial<Parameters<typeof buildDesignerLeadFields>[0]> = {}) {
  return {
    blendName: 'Cabin Fever',
    blendFamily: 'Neutral',
    blendTone: 'mid',
    finish: RECOMMENDED_FINISH,
    garageSize: '2-Car (approx. 400 sq ft)',
    measuredBy: 'preset' as const,
    squareFeet: 400,
    squareFeetApproximate: true,
    slabCondition: 'Bare Concrete',
    estimate,
    mathLine: explainMath(measured, estimate),
    ...over,
  }
}

/* ------------------------------------------------------------ the price fields */

test('the lead carries the rough estimate, its rate and its square footage', () => {
  /*
    The total and the rate live in `details` rather than in fields of their
    own, because `details` is the column that is actually stored — see the note
    in lead-fields.ts. Asserting on the sentence is therefore asserting on what
    reaches the office.
  */
  const fields = buildDesignerLeadFields(ctx())
  assert.equal(fields.estimate_sqft, '400')
  assert.match(fields.details, /\$1,800\.00/)
  assert.match(fields.details, new RegExp('\\$' + GARAGE_RATE_PER_SQFT_USD.toFixed(2) + '/sq ft'))
})

test('the headline the customer email prints says ROUGH', () => {
  /* It lands in an email the customer keeps and may wave at us later. If it
     says "$1,800.00" with no qualifier, that is what they will remember
     agreeing to. */
  const fields = buildDesignerLeadFields(ctx())
  assert.match(fields.estimate_headline, /Rough estimate/)
  assert.match(fields.estimate_headline, /\$1,800\.00/)
})

test('the minimum being applied is flagged, not hidden', () => {
  /* A $1,000 lead on a 200 sq ft garage is a different conversation from a
     $1,000 lead that calculated to $1,000, and the office should know which. */
  const small = resolveSquareFeet({ ...EMPTY_MEASUREMENT, mode: 'preset', preset: '1-Car' })
  const e = roughEstimate(200)
  const fields = buildDesignerLeadFields(
    ctx({ squareFeet: 200, estimate: e, mathLine: explainMath(small, e), garageSize: '1-Car' }),
  )
  assert.match(fields.details, /minimum/i)
  assert.match(fields.details, /\$1,000\.00/)
})

test('the details line shows the arithmetic, so the office can check it', () => {
  const fields = buildDesignerLeadFields(ctx())
  assert.match(fields.details, /Rough estimate: \$1,800\.00/)
  assert.match(fields.details, /400 sq ft/)
})

/* -------------------------------------------------- where the number came from */

test('a preset is reported as an ASSUMPTION, in capitals', () => {
  /* The estimator who turns up needs to know whether to re-measure. */
  const line = describeMeasurement({ measuredBy: 'preset', squareFeet: 400, squareFeetApproximate: true })
  assert.match(line, /APPROXIMATE/)
  assert.match(line, /not measured/)
})

test('a measured garage is reported as measured', () => {
  assert.match(
    describeMeasurement({ measuredBy: 'dimensions', squareFeet: 576, squareFeetApproximate: false }),
    /length x width/,
  )
  assert.match(
    describeMeasurement({ measuredBy: 'area', squareFeet: 528, squareFeetApproximate: false }),
    /entered by the customer/,
  )
})

test('the measurement note reaches the details line', () => {
  assert.match(buildDesignerLeadFields(ctx()).details, /APPROXIMATE/)
  const m = resolveSquareFeet({ ...EMPTY_MEASUREMENT, mode: 'dimensions', lengthFt: '24', widthFt: '24' })
  const e = roughEstimate(576)
  const fields = buildDesignerLeadFields(
    ctx({
      measuredBy: 'dimensions',
      squareFeet: 576,
      squareFeetApproximate: false,
      estimate: e,
      mathLine: explainMath(m, e),
      garageSize: '24 ft × 24 ft (576 sq ft)',
    }),
  )
  assert.doesNotMatch(fields.details, /APPROXIMATE/)
  assert.match(fields.details, /24 ft/)
})

/* --------------------------------------------------------- lead submission */

test('the details line carries blend, garage, slab and estimate', () => {
  const fields = buildDesignerLeadFields(ctx())
  assert.match(fields.details, /Cabin Fever/)
  assert.match(fields.details, /Garage: 2-Car/)
  assert.match(fields.details, /Slab: Bare Concrete/)
  assert.match(fields.details, /Rough estimate:/)
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

test('a failed preview never costs the lead its price', () => {
  /*
    THE RULE THE WHOLE FUNNEL HANGS ON: image generation is a nice-to-have and
    the estimate is the product. An exception path that returned early and lost
    the blend, the size and the price along with the image would turn a
    customer into nothing.
  */
  const fields = buildDesignerLeadFields(ctx({ visualizationPathname: null, visualizationAttempted: true }))
  assert.match(fields.details, /Cabin Fever/)
  assert.match(fields.details, /Garage: 2-Car/)
  assert.match(fields.details, /\$1,800\.00/, 'the price must still reach the office')
  assert.ok(fields.estimate_headline)
})

test('every field is a string, because FormData carries nothing else', () => {
  const fields = buildDesignerLeadFields(ctx({ visualizationPathname: 'visualizations/x.png' }))
  for (const [key, value] of Object.entries(fields)) {
    assert.equal(typeof value, 'string', `${key} must be a string`)
  }
})

/* ------------------------------------------------- the 2000-character cliff */

test('the details line stays well inside the limit that would REJECT the lead', () => {
  /*
    lib/leads.ts validates `details` with z.string().max(2000), and zod's max
    REJECTS rather than truncates — so a details line that outgrows 2000
    characters does not lose its tail, it fails the whole submission and the
    lead is never captured.

    The line got longer when the arithmetic went onto it, which is exactly when
    a limit like this starts to matter. This builds the worst case — longest
    blend name, longest enum values, a measured garage so the dimensions are
    spelled out, and a full blob pathname.
  */
  const m = resolveSquareFeet({ ...EMPTY_MEASUREMENT, mode: 'dimensions', lengthFt: '123.75', widthFt: '101.25' })
  const e = roughEstimate(m.squareFeet!)
  const worst = buildDesignerLeadFields({
    blendName: 'Stonehenge Charcoal Pearl',
    blendFamily: 'Cool Grey',
    blendTone: 'mid',
    finish: 'Full-Broadcast Flake System',
    garageSize: '123.75 ft × 101.25 ft (12,529.69 sq ft)',
    measuredBy: 'dimensions',
    squareFeet: m.squareFeet!,
    squareFeetApproximate: false,
    slabCondition: 'Existing Epoxy or Coating',
    estimate: e,
    mathLine: explainMath(m, e),
    visualizationPathname: 'visualizations/1730000000000-stonehenge-charcoal-pearl-a1b2c3d4e5f6.png',
    visualizationAttempted: true,
  })

  assert.ok(
    worst.details.length < 1000,
    `details is ${worst.details.length} characters; the lead is rejected above 2000, so losing half the headroom means something needs splitting out of this line`,
  )
})
