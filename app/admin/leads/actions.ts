'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  createAdminSession,
  destroyAdminSession,
  isAdminAuthed,
  isAdminConfigured,
  verifyPassword,
} from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { estimateLeads } from '@/lib/db/schema'
import { diagnoseEmail, type EmailDiagnostic, notifyNewLead } from '@/lib/email'

/*
  A deliberate delay on every failed login attempt.

  Without it, this endpoint is an online password oracle that can be hammered
  as fast as the network allows. A second per attempt makes brute force
  impractical while being invisible to the one person who types the password
  correctly. Cheap, and the only rate limiting this surface needs.
*/
const FAILURE_DELAY_MS = 1000
const pause = () => new Promise((r) => setTimeout(r, FAILURE_DELAY_MS))

export async function login(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!isAdminConfigured()) {
    return { error: 'ADMIN_PASSWORD is not set on this project, so the admin page is locked.' }
  }

  const password = String(formData.get('password') ?? '')
  if (!password) return { error: 'Enter the admin password.' }

  if (!verifyPassword(password)) {
    await pause()
    /* Intentionally vague — never confirm whether a guess was close. */
    return { error: 'Incorrect password.' }
  }

  await createAdminSession()
  revalidatePath('/admin/leads')
  return {}
}

export async function logout() {
  await destroyAdminSession()
  revalidatePath('/admin/leads')
}

/*
  Mark a lead contacted / quoted / won / lost.

  Re-checks the session server-side. A server action is a public HTTP endpoint:
  anyone can POST to it directly, so the fact that the UI is behind a login
  proves nothing about the caller. Authorising inside the action is the actual
  protection.
*/
/*
  The `status` column is plain text with no database-level constraint, so this
  whitelist is the ONLY thing stopping arbitrary strings being written by a
  direct POST. Do not remove it.
*/
const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost']

/*
  Re-send the owner notification for a lead already in the database.

  This is the recovery path that was missing, and its absence is why a lost
  notification meant a permanently lost lead. Notifications were only ever
  attempted once, in the same request that created the lead — so if the key was
  wrong, the domain unverified, or the request served by a stale deployment, the
  only record of that customer sat in a table nobody was watching, with no way to
  retry short of asking them to submit the form again.

  Reads the lead back from the database rather than trusting anything passed in:
  the caller supplies only an id, so this cannot be used to send arbitrary
  content, and the email always reflects what was actually stored.
*/
export async function resendLeadNotification(
  leadId: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdminAuthed())) return { ok: false, error: 'Not signed in.' }
  if (!Number.isInteger(leadId) || leadId <= 0) return { ok: false, error: 'Invalid lead.' }

  const [lead] = await db
    .select()
    .from(estimateLeads)
    .where(eq(estimateLeads.id, leadId))
    .limit(1)

  if (!lead) return { ok: false, error: 'That lead no longer exists.' }

  const result = await notifyNewLead({
    leadId: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    zip: lead.zip,
    area: lead.area,
    space: lead.space,
    system: lead.system,
    floorCondition: lead.floorCondition,
    timeframe: lead.timeframe,
    contactMethod: lead.contactMethod,
    details: lead.details,
    photoCount: lead.photoPathnames?.length ?? 0,
    utmSource: lead.utmSource,
    utmCampaign: lead.utmCampaign,
    gclid: lead.gclid,
    landingPath: lead.landingPath,
  })

  /* Same bookkeeping as the original attempt, so the row never lies. */
  if (result.sent) {
    await db
      .update(estimateLeads)
      .set({ notifiedAt: new Date(), notifyError: null })
      .where(eq(estimateLeads.id, leadId))
  } else {
    const detail =
      result.reason === 'not_configured'
        ? 'Not sent: RESEND_API_KEY is not available in this environment.'
        : (result.detail ?? 'Unknown error')

    await db
      .update(estimateLeads)
      .set({ notifiedAt: null, notifyError: detail.slice(0, 500) })
      .where(eq(estimateLeads.id, leadId))

    revalidatePath('/admin/leads')
    return { ok: false, error: detail }
  }

  revalidatePath('/admin/leads')
  return { ok: true }
}

export async function setLeadStatus(leadId: number, status: string) {
  if (!(await isAdminAuthed())) return { ok: false as const }
  if (!STATUSES.includes(status)) return { ok: false as const }
  if (!Number.isInteger(leadId) || leadId <= 0) return { ok: false as const }

  await db.update(estimateLeads).set({ status }).where(eq(estimateLeads.id, leadId))

  revalidatePath('/admin/leads')
  return { ok: true as const }
}

/*
  Send a real test email and report exactly what happened.

  Authorised like any other action — this hits a third-party API and reveals the
  configured sender and recipients, so it must never be callable anonymously.

  The point is to replace "I'm not receiving the email" with a specific,
  actionable reason (no API key / domain not verified / bad recipient), which
  previously required reading server logs the owner has no access to.
*/
export async function sendTestEmail(
  recipient?: string,
): Promise<EmailDiagnostic | { unauthorized: true }> {
  if (!(await isAdminAuthed())) return { unauthorized: true }

  /*
    The optional recipient is attacker-controlled input on an authenticated
    endpoint that sends mail, so it is validated rather than passed through.
    Without a shape check this action would be a small open relay for sending
    arbitrary addresses a message from the owner's verified domain.
  */
  const trimmed = recipient?.trim()
  if (trimmed) {
    if (trimmed.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return {
        ok: false,
        from: '(not attempted)',
        to: [trimmed.slice(0, 60)],
        hasApiKey: true,
        error: 'That does not look like a valid email address.',
        hint: 'Enter one address, for example you@gmail.com, or leave it blank to use the usual recipient.',
      }
    }
  }

  return diagnoseEmail(trimmed || undefined)
}
