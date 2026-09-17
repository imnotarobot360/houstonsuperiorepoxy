'use server'

import { put } from '@vercel/blob'
import { and, desc, eq, gte } from 'drizzle-orm'
import { cookies, headers } from 'next/headers'
import { db } from '@/lib/db'
import { estimateLeads } from '@/lib/db/schema'
import { notifyNewLead, sendCustomerEstimate } from '@/lib/email'
import { flakeBlends } from '@/lib/content/flake-blends'
import { formatShortlistForLead, SHORTLIST_FIELD, SHORTLIST_MAX } from '@/lib/shortlist'
import {
  DEDUPE_WINDOW_MINUTES,
  dedupeKeyFor,
  HONEYPOT_FIELD,
  LEAD_STATUS_SPAM,
  leadSchema,
  normalizeEmail,
  normalizePhone,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_COUNT,
  PHOTO_TYPES,
} from '@/lib/leads'
import {
  deviceTypeFromUserAgent,
  type LeadScore,
  leadSourceLabel,
  scoreLead,
} from '@/lib/lead-score'
import { sendCapiEvent } from '@/lib/meta'
import { pushLeadToCrm } from '@/lib/crm'
import { buildCustomerSms, firstNameFrom, sendCustomerSms } from '@/lib/sms'

/*
  `meta` reports what the SERVER did with the Meta Conversions API copy of the
  Lead, so the client can (a) record the matching server-side entry in the dev
  event debugger and (b) know the shared event id that was used. `capi` is
  'not_configured' whenever the CAPI env vars are unset — the normal state until
  the owner adds them — which is not an error.
*/
export type LeadMeta = {
  capi: 'sent' | 'not_configured' | 'send_failed'
  eventId: string | null
}

export type LeadResult =
  | {
      ok: true
      duplicate: boolean
      leadId: number
      photoCount: number
      leadScore: LeadScore
      meta?: LeadMeta
    }
  | { ok: false; fieldErrors: Record<string, string>; formError?: string }

/** Trim attacker-controlled strings before they reach the database. */
const clamp = (v: FormDataEntryValue | null, max = 500) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

/*
  GA4 stores its client id in the `_ga` cookie as `GA1.1.<client_id>`.
  Read server-side so the value cannot be spoofed by the page, and so a lead
  can be joined back to its GA session during reporting.
*/
function gaClientIdFromCookie(raw: string | undefined) {
  if (!raw) return null
  const parts = raw.split('.')
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : null
}

/*
  Sends the owner's notification and records the outcome on the lead row.

  Extracted so BOTH the new-lead path and the duplicate path can use it. When
  this logic lived inline in the new-lead path only, a deduplicated submission
  returned success while sending nothing at all — see the call site below.
*/
async function notifyAndRecord(
  leadId: number,
  lead: ReturnType<typeof leadSchema.parse>,
  formData: FormData,
  photoCount: number,
  leadScore?: LeadScore,
) {
  try {
    const result = await notifyNewLead({
      leadId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email ?? null,
      zip: lead.zip ?? null,
      area: lead.area ?? null,
      space: lead.space ?? null,
      system: lead.system ?? null,
      floorCondition: lead.floorCondition ?? null,
      timeframe: lead.timeframe ?? null,
      contactMethod: lead.contactMethod ?? null,
      details: lead.details ?? null,
      photoCount,
      leadScore,
      utmSource: clamp(formData.get('utm_source'), 120),
      utmCampaign: clamp(formData.get('utm_campaign'), 200),
      gclid: clamp(formData.get('gclid'), 200),
      landingPath: clamp(formData.get('landing_path'), 300),
    })

    /*
      Record the outcome ON the lead row. Without this, an undelivered lead is
      indistinguishable from a delivered one and the reason lives only in a
      server log the owner cannot read — which is exactly how this went
      unnoticed. `notify_error` is what /admin/leads renders as a warning.
    */
    if (result.sent) {
      await db
        .update(estimateLeads)
        .set({ notifiedAt: new Date(), notifyError: null })
        .where(eq(estimateLeads.id, leadId))
    } else {
      /*
        Every unsent lead now carries a reason, including `not_configured`.

        That case used to write nothing, leaving `notified_at` and
        `notify_error` both NULL — identical to a lead that had not been
        processed yet. It made an un-emailed lead indistinguishable from a
        pending one, which is precisely the ambiguity that made this so hard to
        diagnose. A row that says why nobody was emailed is always better than
        a blank one, even when the cause is configuration rather than failure.
      */
      const detail =
        result.reason === 'not_configured'
          ? 'Not sent: RESEND_API_KEY is not available in this environment. Preview and development deployments do not receive production-only variables, so email only sends on the live site.'
          : (result.detail ?? 'Unknown error')

      await db
        .update(estimateLeads)
        .set({ notifiedAt: null, notifyError: detail.slice(0, 500) })
        .where(eq(estimateLeads.id, leadId))
    }
  } catch (error) {
    console.log('[v0] lead notification failed but lead was saved:', error)
  }
}

