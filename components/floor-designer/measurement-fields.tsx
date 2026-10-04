'use client'

import type { Measurement, MeasurementInput, MeasurementMode } from '@/lib/garage-measurement'
import { GARAGE_SIZES, type GarageSize, TYPICAL_SQFT } from '@/lib/pricing-config'

/*
  How big is the garage — asked three ways.

  THE ORDER IS THE POINT. Most people know "two-car" and nothing else, so that
  is the default and the first thing on screen. The measured options sit under
  it as an upgrade rather than a requirement, because a form that opens by
  demanding a tape measure loses the customer who is standing in their kitchen.

  Whatever they measure wins over whatever they picked — that rule lives in
  resolveSquareFeet, not here. This component only collects.
*/

/*
  0.7rem (11.2px) and never smaller on the hints and the "approx." lines. The
  owner set an 11px floor across this site for a reason — these started at
  0.65rem, which is 10.4px, and 10px type on a garage floor quote is the part
  nobody reads and everybody is later surprised by.
*/
const MODE_LABELS: { value: MeasurementMode; label: string; hint: string }[] = [
  { value: 'preset', label: 'Typical size', hint: 'Pick the closest match' },
  { value: 'dimensions', label: 'Length × width', hint: 'Most accurate' },
  { value: 'area', label: 'Square footage', hint: 'If you already know it' },
]

export function MeasurementFields({
  value,
  onChange,
  measurement,
  showErrors,
}: {
  value: MeasurementInput
  onChange: (next: MeasurementInput) => void
  measurement: Measurement
  /*
    Errors stay hidden until the customer has had a go at the field. Marking a
    blank box red the moment the mode is switched tells someone off for not
    having typed yet.
  */
  showErrors: boolean
}) {
  const set = (patch: Partial<MeasurementInput>) => onChange({ ...value, ...patch })
  const errors = showErrors ? measurement.errors : {}

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-foreground">Garage size</legend>

      {/*
        A group of pressed buttons rather than a tablist — same reasoning as
        every other toggle row on this page: there is no tabpanel, and roving
        tabindex would move focus off a button the customer just pressed.
      */}
      <div role="group" aria-label="How would you like to give the size?" className="flex flex-wrap gap-1 rounded-lg border border-border p-1">
        {MODE_LABELS.map((m) => {
          const active = value.mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={active}
              onClick={() => set({ mode: m.value })}
              className={`flex min-h-11 flex-1 flex-col items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.label}
              <span className={`text-[0.7rem] font-normal ${active ? 'text-primary-foreground/80' : 'text-muted-foreground/70'}`}>
                {m.hint}
              </span>
            </button>
          )
        })}
      </div>

      {value.mode === 'preset' && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {GARAGE_SIZES.map((s) => {
              const active = value.preset === s
              const typical = TYPICAL_SQFT[s]
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ preset: s as GarageSize })}
                  className={`inline-flex min-h-11 flex-col items-start justify-center rounded-lg border px-3 py-2 text-sm transition-colors ${
                    active ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{s}</span>
                  {/*
                    The assumed area is ON the button, not hidden in a footnote.
                    It is the number that will be multiplied by the rate, so the
                    customer should see it before the price appears rather than
                    after — and "approx." is the honest label for a figure
                    nobody measured.
                  */}
                  {typical != null && (
                    <span className="text-[0.7rem] font-normal text-muted-foreground">approx. {typical} sq ft</span>
                  )}
                </button>
              )
            })}
          </div>
          {errors.preset && (
            <p role="alert" className="text-xs text-destructive">
              {errors.preset}
            </p>
          )}
        </div>
      )}

      {value.mode === 'dimensions' && (
        <div className="flex flex-col gap-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Length"
              name="garageLengthFt"
              value={value.lengthFt}
              onChange={(lengthFt) => set({ lengthFt })}
              error={errors.lengthFt}
            />
            <NumberField
              label="Width"
              name="garageWidthFt"
              value={value.widthFt}
              onChange={(widthFt) => set({ widthFt })}
              error={errors.widthFt}
            />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Inside the walls, in feet. A tape across the open door and front to back is close enough.
          </p>
        </div>
      )}

      {value.mode === 'area' && (
        <div className="flex flex-col gap-2">
          <NumberField
            label="Square footage"
            name="garageSquareFeet"
            value={value.squareFeet}
            onChange={(squareFeet) => set({ squareFeet })}
            error={errors.squareFeet}
            suffix="sq ft"
          />
        </div>
      )}
    </fieldset>
  )
}

function NumberField({
  label,
  name,
  value,
  onChange,
  error,
  suffix = 'ft',
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  error?: string
  suffix?: string
}) {
  const errorId = error ? `${name}-error` : undefined
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="relative flex items-center">
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          /*
            inputMode decimal, not type="number". A number input on a phone
            brings up the right keypad but also lets the value be scrolled,
            silently rejects what it considers invalid, and reports an empty
            string for "abc" — which would turn a typo into a blank instead of
            an error the customer can see and fix.
          */
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`min-h-11 w-full rounded-lg border bg-background px-3 py-2.5 pr-14 text-sm text-foreground focus:outline-none ${
            error ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'
          }`}
        />
        <span aria-hidden="true" className="pointer-events-none absolute right-3 text-xs text-muted-foreground">
          {suffix}
        </span>
      </span>
      {error && (
        <span id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </label>
  )
}
