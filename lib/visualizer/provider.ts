import type { FlakeBlend } from '@/lib/content/flake-blends'

/*
  The image-generation seam for the garage-photo visualizer.

  NOTHING IS CONFIGURED IN THIS REPOSITORY TODAY. There is no image-generation
  dependency, no API key, and no provider account wired up — checked, not
  assumed. So this file defines the interface and the failure modes, and
  `resolveProvider()` returns null until an operator sets the environment
  variables documented at the bottom of this file.

  THE ONE RULE THIS FILE EXISTS TO ENFORCE: a visualization is either generated
  from the customer's own photograph by a configured provider, or it does not
  exist. There is no placeholder, no stock garage, no "representative example",
  and no silently substituted pre-rendered preview. A picture of somebody
  else's floor presented as a preview of THEIR floor is a lie that the customer
  cannot detect, and this site's content policy (CONTENT-POLICY.md) already
  draws that line for installed-floor imagery. `not_configured` is a real,
  returnable outcome and the UI renders it as such.

  Equally: nothing here has been run against a live provider, because there are
  no credentials to run it against. The adapter below is written to a documented
  API shape, and it is UNVERIFIED until somebody configures a key and tries it.
  Do not describe this feature as working end to end before that happens.
*/

export type VisualizationRequest = {
  /** The customer's photo, as bytes. Never logged, never persisted by this module. */
  photo: ArrayBuffer
  photoType: string
  /** The stocked blend being previewed — drives the prompt and the sample reference. */
  blend: Pick<FlakeBlend, 'slug' | 'name' | 'family' | 'tone' | 'blurb'>
  /** Optional free-text nudge from the UI, e.g. lighting conditions. */
  note?: string
  signal?: AbortSignal
}

export type VisualizationFailure =
  /* No provider configured — the expected state of a fresh deployment. */
  | 'not_configured'
  /* Provider rejected the credentials. An operator problem, not a visitor one. */
  | 'auth'
  /* Provider refused the image (content filter, unsupported input). */
  | 'rejected'
  /* Rate limited or temporarily unavailable — retrying later is reasonable. */
  | 'unavailable'
  /* Took too long; the UI offers a retry. */
  | 'timeout'
  /* Anything else, including a shape we did not expect back. */
  | 'error'

export type VisualizationResult =
  | { ok: true; image: ArrayBuffer; imageType: string; providerId: string }
  | { ok: false; failure: VisualizationFailure; detail?: string }

export type VisualizationProvider = {
  id: string
  generate(request: VisualizationRequest): Promise<VisualizationResult>
}

/* ------------------------------------------------------------------ config */

/*
  Read lazily rather than at module load, so a missing variable is a runtime
  state the UI can report rather than a build failure, and so a test can set
  the environment per case.
*/
function env(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim().length > 0 ? v.trim() : undefined
}

export type ProviderConfig = {
  endpoint: string
  apiKey: string
  model?: string
  /*
    Sent as `quality` when the provider understands it. OpenAI's gpt-image-1
    takes low | medium | high and the difference is minutes of the customer's
    attention and real money per image.
  */
  quality?: string
  timeoutMs: number
}

export function readProviderConfig(): ProviderConfig | null {
  const endpoint = env('FLOOR_VIZ_ENDPOINT')
  const apiKey = env('FLOOR_VIZ_API_KEY')
  if (!endpoint || !apiKey) return null

  const timeoutRaw = Number(env('FLOOR_VIZ_TIMEOUT_MS') ?? '')
  return {
    endpoint,
    apiKey,
    model: env('FLOOR_VIZ_MODEL'),
    /*
      DEFAULTS TO LOW, DELIBERATELY.

      This is a sales preview that already carries "AI visualization — for
      preview only" on its face, viewed mostly on a phone, and its job is to
      answer "what would this blend look like in my garage" — not to be
      inspected at full resolution. High quality costs noticeably more per
      image and keeps somebody staring at a spinner for the privilege.

      Raise it with FLOOR_VIZ_QUALITY if the output turns out too rough on real
      customer photos; that is a judgement to make by eye, on real garages,
      rather than by picking the biggest number up front.
    */
    quality: env('FLOOR_VIZ_QUALITY') ?? 'low',
    /* 60s default: image generation is slow, and a visitor is watching a spinner. */
    timeoutMs: Number.isFinite(timeoutRaw) && timeoutRaw > 0 ? timeoutRaw : 60_000,
  }
}

