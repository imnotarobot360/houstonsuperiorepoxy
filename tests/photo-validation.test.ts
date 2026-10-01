import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from '../lib/leads'
import { checkPhotoParts, formatMegabytes } from '../lib/visualizer/validation'

/*
  Photo validation. These run against the SAME function the server action calls,
  which is the point of it being a shared module — a test that exercised a
  browser-only copy would prove nothing about what the action accepts.
*/

test('accepts a normal phone photo', () => {
  assert.equal(checkPhotoParts('image/jpeg', 2 * 1024 * 1024, 'IMG_4312.JPG').ok, true)
})

test('accepts every type the estimator already accepts', () => {
  for (const type of PHOTO_TYPES) {
    assert.equal(checkPhotoParts(type, 1024).ok, true, `${type} should be accepted`)
  }
})

test('accepts a type carrying codec parameters', () => {
  /* Some Android browsers append a charset; rejecting it kills a valid photo. */
  assert.equal(checkPhotoParts('image/jpeg; charset=utf-8', 1024).ok, true)
})

test('accepts an uppercase type', () => {
  /* iOS has been observed sending IMAGE/HEIC. */
  assert.equal(checkPhotoParts('IMAGE/HEIC', 1024).ok, true)
})

test('rejects a non-image with an actionable message', () => {
  const result = checkPhotoParts('application/pdf', 1024, 'quote.pdf')
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.reason.code, 'type')
  assert.match(result.reason.message, /JPEG/)
})

test('rejects an empty file', () => {
  const result = checkPhotoParts('image/jpeg', 0, 'broken.jpg')
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.reason.code, 'empty')
})

test('rejects a file over the shared size ceiling, and names the limit', () => {
  const result = checkPhotoParts('image/jpeg', PHOTO_MAX_BYTES + 1)
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.reason.code, 'size')
  assert.match(result.reason.message, /10 MB/)
})

test('accepts a file exactly at the ceiling', () => {
  /* Boundary: the limit is inclusive, so a 10.0MB photo must not be refused. */
  assert.equal(checkPhotoParts('image/jpeg', PHOTO_MAX_BYTES).ok, true)
})

test('the size ceiling is the estimator ceiling, not a second one', () => {
  /* Guards against someone introducing a visualizer-specific limit later: a
     visitor must not meet two different rules on the same page. */
  assert.equal(PHOTO_MAX_BYTES, 10 * 1024 * 1024)
})

test('formats megabytes for a human', () => {
  assert.equal(formatMegabytes(10 * 1024 * 1024), '10 MB')
  assert.equal(formatMegabytes(2.5 * 1024 * 1024), '2.5 MB')
})
