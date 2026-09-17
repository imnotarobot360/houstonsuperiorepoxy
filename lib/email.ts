import { Resend } from 'resend'
import { site } from '@/lib/site'

/*
  Lead notification email.

  DESIGN RULE: nothing in this file may ever throw. By the time it is called the
  lead is already committed to Postgres, so an email problem must degrade to "we
  have the lead but the owner wasn't pinged" — never to a failed submission or a
  lost customer. Every path returns a result object instead of raising, and the
  caller treats it as advisory.

  This is also why the database stays the system of record and /admin/leads
  exists. Email is a notification channel, not storage: it can bounce, land in
  spam, or be deleted. The row in Postgres cannot.
*/

export type NotifyResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: 'not_configured' | 'send_failed'; detail?: string }

/* The site's own domain, used to prefer a sender that matches the brand. */
const DOMAIN = site.canonical.replace(/^https?:\/\//, '').replace(/\/$/, '')

/*
  Last-resort sender. Resend allows this without any DNS setup, but it will
  ONLY deliver to the Resend account owner's own address. For a one-owner
  business that is usually the same inbox as LEAD_NOTIFY_TO, so it is a real
  chance of delivery rather than a guaranteed bounce — which is exactly what we
  want as a fallback and exactly why it must never be the primary sender.
*/
const FALLBACK_FROM = 'Website Estimates <onboarding@resend.dev>'

/*
  Reads RESEND_API_KEY defensively, because "Malformed access token" is almost
  always a copy-paste artifact rather than a wrong key.

  A value pasted into a dashboard field routinely arrives wrapped in quotes, with
  a trailing newline, a stray space, or the word "Bearer " still attached from
  copied example code. Any one of those makes Resend reject an otherwise valid
  key, and none of them are visible when looking at the field. Stripping them
  costs nothing and removes a whole class of unexplainable failure.

  It deliberately does NOT invent a key or mask a genuinely wrong one — a
  cleaned-up value that is still wrong will fail at the send, which is correct.
*/
function readApiKey(): { key?: string; problem?: string } {
  const raw = process.env.RESEND_API_KEY
  if (!raw) return {}

  let key = raw.trim().replace(/^["']|["']$/g, '')
  key = key.replace(/^Bearer\s+/i, '').trim()

  if (key.length === 0) return { problem: 'RESEND_API_KEY is set but empty.' }

  /*
    Resend keys start with `re_`. Reporting a mismatch is far more useful than
    letting the send fail with an opaque message, and it catches the common
    mistake of pasting a different service's key or a Resend *webhook* secret.
  */
  if (!key.startsWith('re_')) {
    return {
      key,
      problem: `RESEND_API_KEY does not look like a Resend key (it should start with "re_", this one starts with "${key.slice(0, 3)}"). Copy the key from Resend > API Keys.`,
    }
  }

  /* Whitespace INSIDE the value means the paste was truncated or joined. */
  if (/\s/.test(key)) {
    return {
      key: key.replace(/\s+/g, ''),
      problem:
        'RESEND_API_KEY contained spaces or line breaks, which usually means it was pasted incompletely. Re-copy the whole key from Resend > API Keys.',
    }
  }

  return { key }
}

/*
  The sender is RESOLVED at send time instead of hardcoded.

  The original code guessed `estimates@mail.<domain>` and, when that domain
  wasn't verified in Resend, every notification failed — silently, from the
  owner's point of view. The guess is the bug: only Resend knows which domains
  are actually verified on this account, so we ask it and pick a sender that
  can genuinely send. LEAD_NOTIFY_FROM still wins, so an explicit choice is
  never overridden.
*/
export type DomainInfo = { name: string; status: string }

/*
  Returns every domain WITH its status, not just the verified names. Adding a
  domain in Resend is only half the job — it sits at `pending` until the DNS
  records resolve, and a pending domain cannot send. Keeping the status lets the
  admin panel say "added but not verified yet" instead of the far less useful
  "no verified domains".
*/
async function listDomains(apiKey: string): Promise<{
  httpStatus?: number
  domains?: DomainInfo[]
  /*
    True when Resend refused the LISTING but the key may still SEND.

    Resend offers "sending access" keys that are deliberately scoped to the
    send endpoint only. Asking such a key to list domains returns 401 — the
    same status a revoked key returns. Conflating the two is why a perfectly
    good key got reported as dead, so the distinction is captured here.
  */
  restricted?: boolean
}> {
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const restricted = /restricted|only send|sending access/i.test(text)
      return { httpStatus: res.status, restricted }
    }
    const body = (await res.json()) as { data?: DomainInfo[] }
    return { httpStatus: res.status, domains: body.data ?? [] }
  } catch {
    /* Advisory only. A lookup failure must not stop us attempting a send. */
    return {}
  }
}

/*
  Cached because a lead submission is on the customer's critical path and
  verified domains change roughly never. A short TTL still lets a freshly
  verified domain start being used without a redeploy.
*/
let senderCache: { from: string; at: number } | null = null
const SENDER_TTL_MS = 5 * 60 * 1000

async function resolveFrom(apiKey: string): Promise<string> {
  const explicit = process.env.LEAD_NOTIFY_FROM
  if (explicit) return explicit

  if (senderCache && Date.now() - senderCache.at < SENDER_TTL_MS) return senderCache.from

  const preferred = `Website Estimates <estimates@mail.${DOMAIN}>`
  const { domains } = await listDomains(apiKey)

  /*
    Preference order matters. `mail.<DOMAIN>` first keeps transactional SPF/DKIM
    off the root domain so this cannot disturb the owner's Google Workspace or
    Microsoft 365 mail. Root domain next, any other verified domain after that.
  */
  const pick = (() => {
    /*
      No listing available — a send-only key, or a network blip. Guessing the
      weak fallback here would be the wrong bet: it only reaches the account
      owner, while `mail.<DOMAIN>` is the address we actually asked the owner to
      verify. Try the good one; the caller retries from the fallback if the
      sender is genuinely rejected, so being wrong costs one extra API call.
    */
    if (!domains) return preferred

    const verified = domains.filter((d) => d.status === 'verified').map((d) => d.name)
    if (verified.length === 0) return FALLBACK_FROM
    if (verified.includes(`mail.${DOMAIN}`)) return preferred
    if (verified.includes(DOMAIN)) return `Website Estimates <estimates@${DOMAIN}>`
    return `Website Estimates <estimates@${verified[0]}>`
  })()

  senderCache = { from: pick, at: Date.now() }
  return pick
}

/* Comma-separated so the owner can add a sales address without a code change. */
const TO = (process.env.LEAD_NOTIFY_TO ?? site.email)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

export type LeadEmailPayload = {
  leadId: number
  name: string
  phone: string
  email?: string | null
  zip?: string | null
  area?: string | null
  space?: string | null
  system?: string | null
  floorCondition?: string | null
  timeframe?: string | null
  contactMethod?: string | null
  details?: string | null
  photoCount: number
  /* Derived priority (see lib/lead-score.ts). Absent for legacy callers. */
  leadScore?: 'hot' | 'warm' | 'nurture'
  utmSource?: string | null
  utmCampaign?: string | null
  gclid?: string | null
  landingPath?: string | null
}

const row = (label: string, value?: string | null) =>
  value ? `<tr><td style="padding:6px 14px 6px 0;color:#666;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;color:#111;font-weight:500">${escapeHtml(value)}</td></tr>` : ''

/*
  Lead fields are attacker-controlled free text arriving straight from a public
  form, and they are about to be interpolated into an HTML email. Escaping is
  what stops a submitted `<script>` or a broken tag from mangling the owner's
  inbox rendering.
*/
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/*
  Self-diagnostic for the admin inbox.

  This exists because the two things that actually break lead email — a missing
  API key and an unverified sending domain — both failed *silently*. The error
  text was written to a server log the owner has no way to read, so from their
  side a broken setup and a working one looked identical.

  So this returns Resend's real message verbatim rather than a friendly
  paraphrase, and adds `hint` only when the message is recognisably one of the
  known setup problems. Guessing at a cause is what made this hard to diagnose
  the first time; quoting the provider is not.
*/
export type EmailDiagnostic = {
  ok: boolean
  from: string
  to: string[]
  hasApiKey: boolean
  verifiedDomains?: string[]
  error?: string
  hint?: string
  /* Resend's id for the test message, useful for looking it up in their dashboard. */
  emailId?: string
  /*
    What happened AFTER Resend accepted the message — `delivered`, `bounced`,
    `complained`, and so on.

    This is the gap that made "it says sent but I never got it" impossible to
    explain. `resend.emails.send()` succeeding only means Resend queued the
    message; it says nothing about whether the receiving mail server accepted
    it. A hard bounce or a spam rejection happens seconds later and was
    completely invisible here.
  */
  delivery?: string
  deliveryDetail?: string
}

/*
  Asks Resend what became of a message it already accepted.

  Polled rather than read once, because the delivery event does not exist at the
  instant the send returns — it arrives when the receiving server responds. A
  few short attempts covers the common case without making the admin page hang;
  giving up and reporting `unknown` is fine, since the message may genuinely
  still be in flight.
*/
async function deliveryStatusFor(
  apiKey: string,
  id: string,
): Promise<{ delivery?: string; detail?: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 1200 : 1600))

    try {
      const res = await fetch(`https://api.resend.com/emails/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      })
      if (!res.ok) return {}

      const body = (await res.json()) as {
        last_event?: string
        bounce?: { message?: string; subType?: string }
      }
      const event = body.last_event

      /* `sent`/`queued` are not outcomes yet, so keep waiting on those. */
      if (event && event !== 'sent' && event !== 'queued') {
        return { delivery: event, detail: body.bounce?.message ?? body.bounce?.subType }
      }
    } catch {
      /* Advisory only — never turn a successful send into a reported failure. */
      return {}
    }
  }

  return { delivery: 'unknown' }
}

export async function diagnoseEmail(recipientOverride?: string): Promise<EmailDiagnostic> {
  const { key: apiKey, problem } = readApiKey()

  /*
    An optional override recipient, which is the fastest way to split the two
    remaining causes apart.

    "Resend accepted it but I never saw it" has two very different explanations:
    the send is broken, or the RECEIVING mailbox silently filtered it. Sending
    the same message to an unrelated address (a personal Gmail, say) settles it
    in one attempt — if that arrives and the normal one does not, the sending
    side is fine and the problem is inbox filtering on the usual recipient.
  */
  const recipients = recipientOverride ? [recipientOverride] : TO

  if (!apiKey) {
    return {
      from: '(none)',
      to: recipients,
      hasApiKey: false,
      ok: false,
      error: problem ?? 'RESEND_API_KEY is not set.',
      hint: 'Add RESEND_API_KEY in project settings > Vars, then redeploy.',
    }
  }

  /*
    Surfaced up front rather than after a doomed send: when the key's shape is
    wrong, the send's own error ("Malformed access token") says nothing about
    WHY, which is exactly the dead end that made this hard to chase down.
  */
  if (problem) {
    return {
      from: await resolveFrom(apiKey),
      to: recipients,
      hasApiKey: true,
      ok: false,
      error: problem,
      hint: `Copy the key again from Resend > API Keys, paste it into project settings > Vars as RESEND_API_KEY with no quotes or extra spaces, then redeploy. Key length seen: ${apiKey.length} characters.`,
    }
  }

  const { httpStatus, domains, restricted } = await listDomains(apiKey)

  /*
    Deliberately NOT returning early on a 401 here.

    The previous version did, and it was wrong: a send-only Resend key answers
    401 to this listing while sending mail without complaint, so the panel
    accused a working key of being revoked and told the owner to replace it.
    Only the send itself can prove a key is dead, so the verdict now waits for
    the send below and the listing is treated as advisory.
  */
  const listingUnavailable = httpStatus === 401 || httpStatus === 400 || !domains
  const verified = domains?.filter((d) => d.status === 'verified').map((d) => d.name)

  /*
    The specific case the owner is most likely to hit: the domain has been
    added in Resend but its DNS has not verified yet, so sends still fail.
    Naming it explicitly turns a confusing failure into a waiting game.
  */
  const unverified = domains?.filter((d) => d.status !== 'verified') ?? []
  const pendingNote =
    unverified.length > 0
      ? ` Added but not sending yet: ${unverified.map((d) => `${d.name} (${d.status})`).join(', ')} — DNS must fully verify in Resend > Domains first.`
      : ''

  const from = await resolveFrom(apiKey)
  const base = { from, to: recipients, hasApiKey: true, verifiedDomains: verified }

  /*
    A test send is the only honest check. Domain listings can look fine while
    the send still fails, so the previous version's "bail out before sending"
    branch is gone — we send, then report exactly what Resend said.
  */
  const attempt = async (sender: string) => {
    const resend = new Resend(apiKey)
    return resend.emails.send({
      from: sender,
      to: recipients,
      subject: 'Test: estimate form email is working',
      text: `This is a test from your website's estimate form.\n\nIf you can read this, new leads will be emailed to: ${recipients.join(', ')}\n\nEvery lead is also saved to your database and listed at /admin/leads, so nothing depends on email alone.`,
    })
  }

  try {
    let sender = from
    let { data, error } = await attempt(sender)

    /* Same fallback the real notifier uses, so the test reflects reality. */
    if (error && sender !== FALLBACK_FROM && /domain|verif|from/i.test(error.message)) {
      sender = FALLBACK_FROM
      ;({ data, error } = await attempt(sender))
    }

    if (error) {
      /*
        Now that a send has actually been attempted, an auth complaint here is
        trustworthy evidence the key is bad — unlike the listing's 401.
      */
      const authFailed =
        /api key|unauthor|invalid.*token|restricted|malformed|access token/i.test(error.message)

      return {
        ...base,
        from: sender,
        ok: false,
        error: error.message,
        hint: authFailed
          ? `Resend refused this key. "Malformed" means the value itself is not a usable key — most often it was pasted with a piece missing, or a webhook secret was used instead of an API key. Create a NEW key in Resend > API Keys with "Full access", copy it in one go (it is only shown once), paste it into project settings > Vars as RESEND_API_KEY, then redeploy. Key length currently seen: ${apiKey.length} characters; a Resend key is normally around 36.`
          : /domain|verif/i.test(error.message)
            ? `Verify a sending domain in Resend > Domains (mail.${DOMAIN} is recommended) and publish its DNS records. Until then Resend can only deliver to the email address that owns the Resend account.${pendingNote}`
            : undefined,
      }
    }

    /*
      The send was accepted. Now find out whether it was actually DELIVERED,
      because those are not the same thing and conflating them is what left
      "it says sent but nothing arrived" with no explanation.
    */
    const { delivery, detail } = data?.id
      ? await deliveryStatusFor(apiKey, data.id)
      : { delivery: undefined, detail: undefined }

    const bounced = delivery === 'bounced'

    return {
      ...base,
      from: sender,
      /* A bounce is a failure, however cheerfully Resend accepted the message. */
      ok: !bounced,
      error: bounced ? `Delivery failed: the receiving mail server rejected it.` : undefined,
      emailId: data?.id ?? undefined,
      delivery,
      deliveryDetail: detail,
      hint: bounced
        ? `${detail ? `Reason given: ${detail}. ` : ''}Check that ${recipients.join(', ')} is a real mailbox that can receive external email.`
        : delivery === 'delivered'
          ? `Confirmed delivered to ${recipients.join(', ')}. If it is not in the inbox, check the spam folder — a brand-new sending domain is often filtered for the first few messages, and marking one message "not spam" trains it.`
          : sender === FALLBACK_FROM
            ? `Sent using Resend's shared test sender, which ONLY reaches the address that owns your Resend account. Verify mail.${DOMAIN} in Resend > Domains for reliable delivery to ${recipients.join(', ')}.${pendingNote}`
            : listingUnavailable
              ? /*
                  Worth saying out loud: the send worked, so the key is fine, but
                  this key cannot list domains. That explains why the panel shows
                  no verified-domain list and stops it looking like a fault.
                */
                `Sent successfully. This key is ${restricted ? 'restricted to sending only' : 'unable to list domains'}, so the verified-domain list above may be empty — that is expected and does not affect delivery.`
              : `Accepted by Resend${delivery === 'unknown' ? ', but no delivery confirmation arrived within a few seconds — it may still be in flight' : ''}. Check the inbox and the spam folder.`,
    }
  } catch (error) {
    return {
      ...base,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/*
  CUSTOMER-FACING confirmation of the preliminary estimate.

  This is a different email from notifyNewLead: that one pings the OWNER, this
  one reaches the CUSTOMER who just used the estimator. Same non-throwing
  contract — the lead is already stored, so a mail failure here must degrade to
  "customer wasn't emailed" and nothing worse.

  DELIVERY REALITY: a message to an arbitrary customer address can only be sent
  from a VERIFIED domain. Resend's shared `onboarding@resend.dev` fallback is
  restricted to the account owner's own inbox, so if that is the only sender
  available we deliberately DO NOT attempt the send — it would be rejected and,
  worse, could look like it worked. We report `no_verified_domain` so the caller
  can log why the customer was not emailed. Verifying mail.<domain> in Resend is
  what switches this on.

  It is also strictly PRELIMINARY by wording: an estimate to confirm at a free
  onsite inspection, never a binding quote — consistent with the gated pricing
  everywhere else on the site.
*/
export type CustomerEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: 'not_configured' | 'no_email' | 'no_verified_domain' | 'send_failed'; detail?: string }

export type CustomerEstimatePayload = {
  leadId: number
  to: string
  firstName: string
  estimateHeadline?: string | null
  squareFeet?: number | null
  finish?: string | null
  zip?: string | null
}

export async function sendCustomerEstimate(
  payload: CustomerEstimatePayload,
): Promise<CustomerEmailResult> {
  const { key: apiKey, problem } = readApiKey()

  if (problem) {
    console.log(`[v0] RESEND_API_KEY problem while emailing customer for lead #${payload.leadId}: ${problem}`)
  }
  if (!apiKey) {
    console.log(
      `[v0] lead #${payload.leadId}: customer estimate email skipped, RESEND_API_KEY not set. Lead is safe in the database.`,
    )
    return { sent: false, reason: 'not_configured' }
  }

  const to = payload.to?.trim()
  if (!to) return { sent: false, reason: 'no_email' }

  /*
    Only send from a real, verified sender. The fallback sender cannot reach a
    customer, so skipping is the honest outcome rather than a doomed attempt.
  */
  const from = await resolveFrom(apiKey)
  if (from === FALLBACK_FROM) {
    console.log(
      `[v0] lead #${payload.leadId}: customer estimate email skipped — no verified sending domain, so Resend can only deliver to the account owner. Verify mail.${DOMAIN} in Resend > Domains to enable customer emails.`,
    )
    return { sent: false, reason: 'no_verified_domain' }
  }

  const first = escapeHtml(payload.firstName?.trim() || 'there')
  const headline = payload.estimateHeadline?.trim() || 'Your preliminary estimate'
  const sqftLine = payload.squareFeet ? `Based on approximately ${payload.squareFeet.toLocaleString('en-US')} sq. ft.` : null

  const text = [
    `Hi ${payload.firstName?.trim() || 'there'},`,
    ``,
    `Thanks for using our garage floor estimator. Here is your preliminary estimate:`,
    ``,
    `${headline}`,
    sqftLine ? sqftLine : null,
    payload.finish ? `System: ${payload.finish}` : null,
    ``,
    `This is a preliminary figure. The next step is a free onsite inspection where we confirm the slab condition and give you a firm written estimate — with no upfront payment and a written 5-year workmanship warranty.`,
    ``,
    `Book your free inspection: ${site.bookingUrl}`,
    `Questions? Call or text ${site.phone} or just reply to this email.`,
    ``,
    `${site.company}`,
    `${site.canonical.replace(/^https?:\/\//, '')}`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  const html = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;color:#111">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888">
    ${escapeHtml(site.company)}
  </p>
  <h1 style="margin:0 0 16px;font-size:22px;color:#111">Hi ${first}, here is your estimate</h1>

  <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#333">
    Thanks for using our garage floor estimator. Here is your preliminary estimate:
  </p>

  <div style="border:1px solid #eee;border-radius:10px;padding:20px;text-align:center;margin:0 0 22px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888">
      Your preliminary estimate
    </p>
    <p style="margin:0;font-size:30px;font-weight:700;color:#ea580c">${escapeHtml(headline)}</p>
    ${sqftLine ? `<p style="margin:8px 0 0;font-size:13px;color:#666">${escapeHtml(sqftLine)}</p>` : ''}
    ${payload.finish ? `<p style="margin:6px 0 0;font-size:13px;color:#666">System: ${escapeHtml(payload.finish)}</p>` : ''}
  </div>

  <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#333">
    This is a preliminary figure. The next step is a <strong>free onsite inspection</strong> where we
    confirm the slab condition and give you a firm written estimate — with no upfront payment and a
    written 5-year workmanship warranty.
  </p>

  <p style="margin:0 0 22px">
    <a href="${escapeHtml(site.bookingUrl)}"
       style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600">
      Book my free inspection
    </a>
  </p>

  <p style="margin:0 0 4px;font-size:14px;color:#333">
    Questions? Call or text
    <a href="${escapeHtml(site.phoneHref)}" style="color:#ea580c;text-decoration:none;font-weight:600">${escapeHtml(site.phone)}</a>,
    or just reply to this email.
  </p>

  <p style="margin:22px 0 0;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#888">
    ${escapeHtml(site.company)} · ${escapeHtml(site.canonical.replace(/^https?:\/\//, ''))}<br>
    Reference #${payload.leadId}
  </p>
</div>`

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `Your garage floor estimate — ${site.company}`,
      text,
      html,
      /* Replies go to the business inbox, not the no-reply sender. */
      replyTo: site.email,
    })

    if (error) {
      console.log(`[v0] lead #${payload.leadId}: customer estimate email failed: ${error.message}`)
      return { sent: false, reason: 'send_failed', detail: error.message }
    }

    console.log(`[v0] lead #${payload.leadId}: customer estimate email sent from ${from} to ${to}`)
    return { sent: true, id: data?.id ?? null }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.log(`[v0] lead #${payload.leadId}: customer estimate email threw: ${detail}`)
    return { sent: false, reason: 'send_failed', detail }
  }
}

export async function notifyNewLead(lead: LeadEmailPayload): Promise<NotifyResult> {
  /* Same defensive read as the diagnostic, so both agree on the key. */
  const { key: apiKey, problem } = readApiKey()

  if (problem) {
    console.log(`[v0] RESEND_API_KEY problem while notifying lead #${lead.leadId}: ${problem}`)
  }

  /*
    Absent key is an expected state, not an error: the site must keep taking
    leads before email is configured. Logged loudly enough to be findable in
    runtime logs, and surfaced in the /admin/leads banner so it cannot go
    unnoticed indefinitely.
  */
  if (!apiKey) {
    console.log(
      `[v0] lead #${lead.leadId} saved, but RESEND_API_KEY is not set so no email was sent. Lead is safe in the database and visible at /admin/leads.`,
    )
    return { sent: false, reason: 'not_configured' }
  }

  /* Most useful triage info first — this is read on a phone lock screen. */
  const subjectBits = [lead.name, lead.area ? `${lead.area} sq ft` : null, lead.timeframe]
    .filter(Boolean)
    .join(' · ')

  const priorityLabel = lead.leadScore
    ? { hot: 'HOT', warm: 'WARM', nurture: 'NURTURE' }[lead.leadScore]
    : null

  const summary = [
    `New estimate request #${lead.leadId}`,
    priorityLabel ? `Priority:  ${priorityLabel}` : null,
    ``,
    `Name:      ${lead.name}`,
    `Phone:     ${lead.phone}`,
    lead.email ? `Email:     ${lead.email}` : null,
    lead.zip ? `ZIP:       ${lead.zip}` : null,
    lead.area ? `Area:      ${lead.area} sq ft` : null,
    lead.space ? `Space:     ${lead.space}` : null,
    lead.system ? `System:    ${lead.system}` : null,
    lead.floorCondition ? `Condition: ${lead.floorCondition}` : null,
    lead.timeframe ? `Timeframe: ${lead.timeframe}` : null,
    lead.contactMethod ? `Prefers:   ${lead.contactMethod}` : null,
    lead.photoCount ? `Photos:    ${lead.photoCount} attached (view in admin)` : null,
    ``,
    lead.details ? `Details:\n${lead.details}` : null,
  ]
    .filter((l) => l !== null)
    .join('\n')

  const html = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888">
    New estimate request
  </p>
  <h1 style="margin:0 0 10px;font-size:20px;color:#111">${escapeHtml(lead.name)}</h1>
  ${
    priorityLabel
      ? `<p style="margin:0 0 18px"><span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.06em;${
          lead.leadScore === 'hot'
            ? 'background:#ea580c;color:#fff'
            : lead.leadScore === 'warm'
              ? 'background:#f5c518;color:#111'
              : 'background:#e5e5e5;color:#555'
        }">${priorityLabel} LEAD</span></p>`
      : ''
  }

  <p style="margin:0 0 18px">
    <a href="tel:${escapeHtml(lead.phone.replace(/[^\d+]/g, ''))}"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">
      Call ${escapeHtml(lead.phone)}
    </a>
  </p>

  <table style="border-collapse:collapse;font-size:14px;width:100%">
    ${row('Phone', lead.phone)}
    ${row('Email', lead.email)}
    ${row('ZIP', lead.zip)}
    ${row('Area', lead.area ? `${lead.area} sq ft` : null)}
    ${row('Space', lead.space)}
    ${row('System', lead.system)}
    ${row('Condition', lead.floorCondition)}
    ${row('Timeframe', lead.timeframe)}
    ${row('Prefers', lead.contactMethod)}
    ${row('Photos', lead.photoCount ? `${lead.photoCount} attached` : null)}
  </table>

  ${
    lead.details
      ? `<div style="margin-top:18px"><p style="margin:0 0 4px;font-size:12px;color:#888">Details</p>
         <p style="margin:0;font-size:14px;color:#111;white-space:pre-wrap">${escapeHtml(lead.details)}</p></div>`
      : ''
  }

  ${
    lead.utmSource || lead.gclid || lead.landingPath
      ? `<div style="margin-top:22px;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#888">
           ${lead.utmSource ? `Source: ${escapeHtml(lead.utmSource)}${lead.utmCampaign ? ` / ${escapeHtml(lead.utmCampaign)}` : ''}<br>` : ''}
           ${lead.gclid ? 'Google Ads click<br>' : ''}
           ${lead.landingPath ? `Landed on: ${escapeHtml(lead.landingPath)}` : ''}
         </div>`
      : ''
  }

  <p style="margin:22px 0 0;font-size:12px;color:#888">
    Lead #${lead.leadId} · saved to your database${lead.photoCount ? ' · photos in admin' : ''}
  </p>
</div>`

  try {
    const resend = new Resend(apiKey)

    const attempt = (sender: string) =>
      resend.emails.send({
        from: sender,
        to: TO,
        subject: `${priorityLabel ? `[${priorityLabel}] ` : ''}New estimate: ${subjectBits || lead.name}`,
        text: summary,
        html,
        /*
          Lets the owner hit Reply and reach the customer directly. Only set when
          the customer actually gave an email — pointing Reply-To at nothing would
          be worse than leaving it off.
        */
        ...(lead.email ? { replyTo: lead.email } : {}),
      })

    let sender = await resolveFrom(apiKey)
    let { data, error } = await attempt(sender)

    /*
      One retry from the no-DNS sender when the failure is about the sending
      identity. A real lead is worth a second attempt from a weaker address: an
      email that might land beats one that definitely didn't. Only identity
      errors retry — resending on a rate limit or a bad recipient would just
      duplicate the failure.
    */
    if (error && sender !== FALLBACK_FROM && /domain|verif|from/i.test(error.message)) {
      console.log(
        `[v0] lead #${lead.leadId}: sender "${sender}" rejected (${error.message}); retrying from ${FALLBACK_FROM}.`,
      )
      senderCache = null
      sender = FALLBACK_FROM
      ;({ data, error } = await attempt(sender))
    }

    if (error) {
      console.log(`[v0] Resend rejected lead #${lead.leadId} notification:`, error.message)
      return { sent: false, reason: 'send_failed', detail: error.message }
    }

    console.log(
      `[v0] lead #${lead.leadId} notification sent from ${sender} to ${TO.join(', ')}`,
    )
    return { sent: true, id: data?.id ?? null }
  } catch (error) {
    /*
      Network failure, DNS problem, Resend outage. Swallowed on purpose: the
      lead is already saved and the caller must not fail because of this.
    */
    const detail = error instanceof Error ? error.message : String(error)
    console.log(`[v0] lead #${lead.leadId} notification threw:`, detail)
    return { sent: false, reason: 'send_failed', detail }
  }
}