export function isProviderConfigured(): boolean {
  return readProviderConfig() !== null
}

/* ----------------------------------------------------------------- prompt */

/*
  The instruction given to the model, kept here rather than in the component so
  it cannot be edited by anything the browser sends.

  WHAT IT IS FOR: the customer wants to see THEIR garage with a different floor.
  Everything that makes the photo theirs — the door, the shelving, the car, the
  light coming in — has to survive, or the result is not a preview of anything.
  So the prompt is written as a constrained edit, not as "a picture of a garage".
*/
export function buildPrompt(blend: VisualizationRequest['blend'], note?: string): string {
  return [
    'Edit this photograph of a real garage so that ONLY the concrete floor surface changes.',
    `Replace the floor with a full-broadcast decorative flake epoxy floor in the "${blend.name}" blend:`,
    `${blend.blurb}`,
    `Overall it reads as a ${blend.tone}-tone ${blend.family} floor with a satin-to-gloss clear topcoat.`,
    'The flake chips are small and densely packed, covering the surface completely — not large scattered specks.',
    'Keep the walls, ceiling, garage door, shelving, vehicles, stored objects, window light, shadows and camera angle exactly as they are.',
    'Preserve the existing lighting direction and intensity, and let the new floor reflect that light plausibly.',
    'Do not add, remove or move any object. Do not change the room geometry. Do not add text, logos or watermarks.',
    note ? `Additional context from the customer: ${note}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/* ---------------------------------------------------------------- adapter */

/*
  A generic HTTP adapter, written against the shape most hosted image-editing
  APIs expose: multipart POST with the source image plus a prompt, returning
  either image bytes or JSON carrying a base64 payload or a URL.

  IT IS UNVERIFIED. No request has ever been made from this code to a real
  endpoint, because no endpoint is configured. Treat the response parsing below
  as a starting point to be confirmed against whichever provider is chosen —
  that is cheaper than pretending a specific vendor was integrated.
*/
function httpProvider(config: ProviderConfig): VisualizationProvider {
  return {
    id: 'http',
    async generate(request) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), config.timeoutMs)

      /* Caller cancellation (component unmount, "remove photo") chains in. */
      const onAbort = () => controller.abort()
      request.signal?.addEventListener('abort', onAbort)

      try {
        const body = new FormData()
        body.set('image', new Blob([request.photo], { type: request.photoType }), 'garage.jpg')
        body.set('prompt', buildPrompt(request.blend, request.note))
        if (config.model) body.set('model', config.model)
        if (config.quality) body.set('quality', config.quality)

        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${config.apiKey}` },
          body,
          signal: controller.signal,
        })

        if (response.status === 401 || response.status === 403) {
          return { ok: false, failure: 'auth', detail: `provider returned ${response.status}` }
        }
        if (response.status === 429 || response.status >= 500) {
          return { ok: false, failure: 'unavailable', detail: `provider returned ${response.status}` }
        }
        if (response.status === 400 || response.status === 422) {
          return { ok: false, failure: 'rejected', detail: `provider returned ${response.status}` }
        }
        if (!response.ok) {
          return { ok: false, failure: 'error', detail: `provider returned ${response.status}` }
        }

        const contentType = response.headers.get('content-type') ?? ''

        /* Bytes straight back — the simplest and most common success shape. */
        if (contentType.startsWith('image/')) {
          return {
            ok: true,
            image: await response.arrayBuffer(),
            imageType: contentType.split(';')[0]!.trim(),
            providerId: 'http',
          }
        }

        /* JSON carrying base64 or a URL. */
        if (contentType.includes('json')) {
          const payload = (await response.json()) as Record<string, unknown>
          const b64 = findString(payload, ['b64_json', 'image_base64', 'base64', 'data'])
          if (b64) {
            const bytes = Buffer.from(stripDataUrl(b64), 'base64')
            return {
              ok: true,
              image: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
              imageType: 'image/png',
              providerId: 'http',
            }
          }
          const url = findString(payload, ['url', 'image_url', 'output'])
          if (url) {
            const fetched = await fetch(url, { signal: controller.signal })
            if (!fetched.ok) return { ok: false, failure: 'error', detail: 'result url fetch failed' }
            return {
              ok: true,
              image: await fetched.arrayBuffer(),
              imageType: (fetched.headers.get('content-type') ?? 'image/png').split(';')[0]!.trim(),
              providerId: 'http',
            }
          }
        }

        return { ok: false, failure: 'error', detail: 'unrecognised provider response shape' }
      } catch (error) {
        if (controller.signal.aborted) return { ok: false, failure: 'timeout' }
        /* The message may name the endpoint; it never contains image bytes. */
        return { ok: false, failure: 'error', detail: error instanceof Error ? error.message : 'unknown' }
      } finally {
        clearTimeout(timer)
        request.signal?.removeEventListener('abort', onAbort)
      }
    },
  }
}