/*
  Everything that fans OUT to a third party after a new lead is safely stored:
  the Meta Conversions API copy of the Lead event, the CRM webhook, and the
  (currently provider-less) customer SMS.

  Runs only for genuinely new, non-spam leads. Every call is awaited so a
  serverless freeze cannot kill it mid-flight (same reasoning as the email
  notifier), and every one is individually non-fatal — the lead is already in
  Postgres, so none of these may turn a captured lead into an error.
*/
async function runPostSubmitIntegrations(args: {
  leadId: number
  lead: ReturnType<typeof leadSchema.parse>
  formData: FormData
  photoCount: number
  score: ReturnType<typeof scoreLead>
  headerStore: Awaited<ReturnType<typeof headers>>
  cookieStore: Awaited<ReturnType<typeof cookies>>
}) {
  const { leadId, lead, formData, photoCount, score, headerStore, cookieStore } = args

  const clientIp = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = headerStore.get('user-agent')?.slice(0, 400) ?? null
  const eventSourceUrl = headerStore.get('referer')
  const landingPath = clamp(formData.get('landing_path'), 300)
  const leadSource = leadSourceLabel({
    landingPath,
    utmSource: clamp(formData.get('utm_source'), 120),
    fbclid: clamp(formData.get('fbclid'), 200),
  })

  /*
    Meta Conversions API — the server twin of the browser Pixel's Lead event.
    Uses the SAME event id the client fired with (posted as `meta_event_id`) so
    Meta dedups the two into one conversion; falls back to a fresh id when the
    client did not supply one (e.g. the main site form, which has no Pixel Lead
    to dedup against). Inert unless the CAPI env vars are set.
  */
  const capiEventId = clamp(formData.get('meta_event_id'), 120) ?? crypto.randomUUID()
  const capi = sendCapiEvent({
    eventName: 'Lead',
    eventId: capiEventId,
    eventSourceUrl,
    user: {
      email: lead.email ?? null,
      phone: lead.phone,
      zip: lead.zip ?? null,
      fbp: cookieStore.get('_fbp')?.value ?? null,
      fbc: cookieStore.get('_fbc')?.value ?? null,
      clientIp,
      userAgent,
    },
    customData: { lead_score: score.score, lead_source: leadSource },
  })

  /*
    CRM webhook — the full field set the owner listed, including the derived
    score, source, device type and status fields. Inert unless CRM_WEBHOOK_URL
    is set; Postgres + admin inbox + email are the always-present fallback.
  */
  const crm = pushLeadToCrm({
    leadId,
    submittedAt: new Date().toISOString(),
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? null,
    zip: lead.zip ?? null,
    garageSize: lead.area ?? null,
    floorCondition: lead.floorCondition ?? null,
    timeline: lead.timeframe ?? null,
    leadScore: score.score,
    leadScoreReasons: score.reasons,
    leadSource,
    landingPath,
    utmSource: clamp(formData.get('utm_source'), 120),
    utmMedium: clamp(formData.get('utm_medium'), 120),
    utmCampaign: clamp(formData.get('utm_campaign'), 200),
    utmContent: clamp(formData.get('utm_content'), 200),
    utmTerm: clamp(formData.get('utm_term'), 200),
    fbclid: clamp(formData.get('fbclid'), 200),
    deviceType: deviceTypeFromUserAgent(userAgent),
    /* Booking happens off-site, photos arrive later by text — see thank-you page. */
    appointmentStatus: 'not_scheduled',
    photoUploadStatus: photoCount > 0 ? 'received' : 'awaiting_customer',
  })

  /*
    Customer SMS. Built only with consent (unchecked-by-default box), then
    handed to the provider seam — which currently reports `no_provider` rather
    than faking a send. The prepared copy is logged so the owner can send it
    manually until a provider is wired.
  */
  const sms = (async () => {
    if (!lead.smsConsent) return
    const message = buildCustomerSms({
      firstName: firstNameFrom(lead.name),
      garageSize: lead.area ?? null,
      zip: lead.zip ?? null,
    })
    const result = await sendCustomerSms(lead.phone, message)
    if (!result.sent) {
      console.log(
        `[v0] lead #${leadId}: customer SMS not sent (${result.reason}). Prepared message: ${message}`,
      )
    }
  })()

  /*
    Customer-facing estimate email. The counterpart to the customer SMS: sent
    only when the customer gave an email, and only actually delivered when a
    verified sending domain exists (see sendCustomerEstimate). Non-fatal — the
    lead is already stored and the owner is notified separately.
  */
  const customerEmail = (async () => {
    if (!lead.email) return
    const sqftRaw = clamp(formData.get('estimate_sqft'), 12)
    const parsedSqft = sqftRaw ? Number.parseInt(sqftRaw, 10) : NaN
    const result = await sendCustomerEstimate({
      leadId,
      to: lead.email,
      firstName: firstNameFrom(lead.name),
      estimateHeadline: clamp(formData.get('estimate_headline'), 120),
      squareFeet: Number.isFinite(parsedSqft) ? parsedSqft : null,
      finish: clamp(formData.get('finish_label'), 120),
      zip: lead.zip ?? null,
    })
    if (!result.sent && result.reason === 'send_failed') {
      console.log(`[v0] lead #${leadId}: customer estimate email not sent (${result.detail})`)
    }
  })()

  const [capiResult, crmResult] = await Promise.all([capi, crm, sms, customerEmail])
  if (!capiResult.sent && capiResult.reason === 'send_failed') {
    console.log(`[v0] lead #${leadId}: Meta CAPI Lead not sent (${capiResult.detail})`)
  }
  if (!crmResult.sent && crmResult.reason === 'send_failed') {
    console.log(`[v0] lead #${leadId}: CRM push not sent (${crmResult.detail})`)
  }

  const capiStatus: LeadMeta['capi'] = capiResult.sent
    ? 'sent'
    : capiResult.reason === 'not_configured'
      ? 'not_configured'
      : 'send_failed'
  return { capi: capiStatus, eventId: capiEventId } satisfies LeadMeta
}

