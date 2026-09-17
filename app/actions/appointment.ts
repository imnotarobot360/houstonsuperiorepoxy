'use server'

import { cookies, headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { estimateLeads } from '@/lib/db/schema'
import { notifyAppointmentBooked, sendCustomerAppointmentConfirmation } from '@/lib/email'
import { sendCapiEvent } from '@/lib/meta'
import { firstNameFrom } from '@/lib/sms'
import { validateSlotId } from '@/lib/scheduling'

/*
  Books an inspection time against an EXISTING lead.

  The lead was already created and stored when the customer submitted the
  estimate form, so this action never creates a lead — it attaches the chosen
  slot to one. That is what lets the scheduling step re-use the details the
  customer already gave (name, phone, ZIP) instead of asking again: the row is
  already there, keyed by `leadId`, and we only fill in the appointment columns.

  Same non-throwing discipline as the lead path: the booking is written to
  Postgres first (the system of record), then email and Meta run as advisory
  best-effort. A mail or tracking failure must never turn a saved booking into
  an error for the customer.
*/

export type BookResult =
  | { ok: true; label: string; capiSent: boolean; eventId: string }
  | { ok: false; error: string }

export async function bookAppointment(leadId: number, slotId: string): Promise<BookResult> {
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return { ok: false, error: 'We lost track of your request. Please call or text us to book.' }
  }

  /*
    Re-validated server-side from the slot id alone. The client renders the same
    slots, but the accepted set is decided here — a posted label or a stale slot
    cannot book a time the business does not actually offer.
  */
  const slot = validateSlotId(slotId)
  if (!slot) {
    return { ok: false, error: 'That time is no longer available. Please pick another slot.' }
  }

  /* The lead must exist and carry the contact details we booked against. */
  const [lead] = await db
    .select({
      id: estimateLeads.id,
      name: estimateLeads.name,
      phone: estimateLeads.phone,
      email: estimateLeads.email,
      zip: estimateLeads.zip,
    })
    .from(estimateLeads)
    .where(eq(estimateLeads.id, leadId))
    .limit(1)

  if (!lead) {
    return { ok: false, error: 'We could not find your request. Please call or text us to book.' }
  }

  try {
    await db
      .update(estimateLeads)
      .set({
        appointmentAt: slot.at,
        appointmentSlotLabel: slot.label,
        appointmentStatus: 'scheduled',
        appointmentBookedAt: new Date(),
      })
      .where(eq(estimateLeads.id, leadId))
  } catch (error) {
    console.log(`[v0] lead #${leadId}: appointment save failed:`, error)
    return { ok: false, error: 'Something went wrong saving your time. Please call or text us.' }
  }

  /*
    Owner notification. Awaited but never fatal (a frozen serverless function
    would kill a floating promise, see the lead path), so the booking is
    confirmed to the customer regardless of whether email succeeds.
  */
  try {
    await notifyAppointmentBooked({
      leadId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      zip: lead.zip,
      slotLabel: slot.label,
    })
  } catch (error) {
    console.log(`[v0] lead #${leadId}: appointment owner email threw:`, error)
  }

  /* Customer confirmation — only when they gave an email and a domain is verified. */
  if (lead.email) {
    try {
      await sendCustomerAppointmentConfirmation({
        leadId,
        to: lead.email,
        firstName: firstNameFrom(lead.name),
        slotLabel: slot.label,
      })
    } catch (error) {
      console.log(`[v0] lead #${leadId}: appointment customer email threw:`, error)
    }
  }

  /*
    Server-side Meta Schedule. Unlike the old off-site calendar (which could
    only fire a browser-side Schedule with no confirmation), the booking is now
    confirmed on our server, so this is a real server conversion. Shares an
    event id with the client Schedule so Meta dedups the pair. Inert unless the
    CAPI env vars are set.
  */
  const eventId = crypto.randomUUID()
  let capiSent = false
  try {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
    const capi = await sendCapiEvent({
      eventName: 'Schedule',
      eventId,
      eventSourceUrl: headerStore.get('referer'),
      user: {
        email: lead.email,
        phone: lead.phone,
        zip: lead.zip,
        fbp: cookieStore.get('_fbp')?.value ?? null,
        fbc: cookieStore.get('_fbc')?.value ?? null,
        clientIp: headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: headerStore.get('user-agent')?.slice(0, 400) ?? null,
      },
    })
    capiSent = capi.sent
  } catch (error) {
    console.log(`[v0] lead #${leadId}: appointment CAPI threw:`, error)
  }

  return { ok: true, label: slot.label, capiSent, eventId }
}
