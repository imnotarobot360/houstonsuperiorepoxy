import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  checkAndRecord,
  GLOBAL_WINDOW_MS,
  hashIp,
  PER_IP_WINDOW_MS,
  perIpLimit,
  type RateStore,
} from '../lib/visualizer/rate-limit'

/*
  checkAndRecord against a fake store.

  WHY NOT A REAL DATABASE: the only one this project has is production Neon.
  A suite that reaches for it is useless offline and dangerous online, so the
  orchestration takes a store and these tests supply one that counts calls in
  memory. What is being checked is the SEQUENCE and the ARITHMETIC — which
  window is queried, whether a refusal records, whether a failure fails closed
  — none of which is a property of Postgres.

  The clock and the sampler are injected for the same reason: a test that
  cannot fix them cannot assert the window or the prune.
*/

const KEYS = ['VIZ_RATE_PER_IP', 'VIZ_RATE_GLOBAL']
afterEach(() => {
  for (const k of KEYS) delete process.env[k]
})

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0)

type Call = { op: string; arg?: unknown }

function fakeStore(counts: { ip?: number; global?: number } = {}, fail?: 'count' | 'record' | 'prune') {
  const calls: Call[] = []
  const store: RateStore = {
    async countForIp(ipHash, since) {
      calls.push({ op: 'countForIp', arg: { ipHash, since: since.getTime() } })
      if (fail === 'count') throw new Error('relation does not exist')
      return counts.ip ?? 0
    },
    async countGlobal(since) {
      calls.push({ op: 'countGlobal', arg: { since: since.getTime() } })
      return counts.global ?? 0
    },
    async record(ipHash) {
      calls.push({ op: 'record', arg: ipHash })
      if (fail === 'record') throw new Error('insert failed')
    },
    async prune(before) {
      calls.push({ op: 'prune', arg: before.getTime() })
      if (fail === 'prune') throw new Error('delete failed')
    },
  }
  return { store, calls, ops: () => calls.map((c) => c.op) }
}

/* Never prune unless a test asks for it, so call order stays predictable. */
const NEVER_PRUNE = () => 1
const ALWAYS_PRUNE = () => 0

test('an allowed request counts, then records', async () => {
  const { store, ops } = fakeStore({ ip: 0, global: 0 })
  const result = await checkAndRecord('203.0.113.1', { store, now: NOW, random: NEVER_PRUNE })

  assert.deepEqual(result, { allowed: true })
  assert.deepEqual(ops(), ['countForIp', 'countGlobal', 'record'])
})

test('the per-IP query asks for the last hour, the global one for the last day', async () => {
  const { store, calls } = fakeStore()
  await checkAndRecord('203.0.113.1', { store, now: NOW, random: NEVER_PRUNE })

  const ipCall = calls.find((c) => c.op === 'countForIp')!.arg as { since: number }
  const globalCall = calls.find((c) => c.op === 'countGlobal')!.arg as { since: number }

  assert.equal(ipCall.since, NOW - PER_IP_WINDOW_MS)
  assert.equal(globalCall.since, NOW - GLOBAL_WINDOW_MS)
})

test('the address never reaches the store — only its hash does', async () => {
  const { store, calls } = fakeStore()
  await checkAndRecord('203.0.113.42', { store, now: NOW, random: NEVER_PRUNE })

  const serialised = JSON.stringify(calls)
  assert.doesNotMatch(serialised, /203\.0\.113\.42/, 'the raw IP must not be stored or queried')
  assert.match(serialised, new RegExp(hashIp('203.0.113.42')))
})

test('A REFUSED REQUEST IS NOT RECORDED', async () => {
  /*
    The rule that matters most here. A blocked caller never reaches the
    provider, so charging the attempt against the allowance would let them
    extend their own block indefinitely by retrying — the limit would never
    decay while they kept knocking.
  */
  const { store, ops } = fakeStore({ ip: perIpLimit(), global: 0 })
  const result = await checkAndRecord('203.0.113.1', { store, now: NOW, random: NEVER_PRUNE })

  assert.equal(result.allowed, false)
  assert.ok(!ops().includes('record'), 'a refusal must not consume allowance')
})

test('a globally refused request is not recorded either', async () => {
  process.env.VIZ_RATE_GLOBAL = '5'
  const { store, ops } = fakeStore({ ip: 0, global: 5 })
  const result = await checkAndRecord('203.0.113.1', { store, now: NOW, random: NEVER_PRUNE })

  assert.equal(result.allowed, false)
  if (result.allowed) return
  assert.equal(result.scope, 'global')
  assert.ok(!ops().includes('record'))
})

test('it FAILS CLOSED when the store is unreachable', async () => {
  /*
    The missing-table case, which is the live state of this repository: the
    DDL in sql/visualization-rate-limit.sql has not been applied, so the count
    throws. Refusing is the intended direction — allowing would mean spending
    the provider budget with no ceiling on the day the database is unwell.
  */
  const { store, ops } = fakeStore({}, 'count')
  const result = await checkAndRecord('203.0.113.1', { store, now: NOW, random: NEVER_PRUNE })

  assert.equal(result.allowed, false)
  if (result.allowed) return
  assert.equal(result.scope, 'unavailable')
  assert.ok(!ops().includes('record'), 'nothing is recorded when the limit could not be verified')
})

test('a failed record also fails closed rather than silently allowing', async () => {
  /* If the attempt cannot be written, the next caller would not see it — so
     allowing this one would quietly uncap the limit. */
  const { store } = fakeStore({ ip: 0, global: 0 }, 'record')
  const result = await checkAndRecord('203.0.113.1', { store, now: NOW, random: NEVER_PRUNE })
  assert.equal(result.allowed, false)
})

test('the prune runs when sampled, and asks for the longer window', async () => {
  const { store, calls, ops } = fakeStore()
  await checkAndRecord('203.0.113.1', { store, now: NOW, random: ALWAYS_PRUNE })

  assert.deepEqual(ops(), ['countForIp', 'countGlobal', 'record', 'prune'])
  assert.equal(calls.find((c) => c.op === 'prune')!.arg, NOW - GLOBAL_WINDOW_MS)
})

test('the prune is skipped when not sampled', async () => {
  const { store, ops } = fakeStore()
  await checkAndRecord('203.0.113.1', { store, now: NOW, random: NEVER_PRUNE })
  assert.ok(!ops().includes('prune'))
})

test('a failed prune does not refuse a request that already passed', async () => {
  /* Cleanup is maintenance. A visitor who cleared the limit must not be
     punished because a DELETE failed after their attempt was recorded. */
  const { store } = fakeStore({ ip: 0, global: 0 }, 'prune')
  const result = await checkAndRecord('203.0.113.1', { store, now: NOW, random: ALWAYS_PRUNE })
  assert.deepEqual(result, { allowed: true })
})

test('two different callers do not share an allowance', async () => {
  const a = fakeStore()
  const b = fakeStore()
  await checkAndRecord('203.0.113.1', { store: a.store, now: NOW, random: NEVER_PRUNE })
  await checkAndRecord('203.0.113.2', { store: b.store, now: NOW, random: NEVER_PRUNE })

  const hashA = a.calls.find((c) => c.op === 'record')!.arg
  const hashB = b.calls.find((c) => c.op === 'record')!.arg
  assert.notEqual(hashA, hashB)
})
