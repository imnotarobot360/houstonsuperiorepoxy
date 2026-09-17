'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { ArrowLeft, ArrowRight, Calendar, Camera, Check, Loader2, Phone, MessageSquare } from 'lucide-react'
import { submitEstimate } from '@/app/actions/estimate'
import { attachEstimatePhotos } from '@/app/actions/estimate-photos'
import { bookAppointment } from '@/app/actions/appointment'
import { generateScheduleDays } from '@/lib/scheduling'
import { readAttribution, readLastTouch, readGaSessionId, track } from '@/lib/analytics'
import { newEventId, readFbCookies, trackMeta, trackMetaOnce, recordDebugEvent } from '@/lib/meta-events'
import {
  ADDED_SURFACES,
  type AddedSurface,
  COATING_CONDITIONS,
  type CoatingCondition,
  DAMAGE_INDICATORS,
  type DamageIndicator,
  FINISHES,
  FINISH_META,
  type Finish,
  GARAGE_SIZES,
  type GarageSize,
  isSupportedZip,
  RECOMMENDED_FINISH,
  TIMEFRAMES,
  ZIP_SUPPORTED_MESSAGE,
  ZIP_UNSUPPORTED_MESSAGE,
} from '@/lib/pricing-config'
import { computeEstimate, type EstimateResult as EstimateResultData } from '@/lib/estimate-calc'
import { EstimateResult } from '@/components/lp/estimate-result'
import { site } from '@/lib/site'

type Phase = 'questions' | 'result' | 'lead' | 'booking'
const TOTAL_STEPS = 8

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

