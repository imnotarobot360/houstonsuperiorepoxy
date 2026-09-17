'use client'

import { useState } from 'react'
import { Phone, MessageSquare, Calendar } from 'lucide-react'
import { site } from '@/lib/site'
import { GARAGE_SIZES } from '@/lib/pricing-config'
import { submitEstimate } from '@/app/actions/estimate'

/*
  Static, dependency-light fallback shown when the interactive estimator cannot
  run (see EstimatorErrorBoundary) or is still loading. The spec requires it to
  keep every conversion path open even with no calculator: a minimal lead form
  (name, phone, ZIP, garage size), click-to-call, click-to-text, and a link to
  the booking calendar.

  It posts to the SAME submitEstimate action as the full funnel, so a lead
  captured here is indistinguishable downstream — it still scores, emails, and
  lands in the one admin inbox. No price, no multi-step state, nothing that can
  throw: this is the floor beneath the funnel.
*/
export function EstimatorFallback() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function onSubmit(formData: FormData) {
    setStatus('sending')
    /* Fixed context so these leads are attributable to the fallback path. */
    formData.set('space', 'Garage')
    formData.set('landing_path', '/garage-floor-estimator-houston')
    formData.set('details', 'Submitted via estimator fallback form.')
    const result = await submitEstimate(formData)
    setStatus(result.ok ? 'done' : 'error')
  }

  if (status === 'done') {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <h3 className="text-xl font-semibold text-foreground">Thanks — we have your request</h3>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          A Houston Superior Epoxy estimator will reach out shortly. Prefer to talk now?
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={site.phoneHref} className="inline-flex items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground">
            <Phone size={16} aria-hidden="true" /> Call {site.phone}
          </a>
          <a href={site.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border border-border px-5 py-3 text-sm font-bold uppercase tracking-wide text-foreground">
            <Calendar size={16} aria-hidden="true" /> Book an inspection
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-xl font-semibold text-foreground text-balance">
        Get your free garage floor estimate
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Tell us where to reach you and we&apos;ll get you a written proposal after a quick look at
        your slab.
      </p>

      <form action={onSubmit} className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fb-name" className="text-sm font-medium text-foreground">Full name</label>
          <input id="fb-name" name="name" required autoComplete="name" className="rounded-md border border-border bg-background px-3 py-2.5 text-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fb-phone" className="text-sm font-medium text-foreground">Mobile phone</label>
          <input id="fb-phone" name="phone" required inputMode="tel" autoComplete="tel" className="rounded-md border border-border bg-background px-3 py-2.5 text-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fb-zip" className="text-sm font-medium text-foreground">ZIP code</label>
          <input id="fb-zip" name="zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} className="rounded-md border border-border bg-background px-3 py-2.5 text-foreground" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fb-size" className="text-sm font-medium text-foreground">Garage size</label>
          <select id="fb-size" name="area" className="rounded-md border border-border bg-background px-3 py-2.5 text-foreground">
            {GARAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {status === 'error' && (
          <p role="alert" className="text-sm text-primary">
            Something went wrong. Please call or text us and we&apos;ll take care of it.
          </p>
        )}

        <button type="submit" disabled={status === 'sending'} className="bg-primary px-6 py-4 text-base font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60">
          {status === 'sending' ? 'Sending…' : 'Request My Estimate'}
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
        <a href={site.phoneHref} className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-3 text-sm font-semibold text-foreground">
          <Phone size={16} aria-hidden="true" /> Call
        </a>
        <a href={site.smsHref} className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-3 text-sm font-semibold text-foreground">
          <MessageSquare size={16} aria-hidden="true" /> Text
        </a>
        <a href={site.bookingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-3 text-sm font-semibold text-foreground">
          <Calendar size={16} aria-hidden="true" /> Book
        </a>
      </div>
    </div>
  )
}
