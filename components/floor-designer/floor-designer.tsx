'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { submitEstimate } from '@/app/actions/estimate'
import { activeBlends, flakeBlends } from '@/lib/content/flake-blends'
import {
  EMPTY_MEASUREMENT,
  explainMath,
  type MeasurementInput,
  resolveSquareFeet,
  roughEstimate,
  type RoughEstimate,
  sqft as formatSqft,
  usd,
} from '@/lib/garage-measurement'
import {
  COATING_CONDITIONS,
  type CoatingCondition,
  type GarageSize,
  RECOMMENDED_FINISH,
  ROUGH_ESTIMATE_EXCLUSIONS,
  ROUGH_ESTIMATE_NOTICE,
  ROUGH_ESTIMATE_SYSTEM,
  TIMEFRAMES,
  type Timeframe,
} from '@/lib/pricing-config'
import { track } from '@/lib/analytics'
import { decideConversion, leadConversionParams } from '@/lib/conversion'
import { CatalogTextLink } from '@/components/catalog-cta'
import { formatPhoneInput, HONEYPOT_FIELD } from '@/lib/leads'
import { newEventId, readFbCookies, trackMeta, trackMetaOnce } from '@/lib/meta-events'
import { site } from '@/lib/site'
import { BookingScheduler } from './booking-scheduler'
import { ColorCarousel } from './color-carousel'
import { MeasurementFields } from './measurement-fields'
import { MobileProjectBar, ProjectSummary } from './project-summary'
import { SelectedColor, SystemSummary } from './selected-color'
import { PhotoVisualizer } from './photo-visualizer'
import { buildDesignerLeadFields } from '@/lib/visualizer/lead-fields'

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

type Phase = 'design' | 'booking' | 'sent'

type FieldErrors = Record<string, string>

