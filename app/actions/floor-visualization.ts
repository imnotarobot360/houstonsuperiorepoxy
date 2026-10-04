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
    here must never block that. The Floor Designer keeps working — colour
    picker, flake close-up, estimate and booking — no matter what this
    returns; only the preview itself is lost.

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

/*
  Visitor-facing text for each failure. Specific enough to act on, vague enough
  not to leak operational detail to the public.

  REWRITTEN 2026-10-04. Every one of these used to send the visitor to "the
  colour preview on this page", which was the stylized garage render — removed
  on 2026-10-03. They were pointing at a thing that no longer exists, which is
  worse than saying nothing: it reads as a feature the visitor cannot find.

  What actually still works when a preview fails is the part that produces a
  lead: the colour, the flake close-up, the rough estimate and the booking. So
  that is what they say now. Checked by failing a real generation against an
  unreachable endpoint, not by reading the file.
*/
const MESSAGES: Record<VisualizationFailure | 'invalid' | 'rate_limited' | 'rate_limited_unavailable', string> = {
  not_configured:
    'Photo previews are not switched on yet. You can still pick a colour and get your rough estimate below, and we bring physical samples to every estimate.',
  auth: 'Photo previews are temporarily unavailable. Your colour choice and your rough estimate below are unaffected.',
  rejected:
    'That photo could not be used. A straight-on shot of the floor, taken in good light with the garage door open, works best.',
  unavailable: 'The preview service is busy. Give it a moment and try again.',
  timeout: 'That took too long to generate. Try again, or carry on — your rough estimate below does not need the photo.',
  error:
    'Something went wrong generating the preview. You can try again, or carry on — your rough estimate below does not need the photo.',
  invalid: 'That file could not be used. Use a photo from your camera or gallery.',
  rate_limited:
    'You have generated a lot of previews in a short time. Your colour choice and your rough estimate below still work in the meantime.',
  /* Fail-closed path: the limiter could not reach its store. Says nothing about
     why, because the visitor cannot act on a database problem. */
  rate_limited_unavailable:
    'Photo previews are briefly unavailable — please try again shortly. Your rough estimate below is unaffected.',
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
