'use client'

import { useEffect, useRef, useState } from 'react'
import { ShortlistField } from '@/components/shortlist/shortlist-field'
import { Check, Clock, ImageIcon, Loader2, Mail, MapPin, Phone, X } from 'lucide-react'
import { submitEstimate } from '@/app/actions/estimate'
import { readAttribution, readGaSessionId, track } from '@/lib/analytics'
import {
  CONDITIONS,
  CONTACT_METHODS,
  HONEYPOT_FIELD,
  PHOTO_MAX_BYTES,
  PHOTO_MAX_COUNT,
  PHOTO_TYPES,
  SPACES,
  SYSTEMS,
  TIMEFRAMES,
  leadSchema,
  type LeadFieldErrors,
} from '@/lib/leads'
import { site } from '@/lib/site'

export function Estimate() {
  const [errors, setErrors] = useState<LeadFieldErrors>({})
  const [pending, setPending] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [done, setDone] = useState<{ name: string; duplicate: boolean; photoCount: number } | null>(
    null,
  )

  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const startedRef = useRef(false)
  const errorRef = useRef<HTMLDivElement>(null)

  /*
    Attribution is read on mount and posted as hidden fields. A server action
    only sees its own request, so the gclid/utm values from the ad click have to
    be carried forward from sessionStorage by the client.
  */
  const [attribution, setAttribution] = useState<Record<string, string>>({})
  useEffect(() => {
    const attr = readAttribution()
    const session = readGaSessionId()
    setAttribution({
      ...(attr as Record<string, string>),
      ...(session ? { ga_session_id: session } : {}),
    })
  }, [])

  /*
    `form_start` fires once, on the first real interaction with a field — not on
    render. Firing on render would count everyone who scrolled past the form as
    having started it, which makes the start→submit rate meaningless.
  */
  function handleFirstInteraction() {
    if (startedRef.current) return
    startedRef.current = true
    track('form_start', { location: 'estimate_form' })
  }

  /* -------------------------------------------------------------- photos */
  function addPhotos(incoming: FileList | null) {
    if (!incoming) return
    handleFirstInteraction()

    const accepted: File[] = []
    let rejected: string | undefined

    for (const file of Array.from(incoming)) {
      if (!PHOTO_TYPES.includes(file.type)) {
        rejected = 'Photos need to be JPG, PNG, WebP or HEIC.'
        continue
      }
      if (file.size > PHOTO_MAX_BYTES) {
        rejected = `Each photo needs to be under ${PHOTO_MAX_BYTES / 1024 / 1024} MB.`
        continue
      }
      accepted.push(file)
    }

    setPhotos((prev) => {
      const merged = [...prev, ...accepted]
      if (merged.length > PHOTO_MAX_COUNT) {
        rejected = `You can attach up to ${PHOTO_MAX_COUNT} photos.`
      }
      return merged.slice(0, PHOTO_MAX_COUNT)
    })
    setErrors((prev) => ({ ...prev, photos: rejected }))

    /*
      Clear the input so selecting the same file again still fires a change
      event — otherwise re-adding a photo you just removed silently does
      nothing.
    */
    if (fileRef.current) fileRef.current.value = ''
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setErrors((prev) => ({ ...prev, photos: undefined }))
  }

  /* -------------------------------------------------------------- submit */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return

    const formEl = e.currentTarget
    const data = new FormData(formEl)

    /*
      Client-side validation first, purely for fast feedback. The server runs
      the identical schema and its verdict is the one that counts — this pass
      exists so the customer is not waiting on a round trip to be told their
      phone number is short.
    */
    const candidate = {
      name: data.get('name') ?? '',
      phone: data.get('phone') ?? '',
      email: data.get('email') ?? '',
      zip: data.get('zip') ?? '',
      area: data.get('area') ?? '',
      space: data.get('space') ?? '',
      system: data.get('system') ?? '',
      floorCondition: data.get('floorCondition') ?? '',
      timeframe: data.get('timeframe') ?? '',
      contactMethod: data.get('contactMethod') ?? '',
      details: data.get('details') ?? '',
      smsConsent: data.get('smsConsent') === 'on',
    }

    const parsed = leadSchema.safeParse(candidate)
    if (!parsed.success) {
      const next: LeadFieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form') as keyof LeadFieldErrors
        if (!next[key]) next[key] = issue.message
      }
      setErrors(next)

      /*
        Track WHICH fields failed. "Someone had an error" is not actionable;
        "43% of errors are the phone field" tells you the input needs work.
      */
      track('form_error', {
        location: 'estimate_form',
        error_fields: Object.keys(next).join(','),
        error_count: Object.keys(next).length,
      })
      errorRef.current?.focus()
      return
    }

    setErrors({})
    setPending(true)

    /* Photos come from state, not the input, so removals are respected. */
    data.delete('photos')
    for (const file of photos) data.append('photos', file)

    try {
      const result = await submitEstimate(data)

      if (!result.ok) {
        setErrors(result.fieldErrors as LeadFieldErrors)
        track('form_error', {
          location: 'estimate_form',
          error_fields: Object.keys(result.fieldErrors).join(','),
          error_count: Object.keys(result.fieldErrors).length,
          source: 'server',
        })
        errorRef.current?.focus()
        return
      }

      /*
        The primary conversion. `duplicate` is passed through so a double
        submit does not inflate the conversion count in GA4 — it is reported,
        but distinguishable.
      */
      track('form_submit', {
        location: 'estimate_form',
        duplicate: result.duplicate,
        photo_count: result.photoCount,
        system: parsed.data.system ?? 'not_specified',
        space: parsed.data.space ?? 'not_specified',
        timeframe: parsed.data.timeframe ?? 'not_specified',
      })

      setDone({
        name: parsed.data.name.trim().split(' ')[0] || 'there',
        duplicate: result.duplicate,
        photoCount: result.photoCount,
      })
      setPhotos([])
      formEl.reset()
    } catch (error) {
      /*
        Network or server failure. The customer must never be left staring at a
        dead button with no path forward, so the fallback message hands them
        the phone number.
      */
      console.error('Estimate submission failed:', error instanceof Error ? error.message : error)
      setErrors({ form: 'Something went wrong on our end. Please call or text us instead.' })
      track('form_error', { location: 'estimate_form', source: 'exception' })
    } finally {
      setPending(false)
    }
  }

  const field =
    'w-full border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none'
  const label = 'mb-2 block text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground'
  const errorText = 'mt-2 text-xs text-destructive'

  return (
    <section id="estimate" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary">
            Free Estimate
          </p>
          <h2 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Tell us about your slab
          </h2>
          <p className="mt-6 leading-relaxed text-muted-foreground text-pretty">
            Send a few details and we will schedule a walkthrough, moisture test the concrete, and
            put an itemized number in writing. No payment is due upfront, and we will tell you
            honestly if your slab needs repair before it needs coating.
          </p>

          <p className="mt-8 text-sm text-muted-foreground">
            In a hurry? Text photos of your slab to{' '}
            <a href={site.smsHref} className="text-primary underline-offset-4 hover:underline">
              {site.phone}
            </a>{' '}
            and we will tell you what we would need to look at onsite.
          </p>

          <dl className="mt-12 space-y-6 border-t border-border pt-10">
            <div className="flex gap-4">
              <Phone size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="sr-only">Phone</dt>
                <dd>
                  <a href={site.phoneHref} className="text-foreground hover:text-primary">
                    {site.phone}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="sr-only">Email</dt>
                <dd>
                  <a href={`mailto:${site.email}`} className="text-foreground hover:text-primary">
                    {site.email}
                  </a>
                </dd>
              </div>
            </div>
            {/* Service-area business: no public street address is published. */}
            <div className="flex gap-4">
              <MapPin size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="sr-only">Service area</dt>
                <dd className="text-muted-foreground">
                  Mobile service across Greater Houston
                  <br />
                  <span className="text-sm">We estimate onsite at your property</span>
                </dd>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <dt className="sr-only">Hours</dt>
                <dd className="space-y-1 text-muted-foreground">
                  {site.hours.map((h) => (
                    <span key={h.days} className="block">
                      {h.days}: {h.time}
                    </span>
                  ))}
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {done ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col justify-center border border-primary/40 bg-card p-7 lg:p-10"
          >
            <Check size={28} className="text-primary" aria-hidden="true" />
            <h3 className="mt-6 font-serif text-2xl leading-tight tracking-tight sm:text-3xl">
              Thanks, {done.name} — we have your request
            </h3>
            <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">
              {done.duplicate
                ? 'We already had this request on file, so you have not been added twice. We will confirm your walkthrough within one business day.'
                : 'Your request is in and we will confirm your walkthrough within one business day.'}
              {done.photoCount > 0 &&
                ` We received ${done.photoCount} photo${done.photoCount === 1 ? '' : 's'}.`}
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Need us sooner? Call{' '}
              <a href={site.phoneHref} className="text-primary underline-offset-4 hover:underline">
                {site.phone}
              </a>{' '}
              or write to{' '}
              <a
                href={`mailto:${site.email}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {site.email}
              </a>
              .
            </p>
            <button
              type="button"
              onClick={() => {
                setDone(null)
                startedRef.current = false
              }}
              className="mt-10 self-start border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              Send another request
            </button>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            onFocus={handleFirstInteraction}
            noValidate
            className="border border-border bg-card p-7 lg:p-10"
          >
            {/* Attribution, carried from the landing URL. */}
            {Object.entries(attribution).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}

            {/*
              Honeypot. Positioned off-screen rather than display:none, because
              some bots skip hidden inputs. aria-hidden and tabIndex keep it
              away from screen readers and keyboard users.

              The field name comes from HONEYPOT_FIELD and must stay neutral.
              Naming it after real personal data (`company_website` originally)
              invited Chrome autofill and password managers to fill it, and a
              filled honeypot used to discard the lead outright — so the trap
              was catching customers instead of bots.

              The visible <label> is gone for the same reason: autofill reads
              label text to decide what a field is. Nothing here is announced to
              assistive tech, so no label is needed.
            */}
            <div
              className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
              aria-hidden="true"
            >
              <input
                id={HONEYPOT_FIELD}
                name={HONEYPOT_FIELD}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                /*
                  Chrome ignores autocomplete="off" on inputs it thinks it
                  recognises, but respects it far more consistently when the
                  field is not a known data type and is explicitly excluded
                  from autofill heuristics.
                */
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore="true"
              />
            </div>

            {errors.form && (
              <div
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="mb-6 border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {errors.form}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className={label}>
                  Full name <span className="text-primary">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={field}
                  placeholder="Jane Doe"
                />
                {errors.name && (
                  <p id="name-error" className={errorText}>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className={label}>
                  Phone <span className="text-primary">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  className={field}
                  placeholder="(346) 782-0903"
                />
                {errors.phone && (
                  <p id="phone-error" className={errorText}>
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className={label}>
                  Email <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={field}
                  placeholder="jane@email.com"
                />
                {errors.email && (
                  <p id="email-error" className={errorText}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="zip" className={label}>
                  ZIP code
                </label>
                <input
                  id="zip"
                  name="zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  aria-invalid={!!errors.zip}
                  aria-describedby={errors.zip ? 'zip-error' : undefined}
                  className={field}
                  placeholder="77024"
                />
                {errors.zip && (
                  <p id="zip-error" className={errorText}>
                    {errors.zip}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="area" className={label}>
                  Square footage
                </label>
                <input
                  id="area"
                  name="area"
                  className={field}
                  placeholder="2-car, or about 480 sq ft"
                />
              </div>

              <div>
                <label htmlFor="space" className={label}>
                  What are we coating?
                </label>
                <select id="space" name="space" defaultValue="" className={field}>
                  <option value="">Select one</option>
                  {SPACES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="system" className={label}>
                  System of interest
                </label>
                <select id="system" name="system" defaultValue="" className={field}>
                  <option value="">Select one</option>
                  {SYSTEMS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="floorCondition" className={label}>
                  Current floor condition
                </label>
                <select id="floorCondition" name="floorCondition" defaultValue="" className={field}>
                  <option value="">Select one</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="timeframe" className={label}>
                  Timeframe
                </label>
                <select id="timeframe" name="timeframe" defaultValue="" className={field}>
                  <option value="">Select one</option>
                  {TIMEFRAMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="sm:col-span-2">
                <legend className={label}>Preferred contact method</legend>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_METHODS.map((m) => (
                    <label
                      key={m}
                      className="cursor-pointer border border-border px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
                    >
                      <input
                        type="radio"
                        name="contactMethod"
                        value={m}
                        className="sr-only"
                        onChange={handleFirstInteraction}
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* --------------------------------------------- photos */}
              <div className="sm:col-span-2">
                <label htmlFor="photos" className={label}>
                  Photos of your floor{' '}
                  <span className="text-muted-foreground">
                    (up to {PHOTO_MAX_COUNT}, optional)
                  </span>
                </label>
                <input
                  ref={fileRef}
                  id="photos"
                  name="photos"
                  type="file"
                  multiple
                  accept={PHOTO_TYPES.join(',')}
                  onChange={(e) => addPhotos(e.target.files)}
                  className="block w-full cursor-pointer border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground file:mr-4 file:cursor-pointer file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:text-foreground"
                />
                <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                  A photo of the slab tells us more than any description — cracks, peeling and oil
                  staining all change the prep work.
                </p>
                {errors.photos && <p className={errorText}>{errors.photos}</p>}

                {photos.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {photos.map((file, i) => (
                      <li
                        key={`${file.name}-${i}`}
                        className="flex items-center gap-3 border border-border bg-background px-3 py-2 text-xs"
                      >
                        <ImageIcon size={14} className="shrink-0 text-primary" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-foreground">{file.name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <X size={14} aria-hidden="true" />
                          <span className="sr-only">Remove {file.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="details" className={label}>
                  Anything we should know?
                </label>
                <textarea
                  id="details"
                  name="details"
                  rows={4}
                  className={`${field} resize-none`}
                  placeholder="Existing coating peeling, cracks near the door, timeline…"
                />
              </div>

              {/*
                The blend shortlist, if they built one on /colors/. Renders
                nothing otherwise, so the form is unchanged for everyone else.
                Sits directly under the free-text box because that is where the
                server action folds it — into `details` — and the customer
                should see the two together.
              */}
              <div className="sm:col-span-2">
                <ShortlistField />
              </div>

              {/*
                Explicit SMS consent, unchecked by default.

                Texting a customer who never agreed to it is a TCPA problem, not
                a UX preference — so consent is captured per submission and
                stored with the lead as evidence for that specific request.
              */}
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    name="smsConsent"
                    onChange={handleFirstInteraction}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span>
                    Text me about my estimate. Message and data rates may apply, message frequency
                    varies, and you can reply STOP at any time to opt out. Consent is not a
                    condition of purchase.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-8 flex w-full items-center justify-center gap-2 bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {pending ? 'Sending…' : 'Request My Free Estimate'}
            </button>
            <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
              No payment due upfront. We respond to every request within one business day.
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