/* Walks one level deep for the first string at any of the given keys. */
function findString(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const direct = payload[key]
    if (typeof direct === 'string' && direct.length > 0) return direct
  }
  for (const value of Object.values(payload)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      const nested = findString(value[0] as Record<string, unknown>, keys)
      if (nested) return nested
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = findString(value as Record<string, unknown>, keys)
      if (nested) return nested
    }
  }
  return null
}

function stripDataUrl(s: string): string {
  const comma = s.indexOf(',')
  return s.startsWith('data:') && comma > -1 ? s.slice(comma + 1) : s
}

/*
  Returns the configured provider, or null when none is set up.

  A null here is NOT an error condition to be papered over — it is the honest
  state of this repository right now, and the caller turns it into a plain
  message telling the visitor the photo preview is not available yet.
*/
export function resolveProvider(): VisualizationProvider | null {
  const config = readProviderConfig()
  return config ? httpProvider(config) : null
}

/* -------------------------------------------------------------- operators */

/*
  SETUP REQUIRED TO TURN THIS ON

    FLOOR_VIZ_ENDPOINT   (required)  Full URL of the provider's image-edit
                                     endpoint. The adapter POSTs multipart
                                     form-data with `image` and `prompt`.
    FLOOR_VIZ_API_KEY    (required)  Sent as `Authorization: Bearer <key>`.
                                     Server-side only — it must never be given
                                     a NEXT_PUBLIC_ prefix, which would compile
                                     it into the browser bundle.
    FLOOR_VIZ_MODEL      (optional)  Sent as a `model` field when the provider
                                     wants one named.
    FLOOR_VIZ_TIMEOUT_MS (optional)  Defaults to 60000.

  Set them in Vercel > Project > Settings > Environment Variables for the
  environments you want this on in, then redeploy — these are read at request
  time on the server, but a deployment is still needed for the values to exist
  in the running environment.

  BEFORE SETTING THE KEY, ADD RATE LIMITING. generateFloorVisualization is a
  public, unauthenticated action. While nothing is configured it short-circuits
  and costs nothing, so the endpoint is harmless today — but the key is exactly
  what turns it into a way for anyone to spend the image-generation budget and
  fill private storage from a script. See the block comment in
  app/actions/floor-visualization.ts for why this was flagged rather than
  guessed at.

  AFTER CONFIGURING, VERIFY BEFORE ANNOUNCING. Upload a real garage photo
  through /floor-designer and confirm: a result comes back, the room is
  recognisably the same room, and only the floor changed. The response parsing
  in httpProvider() is written to a generic shape and has never run against a
  live API, so expect to adjust it for the provider actually chosen.

  KNOWN GAP — HEIC. Validation accepts image/heic and image/heif because the
  estimator's photo upload already does, and because that is what an iPhone
  produces by default. Most hosted image APIs do NOT decode HEIC, so the first
  real iPhone upload is likely to come back as `rejected`.

  That is not papered over here, because guessing at a conversion is worse than
  naming the problem: whoever wires up a provider has to decide between picking
  one that accepts HEIC, transcoding to JPEG before the call (sharp is already a
  dependency, but its HEIC support depends on how libvips was built, so this
  needs testing rather than assuming), or narrowing PHOTO_TYPES for this path
  and telling iPhone users to change their camera format. The failure is at
  least honest and specific in the meantime.
*/
