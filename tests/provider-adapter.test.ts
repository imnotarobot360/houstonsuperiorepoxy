import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { resolveProvider } from '../lib/visualizer/provider'

/*
  The HTTP adapter's behaviour, with fetch stubbed.

  WHY THIS FILE EXISTS SEPARATELY: provider.test.ts covers whether a provider
  resolves at all. That left the ~100 lines that actually talk to a provider —
  status mapping, three success shapes, the timeout — with no coverage, which
  is the wrong way round. The adapter has never run against a real API, so the
  only thing standing between it and a wrong assumption is this file.

  Everything here asserts the MAPPING, not the vendor. When a provider is
  finally chosen and its real responses differ, these tests are where that
  difference should be encoded.
*/

const realFetch = globalThis.fetch

function configure() {
  process.env.FLOOR_VIZ_ENDPOINT = 'https://example.invalid/edit'
  process.env.FLOOR_VIZ_API_KEY = 'sk-test'
}

beforeEach(configure)
afterEach(() => {
  globalThis.fetch = realFetch
  delete process.env.FLOOR_VIZ_ENDPOINT
  delete process.env.FLOOR_VIZ_API_KEY
  delete process.env.FLOOR_VIZ_TIMEOUT_MS
})

const BLEND = {
  slug: 'cabin-fever',
  name: 'Cabin Fever',
  family: 'Neutral',
  tone: 'mid',
  blurb: 'Grey, tan, white and black.',
} as const

function request() {
  return { photo: new ArrayBuffer(8), photoType: 'image/jpeg', blend: BLEND }
}

/*
  The stub signature is deliberately loose: the cases below need to inspect the
  url and the init that the adapter passed, which a zero-argument factory
  cannot see.
*/
type FetchStub = (input?: unknown, init?: any) => Promise<Response>

function stub(response: Response | FetchStub) {
  globalThis.fetch = (typeof response === 'function'
    ? response
    : async () => response) as unknown as typeof fetch
}

/* ------------------------------------------------------------ status codes */

const STATUS_CASES: [number, string][] = [
  [401, 'auth'],
  [403, 'auth'],
  [429, 'unavailable'],
  [500, 'unavailable'],
  [503, 'unavailable'],
  [400, 'rejected'],
  [422, 'rejected'],
  [418, 'error'],
]

for (const [status, failure] of STATUS_CASES) {
  test(`HTTP ${status} maps to ${failure}`, async () => {
    stub(new Response('', { status }))
    const result = await resolveProvider()!.generate(request())
    assert.equal(result.ok, false)
    if (result.ok) return
    assert.equal(result.failure, failure)
  })
}

test('an auth failure is distinguished from a transient one', async () => {
  /* The distinction the UI depends on: auth suppresses the retry button
     because retrying cannot fix a bad key, unavailable offers it. */
  stub(new Response('', { status: 401 }))
  const auth = await resolveProvider()!.generate(request())
  stub(new Response('', { status: 429 }))
  const busy = await resolveProvider()!.generate(request())
  assert.notEqual(
    (auth as { failure: string }).failure,
    (busy as { failure: string }).failure,
  )
})

/* --------------------------------------------------------- success shapes */

test('raw image bytes come back as a result', async () => {
  stub(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/png' } }))
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.imageType, 'image/png')
  assert.equal(result.image.byteLength, 3)
})

test('a content type with parameters is normalised', async () => {
  stub(
    new Response(new Uint8Array([1]), {
      status: 200,
      headers: { 'content-type': 'image/jpeg; charset=binary' },
    }),
  )
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.imageType, 'image/jpeg', 'the parameter must not reach the data URL')
})

test('base64 JSON is decoded', async () => {
  const b64 = Buffer.from([9, 9, 9]).toString('base64')
  stub(Response.json({ b64_json: b64 }))
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.image.byteLength, 3)
})

test('a data: URL prefix is stripped before decoding', async () => {
  /* Some providers return the payload already wrapped. Decoding the prefix as
     base64 would produce bytes that are not an image. */
  const b64 = Buffer.from([7, 7]).toString('base64')
  stub(Response.json({ image_base64: `data:image/png;base64,${b64}` }))
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.image.byteLength, 2)
})

test('base64 nested one level down is still found', async () => {
  stub(Response.json({ data: [{ b64_json: Buffer.from([1]).toString('base64') }] }))
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, true)
})

test('a result URL is fetched and returned as bytes', async () => {
  let calls = 0
  stub(async (input: unknown) => {
    calls += 1
    if (calls === 1) return Response.json({ url: 'https://cdn.invalid/out.png' })
    assert.equal(String(input), 'https://cdn.invalid/out.png')
    return new Response(new Uint8Array([4, 4, 4, 4]), {
      status: 200,
      headers: { 'content-type': 'image/png' },
    })
  })
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.image.byteLength, 4)
  assert.equal(calls, 2)
})

test('a result URL that fails to fetch is an error, not a half-success', async () => {
  let calls = 0
  stub(async () => {
    calls += 1
    return calls === 1 ? Response.json({ url: 'https://cdn.invalid/out.png' }) : new Response('', { status: 404 })
  })
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, false)
})

test('an unrecognised 200 is a failure, never an empty success', async () => {
  /* The shape this guards: a provider changing its payload and the adapter
     returning ok:true with nothing in it, which the UI would render as a
     broken image where a real preview should be. */
  stub(Response.json({ status: 'queued', id: 'abc' }))
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.failure, 'error')
})

/* -------------------------------------------------------------- transport */

test('a thrown fetch is reported, not propagated', async () => {
  stub(async () => {
    throw new Error('ECONNREFUSED')
  })
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.failure, 'error')
})

test('exceeding the timeout reports a timeout', async () => {
  process.env.FLOOR_VIZ_TIMEOUT_MS = '20'
  stub(
    (_input: unknown, init: { signal?: AbortSignal } = {}) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      }) as Promise<Response>,
  )
  const result = await resolveProvider()!.generate(request())
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.failure, 'timeout', 'a slow provider must not surface as a generic error')
})

test('the caller can cancel in flight', async () => {
  /* Removing the photo or unmounting must stop the request rather than leave
     it running and resolve into a component that is gone. */
  const controller = new AbortController()
  stub(
    (_input: unknown, init: { signal?: AbortSignal } = {}) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      }) as Promise<Response>,
  )
  const pending = resolveProvider()!.generate({ ...request(), signal: controller.signal })
  controller.abort()
  const result = await pending
  assert.equal(result.ok, false)
})

/* ---------------------------------------------------------------- request */

test('the key is sent as a bearer token and never in the body', async () => {
  let seen: { headers?: Record<string, string>; body?: unknown } = {}
  stub(async (_input: unknown, init: Record<string, never> = {} as never) => {
    seen = init as never
    return new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'image/png' } })
  })
  await resolveProvider()!.generate(request())
  assert.equal((seen.headers as Record<string, string>).Authorization, 'Bearer sk-test')
  const body = seen.body as FormData
  assert.equal(body.get('api_key'), null, 'the key must not be duplicated into the form')
})

test('the prompt is sent with the image', async () => {
  let body: FormData | undefined
  stub(async (_input: unknown, init: { body?: FormData } = {}) => {
    body = init.body
    return new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'image/png' } })
  })
  await resolveProvider()!.generate(request())
  assert.ok(body, 'expected a body')
  assert.match(String(body!.get('prompt')), /ONLY the concrete floor/)
  assert.ok(body!.get('image'), 'the photo must be attached')
})
