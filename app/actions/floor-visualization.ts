'use server'

import { headers } from 'next/headers'
import { put } from '@vercel/blob'
import { flakeBlends } from '@/lib/content/flake-blends'
import { checkPhotoParts } from '@/lib/visualizer/validation'
import { resolveProvider, type VisualizationFailure } from '@/lib/visualizer/provider'
import { checkAndRecord, clientIpFrom } from '@/lib/visualizer/rate-limit'

/*
  Generates a floor visualization from a photo the visitor took of their own
  garage, and returns it as a data URL for immediate display.

  WHAT THIS DELIBERATELY DOES NOT DO:

  - It does not fall back to a stock or pre-rendered image when generation
    fails. Every failure is reported as a failure. See the rule at the top of
    lib/visualizer/provider.ts.
  - It does not log the image, its bytes, its name, or any data URL. Failures
    log a code and the provider's status, nothing that reconstructs a
    photograph of somebody's home.
  - It does not touch the lead. Generation happens while the visitor is still
    deciding; the lead is submitted later by the existing action, and a failure
    here must never block that. The Floor Designer keeps working with the
    stylized preview no matter what this returns.

  Storage follows the estimator's existing photo path exactly: @vercel/blob with
  `access: 'private'`, because these are pictures of a customer's home. The
  ORIGINAL upload is not stored at all — only the generated result, and only so
  the office can see what the customer was shown. If no result is generated,
  nothing is stored.

  ────────────────────────────────────────────────────────────────────────────
  RATE LIMITING: per IP, with a global ceiling behind it, counted in Postgres.
  See lib/visualizer/rate-limit.ts for why each of those was chosen, and why it
  fails closed.

  THE TABLE IS NOT CREATED YET. sql/visualization-rate-limit.sql holds the DDL
  and has deliberately not been applied — applying it is a production database
  change. Until it exists the limiter cannot read its store and refuses, so
  photo previews are off rather than unmetered. Apply the SQL before setting
  FLOOR_VIZ_API_KEY, in that order: the dangerous state is a configured
  provider with no ceiling, never a missing table.

  The lead form's honeypot (HONEYPOT_FIELD in lib/leads.ts) is not a substitute
  here. It works there because bots fill forms blindly; this endpoint is called
  directly.
  ────────────────────────────────────────────────────────────────────────────
*/

export type VisualizationResponse =
  | {
      ok: true
      /** data: URL for immediate display — never a provider URL, never a public blob. */
      dataUrl: string
      /** Private blob pathname, carried into the lead's details line. */
      pathname: string | null
      blendSlug: string
    }
  | { ok: false; code: VisualizationFailure | 'invalid' | 'rate_limited'; message: string }

/* Visitor-facing text for each failure. Specific enough to act on, vague enough
   not to leak operational detail to the public. */
const MESSAGES: Record<VisualizationFailure | 'invalid' | 'rate_limited' | 'rate_limited_unavailable', string> = {
  not_configured:
    'Photo previews are not switched on yet. The colour preview on this page still works, and we bring physical samples to every estimate.',
  auth: 'Photo previews are temporarily unavailable. Please use the colour preview for now — everything else on this page still works.',
  rejected:
    'That photo could not be used. A straight-on shot of the floor, taken in good light with the garage door open, works best.',
  unavailable: 'The preview service is busy. Give it a moment and try again.',
  timeout: 'That took too long to generate. Try again, or carry on with the colour preview.',
  error: 'Something went wrong generating the preview. You can try again, or carry on with the colour preview.',
  invalid: 'That file could not be used. Use a photo from your camera or gallery.',
  rate_limited:
    'You have generated a lot of previews in a short time. The colour preview on this page still works in the meantime.',
  /* Fail-closed path: the limiter could not reach its store. Says nothing about
     why, because the visitor cannot act on a database problem. */
  rate_limited_unavailable:
    'Photo previews are briefly unavailable. The colour preview on this page still works — please try again shortly.',
}

