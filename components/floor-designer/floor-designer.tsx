'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { submitEstimate } from '@/app/actions/estimate'
import { computeEstimate, type EstimatorAnswers } from '@/lib/estimate-calc'
import { flakeBlends } from '@/lib/content/flake-blends'
import {
  COATING_CONDITIONS,
  type CoatingCondition,
  GARAGE_SIZES,
  type GarageSize,
  RECOMMENDED_FINISH,
  TIMEFRAMES,
  type Timeframe,
} from '@/lib/pricing-config'
import { CatalogTextLink } from '@/components/catalog-cta'
import { HONEYPOT_FIELD } from '@/lib/leads'
import { newEventId, readFbCookies, trackMeta, trackMetaOnce } from '@/lib/meta-events'
import { site } from '@/lib/site'
import { BlendPicker } from './blend-picker'
import { BookingScheduler } from './booking-scheduler'
import type { InstalledPhoto } from './floor-detail-strip'
import { FloorPreview } from './floor-preview'

/*
  The /floor-designer experience.

  Design-first counterpart to the question-first estimator at
  /garage-floor-estimator-houston. The visitor leads with COLOUR — the preview is
  the constant on the page — then answers the two facts that let the gated
  estimate say something honest (size + slab condition), submits contact details,
  and books an inspection in-site.

  Everything downstream is REUSED, not rebuilt:
    - computeEstimate()  — same gated pricing engine, so no invented number can
      appear here that the main estimator would not also show.
    - submitEstimate()   — same server action, so the lead lands in Postgres,
      /admin/leads and the info@ notification exactly like every other lead.
    - BookingScheduler    — same in-site scheduler and bookAppointment action.

  The finish is fixed to the flake system because this page is specifically about
  choosing a flake blend; metallic and solid-colour are not blend-driven.
*/

const DEFAULT_SLUG = 'cabin-fever' // balanced mid-tone; /colors/ cites it as a strong dirt-hiding pick

type Phase = 'design' | 'booking'

type FieldErrors = Record<string, string>

