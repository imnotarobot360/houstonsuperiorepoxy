/*
  Meta Pixel event contract (browser side).

  Mirrors lib/analytics.ts in spirit: one module owns every event name and the
  fire helper, so no event is spelled inline at a call site. Nothing here does
  anything unless NEXT_PUBLIC_META_PIXEL_ID is set — an unconfigured environment
  loads no Pixel and fires nothing, exactly like GA4.

  The browser Pixel and the server Conversions API BOTH report the important
  conversions. Meta de-duplicates them when they share an `eventId` / `event_id`
  and event name, so the funnel generates one id per conversion, fires the Pixel
  with it, and posts the same id to the server action for the CAPI copy. Without
  that shared id the same lead would be counted twice.
*/

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''
export const metaEnabled = META_PIXEL_ID.length > 0

/*
  Standard events are Meta's own named events (optimisable in Ads Manager);
  custom events are our funnel-step signals fired via `trackCustom`. Splitting
  them means the helper calls the right fbq method automatically.
*/
export const META_STANDARD_EVENTS = [
  'PageView',
  'ViewContent',
  'Lead',
  'Schedule',
] as const

export const META_CUSTOM_EVENTS = [
  'FormStarted',
  'GarageSizeSelected',
  'FloorConditionSelected',
  'TimelineSelected',
  'PhotoUploaded',
  'QualifiedLead',
  'EstimateCompleted',
  'JobWon',
  /*
    Estimator funnel signals (Phase 4). These are custom because they are
    funnel-progress markers, not Meta's optimisable conversions:
      - StartEstimator          first question answered
      - EstimatorStepCompleted  each step, with a `step` param
      - EstimateGenerated       price range shown — explicitly NOT a Lead
    The real conversions remain the standard `Lead` (after the CRM confirms the
    row) and `Schedule` (after the booking platform confirms).

    ViewEstimator (estimator section seen), ZipQualified (a supported ZIP was
    entered), LeadFormStarted (contact form revealed) and PhoneClick (a call
    link tapped) round out the spec's funnel-signal set. All are markers, not
    optimisable conversions, so they are custom too.
  */
  'StartEstimator',
  'EstimatorStepCompleted',
  'EstimateGenerated',
  'ViewEstimator',
  'ZipQualified',
  'LeadFormStarted',
  'PhoneClick',
] as const

export type MetaStandardEvent = (typeof META_STANDARD_EVENTS)[number]
export type MetaCustomEvent = (typeof META_CUSTOM_EVENTS)[number]
export type MetaEvent = MetaStandardEvent | MetaCustomEvent

export type MetaParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] }
    _fbq?: unknown
  }
}

function isStandard(event: MetaEvent): event is MetaStandardEvent {
  return (META_STANDARD_EVENTS as readonly string[]).includes(event)
}

/*
  Fire a Pixel event. `eventId` must be passed for any conversion that is ALSO
  sent from the server (Lead, Schedule, QualifiedLead...), so Meta can collapse
  the browser and server copies into one. Silent when disabled or before fbq
  has loaded — tracking never breaks the page it measures.
*/
export function trackMeta(event: MetaEvent, params: MetaParams = {}, eventId?: string) {
  if (typeof window === 'undefined') return

  /*
    Record the browser-side event for the dev debugger FIRST, before the
    Pixel-enabled guard. In development the Pixel id is usually unset, so
    `metaEnabled` is false and no real fbq call happens — but a developer still
    needs to SEE that the event fired at the right moment in the funnel. The
    debugger is a no-op in production regardless (see recordDebugEvent).
  */
  recordDebugEvent(event, eventId, 'browser')

  if (!metaEnabled || typeof window.fbq !== 'function') return

  const clean: MetaParams = {}
  for (const [k, v] of Object.entries(params)) if (v !== undefined) clean[k] = v

  try {
    const method = isStandard(event) ? 'track' : 'trackCustom'
    if (eventId) {
      window.fbq(method, event, clean, { eventID: eventId })
    } else {
      window.fbq(method, event, clean)
    }
  } catch {
    /* Never surface a tracking failure to the user. */
  }
}

/*
  Fire a conversion at most once per browser session, keyed by `key`. This is
  the Phase-4 requirement that "page refreshes and repeat clicks" must not fire
  duplicate conversions. sessionStorage (not a ref) is used deliberately: a ref
  resets on refresh, which is exactly the case we must survive. Returns the
  eventId actually used so the caller can hand the SAME id to the server CAPI
  call — including on a suppressed repeat, so a retry or double-submit still
  dedups rather than creating a second server-side conversion.
*/
export function trackMetaOnce(
  key: string,
  event: MetaEvent,
  params: MetaParams = {},
  eventId: string = newEventId(),
): { fired: boolean; eventId: string } {
  if (typeof window === 'undefined') return { fired: false, eventId }
  const storageKey = `hse:evt:${key}`
  try {
    const existing = window.sessionStorage.getItem(storageKey)
    if (existing) return { fired: false, eventId: existing }
    window.sessionStorage.setItem(storageKey, eventId)
  } catch {
    /* Private mode with no storage — fall through and fire, best effort. */
  }
  trackMeta(event, params, eventId)
  return { fired: true, eventId }
}

/*
  A conversion event id shared between the Pixel call and the server CAPI call.
  `crypto.randomUUID` is available in every browser the funnel targets; the
  fallback keeps older engines from throwing.
*/
export function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/*
  Reads the Pixel's first-party cookies so the server CAPI call can be attributed
  to the same browser. `_fbp` is set by the Pixel; `_fbc` is derived from the
  fbclid on the ad click. Best-effort — absence just means slightly weaker match
  quality, never an error.
*/
export function readFbCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {}
  const get = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`))?.[1]
  return { fbp: get('_fbp'), fbc: get('_fbc') }
}

/* ----------------------------------------------------------- dev event debugger

  A tiny in-page event bus that the development-only EventDebugger listens to.
  It exists so a developer can see, live, which events fired and whether each
  went out browser-side, server-side, or both (matched by event id).

  Hard-gated to development: in a production build `isDebugEnv` is false, so
  recordDebugEvent is a no-op and nothing is ever dispatched or shown. The
  debugger component additionally refuses to render in production.
*/
export const isDebugEnv = process.env.NODE_ENV !== 'production'

export type DebugChannel = 'browser' | 'server'
export type DebugEventDetail = { name: string; eventId?: string; channel: DebugChannel; at: number }
export const DEBUG_EVENT_NAME = 'hse:debug-event'

export function recordDebugEvent(name: string, eventId: string | undefined, channel: DebugChannel) {
  if (!isDebugEnv || typeof window === 'undefined') return
  const detail: DebugEventDetail = { name, eventId, channel, at: Date.now() }
  window.dispatchEvent(new CustomEvent(DEBUG_EVENT_NAME, { detail }))
}