export async function generateFloorVisualization(formData: FormData): Promise<VisualizationResponse> {
  const file = formData.get('photo')
  const blendSlug = String(formData.get('blendSlug') ?? '')
  const note = String(formData.get('note') ?? '').slice(0, 300)

  if (!(file instanceof File)) {
    return { ok: false, code: 'invalid', message: MESSAGES.invalid }
  }

  /*
    SERVER-SIDE VALIDATION IS THE REAL ONE. The component checks first so the
    visitor hears immediately, but this action is reachable without the page.
  */
  const check = checkPhotoParts(file.type, file.size, file.name)
  if (!check.ok) {
    return { ok: false, code: 'invalid', message: check.reason.message }
  }

  const blend = flakeBlends.find((b) => b.slug === blendSlug)
  if (!blend) {
    return { ok: false, code: 'invalid', message: 'That colour is no longer available. Pick another blend.' }
  }

  /*
    Resolved per request rather than at module load, so adding the environment
    variables and redeploying is enough — no code change, and the "not
    configured" state is reported honestly rather than crashing.
  */
  const provider = resolveProvider()
  if (!provider) {
    return { ok: false, code: 'not_configured', message: MESSAGES.not_configured }
  }

  /*
    THE LIMIT IS CHECKED HERE, AFTER THE PROVIDER RESOLVES AND BEFORE THE CALL.

    Order matters in both directions. Later than this and the spend has already
    happened. Earlier — before resolveProvider — and every call on an
    unconfigured deployment would write a counter row for a request that costs
    nothing, turning a free short-circuit into database traffic and filling a
    table of IP hashes for no reason.

    It also records the attempt, so a request that is dispatched is always
    counted even if the provider then fails.
  */
  const rate = await checkAndRecord(clientIpFrom(await headers()))
  if (!rate.allowed) {
    return {
      ok: false,
      code: 'rate_limited',
      message:
        rate.scope === 'unavailable'
          ? MESSAGES.rate_limited_unavailable
          : `${MESSAGES.rate_limited} Try again in about ${rate.retryAfterMinutes} minutes.`,
    }
  }

  let result
  try {
    result = await provider.generate({
      photo: await file.arrayBuffer(),
      photoType: file.type.split(';')[0]!.trim().toLowerCase(),
      blend,
      note: note || undefined,
    })
  } catch (error) {
    /* A throw from the adapter is still a failure, not a reason to show nothing
       at all — and the message is the adapter's, which never carries bytes. */
    console.log('[viz] provider threw:', error instanceof Error ? error.message : 'unknown')
    return { ok: false, code: 'error', message: MESSAGES.error }
  }

  if (!result.ok) {
    /* Code and detail only. No file name, no size, no image. */
    console.log(`[viz] generation failed: ${result.failure}${result.detail ? ` (${result.detail})` : ''}`)
    return { ok: false, code: result.failure, message: MESSAGES[result.failure] }
  }

  const bytes = Buffer.from(result.image)
  const dataUrl = `data:${result.imageType};base64,${bytes.toString('base64')}`

  /*
    Storing the RESULT is best-effort. If the blob write fails the visitor still
    sees their preview — losing the office's copy is not a reason to throw away
    a working visualization in front of the customer.
  */
  let pathname: string | null = null
  try {
    /* Extension follows the provider's actual type — hardcoding .png here
       stored JPEG results under a lying filename. */
    const ext = result.imageType === 'image/jpeg' ? 'jpg' : result.imageType.split('/')[1] || 'png'
    const blob = await put(`visualizations/${Date.now()}-${blend.slug}.${ext}`, bytes, {
      access: 'private',
      addRandomSuffix: true,
      contentType: result.imageType,
    })
    pathname = blob.pathname
  } catch (error) {
    console.log('[viz] result not archived:', error instanceof Error ? error.message : 'unknown')
  }

  return { ok: true, dataUrl, pathname, blendSlug: blend.slug }
}
