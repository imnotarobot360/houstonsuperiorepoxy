import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatPhoneInput, normalizePhone } from '../lib/leads'

/*
  Phone capture.

  THE FAILURE MODE THIS FILE EXISTS FOR is not a rejected lead — it is an
  ACCEPTED one with the wrong number in it. A rejected lead is a visitor who
  tries again. A silently mangled phone number is a customer the office cannot
  reach, sitting in the admin looking perfectly valid, and nothing anywhere
  says anything is wrong.

  So every case below asserts the STORED number, not just that validation
  passed.
*/

/* The one real number on this site, used as the known-good target. */
const REAL = '3467820903'

/* How the field ends up holding a number, in the wild. */
const INPUTS: [string, string][] = [
  ['3467820903', 'typed bare'],
  ['346 782 0903', 'typed with spaces'],
  ['346-782-0903', 'typed with dashes'],
  ['346.782.0903', 'typed with dots'],
  ['(346) 782-0903', 'typed formatted'],
  ['+1 346 782 0903', 'iOS autofill'],
  ['+1 (346) 782-0903', 'Android autofill'],
  ['+13467820903', 'E.164, pasted from contacts'],
  ['1-346-782-0903', 'typed with a leading 1'],
  ['1 (346) 782-0903', 'leading 1 with formatting'],
  ['  346 782 0903  ', 'pasted with whitespace'],
]

for (const [input, how] of INPUTS) {
  test(`${how}: "${input}" reaches the office as the right number`, () => {
    const shown = formatPhoneInput(input)
    const stored = normalizePhone(shown)
    assert.equal(stored, REAL, `the field displayed "${shown}", which stores as ${stored}`)
    assert.equal(stored.length, 10)
  })
}

test('a leading 1 is dropped rather than truncating the real number', () => {
  /*
    THE REGRESSION. The old mask did digits.slice(0, 10) with no country-code
    handling, so "+1 346 782 0903" displayed as "(134) 678-2090" — ten digits,
    passes validation, completely wrong, and nobody finds out until someone
    tries to ring it.
  */
  assert.notEqual(formatPhoneInput('+1 346 782 0903'), '(134) 678-2090')
  assert.equal(formatPhoneInput('+1 346 782 0903'), '(346) 782-0903')
})

test('typing stays natural while the number is incomplete', () => {
  /* Masking as you go, without yanking a character out from under the cursor:
     a number that starts with 1 is still legitimately being typed until there
     are more than ten digits. */
  assert.equal(formatPhoneInput('3'), '3')
  assert.equal(formatPhoneInput('346'), '346')
  assert.equal(formatPhoneInput('3467'), '(346) 7')
  assert.equal(formatPhoneInput('346782'), '(346) 782')
  assert.equal(formatPhoneInput('3467820'), '(346) 782-0')
  assert.equal(formatPhoneInput('1346782090'), '(134) 678-2090', 'ten digits starting with 1 are taken at face value')
  assert.equal(formatPhoneInput('13467820903'), '(346) 782-0903', 'the eleventh digit reveals it was a country code')
})

test('extra digits past a full number are refused, not absorbed', () => {
  /* An extension typed into the phone box would otherwise silently become part
     of the number. */
  assert.equal(formatPhoneInput('3467820903123'), '(346) 782-0903')
})

test('a short number stays short rather than being padded into validity', () => {
  const stored = normalizePhone(formatPhoneInput('346782'))
  assert.equal(stored.length, 6)
  assert.notEqual(stored.length, 10, 'an incomplete number must fail validation, not pass it')
})

test('letters and symbols cannot reach the stored value', () => {
  assert.equal(normalizePhone(formatPhoneInput('call me on 346-782-0903 please')), REAL)
  assert.equal(formatPhoneInput('abc'), '')
})

test('normalizePhone and the formatter agree on what a US number is', () => {
  /* They are applied in sequence — the field formats, the server normalises —
     so a disagreement between them is a number that renders one way and stores
     another. */
  for (const [input] of INPUTS) {
    assert.equal(normalizePhone(input), normalizePhone(formatPhoneInput(input)), `disagreement on "${input}"`)
  }
})