/*
  `catalogEnabled` arrives as a prop because this is a client component and
  FLAKECOLOR_URL is server-only — see lib/catalog.ts. Defaults to false so the
  catalog link is absent unless a server page positively says otherwise.
*/
export function FloorDesigner({
  catalogEnabled = false,
  installed = {},
}: {
  catalogEnabled?: boolean
  /* Real installed floors by blend slug — assembled server-side, see the page. */
  installed?: Record<string, InstalledPhoto>
}) {
  const [slug, setSlug] = useState(DEFAULT_SLUG)
  const [lighting, setLighting] = useState<'bright' | 'dim'>('bright')
  const [size, setSize] = useState<GarageSize | null>(null)
  const [condition, setCondition] = useState<CoatingCondition | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('As Soon as Possible')
  const [smsConsent, setSmsConsent] = useState(false)

  const [phase, setPhase] = useState<Phase>('design')
  const [leadId, setLeadId] = useState<number | null>(null)
  const [firstName, setFirstName] = useState('there')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const formRef = useRef<HTMLFormElement>(null)

  const blend = useMemo(() => flakeBlends.find((b) => b.slug === slug) ?? flakeBlends[0], [slug])

  /* One ViewContent per session — this page is the ad's content. */
  useEffect(() => {
    trackMetaOnce('floor_designer_view', 'ViewContent', { content_name: 'Floor Designer' })
  }, [])

  /*
    The gated estimate. Computed live once both facts are chosen, using defaults
    (no damage, no added surfaces) that keep the two-car qualifying anchor
    honest. Null until then, so the card prompts instead of guessing.
  */
  const estimate = useMemo(() => {
    if (!size || !condition) return null
    const answers: EstimatorAnswers = {
      garageSize: size,
      squareFeetEntered: null,
      coatingCondition: condition,
      damage: ['None That I Can See'],
      addedSurfaces: ['None'],
      finish: RECOMMENDED_FINISH,
      zip: '',
      timeframe,
    }
    return computeEstimate(answers)
  }, [size, condition, timeframe])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setFormError(null)

    const form = e.currentTarget
    const data = new FormData(form)

    /* Fixed + derived context the server needs, added as fields. */
    data.set('area', size ?? '')
    data.set('floorCondition', condition ?? '')
    data.set('timeframe', timeframe)
    data.set(
      'details',
      `Floor Designer — leaning toward the "${blend.name}" flake blend (${blend.family}, ${blend.tone}-tone). Finish: ${RECOMMENDED_FINISH}. Viewed in ${lighting === 'dim' ? 'dim/one-bulb' : 'bright'} lighting.`,
    )
    data.set('smsConsent', smsConsent ? 'on' : '')

    /* Powers the customer-facing estimate email (see app/actions/estimate.ts). */
    if (estimate) {
      data.set('estimate_headline', estimate.headline)
      data.set('finish_label', estimate.finishLabel)
      if (estimate.squareFeet != null) data.set('estimate_sqft', String(estimate.squareFeet))
    }

    /* Shared Meta event id so the Pixel Lead and the server CAPI Lead dedup. */
    const leadEventId = newEventId()
    data.set('meta_event_id', leadEventId)

    /* Best-effort attribution the client can see but the server action cannot. */
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']) {
        const v = params.get(k)
        if (v) data.set(k, v)
      }
      data.set('landing_path', window.location.pathname)
      data.set('referrer', document.referrer || '')
      const { fbp, fbc } = readFbCookies()
      if (fbp) data.set('fbp', fbp)
      if (fbc) data.set('fbc', fbc)
    }

    startTransition(async () => {
      const result = await submitEstimate(data)
      if (result.ok) {
        const name = (data.get('name') as string) || 'there'
        setFirstName(name.trim().split(/\s+/)[0] || 'there')
        setLeadId(result.leadId)
        trackMeta('Lead', { content_name: 'Floor Designer' }, result.meta?.eventId ?? leadEventId)
        setPhase('booking')
        formRef.current?.reset()
        requestAnimationFrame(() =>
          document.getElementById('designer-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        )
      } else {
        setErrors(result.fieldErrors ?? {})
        setFormError(result.formError ?? null)
      }
    })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14" id="designer-flow">
      {/* ------------------------------------------------------- Preview column */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        {/*
          ORDER IS THE LAYOUT SPEC: garage panel, then the blend name, then the
          samples, then the caveat. The name used to sit BELOW the sample strip
          and the disclaimer, which meant the largest thing on the page was
          unlabelled until you had scrolled past two other blocks.
        */}
        <FloorPreview
          blend={blend}
          lighting={lighting}
          installed={installed[blend.slug]}
          heading={
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {/*
                  Req 13's label for the panel above, placed as the eyebrow to
                  the name so the two read as one line of thought: this is a
                  preview, and it is of this blend.
                */}
                <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Installed floor preview
                </p>
                <h2 className="mt-1.5 font-serif text-3xl leading-none tracking-tight text-foreground">
                  {blend.name}
                </h2>
                <p className="mt-1.5 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-primary">
                  {blend.family} · {blend.tone}-tone
                </p>
              </div>

              {/* Lighting toggle — the on-brand, load-bearing control */}
              <div
                role="group"
                aria-label="Preview lighting"
                className="flex gap-1 rounded-lg border border-border p-1"
              >
                {(['bright', 'dim'] as const).map((l) => {
                  const active = l === lighting
                  return (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setLighting(l)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {l === 'bright' ? 'Bright' : 'One bulb'}
                    </button>
                  )
                })}
              </div>

              {/* Full width under both, so a long blurb never squeezes the toggle. */}
              <p className="w-full text-sm leading-relaxed text-muted-foreground text-pretty">
                {blend.blurb}
              </p>
            </div>
          }
        />
      </div>

      {/* --------------------------------------------------------- Control column */}
      <div className="flex flex-col gap-10">
        {phase === 'booking' && leadId ? (
          <BookingScheduler leadId={leadId} firstName={firstName} />
        ) : (
          <>
            {/* 01 — Colour */}
            <section aria-labelledby="step-color" className="flex flex-col gap-4">
              <StepHeading n="01" id="step-color" title="Choose a flake blend" />
              <BlendPicker selectedSlug={slug} onSelect={setSlug} />
              {/*
                Under step 01 specifically: the alternative to picking a blend
                here is picking one on a phone, so the offer belongs beside the
                picker rather than at the foot of the page. Renders nothing
                while FLAKECOLOR_URL is unset.
              */}
              <CatalogTextLink enabled={catalogEnabled} />
            </section>

            {/* 02 — Space */}
            <section aria-labelledby="step-space" className="flex flex-col gap-5">
              <StepHeading n="02" id="step-space" title="Tell us about the space" />

              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium text-foreground">Garage size</legend>
                <div className="flex flex-wrap gap-2">
                  {GARAGE_SIZES.map((s) => {
                    const active = s === size
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSize(s)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Current slab condition</span>
                <select
                  value={condition ?? ''}
                  onChange={(e) => setCondition((e.target.value || null) as CoatingCondition | null)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Select the closest match…</option>
                  {COATING_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Timeframe</span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {TIMEFRAMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {/* 03 — Estimate (gated) */}
            <section aria-labelledby="step-estimate" className="flex flex-col gap-4">
              <StepHeading n="03" id="step-estimate" title="Your starting estimate" />
              <EstimateCard estimate={estimate} />
            </section>

            {/* 04 — Contact */}
            <section aria-labelledby="step-contact" className="flex flex-col gap-4">
              <StepHeading n="04" id="step-contact" title="Get it in writing" />
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                Send your details and we&apos;ll bring physical samples of your shortlist to a free
                onsite inspection, then put the final scope and price in writing. No payment up front.
              </p>

              <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
                {/* Honeypot — visually hidden, not display:none, so bots still fill it */}
                <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
                  <label htmlFor={HONEYPOT_FIELD}>Do not fill this field</label>
                  <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <Field label="Name" name="name" error={errors.name} required>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone" name="phone" error={errors.phone} required>
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </Field>
                  <Field label="ZIP" name="zip" error={errors.zip}>
                    <input
                      name="zip"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </Field>
                </div>

                <Field label="Email" name="email" error={errors.email} hint="So we can email your estimate">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </Field>

                <label className="flex items-start gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
                  />
                  <span className="leading-relaxed text-pretty">
                    Text me about my estimate and inspection. Message and data rates may apply; reply
                    STOP to opt out.
                  </span>
                </label>

                {formError && (
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="mt-1 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? 'Sending…' : 'Get my estimate & pick a time'}
                </button>

                <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
                  Prefer to talk? Call or text{' '}
                  <a href={site.phoneHref} className="text-foreground underline underline-offset-2">
                    {site.phone}
                  </a>
                  .
                </p>
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function StepHeading({ n, id, title }: { n: string; id: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-border pb-3">
      <span className="font-mono text-xs text-primary">{n}</span>
      <h2 id={id} className="font-serif text-xl tracking-tight text-foreground">
        {title}
      </h2>
    </div>
  )
}

function Field({
  label,
  name,
  error,
  required,
  hint,
  children,
}: {
  label: string
  name: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="flex items-baseline justify-between gap-2 text-sm font-medium text-foreground">
        <span>
          {label}
          {required ? <span className="text-primary"> *</span> : <span className="text-muted-foreground"> (optional)</span>}
        </span>
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function EstimateCard({ estimate }: { estimate: ReturnType<typeof computeEstimate> | null }) {
  if (!estimate) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Choose a garage size and slab condition above to see your starting estimate.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-primary">
        Preliminary — {estimate.finishLabel}
      </p>
      <p className="mt-2 font-serif text-3xl tracking-tight text-foreground text-balance">
        {estimate.headline}
      </p>
      {estimate.squareFeet != null && (
        <p className="mt-1 text-sm text-muted-foreground">
          Based on {estimate.squareFeet} sq ft{estimate.squareFeetApproximate ? ' (approx.)' : ''}
        </p>
      )}

      <div className="mt-5 border-t border-border pt-5">
        <p className="text-sm font-medium text-foreground">Every floor includes</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {estimate.includedSteps.map((s) => (
            <li key={s} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="text-pretty">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {estimate.factorsThatMayChangePrice.length > 0 && (
        <div className="mt-5 border-t border-border pt-5">
          <p className="text-sm font-medium text-foreground">What could change the price</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {estimate.factorsThatMayChangePrice.map((f) => (
              <li key={f} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                <span className="text-pretty">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-5 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground text-pretty">
        {estimate.disclaimer}
      </p>
    </div>
  )
}
