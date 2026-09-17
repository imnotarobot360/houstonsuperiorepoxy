'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { submitEstimate } from '@/app/actions/estimate'
import { computeEstimate, type EstimatorAnswers } from '@/lib/estimate-calc'
import { activeBlends, flakeBlends } from '@/lib/content/flake-blends'
import type { InstalledPhoto } from '@/lib/content/blend-visuals'
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
import { BookingScheduler } from './booking-scheduler'
import { ColorCarousel } from './color-carousel'
import { InstalledPreview } from './installed-preview'
import { MobileProjectBar, ProjectSummary } from './project-summary'
import { SelectedColor } from './selected-color'

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

  THE COLOUR STEP IS NOW A PANEL, NOT A COLUMN. It used to be a sticky preview
  beside a single scrolling column that held the picker, the questions, the
  estimate and the contact form all at once. Choosing a colour — the thing the
  page exists for and the thing that sells the floor — competed for width with a
  form. It now gets the full container: a large preview, the real sample beside
  it, and the colour rail underneath, with the estimator following after.
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
  const [showReal, setShowReal] = useState(true)
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
  const realPhoto = installed[blend.slug]

  /*
    The colours either side in the rail, so the preview can warm them while the
    visitor is still looking at this one. Stepping to an adjacent swatch is by
    far the most common next action.
  */
  const neighbours = useMemo(() => {
    const i = activeBlends.findIndex((b) => b.slug === slug)
    return {
      prev: i > 0 ? activeBlends[i - 1].slug : undefined,
      next: i >= 0 && i < activeBlends.length - 1 ? activeBlends[i + 1].slug : undefined,
    }
  }, [slug])

  const detailsRef = useRef<HTMLDivElement>(null)
  const jumpToDetails = useCallback(() => {
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

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
      `Floor Designer — leaning toward the "${blend.name}" flake blend (${blend.family}, ${blend.tone}-tone). Finish: ${RECOMMENDED_FINISH}.`,
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

  if (phase === 'booking' && leadId) {
    return (
      <div id="designer-flow">
        <BookingScheduler leadId={leadId} firstName={firstName} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12" id="designer-flow">
      <ProgressSteps
        steps={[
          { label: 'Color', done: true },
          { label: 'Garage', done: size != null },
          { label: 'Slab', done: condition != null },
          { label: 'Estimate', done: estimate != null },
        ]}
      />

      {/* ------------------------------------------------- Colour: preview + selection */}
      <section aria-labelledby="step-color" className="grid gap-8 lg:grid-cols-[65fr_35fr] lg:gap-10">
        <h2 id="step-color" className="sr-only">
          Choose your floor colour
        </h2>
        <InstalledPreview
          slug={blend.slug}
          name={blend.name}
          neighbours={neighbours}
          realPhoto={realPhoto}
          showReal={showReal}
          onToggleReal={setShowReal}
        />
        <SelectedColor blend={blend} />
      </section>

      {/* --------------------------------------------------------------- Colour rail */}
      <section aria-labelledby="pick-color" className="flex flex-col gap-4">
        <div className="flex items-baseline gap-3 border-b border-border pb-3">
          <span className="font-mono text-xs text-primary">01</span>
          <h2 id="pick-color" className="font-serif text-xl tracking-tight text-foreground">
            Choose your color
          </h2>
        </div>
        <ColorCarousel
          selectedSlug={slug}
          onSelect={(s) => {
            setSlug(s)
            /* A different blend may have no photograph; fall back to the render. */
            setShowReal(true)
          }}
        />
        {/*
          Beside the picker specifically: the alternative to choosing here is
          choosing on a phone with the physical fan deck. Renders nothing while
          FLAKECOLOR_URL is unset.
        */}
        <CatalogTextLink enabled={catalogEnabled} />
      </section>

      {/* ------------------------------------------------------------------ Summary */}
      <ProjectSummary
        blendName={blend.name}
        size={size}
        condition={condition}
        onJumpToDetails={jumpToDetails}
      />

      {/* ------------------------------------------------- The estimator, unchanged */}
      <div ref={detailsRef} className="grid gap-10 scroll-mt-24 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-10">
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
        </div>

        {/* 04 — Contact */}
        <section aria-labelledby="step-contact" className="flex flex-col gap-4 lg:self-start">
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
      </div>

      {/*
        Pinned on phones, and it stands in for the site-wide call bar here
        rather than stacking under it — see MarketingChromeBottom.
      */}
      <MobileProjectBar blendName={blend.name} size={size} onContinue={jumpToDetails} />
      {/* Room for the pinned bar, so the last field is never under it. */}
      <div aria-hidden className="h-16 lg:hidden" />
    </div>
  )
}

/*
  Where the visitor is, in the order this page actually asks things.

  COLOUR IS STEP ONE HERE, not the garage. The brief's sequence started with the
  garage, which is the order the question-first estimator at
  /garage-floor-estimator-houston already uses; this page exists precisely
  because some people want to see the floor before they answer anything, and
  labelling it otherwise would describe a page we did not build.

  Ticks are driven by real state, so nothing shows complete before it is.
*/
function ProgressSteps({ steps }: { steps: { label: string; done: boolean }[] }) {
  const current = steps.findIndex((s) => !s.done)
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {steps.map((s, i) => {
        const active = i === current
        return (
          <li key={s.label} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden className="h-px w-5 bg-border" />
            )}
            <span
              className={`flex items-center gap-1.5 ${
                s.done ? 'text-foreground' : active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span
                aria-hidden
                className={`grid size-4 place-items-center rounded-full border text-[0.55rem] ${
                  s.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                      ? 'border-primary text-primary'
                      : 'border-border'
                }`}
              >
                {s.done ? '✓' : i + 1}
              </span>
              <span className="font-medium uppercase tracking-[0.12em]">{s.label}</span>
              {s.done && <span className="sr-only">complete</span>}
            </span>
          </li>
        )
      })}
    </ol>
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
