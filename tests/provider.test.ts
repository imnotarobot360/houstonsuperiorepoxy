import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  buildPrompt,
  isProviderConfigured,
  readProviderConfig,
  resolveProvider,
} from '../lib/visualizer/provider'

/*
  Provider resolution and the failure modes.

  THE CENTRAL ASSERTION OF THIS FILE: with nothing configured, the provider is
  null. Not a stub, not a sample image, not a pre-rendered garage. A future
  change that makes an unconfigured deployment "work" by returning a stock
  picture would fail these tests, which is exactly what they are for.
*/

const KEYS = ['FLOOR_VIZ_ENDPOINT', 'FLOOR_VIZ_API_KEY', 'FLOOR_VIZ_MODEL', 'FLOOR_VIZ_TIMEOUT_MS']

function clear() {
  for (const k of KEYS) delete process.env[k]
}

afterEach(clear)

test('unconfigured: no provider, and nothing pretends otherwise', () => {
  clear()
  assert.equal(readProviderConfig(), null)
  assert.equal(isProviderConfigured(), false)
  assert.equal(resolveProvider(), null)
})

test('a key without an endpoint is still unconfigured', () => {
  clear()
  process.env.FLOOR_VIZ_API_KEY = 'sk-test'
  assert.equal(resolveProvider(), null, 'half a configuration must not resolve')
})

test('an endpoint without a key is still unconfigured', () => {
  clear()
  process.env.FLOOR_VIZ_ENDPOINT = 'https://example.invalid/edit'
  assert.equal(resolveProvider(), null)
})

test('whitespace-only values do not count as configured', () => {
  clear()
  process.env.FLOOR_VIZ_ENDPOINT = '   '
  process.env.FLOOR_VIZ_API_KEY = '\t'
  assert.equal(resolveProvider(), null)
})

test('both values present resolves a provider', () => {
  clear()
  process.env.FLOOR_VIZ_ENDPOINT = 'https://example.invalid/edit'
  process.env.FLOOR_VIZ_API_KEY = 'sk-test'
  const provider = resolveProvider()
  assert.ok(provider, 'expected a provider')
  assert.equal(provider!.id, 'http')
})

test('timeout defaults to 60s and accepts an override', () => {
  clear()
  process.env.FLOOR_VIZ_ENDPOINT = 'https://example.invalid/edit'
  process.env.FLOOR_VIZ_API_KEY = 'sk-test'
  assert.equal(readProviderConfig()!.timeoutMs, 60_000)

  process.env.FLOOR_VIZ_TIMEOUT_MS = '15000'
  assert.equal(readProviderConfig()!.timeoutMs, 15_000)
})

test('a nonsense timeout falls back rather than disabling the timeout', () => {
  clear()
  process.env.FLOOR_VIZ_ENDPOINT = 'https://example.invalid/edit'
  process.env.FLOOR_VIZ_API_KEY = 'sk-test'
  process.env.FLOOR_VIZ_TIMEOUT_MS = 'soon'
  assert.equal(readProviderConfig()!.timeoutMs, 60_000)

  process.env.FLOOR_VIZ_TIMEOUT_MS = '-1'
  assert.equal(readProviderConfig()!.timeoutMs, 60_000)
})

/* ------------------------------------------------------------------ prompt */

const BLEND = {
  slug: 'cabin-fever',
  name: 'Cabin Fever',
  family: 'Neutral',
  tone: 'mid',
  blurb: 'Grey, tan, white and black in near-equal measure.',
} as const

test('the prompt constrains the edit to the floor', () => {
  const prompt = buildPrompt(BLEND)
  assert.match(prompt, /ONLY the concrete floor/)
  assert.match(prompt, /Keep the walls, ceiling, garage door, shelving, vehicles/)
  assert.match(prompt, /Do not add, remove or move any object/)
})

test('the prompt names the chosen blend', () => {
  const prompt = buildPrompt(BLEND)
  assert.match(prompt, /Cabin Fever/)
  assert.match(prompt, /Neutral/)
})

test('the prompt forbids watermarks and added text', () => {
  assert.match(buildPrompt(BLEND), /Do not add text, logos or watermarks/)
})

test('a customer note is included but does not replace the constraints', () => {
  const prompt = buildPrompt(BLEND, 'my garage faces north')
  assert.match(prompt, /my garage faces north/)
  assert.match(prompt, /ONLY the concrete floor/)
})