/* ------------------------------------------------------ appointment booking */

export type AppointmentOwnerPayload = {
  leadId: number
  name: string
  phone: string
  email?: string | null
  zip?: string | null
  slotLabel: string
}

/*
  OWNER notification that an inspection was booked on the site.

  Distinct from notifyNewLead: that one fires when the lead is first captured;
  this one fires later, when the customer picks a time on the scheduling step.
  Same non-throwing contract and the same sender-with-fallback retry, because a
  booked appointment is at least as important to deliver as the original lead.
*/
export async function notifyAppointmentBooked(
  payload: AppointmentOwnerPayload,
): Promise<NotifyResult> {
  const { key: apiKey, problem } = readApiKey()
  if (problem) {
    console.log(`[v0] RESEND_API_KEY problem while emailing appointment for lead #${payload.leadId}: ${problem}`)
  }
  if (!apiKey) {
    console.log(
      `[v0] lead #${payload.leadId}: appointment saved, but RESEND_API_KEY is not set so no email was sent. It is visible at /admin/leads.`,
    )
    return { sent: false, reason: 'not_configured' }
  }

  const summary = [
    `Inspection booked — lead #${payload.leadId}`,
    ``,
    `When:   ${payload.slotLabel}`,
    `Name:   ${payload.name}`,
    `Phone:  ${payload.phone}`,
    payload.email ? `Email:  ${payload.email}` : null,
    payload.zip ? `ZIP:    ${payload.zip}` : null,
    ``,
    `Full details and history are at /admin/leads (lead #${payload.leadId}).`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  const html = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888">
    Inspection booked
  </p>
  <h1 style="margin:0 0 10px;font-size:20px;color:#111">${escapeHtml(payload.name)}</h1>

  <div style="border:1px solid #eee;border-radius:10px;padding:16px 18px;margin:0 0 18px;background:#fafafa">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#888">Requested time</p>
    <p style="margin:0;font-size:18px;font-weight:700;color:#111">${escapeHtml(payload.slotLabel)}</p>
  </div>

  <p style="margin:0 0 18px">
    <a href="tel:${escapeHtml(payload.phone.replace(/[^\d+]/g, ''))}"
       style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">
      Call ${escapeHtml(payload.phone)}
    </a>
  </p>

  <table style="border-collapse:collapse;font-size:14px;width:100%">
    ${row('Phone', payload.phone)}
    ${row('Email', payload.email)}
    ${row('ZIP', payload.zip)}
  </table>

  <p style="margin:22px 0 0;font-size:12px;color:#888">
    Lead #${payload.leadId} · saved to your database · confirm the exact time with the customer
  </p>
</div>`

  try {
    const resend = new Resend(apiKey)
    const attempt = (sender: string) =>
      resend.emails.send({
        from: sender,
        to: TO,
        subject: `Inspection booked: ${payload.name} — ${payload.slotLabel}`,
        text: summary,
        html,
        ...(payload.email ? { replyTo: payload.email } : {}),
      })

    let sender = await resolveFrom(apiKey)
    let { data, error } = await attempt(sender)

    if (error && sender !== FALLBACK_FROM && /domain|verif|from/i.test(error.message)) {
      senderCache = null
      sender = FALLBACK_FROM
      ;({ data, error } = await attempt(sender))
    }

    if (error) {
      console.log(`[v0] Resend rejected appointment email for lead #${payload.leadId}:`, error.message)
      return { sent: false, reason: 'send_failed', detail: error.message }
    }

    console.log(`[v0] lead #${payload.leadId} appointment email sent from ${sender} to ${TO.join(', ')}`)
    return { sent: true, id: data?.id ?? null }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.log(`[v0] lead #${payload.leadId} appointment email threw:`, detail)
    return { sent: false, reason: 'send_failed', detail }
  }
}

