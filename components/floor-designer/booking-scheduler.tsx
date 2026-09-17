'use client'

import { useMemo, useState, useTransition } from 'react'
import { bookAppointment } from '@/app/actions/appointment'
import { generateScheduleDays } from '@/lib/scheduling'
import { site } from '@/lib/site'
import { trackMeta } from '@/lib/meta-events'

/*
  In-site inspection scheduler, bound to a lead that already exists.

  The lead was created when the estimate form was submitted, so this only
  attaches a chosen slot to it (see app/actions/appointment.ts). Days and slots
  come from lib/scheduling.ts — the SAME generator the server validates against —
  so what the customer sees and what the server accepts cannot drift.
*/
export function BookingScheduler({
  leadId,
  firstName,
}: {
  leadId: number
  firstName: string
}) {
  /* Generated once on mount; pure date math, no fetch. */
  const days = useMemo(() => generateScheduleDays(), [])
  const [activeDay, setActiveDay] = useState(0)
  const [confirmed, setConfirmed] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (confirmed) {
    return (
      <div className="rounded-xl border border-primary/40 bg-primary/5 p-6">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-primary">
          You&apos;re on the schedule
        </p>
        <h3 className="mt-3 font-serif text-2xl tracking-tight text-foreground text-balance">
          See you {confirmed}, {firstName}.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
          We&apos;ll confirm by phone and bring physical flake sample boards so you can compare your
          shortlist on your own slab, under your own light, before anything is ordered. Need to
          change the time? Call or text{' '}
          <a href={site.phoneHref} className="text-foreground underline underline-offset-2">
            {site.phone}
          </a>
          .
        </p>
      </div>
    )
  }

  if (days.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
        We&apos;re fully booked online right now. Call or text{' '}
        <a href={site.phoneHref} className="text-foreground underline underline-offset-2">
          {site.phone}
        </a>{' '}
        and we&apos;ll find you the soonest time.
      </p>
    )
  }

  const day = days[activeDay]

  function book(slotId: string) {
    setError(null)
    startTransition(async () => {
      const result = await bookAppointment(leadId, slotId)
      if (result.ok) {
        trackMeta('Schedule', { content_name: 'Floor Designer' }, result.eventId)
        setConfirmed(result.label)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-primary">
          Last step
        </p>
        <h3 className="mt-2 font-serif text-2xl tracking-tight text-foreground text-balance">
          Pick a time for your free inspection
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          We already have your details, {firstName} — just choose a two-hour arrival window that
          works. These are scoping visits routed around the crew&apos;s day, so we confirm the exact
          time by phone.
        </p>
      </div>

      {/* Day selector */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose a day">
        {days.map((d, i) => {
          const active = i === activeDay
          return (
            <button
              key={d.dateId}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveDay(i)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {d.dayLabel}
            </button>
          )
        })}
      </div>

      {/* Slots for the active day */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {day.slots.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={pending}
            onClick={() => book(s.id)}
            className="rounded-lg border border-border px-3 py-3 text-sm text-foreground transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {pending && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Booking your time…
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
