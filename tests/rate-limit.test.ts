import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  clientIpFrom,
  decide,
  globalLimit,
  hashIp,
  perIpLimit,
  PER_IP_WINDOW_MS,
  GLOBAL_WINDOW_MS,
} from '../lib/visualizer/rate-limit'

/*
  The rate-limit POLICY, tested without a database.

  `decide` is a pure function of counts precisely so the arithmetic and the
  boundaries can be pinned here. Whether drizzle can count rows is not what is
  likely to go wrong; an off-by-one that lets the thirteenth call through is.
*/

const KEYS = ['VIZ_RATE_PER_IP', 'VIZ_RATE_GLOBAL', 'VIZ_RATE_SALT']
afterEach(() => {
  for (const k of KEYS) delete process.env[k]
})

test('a first-time caller is allowed', () => {
  assert.deepEqual(decide({ ip: 0, global: 0 }), { allowed: true })
})

test('the per-IP limit is a ceiling, not a target', () => {
  /* At the limit the next call is refused — the count is of calls already
     made, so `ip === limit` means the allowance is spent. */
  const limit = perIpLimit()
  assert.equal(decide({ ip: limit - 1, global: 0 }).allowed, true, 'one under must pass')
  assert.equal(decide({ ip: limit, global: 0 }).allowed, false, 'at the limit must refuse')
})

test('a refused per-IP caller is told which scope and when', () => {
  const result = decide({ ip: perIpLimit(), global: 0 })
  assert.equal(result.allowed, false)
  if (result.allowed) return
  assert.equal(result.scope, 'ip')
  assert.ok(result.retryAfterMinutes > 0)
})

test('the global ceiling refuses even a caller who has used nothing', () => {
  /* The backstop for somebody rotating addresses: per-IP alone would let an
     attacker with many IPs through while each one looked innocent. */
  const result = decide({ ip: 0, global: globalLimit() })
  assert.equal(result.allowed, false)
  if (result.allowed) return
  assert.equal(result.scope, 'global')
})

test('the global ceiling is checked before the per-IP one', () => {
  /* Both exceeded: the honest attribution is the budget cap, because that is
     the one that will still be refusing after this visitor's hour rolls over. */
  const result = decide({ ip: perIpLimit(), global: globalLimit() })
  assert.equal(result.allowed, false)
  if (result.allowed) return
  assert.equal(result.scope, 'global')
})

test('limits are overridable without a code change', () => {
  process.env.VIZ_RATE_PER_IP = '2'
  assert.equal(perIpLimit(), 2)
  assert.equal(decide({ ip: 1, global: 0 }).allowed, true)
  assert.equal(decide({ ip: 2, global: 0 }).allowed, false)
})

test('a nonsense override falls back instead of disabling the limit', () => {
  /* The failure mode guarded against: VIZ_RATE_PER_IP="" or "lots" silently
     becoming 0 or NaN, which would refuse everyone or allow everyone. */
  for (const bad of ['', 'lots', '0', '-5']) {
    process.env.VIZ_RATE_PER_IP = bad
    assert.equal(perIpLimit(), 12, `"${bad}" should fall back to the default`)
  }
})

test('the windows are the documented sizes', () => {
  assert.equal(PER_IP_WINDOW_MS, 60 * 60 * 1000)
  assert.equal(GLOBAL_WINDOW_MS, 24 * 60 * 60 * 1000)
  assert.ok(GLOBAL_WINDOW_MS > PER_IP_WINDOW_MS, 'pruning uses the longer window')
})

/* ------------------------------------------------------------------- ident */

test('the stored value is a hash, never the address', () => {
  const hash = hashIp('203.0.113.42')
  assert.doesNotMatch(hash, /203\.0\.113\.42/)
  assert.match(hash, /^[0-9a-f]{32}$/)
})

test('the same address hashes the same way, different ones differ', () => {
  assert.equal(hashIp('203.0.113.42'), hashIp('203.0.113.42'))
  assert.notEqual(hashIp('203.0.113.42'), hashIp('203.0.113.43'))
})

test('the salt changes the fingerprint', () => {
  const unsalted = hashIp('203.0.113.42')
  process.env.VIZ_RATE_SALT = 'something-else'
  assert.notEqual(hashIp('203.0.113.42'), unsalted)
})

test('the left-most forwarded address is the caller', () => {
  /* Vercel rewrites x-forwarded-for rather than appending, so the left-most
     entry is the real peer. Taking the last would make every caller look like
     the proxy and collapse them into one bucket. */
  const headers = new Map([['x-forwarded-for', '203.0.113.42, 70.41.3.18, 150.172.238.178']])
  assert.equal(clientIpFrom({ get: (n) => headers.get(n) ?? null }), '203.0.113.42')
})

test('x-real-ip is the fallback', () => {
  const headers = new Map([['x-real-ip', '203.0.113.9']])
  assert.equal(clientIpFrom({ get: (n) => headers.get(n) ?? null }), '203.0.113.9')
})

test('no headers degrades to one shared bucket, not to no limit', () => {
  /* The important half of this: an empty identity still hashes to something
     stable, so unknown callers share a ceiling rather than bypassing one. */
  const ip = clientIpFrom({ get: () => null })
  assert.equal(ip, '')
  assert.match(hashIp(ip), /^[0-9a-f]{32}$/)
})
