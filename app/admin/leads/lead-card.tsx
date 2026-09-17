'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { Calendar } from 'lucide-react'
import type { InferSelectModel } from 'drizzle-orm'
import type { estimateLeads } from '@/lib/db/schema'
import { LEAD_STATUS_SPAM } from '@/lib/leads'
import { resendLeadNotification, setLeadStatus } from './actions'

type Lead = InferSelectModel<typeof estimateLeads>

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const

/* Only `new` is highlighted — it is the one status that demands action. */
const statusStyle = (s: string, active: boolean) =>
  active
    ? s === 'new'
      ? 'bg-primary text-primary-foreground'
      : 'bg-foreground text-background'
    : 'text-muted-foreground hover:text-foreground'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
    </div>
  )
}

export function LeadCard({ lead }: { lead: Lead }) {
  /*
    Optimistic status so the button responds instantly. The server action
    revalidates and reconciles; if it fails, React reverts to the real value
    rather than leaving a lie on screen.
  */
  const [status, setOptimistic] = useOptimistic(lead.status)
  const [, startTransition] = useTransition()

  const update = (next: string) =>
    startTransition(async () => {
      setOptimistic(next)
      await setLeadStatus(lead.id, next)
    })

  /*
    Kept as its own transition so a slow email attempt never blocks the status
    buttons, and its failure is reported inline instead of silently doing
    nothing — the failure mode that started this whole hunt.
  */
  const [sending, startSending] = useTransition()
  const [resendError, setResendError] = useState<string | null>(null)

  const resend = () =>
    startSending(async () => {
      setResendError(null)
      const r = await resendLeadNotification(lead.id)
      if (!r.ok) setResendError(r.error ?? 'Could not send.')
    })

  const created = new Date(lead.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Chicago', // the business is in Houston; show its local time
  })

  const attribution = [
    lead.utmSource ? `${lead.utmSource}${lead.utmCampaign ? ` / ${lead.utmCampaign}` : ''}` : null,
    lead.gclid ? 'Google Ads click' : null,
    lead.landingPath ? `landed ${lead.landingPath}` : null,
  ].filter(Boolean)

  return (
    <article className="border border-border bg-card/40 p-5">
      {/*
        Only shown when a send was attempted and rejected. Deliberately not
        shown when email is unconfigured — that is a one-time setup step with
        its own banner, and repeating it on every lead would be noise.
      */}
      {/*
        Keyed off `notifiedAt` rather than `notifyError`, so a lead that was
        never emailed for ANY reason says so.

        Previously this only appeared when an error string happened to be
        recorded, which meant the worst case — no email and no recorded reason —
        rendered no banner at all and looked identical to a delivered lead. A
        real customer sat unnoticed in this list because of that gap.
      */}
      {!lead.notifiedAt && status !== LEAD_STATUS_SPAM ? (
        <div className="mb-4 border-l-2 border-destructive px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Not emailed to you.</span> The lead itself
            is saved safely — only the notification failed.
            {lead.notifyError ? (
              <>
                {' '}
                <span className="font-mono text-[0.7rem] text-destructive">{lead.notifyError}</span>
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="mt-2 border border-border px-2 py-1 text-[0.7rem] text-foreground hover:bg-muted disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send it to me now'}
          </button>
          {resendError ? (
            <p className="mt-2 font-mono text-[0.7rem] text-destructive">{resendError}</p>
          ) : null}
        </div>
      ) : null}

      {/*
        Shown for leads the bot trap flagged. These used to be deleted without
        a trace, so this banner exists to make the judgement call visible and
        reversible: if it is a real customer, one click on a status below
        returns them to the normal pipeline.
      */}
      {status === LEAD_STATUS_SPAM ? (
        <p className="mb-4 border-l-2 border-primary px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Flagged for review, not emailed.</span> A
          hidden anti-spam field was filled, which usually means a bot — but browser autofill can
          trip it too. If this looks like a real customer, set a status below to clear the flag.
        </p>
      ) : null}

      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-serif text-xl text-foreground">{lead.name}</h2>
        <p className="font-mono text-xs text-muted-foreground">
          #{lead.id} · {created}
        </p>
      </header>

      {/* Phone first and tappable: this list is read on a phone, and calling
          back fast is the entire point of a lead. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
          className="bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Call {lead.phone}
        </a>
        {lead.email ? (
          <a
            href={`mailto:${lead.email}`}
            className="text-sm text-primary underline underline-offset-4"
          >
            {lead.email}
          </a>
        ) : null}
      </div>

      {/*
        The booked inspection window, when the customer picked one on the site.
        Placed high and highlighted because it is the single most action-driving
        fact on the card — this is the time someone has to show up. Bookings made
        off-site never reached this inbox at all; now they land here.
      */}
      {lead.appointmentStatus === 'scheduled' && lead.appointmentSlotLabel ? (
        <div className="mt-4 flex items-center gap-2 border-l-2 border-primary bg-primary/5 px-3 py-2">
          <Calendar size={16} className="text-primary" aria-hidden="true" />
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
              Inspection booked
            </p>
            <p className="text-sm font-medium text-foreground">{lead.appointmentSlotLabel}</p>
          </div>
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {lead.zip ? <Field label="ZIP">{lead.zip}</Field> : null}
        {lead.area ? <Field label="Area">{lead.area} sq ft</Field> : null}
        {lead.space ? <Field label="Space">{lead.space}</Field> : null}
        {lead.system ? <Field label="System">{lead.system}</Field> : null}
        {lead.floorCondition ? <Field label="Condition">{lead.floorCondition}</Field> : null}
        {lead.timeframe ? <Field label="Timeframe">{lead.timeframe}</Field> : null}
        {lead.contactMethod ? <Field label="Prefers">{lead.contactMethod}</Field> : null}
        <Field label="SMS consent">{lead.smsConsent ? 'Yes' : 'No'}</Field>
      </dl>

      {lead.details ? (
        <div className="mt-4">
          <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">Details</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {lead.details}
          </p>
        </div>
      ) : null}

      {lead.photoPathnames?.length ? (
        <div className="mt-4">
          <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
            Photos ({lead.photoPathnames.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {lead.photoPathnames.map((p, i) => (
              <a
                key={p}
                href={`/admin/leads/photo?p=${encodeURIComponent(p)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border px-3 py-1.5 text-xs text-primary transition-colors hover:border-primary"
              >
                Photo {i + 1}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-border pt-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => update(s)}
            aria-pressed={status === s}
            className={`px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors ${statusStyle(s, status === s)}`}
          >
            {s}
          </button>
        ))}
      </div>

      {attribution.length ? (
        <p className="mt-3 font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
          {attribution.join(' · ')}
        </p>
      ) : null}
    </article>
  )
}