/*
  `catalogEnabled` arrives as a prop because this is a client component and
  FLAKECOLOR_URL is server-only — see lib/catalog.ts. Defaults to false so the
  catalog link is absent unless a server page positively says otherwise.
*/
export function FloorDesigner({
  catalogEnabled = false,
  photoPreviewEnabled = false,
}: {
  catalogEnabled?: boolean
  /*
    Whether an image-generation provider is configured. DEFAULTS TO FALSE so a
    caller that forgets to pass it shows no preview rather than a dead one —
    the safe direction for a control that cannot work without a server-side
    key. Resolved in app/floor-designer/page.tsx.

    SINCE THE STYLIZED PREVIEW WAS REMOVED this flag decides whether the page
    offers a preview AT ALL. If the key ever lapses the designer still works —
    swatch, flake close-up, lighting, estimate, booking — it simply stops
    offering to paint the visitor's own garage, which is better than offering
    it and failing.
  */
  photoPreviewEnabled?: boolean
}) {
  const [slug, setSlug] = useState(DEFAULT_SLUG)

  /*
    Carried into the lead so whoever calls back knows whether this person
    showed us their garage — and whether the preview worked. Never holds image
    data, only the private-storage pathname.
  */
  const [visualization, setVisualization] = useState<{ pathname: string | null; attempted: boolean }>({
    pathname: null,
    attempted: false,
  })
  /*
    How big the garage is. One object rather than a size enum, because the
    customer can answer it three ways and the price has to come from whichever
    one they actually used — see lib/garage-measurement.ts.
  */
  const [measurement, setMeasurement] = useState<MeasurementInput>(EMPTY_MEASUREMENT)
  /*
    Measurement errors stay quiet until the customer has either typed something
    or tried to submit. Reddening an empty box the moment they open the field
    is a telling-off for not having started.
  */
  const [measurementTouched, setMeasurementTouched] = useState(false)
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

  /*
    THE CONVERSION GUARD. One lead, one conversion — for GA4 and for Meta.

    A ref, not state: it must be readable and writable inside the same async
    callback that fires the events, and it must not cause a render. React 18+
    double-invokes effects in development, and a customer who submits, gets a
    validation error from the server, fixes it and submits again goes through
    this handler twice — neither may produce a second conversion, because a
    conversion is what the ad platforms optimise spend against and a duplicate
    is a lie about how many customers this page produced.
  */
  const conversionFired = useRef(false)

  const blend = useMemo(() => flakeBlends.find((b) => b.slug === slug) ?? flakeBlends[0], [slug])


  const detailsRef = useRef<HTMLDivElement>(null)
  const jumpToDetails = useCallback(() => {
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /* One ViewContent per session — this page is the ad's content. */
  useEffect(() => {
    trackMetaOnce('floor_designer_view', 'ViewContent', { content_name: 'Floor Designer' })
  }, [])

  /*
    THE ROUGH ESTIMATE: max(square feet x $4.50, $1,000).

    Deliberately NOT a function of slab condition, damage or timeframe. Those
    are asked, they go on the lead and they are why the notice says the price
    can move after inspection — but if answering "existing coating" made the
    number jump, the customer would have been quoted by a form that never saw
    the slab. One rate, one floor, shown with its arithmetic.

    This is the owner-approved path and is NOT behind `calculatorEnabled`;
    that gate still guards the unapproved low–high matrix used by the
    question-first estimator at /pricing. See lib/pricing-config.ts.

    It needs only the size — the price appears as soon as the garage is
    described, before the slab question, because the measurement is the only
    input to it.
  */
  const measured = useMemo(() => resolveSquareFeet(measurement), [measurement])
  const estimate: RoughEstimate | null = useMemo(
    () => (measured.ok ? roughEstimate(measured.squareFeet) : null),
    [measured],
  )

  /*
    What the lead calls the garage. A preset is its label; a measurement is the
    measurement, because "24 ft x 24 ft (576 sq ft)" tells whoever calls back
    something "2-Car" does not.
  */
  const areaLabel = useMemo(() => {
    if (!measured.ok) return measurement.preset ?? null
    if (measured.lengthFt != null && measured.widthFt != null) {
      return `${measured.lengthFt} ft × ${measured.widthFt} ft (${formatSqft(measured.squareFeet)})`
    }
    if (measured.source === 'area') return formatSqft(measured.squareFeet)
    return `${measurement.preset} (approx. ${formatSqft(measured.squareFeet)})`
  }, [measured, measurement.preset])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setFormError(null)

    const form = e.currentTarget
    const data = new FormData(form)

    /*
      THE MEASUREMENT IS VALIDATED BEFORE ANYTHING ELSE HAPPENS. Submitting
      with an unanswered or implausible size would send a lead with no price on
      it, which is the one thing this funnel exists to avoid.
    */
    setMeasurementTouched(true)
    if (!measured.ok || !estimate) {
      setFormError('Tell us the garage size above so we can work out your rough estimate.')
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    /* Fixed + derived context the server needs, added as fields. */
    data.set('area', areaLabel ?? '')
    data.set('floorCondition', condition ?? '')
    data.set('timeframe', timeframe)
    data.set('smsConsent', smsConsent ? 'on' : '')

    /*
      The designer's contribution to the lead — the details sentence and the
      estimate fields that power the customer email — is built by a pure,
      tested function rather than assembled inline here. It reports the
      estimate's status verbatim from computeEstimate and never re-derives a
      price. See lib/visualizer/lead-fields.ts.
    */
    for (const [key, value] of Object.entries(
      buildDesignerLeadFields({
        blendName: blend.name,
        blendFamily: blend.family,
        blendTone: blend.tone,
        finish: RECOMMENDED_FINISH,
        garageSize: areaLabel,
        measuredBy: measured.source,
        squareFeet: estimate.squareFeet,
        squareFeetApproximate: measured.approximate,
        slabCondition: condition,
        estimate,
        mathLine: explainMath(measured, estimate),
        visualizationPathname: visualization.pathname,
        visualizationAttempted: visualization.attempted,
      }),
    )) {
      data.set(key, value)
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
        /*
          THE CONVERSION, fired here and nowhere else: after the server has
          come back ok, never on the click and never on a validation failure.

          `result.ok` and not `!result.unsaved`: ok means the lead reached the
          business, which is what a conversion claims. When the database write
          failed but the notification email went out (result.unsaved), the
          owner has the customer's details and will call them — that is a lead
          by any definition the ad account cares about, and suppressing it
          would under-report real business. The flag rides along on the event
          so the discrepancy is visible in the report rather than invisible.

          Both platforms are inert unless their IDs are configured; see
          lib/analytics.ts and lib/meta-events.ts. Neither call carries the
          customer's name, phone or email — only the value of the job.
        */
        const decision = decideConversion({
          outcome: { kind: 'accepted', stored: !result.unsaved },
          alreadyFired: conversionFired.current,
        })
        if (decision.fire) {
          conversionFired.current = true
          trackMeta('Lead', { content_name: 'Floor Designer' }, result.meta?.eventId ?? leadEventId)
          track(
            'generate_lead',
            leadConversionParams({
              estimate,
              measuredBy: measured.source,
              blendName: blend.name,
              stored: !result.unsaved,
            }),
          )
        }
        /*
          'sent' rather than 'booking' when the lead could not be stored. The
          scheduler writes the chosen slot onto the lead row, so with no row
          there is nothing to book against — offering a calendar would take a
          time from someone and then lose it. They are told we will call
          instead, which is true: the owner has the email.
        */
        setPhase(result.unsaved ? 'sent' : 'booking')
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

  /*
    The lead reached the owner by email but was not stored, so there is no
    record to attach an appointment to. This says what is true — we have your
    details, we will call you — rather than offering a scheduler that would
    silently fail, and gives the phone number so the visitor is never waiting
    on us alone.
  */
  if (phase === 'sent') {
    return (
      <div id="designer-flow" className="rounded-2xl border border-border bg-card/40 p-8 sm:p-10">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-primary">Request received</p>
        <h2 className="mt-3 font-serif text-2xl tracking-tight text-foreground sm:text-3xl">
          Thanks, {firstName} — we have your details.
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground text-pretty">
          We will call you to arrange the free onsite inspection. If you would rather not wait, call
          or text us on{' '}
          <a href={site.phoneHref} className="font-medium text-foreground underline underline-offset-4">
            {site.phone}
          </a>{' '}
          and we will pick it up straight away.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12" id="designer-flow">
      <ProgressSteps
        steps={[
          { label: 'Color', done: true },
          { label: 'Garage', done: measured.ok },
          { label: 'Slab', done: condition != null },
          { label: 'Estimate', done: estimate != null },
        ]}
      />

      {/* ------------------------------------------------- Colour: preview + selection */}
      <section aria-labelledby="step-color" className="grid gap-8 lg:grid-cols-[65fr_35fr] lg:gap-10">
        <h2 id="step-color" className="sr-only">
          Choose your floor colour
        </h2>
        <div className="flex flex-col gap-4">
          {/*
            THE GENERATED GARAGE PREVIEW WAS REMOVED ON 2026-10-03, by the
            owner's decision after seeing it.

            It composited a flake texture onto a stock garage photograph, and
            five rounds of work got it close without getting it right: the
            step was coated, the flake had no contrast, the tile showed a grid,
            the floor line waved, and the material smeared against the walls.
            Each was found and fixed, and the verdict was still that it did not
            look like a real floor. That verdict is the one that counts — it is
            the picture a customer judges the company by.

            What remains is the visitor's OWN garage, which does not have the
            problem the stylized one could never shake: it is a photograph of
            the actual room, so nothing has to be faked convincingly.

            The renderer, its scripts and the 162 pre-rendered images are still
            in the repository and still build. Nothing about bringing it back
            is hard if that is ever wanted; see installed-preview.tsx and
            scripts/build-installed-previews.mjs.
          */}
          {photoPreviewEnabled && <PhotoVisualizer blend={blend} onVisualization={setVisualization} />}
        </div>
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
          onSelect={setSlug}
        />
        {/*
          Beside the picker specifically: the alternative to choosing here is
          choosing on a phone with the physical fan deck. Renders nothing while
          FLAKECOLOR_URL is unset.
        */}
        <CatalogTextLink enabled={catalogEnabled} />
      </section>

      {/*
        AFTER the picker, deliberately. See the note on SystemSummary: in the
        column beside the preview it pushed the colour rail half a screen down
        on a phone, and nothing is allowed between the preview and the picker
        on this page.
      */}
      <SystemSummary />

      {/* ------------------------------------------------------------------ Summary */}
      <ProjectSummary
        blendName={blend.name}
        areaLabel={areaLabel}
        squareFeet={measured.ok ? measured.squareFeet : null}
        approximate={measured.ok && measured.approximate}
        condition={condition}
        onJumpToDetails={jumpToDetails}
      />

      {/* ------------------------------------------------- The estimator, unchanged */}
      <div ref={detailsRef} className="grid gap-10 scroll-mt-24 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-10">
          {/* 02 — Space */}
          <section aria-labelledby="step-space" className="flex flex-col gap-5">
            <StepHeading n="02" id="step-space" title="Tell us about the space" />

            <MeasurementFields
              value={measurement}
              onChange={(next) => {
                /*
                  SWITCHING HOW YOU ANSWER IS NOT AN ATTEMPT AT ANSWERING.

                  Found by using it: tapping "Length x width" reddened two
                  empty boxes before a single key had been pressed, because
                  picking a preset a moment earlier had already marked the
                  question as touched. Changing the mode starts that mode
                  clean; typing in it, or submitting, is what earns an error.
                */
                setMeasurementTouched(next.mode === measurement.mode)
                setMeasurement(next)
              }}
              measurement={measured}
              showErrors={measurementTouched}
            />

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
            <StepHeading n="03" id="step-estimate" title="Your rough estimate" />
            <RoughEstimateCard estimate={estimate} mathLine={estimate ? explainMath(measured, estimate) : null} />
          </section>
        </div>

        {/* 04 — Contact */}
        <section aria-labelledby="step-contact" className="flex flex-col gap-4 lg:self-start">
          <StepHeading n="04" id="step-contact" title="Get it in writing" />
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Send your details and we&apos;ll bring physical samples of your shortlist to a free
            onsite inspection, then put the final scope and price in writing. No payment up front.
          </p>

          {/*
            THE SECOND PLACEMENT, and it is not a duplicate by accident. On a
            phone the price card and this form are several screens apart, so a
            customer can arrive at "send my details" having scrolled straight
            past the qualifier. Repeating it here means nobody hands over their
            number without having been told what the figure is and is not.
          */}
          {estimate && (
            <div className="rounded-lg border border-border bg-card/40 p-4">
              <RoughEstimateNotice />
            </div>
          )}

          <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {/* Honeypot — visually hidden, not display:none, so bots still fill it */}
            <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
              <label htmlFor={HONEYPOT_FIELD}>Do not fill this field</label>
              <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <Field label="Name" name="name" error={errors.name} required>
              <input
                {...fieldAttrs('name', errors.name)}
                type="text"
                autoComplete="name"
                className={inputClass(errors.name)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" name="phone" error={errors.phone} required>
                <input
                  {...fieldAttrs('phone', errors.phone)}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(346) 782-0903"
                  /*
                    Formats as you type, on an UNCONTROLLED input: rewriting
                    e.target.value in the handler keeps the rest of this form
                    uncontrolled (it is read with FormData on submit) while
                    still showing the number the way it will be stored.

                    The mask is the shared one, which strips a leading country
                    code. That matters most here, because "+1 …" is what phone
                    autofill writes and this is the only required field that
                    can be wrong without looking wrong.
                  */
                  onChange={(e) => {
                    e.target.value = formatPhoneInput(e.target.value)
                  }}
                  className={inputClass(errors.phone)}
                />
              </Field>
              <Field label="ZIP" name="zip" error={errors.zip}>
                <input
                  {...fieldAttrs('zip', errors.zip)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  placeholder="77494"
                  className={inputClass(errors.zip)}
                />
              </Field>
            </div>

            <Field label="Email" name="email" error={errors.email} hint="So we can email your estimate">
              <input
                {...fieldAttrs('email', errors.email)}
                type="email"
                inputMode="email"
                autoComplete="email"
                className={inputClass(errors.email)}
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
      <MobileProjectBar blendName={blend.name} areaLabel={areaLabel} onContinue={jumpToDetails} />
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
            {/*
              HIDDEN BELOW sm BECAUSE THE STRIP WRAPS THERE. Four steps do not
              fit on one line at 375px, and the connector renders BEFORE its
              step, so the second row opened with a dash joining it to nothing.
              Without connectors the wrap reads as four chips, which is fine;
              with them it read as broken.
            */}
            {i > 0 && <span aria-hidden className="hidden h-px w-5 bg-border sm:block" />}
            <span
              className={`flex items-center gap-1.5 ${
                s.done ? 'text-foreground' : active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span
                aria-hidden
                className={`grid size-5 place-items-center rounded-full border text-[0.7rem] ${
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

/*
  The attributes every input in this form needs and three of the four were
  missing.

  THE BUG: `Field` renders `<label htmlFor={name}>` — and not one of these
  inputs carried a matching `id`. So tapping the word "Phone" focused nothing,
  which on a phone is the most natural way to start typing in a field, and a
  screen reader announced four unlabelled boxes. The error text underneath was
  a `<p role="alert">` with no association to the input it described, so a
  non-sighted visitor was told something was wrong without being told what.

  Spread rather than copied so a fifth field cannot be added without it.
*/
function fieldAttrs(name: string, error?: string) {
  return {
    id: name,
    name,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? `${name}-error` : undefined,
  }
}

/* The border is the only part that changes when a field is in error, so the
   class lives here instead of being retyped with one word different. */
function inputClass(error?: string) {
  return `w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none ${
    error ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
  }`
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
        <p id={`${name}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/*
  The rough estimate, with its arithmetic on display.

  THE MATH IS SHOWN ON PURPOSE. A price that appears out of a form is a number
  the customer has to take on trust; "400 sq ft x $4.50/sq ft = $1,800.00" is
  one they can check against their own tape measure. It also makes the $1,000
  minimum visible as a floor rather than as a mysteriously round answer for
  every small garage.

  The notice is rendered VERBATIM from the config and is not collapsible,
  truncated or behind a "read more" — it is the sentence that keeps the figure
  a rough estimate instead of a quote.
*/
function RoughEstimateCard({ estimate, mathLine }: { estimate: RoughEstimate | null; mathLine: string | null }) {
  if (!estimate) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6">
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Give us the garage size above — a typical size, your measurements, or the square footage —
          and your rough estimate appears here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-primary">Rough estimate</p>
      <p className="mt-2 font-serif text-4xl tracking-tight text-foreground text-balance">
        {usd(estimate.totalUsd)}
      </p>

      {/* The arithmetic, in the customer's units. */}
      <dl className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
        <Row label="Area" value={formatSqft(estimate.squareFeet)} />
        <Row label="Rate" value={`${usd(estimate.ratePerSqFtUsd)} per sq ft`} />
        <Row label="Calculated" value={usd(estimate.calculatedUsd)} />
        {estimate.minimumApplied && (
          <Row label="Minimum" value={`${usd(estimate.minimumUsd)} — applied`} emphasis />
        )}
      </dl>
      {mathLine && <p className="mt-3 text-xs leading-relaxed text-muted-foreground text-pretty">{mathLine}</p>}

      <div className="mt-5 border-t border-border pt-5">
        <p className="text-sm font-medium text-foreground">The standard system</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {ROUGH_ESTIMATE_SYSTEM.map((step) => (
            <li key={step} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="text-pretty">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <p className="text-sm font-medium text-foreground">Not included in this figure</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {ROUGH_ESTIMATE_EXCLUSIONS.map((x) => (
            <li key={x} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
              <span className="text-pretty">{x}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
          Any of these may change the final price. We confirm them at the free onsite inspection.
        </p>
      </div>

      <RoughEstimateNotice className="mt-5 border-t border-border pt-5" />
    </div>
  )
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={emphasis ? 'font-medium text-foreground' : 'text-foreground'}>{value}</dd>
    </div>
  )
}

/*
  Rendered in BOTH places the spec requires: beside the price and again above
  the lead form. One component so the two can never drift apart, and so a
  future edit cannot accidentally fix only the copy somebody happened to be
  looking at.
*/
function RoughEstimateNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-muted-foreground text-pretty ${className}`}>
      {ROUGH_ESTIMATE_NOTICE}
    </p>
  )
}

