/*
  GA4 event contract.

  One module defines every event name and its payload shape, so events are
  never spelled inline at call sites. A typo in a GA4 event name does not throw
  — it silently creates a second, near-identical event that quietly splits your
  conversion data, and you find out weeks later. Types are the only real
  defense against that.

  Nothing here fires unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set, so a
  misconfigured or unset environment is inert rather than broken.
*/

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ''
export const analyticsEnabled = GA_MEASUREMENT_ID.length > 0

/*
  The eight tracked interactions. Names use GA4's snake_case convention and
  avoid GA4's own reserved names (`page_view`, `session_start`, `click`, ...)
  so these never collide with automatically collected events.
*/
export type AnalyticsEvent =
  | 'phone_click'
  | 'sms_click'
  | 'email_click'
  | 'form_start'
  | 'form_submit'
  | 'form_error'
  | 'scroll_depth'
  | 'gallery_interact'
  /*
    Estimator funnel steps (GA4 mirror of the Meta funnel signals). snake_case,
    and none collide with GA4's reserved names. `estimate_generated` is a funnel
    milestone, NOT a conversion — the conversion is `form_submit` (the Lead).
  */
  | 'view_estimator'
  | 'start_estimator'
  | 'estimator_step'
  | 'zip_qualified'
  | 'estimate_generated'
  | 'lead_form_start'
  | 'schedule_inspection'
  /*
    Blend-selection entry points. Both are fired by the delegated CTA handler
    in components/analytics-events.tsx, not by an onClick, so the components
    carrying them stay server-rendered.

    `preview_floor_click` — the hero's secondary button into /floor-designer/.
    `catalog_click`       — the /app/ link into the FlakeColor mobile catalog,
                            rendered only when FLAKECOLOR_URL is set.

    Both are inert until NEXT_PUBLIC_GA_MEASUREMENT_ID is configured, which it
    currently is not — see the note at the top of this file.
  */
  | 'preview_floor_click'
  | 'catalog_click'
  /*
    The blend shortlist converting: someone who saved blends on /colors/ acting
    on the bar's CTA into /schedule/. The event worth having, because it is the
    one that says the shortlist earned its place rather than just being played
    with.
  */
  | 'shortlist_to_estimate'

/*
  `location` answers "which of the many phone links was it?" — the header, the
  sticky mobile bar, the footer. Without it every tel: click looks identical in
  reporting and you cannot tell which CTA earns its place.
*/
type BaseParams = {
  location?: string
  page_path?: string
}

export type EventParams = BaseParams & Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/*
  Push an event to GA4.

  Deliberately silent when analytics is disabled or gtag has not loaded yet:
  tracking is never allowed to break the page it measures. A dropped analytics
  event costs a row in a report; a thrown error costs the lead.
*/
export function track(event: AnalyticsEvent, params: EventParams = {}) {
  if (!analyticsEnabled) return
  if (typeof window === 'undefined') return

  const payload: EventParams = {
    ...params,
    page_path: params.page_path ?? window.location.pathname,
  }

  // Strip undefined so GA4 does not receive empty parameter columns.
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined) delete payload[key]
  }

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, payload)
    } else {
      /*
        gtag.js has not finished loading. Pushing the raw command onto
        dataLayer still works — gtag replays the queue on init — so early
        clicks are not lost.
      */
      window.dataLayer = window.dataLayer ?? []
      window.dataLayer.push(['event', event, payload])
    }
  } catch {
    /* Never let a tracking failure surface to the user. */
  }
}

/*
  Attribution parameters worth persisting with a lead.

  Captured on first arrival and kept in sessionStorage, because the visitor
  usually lands on an ad URL and submits from a different page by which point
  the query string is long gone. Without this, every paid lead reports as
  direct traffic and the ad spend cannot be evaluated.
*/
const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
] as const

const STORAGE_KEY = 'hse_attribution' // first touch
const STORAGE_KEY_LAST = 'hse_attribution_last' // last touch

export type Attribution = Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>> & {
  landing_path?: string
  referrer?: string
}

/*
  Read attribution from the URL and store BOTH first-touch and last-touch
  (spec item 8). First-touch wins for the primary record — if a visitor arrives
  from an ad, browses, and later returns via a bookmark, the ad still gets credit.
  Last-touch is overwritten whenever a NEW campaign-tagged visit arrives, so the
  most recent source that drove the session is preserved alongside the first.
  Both are saved with the CRM lead so multi-touch journeys can be evaluated.
*/
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return {}

  let stored: Attribution = {}
  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    stored = {}
  }

  const params = new URLSearchParams(window.location.search)
  const incoming: Attribution = {}
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key)
    if (value) incoming[key] = value.slice(0, 200)
  }

  /* Only the first touch records the landing page and referrer. */
  const isFirstTouch = Object.keys(stored).length === 0
  if (isFirstTouch) {
    incoming.landing_path = window.location.pathname + window.location.search
    incoming.referrer = document.referrer || undefined
  }

  const merged: Attribution = { ...incoming, ...stored }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    /* Private browsing can reject writes; attribution is best-effort. */
  }

  /*
    Last-touch: update only when THIS navigation carries campaign params, so a
    later direct/bookmark visit does not blank out the campaign that actually
    drove the return. A visit with no params leaves the previous last-touch intact.
  */
  const hasCampaign = ATTRIBUTION_KEYS.some((k) => incoming[k])
  if (hasCampaign) {
    const last: Attribution = { ...incoming }
    last.landing_path = window.location.pathname + window.location.search
    last.referrer = document.referrer || undefined
    try {
      sessionStorage.setItem(STORAGE_KEY_LAST, JSON.stringify(last))
    } catch {
      /* best-effort */
    }
  }

  return merged
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/* The most recent campaign-tagged touch, saved with the lead for multi-touch analysis. */
export function readLastTouch(): Attribution {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY_LAST) ?? '{}')
  } catch {
    return {}
  }
}

/*
  GA4's session id lives in a `_ga_<CONTAINER>` cookie. Read it so a lead row
  can be joined back to its GA4 session during reporting. Best-effort: the
  cookie format is not a public contract and may change.
*/
export function readGaSessionId(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/_ga_[A-Z0-9]+=([^;]+)/)
  if (!match) return undefined
  // Format: GS1.1.<session_id>.<session_number>....
  const parts = match[1].split('.')
  return parts[2] ?? undefined
}