export async function submitEstimate(formData: FormData): Promise<LeadResult> {
  /*
    Honeypot: an off-screen field a human never sees, so a value in it suggests
    a bot filled the form programmatically.

    It is a SUSPICION, not a verdict, and it deliberately no longer discards the
    submission. It used to `return ok:true` and drop the lead on the floor, which
    was silently destroying real customers: browser autofill and password
    managers routinely fill hidden inputs regardless of `autocomplete="off"`, so
    any customer with autofill enabled saw a cheerful "we have your request" and
    was never recorded anywhere. A lead form must never be able to lose a lead
    on evidence this weak.

    So the lead is saved and flagged for review instead. The owner sees it in
    /admin/leads and can reclaim it in one click, while the email notification is
    suppressed so genuine bot traffic does not reach the inbox. Storing a few
    junk rows is a trivial cost next to losing one paying customer.
  */
  const spamSuspected = Boolean(clamp(formData.get(HONEYPOT_FIELD)))

  /*
    The blend shortlist, folded into `details`.

    NAMES ARE RE-DERIVED SERVER-SIDE FROM THE SLUGS. The form posts slugs and
    this looks each one up in the real blend list, so what reaches the inbox is
    always a blend we actually stock. Trusting a display string from the client
    would let anything at all be written into a field the crew reads as fact —
    and an unknown slug is simply dropped rather than passed through.

    It lands in `details` rather than a new column because that is the field
    /admin/leads and the notification email already show. A migration against
    the production leads table is a bigger change than this feature earns.
  */
  const shortlistNames = String(formData.get(SHORTLIST_FIELD) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, SHORTLIST_MAX)
    .map((slug) => flakeBlends.find((b) => b.slug === slug)?.name)
    .filter((n): n is string => Boolean(n))

  const shortlistLine = formatShortlistForLead(shortlistNames)
  const typedDetails = String(formData.get('details') ?? '').trim()
  /*
    Customer's own words first. Capped to the column's 2000 so a long note plus
    a shortlist cannot fail validation — the shortlist is what gets trimmed,
    because losing the note the customer typed would be worse.
  */
  const details = [typedDetails, shortlistLine].filter(Boolean).join('\n\n').slice(0, 2000)

  const parsed = leadSchema.safeParse({
    name: formData.get('name') ?? '',
    phone: formData.get('phone') ?? '',
    email: formData.get('email') ?? '',
    zip: formData.get('zip') ?? '',
    area: formData.get('area') ?? '',
    space: formData.get('space') ?? '',
    system: formData.get('system') ?? '',
    floorCondition: formData.get('floorCondition') ?? '',
    timeframe: formData.get('timeframe') ?? '',
    contactMethod: formData.get('contactMethod') ?? '',
    details,
    smsConsent: formData.get('smsConsent') === 'on' || formData.get('smsConsent') === 'true',
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { ok: false, fieldErrors }
  }

  const lead = parsed.data
  const key = dedupeKeyFor(lead)

  /*
    Lead score is a pure function of the answers, so it is computed once here
    and reused for the email, the return value and the CRM push. Nothing is
    stored — see lib/lead-score.ts for why deriving beats persisting.
  */
  const score = scoreLead({
    phone: lead.phone,
    zip: lead.zip,
    area: lead.area,
    timeframe: lead.timeframe,
  })

  /*
    Duplicate detection. A customer who double-taps submit, or refills the form
    after a slow response, should not become two leads for the sales team to
    call twice. Matching is on the identity+project fingerprint within a time
    window, so a different project from the same person still gets through.

    Checked before uploading photos so a duplicate does not also duplicate the
    stored files.
  */
  const since = new Date(Date.now() - DEDUPE_WINDOW_MINUTES * 60_000)
  const [existing] = await db
    .select({
      id: estimateLeads.id,
      photoPathnames: estimateLeads.photoPathnames,
      /*
        Needed to tell "already dealt with" apart from "saved but the owner was
        never told" — the distinction the duplicate branch below turns on.
      */
      notifiedAt: estimateLeads.notifiedAt,
    })
    .from(estimateLeads)
    .where(and(eq(estimateLeads.dedupeKey, key), gte(estimateLeads.createdAt, since)))
    .orderBy(desc(estimateLeads.createdAt))
    .limit(1)

  if (existing) {
    /*
      Deduplication must suppress duplicate LEADS, not the only notification.

      Previously this returned immediately, so if the first submission's email
      failed — or was sent while email was misconfigured — every resubmission
      inside the 30-minute window was silently swallowed. The customer saw
      success, the row was in the database, and the owner was never emailed.
      That combination is the worst possible outcome: a lead nobody knows about.

      So a duplicate whose original was never successfully notified is treated
      as a retry and re-notified. One that WAS notified stays silent, which is
      the whole point of deduplication.
    */
    if (!existing.notifiedAt) {
      console.log(`[v0] duplicate of un-notified lead #${existing.id}; retrying notification`)
      await notifyAndRecord(
        existing.id,
        lead,
        formData,
        existing.photoPathnames?.length ?? 0,
        score.score,
      )
    }

    return {
      ok: true,
      duplicate: true,
      leadId: existing.id,
      photoCount: existing.photoPathnames?.length ?? 0,
      leadScore: score.score,
    }
  }

  /*
    Photos. Validated server-side by type and size regardless of what the input
    element allowed, then written to a PRIVATE blob store — these are pictures
    of a customer's home, so the URLs must not be publicly guessable.

    We store pathnames, never public URLs.
  */
  const files = formData
    .getAll('photos')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, PHOTO_MAX_COUNT)

  const photoPathnames: string[] = []
  for (const file of files) {
    if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) continue
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
    try {
      const blob = await put(`estimates/${Date.now()}-${safeName}`, file, {
        access: 'private',
        addRandomSuffix: true,
      })
      photoPathnames.push(blob.pathname)
    } catch (error) {
      /*
        A failed photo must never lose the lead — the contact details are worth
        far more than the attachment. Log and continue.
      */
      console.log('[v0] photo upload failed:', error instanceof Error ? error.message : error)
    }
  }

  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])

  const inserted = await db
    .insert(estimateLeads)
    .values({
      /*
        Flagged for review rather than dropped, so an autofilled honeypot
        costs the owner one click instead of costing them the customer.
      */
      status: spamSuspected ? LEAD_STATUS_SPAM : 'new',
      name: lead.name,
      phone: lead.phone,
      phoneNormalized: normalizePhone(lead.phone),
      /*
        Everything except name/phone is optional, so each of these may be
        undefined — coalesced to null so the column stores NULL rather than an
        empty string. "No answer given" and "answered with blank" should not be
        two different states in the database.
      */
      email: lead.email ?? null,
      emailNormalized: lead.email ? normalizeEmail(lead.email) : null,
      zip: lead.zip ?? null,
      area: lead.area ?? null,
      space: lead.space ?? null,
      system: lead.system ?? null,
      floorCondition: lead.floorCondition ?? null,
      timeframe: lead.timeframe ?? null,
      contactMethod: lead.contactMethod ?? null,
      details: lead.details ?? null,
      photoPathnames,
      smsConsent: lead.smsConsent,

      /*
        Persisted so the NEXT submission can be compared against this one.
        Without storing it, the dedupe query above would never match anything
        and duplicate detection would silently do nothing.
      */
      dedupeKey: key,

      /*
        Attribution. UTMs and click ids are captured by the client on the
        landing page and posted back as hidden fields, because a server action
        only ever sees its own request — not the URL the visitor first arrived
        on. Treated as untrusted input and clamped accordingly.
      */
      utmSource: clamp(formData.get('utm_source'), 120),
      utmMedium: clamp(formData.get('utm_medium'), 120),
      utmCampaign: clamp(formData.get('utm_campaign'), 200),
      utmTerm: clamp(formData.get('utm_term'), 200),
      utmContent: clamp(formData.get('utm_content'), 200),
      gclid: clamp(formData.get('gclid'), 200),
      gbraid: clamp(formData.get('gbraid'), 200),
      wbraid: clamp(formData.get('wbraid'), 200),
      fbclid: clamp(formData.get('fbclid'), 200),
      landingPath: clamp(formData.get('landing_path'), 300),
      referrer: clamp(formData.get('referrer'), 300),
      gaSessionId: clamp(formData.get('ga_session_id'), 120),

      // Server-derived, so these cannot be forged by the page.
      gaClientId: gaClientIdFromCookie(cookieStore.get('_ga')?.value),
      userAgent: headerStore.get('user-agent')?.slice(0, 400) ?? null,
    })
    .returning({ id: estimateLeads.id })

  const leadId = inserted[0].id

  /*
    Notify the owner. Deliberately AFTER the insert and deliberately awaited but
    never allowed to fail the request:

    - After, because the database is the system of record. If email were sent
      first and the insert then failed, the owner would be chasing a lead that
      does not exist anywhere.
    - Awaited, because a serverless function can be frozen the moment it
      returns a response — a floating promise here would be killed mid-flight
      and the email would silently never arrive. This is the classic
      fire-and-forget bug in serverless email.
    - Never fatal, because the lead is already safely stored. `notifyNewLead`
      is written to return a result rather than throw, and the extra catch is
      belt-and-braces: under no circumstances should a mail problem turn a
      captured lead into an error message for the customer.
  */
  /*
    Flagged submissions are stored but not emailed. Genuine bot traffic would
    otherwise fill the owner's inbox, and the flag is visible in /admin/leads,
    so a false positive is still recoverable there rather than lost.
  */
  let meta: LeadMeta | undefined
  if (spamSuspected) {
    console.log(`[v0] lead #${leadId} flagged ${LEAD_STATUS_SPAM}; notification suppressed`)
  } else {
    await notifyAndRecord(leadId, lead, formData, photoPathnames.length, score.score)
    /*
      Fan out to Meta CAPI, the CRM webhook and the SMS seam. Kept off the spam
      path so flagged submissions never reach a third party, and awaited so none
      is cut off by a serverless freeze after the response returns.
    */
    meta = await runPostSubmitIntegrations({
      leadId,
      lead,
      formData,
      photoCount: photoPathnames.length,
      score,
      headerStore,
      cookieStore,
    })
  }

  return {
    ok: true,
    duplicate: false,
    meta,
    leadId,
    photoCount: photoPathnames.length,
    leadScore: score.score,
  }
}