/*
  The interactive garage-floor estimator.

  Flow: 8 questions, one at a time, driven by a sticky Back/Next bar → gated
  price result (no contact details yet) → trimmed lead form → booking + optional
  photos. Each step auto-scrolls to the top of the card and preserves any answer
  already given, so Back never loses a selection.

  Tracking contract:
    - ViewEstimator          once, when the estimator mounts (section seen)
    - StartEstimator         once, on the first advance
    - EstimatorStepCompleted each step, with the step's non-PII answer
    - ZipQualified           when a supported ZIP is entered
    - EstimateGenerated      when the range is shown (explicitly NOT a Lead)
    - LeadFormStarted        when the contact form is revealed
    - Lead                   ONLY after submitEstimate confirms the row, with the
                             same event id posted to the server CAPI for dedup
    - ScheduleInspection     when the booking calendar is opened (browser-side
                             Meta `Schedule`; the off-site calendar has no
                             server confirmation callback to fire CAPI from)
    - PhoneClick             on a call link inside the funnel

  Only non-PII parameters are ever sent to browser analytics — never email,
  phone or name. Anything that could throw during calculation is contained by
  the parent EstimatorErrorBoundary.
*/
export function EstimatorFunnel() {
  const [phase, setPhase] = useState<Phase>('questions')
  const [stepIndex, setStepIndex] = useState(0)

  const [garageSize, setGarageSize] = useState<GarageSize | null>(null)
  const [squareFeet, setSquareFeet] = useState('')
  const [condition, setCondition] = useState<CoatingCondition | null>(null)
  const [damage, setDamage] = useState<DamageIndicator[]>([])
  const [surfaces, setSurfaces] = useState<AddedSurface[]>([])
  const [finish, setFinish] = useState<Finish | null>(null)
  const [zip, setZip] = useState('')
  const [timeframe, setTimeframe] = useState<string | null>(null)

  const [result, setResult] = useState<EstimateResultData | null>(null)
  const [leadName, setLeadName] = useState('')

  const startedRef = useRef(false)
  const viewFiredRef = useRef(false)
  const estimateFiredRef = useRef(false)
  const leadFiredRef = useRef(false)
  const leadFormFiredRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  /* Non-PII snapshot for analytics params. Never includes name/phone/email. */
  const eventParams = useMemo(
    () => ({
      garage_size: garageSize ?? undefined,
      calculated_sqft: result?.squareFeet ?? (squareFeet ? Number.parseInt(squareFeet, 10) : undefined),
      floor_condition: condition ?? undefined,
      selected_system: finish ?? undefined,
      estimate_low: result?.low ?? undefined,
      estimate_high: result?.high ?? undefined,
      timeline: timeframe ?? undefined,
    }),
    [garageSize, result, squareFeet, condition, finish, timeframe],
  )

  /* ViewEstimator — once, when the estimator first renders. Deferred a tick so
     the sibling dev EventDebugger has subscribed before it dispatches (it mounts
     after this component); the real Pixel/GA calls are unaffected by the delay. */
  useEffect(() => {
    if (viewFiredRef.current) return
    viewFiredRef.current = true
    const id = window.setTimeout(() => {
      trackMeta('ViewEstimator')
      track('view_estimator', { location: 'estimator' })
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  /* Auto-scroll the active question into view — but never on the initial mount. */
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [stepIndex, phase])

  /* LeadFormStarted — once, when the contact form is revealed. */
  useEffect(() => {
    if (phase !== 'lead' || leadFormFiredRef.current) return
    leadFormFiredRef.current = true
    trackMeta('LeadFormStarted', eventParams)
    track('lead_form_start', { location: 'estimator' })
  }, [phase, eventParams])

  function markStarted() {
    if (startedRef.current) return
    startedRef.current = true
    trackMeta('StartEstimator')
    track('start_estimator', { location: 'estimator' })
  }

  function stepParamsFor(idx: number): Record<string, string> {
    switch (idx) {
      case 0:
        return { garage_size: garageSize ?? '' }
      case 1:
        return { square_feet: squareFeet || 'unknown' }
      case 2:
        return { floor_condition: condition ?? '' }
      case 3:
        return { damage: damage.join(',') || 'none' }
      case 4:
        return { surfaces: surfaces.join(',') || 'none' }
      case 5:
        return { selected_system: finish ?? '' }
      case 6:
        return { zip_prefix: zip.slice(0, 3) }
      case 7:
        return { timeline: timeframe ?? '' }
      default:
        return {}
    }
  }

  function canProceed(idx: number): boolean {
    switch (idx) {
      case 0:
        return !!garageSize
      case 1:
        return true // square footage is optional
      case 2:
        return !!condition
      case 3:
        return damage.length > 0
      case 4:
        return surfaces.length > 0
      case 5:
        return !!finish
      case 6:
        return /^\d{5}$/.test(zip)
      case 7:
        return !!timeframe
      default:
        return false
    }
  }

  function goToStep(next: number) {
    setStepIndex(next)
  }

  function handleNext() {
    if (!canProceed(stepIndex)) return
    markStarted()
    const idx = stepIndex
    trackMeta('EstimatorStepCompleted', { step: idx + 1, ...stepParamsFor(idx) })
    track('estimator_step', { location: 'estimator', step: idx + 1 })

    /* Leaving the ZIP step: a supported ZIP is a qualification signal. */
    if (idx === 6 && isSupportedZip(zip)) {
      trackMeta('ZipQualified', { zip_prefix: zip.slice(0, 3) })
      track('zip_qualified', { location: 'estimator' })
    }

    if (idx < TOTAL_STEPS - 1) {
      goToStep(idx + 1)
    } else {
      finishQuestions(timeframe ?? '')
    }
  }

  function handleBack() {
    if (stepIndex === 0) return
    goToStep(stepIndex - 1)
  }

  function finishQuestions(finalTimeframe: string) {
    const answers = {
      garageSize: garageSize ?? 'Other / Not Sure',
      squareFeetEntered: squareFeet ? Number.parseInt(squareFeet, 10) || null : null,
      coatingCondition: condition ?? 'Not Sure',
      damage,
      addedSurfaces: surfaces,
      finish: finish ?? 'Not Sure — Recommend One',
      zip,
      timeframe: finalTimeframe,
    }
    const computed = computeEstimate(answers)
    setResult(computed)
    setPhase('result')
    if (!estimateFiredRef.current) {
      estimateFiredRef.current = true
      const params = {
        mode: computed.mode,
        qualifies: computed.qualifiesForTwoCarAnchor,
        garage_size: garageSize ?? undefined,
        calculated_sqft: computed.squareFeet ?? undefined,
        floor_condition: condition ?? undefined,
        selected_system: computed.finishLabel,
        estimate_low: computed.low ?? undefined,
        estimate_high: computed.high ?? undefined,
        timeline: finalTimeframe,
      }
      trackMeta('EstimateGenerated', params)
      track('estimate_generated', { location: 'estimator' })
    }
  }

  const progress = useMemo(() => Math.round(((stepIndex + 1) / TOTAL_STEPS) * 100), [stepIndex])
  const zipValid = /^\d{5}$/.test(zip)

  /* ------------------------------------------------------------- lead submit */

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [leadId, setLeadId] = useState<number | null>(null)

  async function submitLead(formData: FormData) {
    if (leadFiredRef.current) return
    setSubmitting(true)
    setFormError(null)

    const eventId = newEventId()
    const attribution = readAttribution()
    const lastTouch = readLastTouch()
    const gaSession = readGaSessionId()
    const fbCookies = readFbCookies()

    /* Combine first + last name into the single `name` column the schema expects. */
    const firstName = String(formData.get('firstName') ?? '').trim()
    const lastName = String(formData.get('lastName') ?? '').trim()
    const fullName = [firstName, lastName].filter(Boolean).join(' ')
    formData.set('name', fullName)
    setLeadName(fullName)

    /* Estimator answers → the shared lead schema columns. */
    formData.set('space', 'Garage')
    formData.set(
      'area',
      squareFeet ? `${squareFeet} sq ft (${garageSize ?? 'garage'})` : (garageSize ?? ''),
    )
    if (condition) formData.set('floorCondition', condition)
    if (timeframe) formData.set('timeframe', timeframe)
    formData.set('zip', zip)

    /* Last-touch attribution folded into details (free text) so multi-touch is
       preserved without a schema migration; first-touch flows to its columns. */
    const lastTouchSummary = Object.entries(lastTouch)
      .filter(([, v]) => typeof v === 'string' && v)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')

    formData.set(
      'details',
      [
        `Finish: ${finish ?? 'Not sure yet'}`,
        damage.length ? `Condition flags: ${damage.join(', ')}` : null,
        surfaces.filter((s) => s !== 'None').length
          ? `Added surfaces: ${surfaces.filter((s) => s !== 'None').join(', ')}`
          : null,
        result ? `Estimate shown: ${result.headline}` : null,
        lastTouchSummary ? `Last touch: ${lastTouchSummary}` : null,
      ]
        .filter(Boolean)
        .join(' | '),
    )

    /* Estimate summary for the customer confirmation email (see lib/email.ts). */
    if (result) formData.set('estimate_headline', result.headline)
    if (squareFeet) formData.set('estimate_sqft', String(squareFeet))
    if (finish) formData.set('finish_label', finish)

    formData.set('meta_event_id', eventId)
    for (const [k, v] of Object.entries(attribution)) if (typeof v === 'string') formData.set(k, v)
    formData.set('landing_path', '/garage-floor-estimator-houston')
    if (gaSession) formData.set('ga_session_id', gaSession)
    if (fbCookies.fbp) formData.set('_fbp', fbCookies.fbp)
    if (fbCookies.fbc) formData.set('_fbc', fbCookies.fbc)

    try {
      const res = await submitEstimate(formData)
      if (!res.ok) {
        setFormError(res.formError ?? 'Please check your details and try again.')
        setSubmitting(false)
        return
      }

      leadFiredRef.current = true
      setLeadId(res.leadId)

      /* Browser Lead — same event id the server used, so Meta dedups the pair.
         Only non-PII custom params ride along. */
      trackMetaOnce(`lead-${res.leadId}`, 'Lead', { lead_id: res.leadId, ...eventParams }, eventId)
      track('form_submit', { location: 'estimator' })

      /* Reflect the server CAPI outcome in the dev event debugger. */
      if (res.meta && res.meta.capi === 'sent') {
        recordDebugEvent('Lead', res.meta.eventId ?? eventId, 'server')
      }

      setPhase('booking')
    } catch {
      setFormError("Something went wrong. Please call or text us and we'll take care of it.")
      setSubmitting(false)
    }
  }

  /* ------------------------------------------------------------------ render */

  return (
    <div ref={cardRef} className="mx-auto w-full max-w-2xl scroll-mt-24">
      {phase === 'questions' && (
        <div className="overflow-hidden rounded-lg border border-border bg-card p-6 sm:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Step {stepIndex + 1} of {TOTAL_STEPS}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step 1 — garage size */}
          {stepIndex === 0 && (
            <CardChoice
              title="What size is your garage?"
              options={GARAGE_SIZES}
              selected={garageSize}
              onSelect={setGarageSize}
            />
          )}

          {/* Step 2 — square footage (optional) */}
          {stepIndex === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground text-balance">
                Roughly how many square feet?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                An estimate is fine — leave it blank if you&apos;re not sure and we&apos;ll use a
                typical size for your garage.
              </p>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={squareFeet}
                onChange={(e) => setSquareFeet(e.target.value)}
                placeholder="e.g. 400"
                className="mt-4 w-full rounded-md border border-border bg-background px-4 py-3 text-foreground"
              />
            </div>
          )}

          {/* Step 3 — coating condition */}
          {stepIndex === 2 && (
            <CardChoice
              title="What's on the floor right now?"
              options={COATING_CONDITIONS}
              selected={condition}
              onSelect={setCondition}
            />
          )}

          {/* Step 4 — damage indicators (multi) */}
          {stepIndex === 3 && (
            <MultiChoice
              title="Any of these on the slab?"
              hint="Select all that apply."
              options={DAMAGE_INDICATORS}
              selected={damage}
              exclusive="None That I Can See"
              onToggle={setDamage}
            />
          )}

          {/* Step 5 — added surfaces (multi) */}
          {stepIndex === 4 && (
            <MultiChoice
              title="Anything beyond the main floor?"
              hint="Select all that apply."
              options={ADDED_SURFACES}
              selected={surfaces}
              exclusive="None"
              onToggle={setSurfaces}
            />
          )}

          {/* Step 6 �� finish (outcome-based, with recommendation) */}
          {stepIndex === 5 && (
            <FinishChoice selected={finish} onSelect={setFinish} />
          )}

          {/* Step 7 — ZIP with soft qualification message */}
          {stepIndex === 6 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground text-balance">
                What ZIP code is the garage in?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                So we can confirm you&apos;re in our Greater Houston service area.
              </p>
              <input
                inputMode="numeric"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="77024"
                className="mt-4 w-full rounded-md border border-border bg-background px-4 py-3 text-foreground"
              />
              {zipValid && (
                <p
                  className={`mt-3 flex items-center gap-2 text-sm ${
                    isSupportedZip(zip) ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                >
                  {isSupportedZip(zip) && <Check size={16} aria-hidden="true" />}
                  {isSupportedZip(zip) ? ZIP_SUPPORTED_MESSAGE : ZIP_UNSUPPORTED_MESSAGE}
                </p>
              )}
            </div>
          )}

          {/* Step 8 — timeframe */}
          {stepIndex === 7 && (
            <CardChoice
              title="When are you hoping to start?"
              options={TIMEFRAMES}
              selected={timeframe as (typeof TIMEFRAMES)[number] | null}
              onSelect={setTimeframe}
            />
          )}

          {/* Sticky Back / Next bar */}
          <div className="sticky bottom-16 z-10 mt-8 flex items-center justify-between gap-3 border-t border-border bg-card/95 pt-4 backdrop-blur lg:bottom-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:invisible"
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed(stepIndex)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-6 py-4 text-base font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 sm:flex-none sm:px-10"
            >
              {stepIndex === TOTAL_STEPS - 1 ? 'See My Estimate' : 'Next'}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <EstimateResult result={result} onContinue={() => setPhase('lead')} />
      )}

      {phase === 'lead' && (
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
          {/* Spec item 6: the estimate stays visible above the contact form. */}
          {result && (
            <div className="mb-6 rounded-md border border-border bg-muted/20 p-4 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Your preliminary estimate
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold text-primary">{result.headline}</p>
              {result.squareFeet != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Based on approximately {result.squareFeet.toLocaleString('en-US')} sq. ft.
                </p>
              )}
            </div>
          )}
          <h2 className="text-2xl font-semibold text-foreground text-balance">
            Where should we send your written estimate?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We&apos;ll confirm details and set up your free onsite inspection. No upfront payment.
          </p>

          <form action={submitLead} className="mt-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name" htmlFor="es-first">
                <input
                  id="es-first"
                  name="firstName"
                  required
                  autoComplete="given-name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-foreground"
                />
              </Field>
              <Field label="Last name" htmlFor="es-last">
                <input
                  id="es-last"
                  name="lastName"
                  required
                  autoComplete="family-name"
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-foreground"
                />
              </Field>
            </div>
            <Field label="Mobile phone" htmlFor="es-phone">
              <PhoneInput />
            </Field>
            <Field label="Email" htmlFor="es-email">
              <input
                id="es-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-foreground"
              />
            </Field>

            {formError && (
              <p role="alert" className="text-sm text-primary">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-primary px-6 py-4 text-base font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Sending…
                </>
              ) : (
                'Send My Written Estimate'
              )}
            </button>

            <p className="text-xs leading-relaxed text-muted-foreground">
              We&apos;ll use your information only to send your estimate and arrange your free onsite
              inspection. No spam. We never sell your information.
            </p>
          </form>
        </div>
      )}

      {phase === 'booking' && <BookingStep leadId={leadId} name={leadName} zip={zip} />}
    </div>
  )
}

/* ----------------------------------------------------------------- sub-parts */

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function PhoneInput() {
  const [value, setValue] = useState('')
  return (
    <input
      id="es-phone"
      name="phone"
      required
      inputMode="tel"
      autoComplete="tel"
      value={value}
      onChange={(e) => setValue(formatPhone(e.target.value))}
      placeholder="(346) 782-0903"
      className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-foreground"
    />
  )
}

function CardChoice<T extends string>({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string
  options: readonly T[]
  selected: T | null
  onSelect: (v: T) => void
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground text-balance">{title}</h2>
      <div className="mt-4 flex flex-col gap-2.5">
        {options.map((opt) => {
          const isSelected = selected === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`flex items-center justify-between rounded-md border px-4 py-4 text-left text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/60'
              }`}
            >
              {opt}
              {isSelected && <Check size={18} className="text-primary" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/*
  Finish step. Same selection mechanics as CardChoice, but each option carries a
  one-line outcome description and the recommended system gets a badge — so the
  customer chooses by result, not by resin chemistry (spec item 4).
*/
function FinishChoice({ selected, onSelect }: { selected: Finish | null; onSelect: (v: Finish) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground text-balance">
        Which finish are you leaning toward?
      </h2>
      <div className="mt-4 flex flex-col gap-2.5">
        {FINISHES.map((opt) => {
          const isSelected = selected === opt
          const meta = FINISH_META[opt]
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`flex flex-col gap-1 rounded-md border px-4 py-4 text-left transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background hover:border-primary/60'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {opt}
                  {opt === RECOMMENDED_FINISH && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary-foreground">
                      Recommended
                    </span>
                  )}
                </span>
                {isSelected && <Check size={18} className="shrink-0 text-primary" aria-hidden="true" />}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">{meta.blurb}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MultiChoice<T extends string>({
  title,
  hint,
  options,
  selected,
  exclusive,
  onToggle,
}: {
  title: string
  hint: string
  options: readonly T[]
  selected: T[]
  exclusive: T
  onToggle: (next: T[]) => void
}) {
  function toggle(opt: T) {
    /* Selecting the "none" option clears everything else, and vice-versa. */
    if (opt === exclusive) {
      onToggle(selected.includes(exclusive) ? [] : [exclusive])
      return
    }
    const withoutExclusive = selected.filter((s) => s !== exclusive)
    onToggle(
      withoutExclusive.includes(opt)
        ? withoutExclusive.filter((s) => s !== opt)
        : [...withoutExclusive, opt],
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground text-balance">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-4 flex flex-col gap-2.5">
        {options.map((opt) => {
          const isSelected = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`flex items-center justify-between rounded-md border px-4 py-4 text-left text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/60'
              }`}
            >
              {opt}
              {isSelected && <Check size={18} className="text-primary" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/*
  Booking + optional photos. Shown after the CRM lead exists.

  The time picker is served entirely by this site. Slots come from
  generateScheduleDays — the SAME module the server re-validates against — and
  confirming calls the bookAppointment action, which writes the chosen window
  onto the existing lead, emails the owner and the customer, and fires a
  server-side Meta Schedule. Because the lead already holds the customer's name,
  phone, email and ZIP, the customer only picks a time here; nothing they
  already typed is asked again. This replaced an off-site calendar whose
  bookings never reached this project's database or notifications.
*/
function BookingStep({ leadId, name, zip }: { leadId: number | null; name: string; zip: string }) {
  const [photoStatus, setPhotoStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [added, setAdded] = useState(0)

  /* Generated once per booking session so "now" (and the lead-time cutoff) is stable. */
  const days = useMemo(() => generateScheduleDays(), [])
  const [activeDayId, setActiveDayId] = useState(() => days[0]?.dateId ?? '')
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [confirmedLabel, setConfirmedLabel] = useState<string | null>(null)
  const [bookError, setBookError] = useState<string | null>(null)
  const [booking, startBooking] = useTransition()

  const activeDay = days.find((d) => d.dateId === activeDayId) ?? days[0]

  function confirmBooking() {
    if (leadId == null || !selectedSlotId) return
    setBookError(null)
    startBooking(async () => {
      const res = await bookAppointment(leadId, selectedSlotId)
      if (!res.ok) {
        setBookError(res.error)
        return
      }
      setConfirmedLabel(res.label)
      /* Browser-side Meta Schedule, sharing the server event id so Meta dedups the pair. */
      trackMeta('Schedule', {}, res.eventId)
      track('schedule_inspection', { location: 'estimator', slot: res.label })
    })
  }

  function onPhoneClick() {
    trackMeta('PhoneClick')
    track('phone_click', { location: 'estimator-booking' })
  }

  async function uploadPhotos(formData: FormData) {
    if (leadId == null) return
    setPhotoStatus('uploading')
    const res = await attachEstimatePhotos(leadId, formData)
    if (res.ok && res.added > 0) {
      setAdded(res.added)
      setPhotoStatus('done')
      trackMeta('PhotoUploaded', { count: res.added })
    } else {
      setPhotoStatus(res.ok ? 'idle' : 'error')
    }
  }

  /* Once confirmed, the picker collapses to a clear confirmation of the booked window. */
  if (confirmedLabel) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2 text-primary">
          <Check size={20} aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-wide">Inspection booked</span>
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-foreground text-balance">
          You&apos;re on the schedule{name ? `, ${name.split(' ')[0]}` : ''}
        </h2>

        <div className="mt-5 rounded-md border border-primary/40 bg-primary/10 p-5">
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
            Your inspection window
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">{confirmedLabel}</p>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          We&apos;ve saved your time and sent a confirmation{' '}
          {/* Customer email only goes out from a verified domain; wording stays true either way. */}
          to your phone or email. We&apos;ll arrive within that window to confirm your slab and put a
          firm price in writing — no upfront payment. Need to change it? Call or text {site.phone}.
        </p>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
          <a
            href={site.phoneHref}
            onClick={onPhoneClick}
            className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-3 text-sm font-semibold text-foreground"
          >
            <Phone size={16} aria-hidden="true" /> Call {site.phone}
          </a>
          <a
            href={site.smsHref}
            className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-3 text-sm font-semibold text-foreground"
          >
            <MessageSquare size={16} aria-hidden="true" /> Text us
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2 text-primary">
        <Check size={20} aria-hidden="true" />
        <span className="text-sm font-semibold uppercase tracking-wide">Request received</span>
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-foreground text-balance">
        Pick a time for your free onsite inspection
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {name ? `Booking for ${name}` : 'Booking your visit'}
        {zip ? ` · ZIP ${zip}` : ''}. Just choose a window below — we already have your details, so
        there&apos;s nothing else to fill in.
      </p>

      {days.length === 0 ? (
        /* Defensive: if no open windows are available, fall back to call/text rather than a dead end. */
        <p className="mt-5 rounded-md border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          We couldn&apos;t load times right now. Please call or text {site.phone} and we&apos;ll book
          you in.
        </p>
      ) : (
        <div className="mt-5">
          <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Choose a day</p>
          <div
            role="tablist"
            aria-label="Inspection day"
            className="mt-2 flex gap-2 overflow-x-auto pb-1"
          >
            {days.map((d) => {
              const active = d.dateId === activeDay?.dateId
              return (
                <button
                  key={d.dateId}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveDayId(d.dateId)
                    setSelectedSlotId(null)
                  }}
                  className={`shrink-0 whitespace-nowrap border px-4 py-2 text-sm font-medium transition-colors ${
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

          <p className="mt-5 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
            Choose a window
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {activeDay?.slots.map((slot) => {
              const selected = slot.id === selectedSlotId
              return (
                <button
                  key={slot.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`flex items-center justify-between border px-4 py-3 text-sm font-medium transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-foreground hover:border-primary/60'
                  }`}
                >
                  <span>{slot.label}</span>
                  {selected && <Check size={16} className="text-primary" aria-hidden="true" />}
                </button>
              )
            })}
          </div>

          {bookError && (
            <p role="alert" className="mt-3 text-sm text-primary">
              {bookError}
            </p>
          )}

          <button
            type="button"
            onClick={confirmBooking}
            disabled={!selectedSlotId || booking || leadId == null}
            className="mt-5 flex w-full items-center justify-center gap-2 bg-primary px-6 py-4 text-base font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {booking ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Booking…
              </>
            ) : (
              <>
                <Calendar size={18} aria-hidden="true" /> Confirm my inspection
              </>
            )}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Free onsite visit · no upfront payment · takes about 30 minutes
          </p>
        </div>
      )}

      <div className="mt-6 rounded-md border border-border bg-muted/20 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Camera size={16} className="text-primary" aria-hidden="true" /> Add floor photos (optional)
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          A few photos of your slab help us prepare a tighter proposal before we arrive.
        </p>

        {photoStatus === 'done' ? (
          <p className="mt-3 text-sm text-foreground">
            Thanks — {added} photo{added === 1 ? '' : 's'} added to your request.
          </p>
        ) : (
          <form action={uploadPhotos} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              name="photos"
              multiple
              accept="image/*"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
            />
            <button
              type="submit"
              disabled={photoStatus === 'uploading'}
              className="inline-flex items-center justify-center gap-2 border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
            >
              {photoStatus === 'uploading' ? 'Uploading…' : 'Upload'}
            </button>
          </form>
        )}
        {photoStatus === 'error' && (
          <p role="alert" className="mt-2 text-xs text-primary">
            Upload didn&apos;t go through. You can also text photos to us.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
        <a
          href={site.phoneHref}
          onClick={onPhoneClick}
          className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-3 text-sm font-semibold text-foreground"
        >
          <Phone size={16} aria-hidden="true" /> Call {site.phone}
        </a>
        <a
          href={site.smsHref}
          className="inline-flex flex-1 items-center justify-center gap-2 border border-border px-4 py-3 text-sm font-semibold text-foreground"
        >
          <MessageSquare size={16} aria-hidden="true" /> Text us
        </a>
      </div>
    </div>
  )
}
