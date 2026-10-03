import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from '../lib/leads'
import { checkPhotoParts, formatMegabytes, PHOTO_ACCEPT } from '../lib/visualizer/validation'
import { MAX_EDGE } from '../lib/visualizer/prepare-photo'

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

/* ----------------------------------------- what an iPhone actually sends */

test('a file with NO type is accepted when the extension says it is a photo', () => {
  /*
    THE BUG THIS FILE EXISTS TO PREVENT RECURRING. iOS and several cloud
    pickers hand over a perfectly good HEIC or JPEG with type: "". The
    estimator refused those and told the customer "Photos need to be JPG, PNG,
    WebP or HEIC" about a file that was one — reported as "I select a picture
    and nothing happens".
  */
  for (const name of ['IMG_0421.HEIC', 'photo.jpg', 'garage.JPEG', 'shot.png', 'x.webp']) {
    assert.equal(checkPhotoParts('', 2048, name).ok, true, `${name} should be accepted with no type`)
  }
})

test('a file with no type AND no usable extension is still refused', () => {
  /* The fallback is a hint, not a bypass. */
  const result = checkPhotoParts('', 2048, 'scan.pdf')
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.reason.code, 'type')
})

test('no type and no name at all is refused rather than assumed', () => {
  assert.equal(checkPhotoParts('', 2048).ok, false)
})

test('an explicit wrong type is not rescued by a photo-looking name', () => {
  /*
    Extension only speaks when the browser is silent. A file the browser says
    is a PDF stays a PDF even if it is called holiday.jpg.
  */
  assert.equal(checkPhotoParts('application/pdf', 2048, 'holiday.jpg').ok, false)
})

test('the size limit still applies to an extension-matched file', () => {
  const result = checkPhotoParts('', PHOTO_MAX_BYTES + 1, 'IMG_0421.HEIC')
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.reason.code, 'size')
})

test('the accept attribute offers extensions as well as types', () => {
  /* A picker that cannot map HEIC to a MIME type greys the file out unless the
     extension is listed — selecting it becomes impossible. */
  assert.match(PHOTO_ACCEPT, /\.heic/)
  assert.match(PHOTO_ACCEPT, /\.jpg/)
  assert.match(PHOTO_ACCEPT, /image\/jpeg/)
})

/* ------------------------------------------- the pre-upload preparation */

test('the resize ceiling is big enough for the model and small enough to send', () => {
  /*
    1536 is the long edge the photo is reduced to before upload. Guarding it
    because the two failure directions are opposite and both bad: shrink too
    far and the preview is mush, leave it too large and a phone spends ten
    seconds uploading bytes the provider throws away.
  */
  assert.equal(MAX_EDGE, 1536)
})
