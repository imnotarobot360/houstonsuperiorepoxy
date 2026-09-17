import 'server-only'

/*
  Outbound CRM webhook.

  The lead is already safe in Postgres and visible at /admin/leads before this
  runs, so pushing to an external CRM is a convenience, not the system of
  record. Accordingly this NEVER throws and never blocks the customer's
  response: a CRM outage must not turn a captured lead into an error.

  Inert until CRM_WEBHOOK_URL is set — no CRM configured simply means the push
  is skipped, which is the "fallback if CRM submission fails" the spec asks for:
  Postgres + the admin inbox + the owner email are the fallback, and they are
  always present.

  The payload is the full field set the owner asked to send to the CRM,
  including the derived lead score, lead source, device type and status fields.
*/

const WEBHOOK_URL = process.env.CRM_WEBHOOK_URL ?? ''
export const crmConfigured = WEBHOOK_URL.length > 0

export type CrmPayload = {
  leadId: number
  submittedAt: string
  name: string
  phone: string
  email: string | null
  zip: string | null
  garageSize: string | null
  floorCondition: string | null
  timeline: string | null
  leadScore: string
  leadScoreReasons: string[]
  leadSource: string
  landingPath: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
  fbclid: string | null
  deviceType: string
  appointmentStatus: string
  photoUploadStatus: string
}

export type CrmResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'send_failed'; detail?: string }

export async function pushLeadToCrm(payload: CrmPayload): Promise<CrmResult> {
  if (!crmConfigured) return { sent: false, reason: 'not_configured' }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.log(`[v0] CRM webhook rejected lead #${payload.leadId} (${res.status})`)
      return { sent: false, reason: 'send_failed', detail: `${res.status}` }
    }
    return { sent: true }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.log(`[v0] CRM webhook threw for lead #${payload.leadId}: ${detail}`)
    return { sent: false, reason: 'send_failed', detail }
  }
}