export type CustomerAppointmentPayload = {
  leadId: number
  to: string
  firstName: string
  slotLabel: string
}

/*
  CUSTOMER confirmation that their inspection time is booked. Same delivery
  reality as sendCustomerEstimate: only sent from a verified domain, because the
  shared fallback sender cannot reach an arbitrary customer address.
*/
export async function sendCustomerAppointmentConfirmation(
  payload: CustomerAppointmentPayload,
): Promise<CustomerEmailResult> {
  const { key: apiKey, problem } = readApiKey()
  if (problem) {
    console.log(`[v0] RESEND_API_KEY problem while confirming appointment for lead #${payload.leadId}: ${problem}`)
  }
  if (!apiKey) return { sent: false, reason: 'not_configured' }

  const to = payload.to?.trim()
  if (!to) return { sent: false, reason: 'no_email' }

  const from = await resolveFrom(apiKey)
  if (from === FALLBACK_FROM) {
    console.log(
      `[v0] lead #${payload.leadId}: appointment confirmation skipped — no verified sending domain. Verify mail.${DOMAIN} in Resend > Domains to enable customer emails.`,
    )
    return { sent: false, reason: 'no_verified_domain' }
  }

  const first = escapeHtml(payload.firstName?.trim() || 'there')
  const slot = escapeHtml(payload.slotLabel)

  const text = [
    `Hi ${payload.firstName?.trim() || 'there'},`,
    ``,
    `Your free onsite garage floor inspection is booked for:`,
    ``,
    `${payload.slotLabel}`,
    ``,
    `We'll arrive within that window to confirm your slab condition, moisture and prep needs, then put a firm scope and price in writing — no upfront payment, with a written 5-year workmanship warranty.`,
    ``,
    `Need to change the time? Just call or text ${site.phone} or reply to this email.`,
    ``,
    `${site.company}`,
    `${site.canonical.replace(/^https?:\/\//, '')}`,
  ].join('\n')

  const html = `
<div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;color:#111">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#888">
    ${escapeHtml(site.company)}
  </p>
  <h1 style="margin:0 0 16px;font-size:22px;color:#111">Hi ${first}, your inspection is booked</h1>

  <div style="border:1px solid #eee;border-radius:10px;padding:20px;text-align:center;margin:0 0 22px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#888">Your inspection</p>
    <p style="margin:0;font-size:22px;font-weight:700;color:#ea580c">${slot}</p>
  </div>

  <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#333">
    We&apos;ll arrive within that window to confirm your slab condition, moisture and prep needs, then
    put a firm scope and price in writing — with <strong>no upfront payment</strong> and a written
    5-year workmanship warranty.
  </p>

  <p style="margin:0 0 4px;font-size:14px;color:#333">
    Need to change the time? Call or text
    <a href="${escapeHtml(site.phoneHref)}" style="color:#ea580c;text-decoration:none;font-weight:600">${escapeHtml(site.phone)}</a>,
    or just reply to this email.
  </p>

  <p style="margin:22px 0 0;padding-top:14px;border-top:1px solid #eee;font-size:12px;color:#888">
    ${escapeHtml(site.company)} · ${escapeHtml(site.canonical.replace(/^https?:\/\//, ''))}<br>
    Reference #${payload.leadId}
  </p>
</div>`

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `Your inspection is booked — ${payload.slotLabel}`,
      text,
      html,
      replyTo: site.email,
    })

    if (error) {
      console.log(`[v0] lead #${payload.leadId}: appointment confirmation failed: ${error.message}`)
      return { sent: false, reason: 'send_failed', detail: error.message }
    }

    console.log(`[v0] lead #${payload.leadId}: appointment confirmation sent from ${from} to ${to}`)
    return { sent: true, id: data?.id ?? null }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.log(`[v0] lead #${payload.leadId}: appointment confirmation threw: ${detail}`)
    return { sent: false, reason: 'send_failed', detail }
  }
}
