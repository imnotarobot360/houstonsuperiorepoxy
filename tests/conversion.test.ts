import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decideConversion, leadConversionParams, type SubmitOutcome } from '../lib/conversion'
import { roughEstimate } from '../lib/garage-measurement'

/*
  Conversion TIMING.

  Every assertion here is about a bug that would be invisible on screen. A page
  that fires its conversion on the button click looks identical to one that
  fires it after the server replies — the difference only shows up weeks later,
  as an ad account that has learned to buy clicks, or as a cost-per-lead that
  halved without the phone ringing more.
*/

const estimate = roughEstimate(400)

/* ------------------------------------------------------- when it may fire */

test('an accepted lead fires the conversion', () => {
  assert.deepEqual(decideConversion({ outcome: { kind: 'accepted', stored: true }, alreadyFired: false }), {
    fire: true,
  })
})

test('a lead the owner got by email, with no database row, still counts', () => {
  /*
    `unsaved` means the row failed but the notification went out — the owner
    has the customer's details and will call them. Suppressing this would
    under-report real business on the day the database is unwell.
  */
  const d = decideConversion({ outcome: { kind: 'accepted', stored: false }, alreadyFired: false })
  assert.equal(d.fire, true)
})

/* ---------------------------------------------------- when it must not fire */

test('merely viewing the estimate is not a conversion', () => {
  /* The most tempting mistake: the page feels successful when the price
     appears, and that is not when a customer exists. */
  const d = decideConversion({ outcome: { kind: 'not_submitted' }, alreadyFired: false })
  assert.equal(d.fire, false)
  if (d.fire) return
  assert.equal(d.reason, 'not_submitted')
})

test('a validation failure is not a conversion', () => {
  const d = decideConversion({ outcome: { kind: 'validation_failed' }, alreadyFired: false })
  assert.equal(d.fire, false)
})

test('a lead the server refused is not a conversion', () => {
  const d = decideConversion({ outcome: { kind: 'server_rejected' }, alreadyFired: false })
  assert.equal(d.fire, false)
})

test('it never fires twice, whatever the outcome', () => {
  /*
    React development mode double-invokes, and a customer who fixes a
    server-side error submits the handler again. Either would double-count the
    same person.
  */
  const outcomes: SubmitOutcome[] = [
    { kind: 'accepted', stored: true },
    { kind: 'accepted', stored: false },
    { kind: 'validation_failed' },
    { kind: 'not_submitted' },
  ]
  for (const outcome of outcomes) {
    const d = decideConversion({ outcome, alreadyFired: true })
    assert.equal(d.fire, false, `${outcome.kind} must not re-fire`)
    if (d.fire) return
    assert.equal(d.reason, 'already_fired')
  }
})

test('a rejected attempt leaves the door open for the retry', () => {
  /* The opposite failure: latching the guard on a FAILED submit, so the
     customer fixes their phone number, submits successfully, and the
     conversion never fires at all. */
  const first = decideConversion({ outcome: { kind: 'validation_failed' }, alreadyFired: false })
  assert.equal(first.fire, false)
  const retry = decideConversion({ outcome: { kind: 'accepted', stored: true }, alreadyFired: false })
  assert.equal(retry.fire, true, 'the guard must only latch on a fired conversion')
})

/* --------------------------------------------------------------- the payload */

test('the conversion carries the job, never the customer', () => {
  const params = leadConversionParams({ estimate, measuredBy: 'dimensions', blendName: 'Cabin Fever', stored: true })
  const serialized = JSON.stringify(params).toLowerCase()
  for (const forbidden of ['name', 'phone', 'email', 'zip', 'address']) {
    assert.doesNotMatch(serialized, new RegExp(forbidden), `${forbidden} must never reach an ad platform`)
  }
})

test('the value is the rough estimate, in USD', () => {
  const params = leadConversionParams({ estimate, measuredBy: 'preset', blendName: 'Cabin Fever', stored: true })
  assert.equal(params.value, 1800)
  assert.equal(params.currency, 'USD')
})

test('the payload says whether the square footage was measured or assumed', () => {
  const assumed = leadConversionParams({ estimate, measuredBy: 'preset', blendName: 'x', stored: true })
  const taped = leadConversionParams({ estimate, measuredBy: 'dimensions', blendName: 'x', stored: true })
  assert.equal(assumed.measured_by, 'preset')
  assert.equal(taped.measured_by, 'dimensions')
})

test('a lead that reached the owner but not the database is flagged', () => {
  /* So conversions outnumbering rows is explainable rather than alarming. */
  assert.equal(
    leadConversionParams({ estimate, measuredBy: 'preset', blendName: 'x', stored: false }).lead_stored,
    false,
  )
})

test('the minimum showing up in the value is visible in the payload', () => {
  /* A pile of $1,000 conversions is the floor doing its job, not demand. */
  const params = leadConversionParams({
    estimate: roughEstimate(200),
    measuredBy: 'preset',
    blendName: 'x',
    stored: true,
  })
  assert.equal(params.value, 1000)
  assert.equal(params.minimum_applied, true)
})
