import 'server-only'
import { createHash } from 'node:crypto'
import { normalizePhone } from '@/lib/leads'

/*
  Meta Conversions API — the server half of the funnel's conversion tracking.

  This sends the SAME conversion the browser Pixel sends, with the same
  `event_id`, so Meta collapses the two into one (see lib/meta-events.ts). The
  server copy exists because the browser copy is increasingly lost to ad
  blockers, ITP and iOS — CAPI is what keeps optimisation data flowing when the
  Pixel is blocked.

  DESIGN RULE, identical to lib/email.ts: nothing here may throw. The lead is
  already committed to Postgres by the time this runs, so a tracking failure
  must degrade to "the conversion wasn't reported", never to a failed
  submission. Every path returns rather than raises, and the caller treats it
  as advisory.

  Fully inert until BOTH NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN
  are set, so an unconfigured environment sends nothing.
*/

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? ''
/*
  Optional. Meta issues a test-event code in Events Manager; when set, events
  show up in the Test Events tab instead of (only) production. Leave unset in
  production.
*/
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE ?? ''

const GRAPH_VERSION = 'v21.0'

export const capiConfigured = PIXEL_ID.length > 0 && ACCESS_TOKEN.length > 0

/* Meta requires user identifiers to be SHA-256 hashed, lower-cased and trimmed. */
function hash(value?: string | null): string | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  return createHash('sha256').update(normalized).digest('hex')
}

export type CapiUserData = {
  email?: string | null
  phone?: string | null
  zip?: string | null
  /* First-party Pixel cookies, forwarded from the client for match quality. */
  fbp?: string | null
  fbc?: string | null
  clientIp?: string | null
  userAgent?: string | null
}

export type CapiEventInput = {
  eventName: 'Lead' | 'Schedule' | 'QualifiedLead'
  /* The id shared with the browser Pixel — this is what makes dedup work. */
  eventId: string
  eventSourceUrl?: string | null
  user: CapiUserData
  customData?: Record<string, string | number | boolean | undefined>
}

export type CapiResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'send_failed'; detail?: string }

export async function sendCapiEvent(input: CapiEventInput): Promise<CapiResult> {
  if (!capiConfigured) return { sent: false, reason: 'not_configured' }

  const { user } = input

  /*
    Phone is hashed in E.164-ish digit form (with country code) per Meta's
    guidance; normalizePhone strips to the 10 national digits, so prefix "1".
  */
  const phoneDigits = user.phone ? normalizePhone(user.phone) : ''
  const phoneForHash = phoneDigits.length === 10 ? `1${phoneDigits}` : phoneDigits

  const userData: Record<string, unknown> = {
    em: hash(user.email) ? [hash(user.email)] : undefined,
    ph: phoneForHash ? [hash(phoneForHash)] : undefined,
    zp: hash(user.zip) ? [hash(user.zip)] : undefined,
    fbp: user.fbp ?? undefined,
    fbc: user.fbc ?? undefined,
    client_ip_address: user.clientIp ?? undefined,
    client_user_agent: user.userAgent ?? undefined,
  }
  for (const k of Object.keys(userData)) if (userData[k] === undefined) delete userData[k]

  const customData: Record<string, unknown> = { ...input.customData }
  for (const k of Object.keys(customData)) if (customData[k] === undefined) delete customData[k]

  const body = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        event_source_url: input.eventSourceUrl ?? undefined,
        user_data: userData,
        custom_data: Object.keys(customData).length ? customData : undefined,
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    )

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.log(`[v0] Meta CAPI ${input.eventName} rejected (${res.status}): ${detail.slice(0, 300)}`)
      return { sent: false, reason: 'send_failed', detail: `${res.status}` }
    }

    return { sent: true }
  } catch (error) {
    /* Network/DNS/Meta outage — advisory only, never fatal to the lead. */
    const detail = error instanceof Error ? error.message : String(error)
    console.log(`[v0] Meta CAPI ${input.eventName} threw: ${detail}`)
    return { sent: false, reason: 'send_failed', detail }
  }
}
