'use client'

import { Check, Info, ClipboardCheck } from 'lucide-react'
import { sqft as formatSqft, type RoughEstimate, usd } from '@/lib/garage-measurement'
import { ROUGH_ESTIMATE_EXCLUSIONS, ROUGH_ESTIMATE_NOTICE, ROUGH_ESTIMATE_SYSTEM } from '@/lib/pricing-config'

/*
  The price-reveal card, shown BEFORE any contact details are requested (the
  spec's core promise).

  MOVED ONTO THE FLAT RATE 2026-10-04. It used to render `computeEstimate`'s
  gated output, which on this page usually meant "Priced after your free
  inspection" — on the landing page the ads point at, which is the worst place
  on the site to answer a price question with a shrug. It now shows the same
  arithmetic as /floor-designer and /pricing: square feet times $4.50, floored
  at $1,000, with every step visible.

  IT STILL REFUSES TO INVENT A NUMBER. `estimate` is null when the visitor
  picked "Larger" or "Other / Not Sure" and gave no square footage — there is
  no honest way to price that from a form, so the card says so rather than
  guessing. That was the old behaviour for almost everybody and is now the
  behaviour for the few it genuinely applies to.
*/

export type FunnelEstimate = {
  /* Null when the answers cannot produce a square footage. */
  estimate: RoughEstimate | null
  /* The arithmetic as one line, identical to the one on the lead. */
  mathLine: string | null
  /* True when the area came from a garage-size assumption rather than the
     visitor's own figure. */
  approximate: boolean
  finishLabel: string
  factorsThatMayChangePrice: string[]
  generatedAtISO: string
}

export function EstimateResult({
  result,
  onContinue,
}: {
  result: FunnelEstimate
  onContinue: () => void
}) {
  const generated = new Date(result.generatedAtISO)
  const generatedLabel = generated.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const e = result.estimate

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-6 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Your Rough Garage Floor Estimate
        </p>
        <p className="mt-2 font-serif text-4xl font-semibold text-primary text-balance sm:text-5xl">
          {e ? usd(e.totalUsd) : 'Priced after your free inspection'}
        </p>

        {e ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              {result.approximate ? 'Based on approximately ' : 'Based on '}
              {formatSqft(e.squareFeet)}
            </p>
            {/*
              THE MINIMUM, CALLED OUT WHERE IT APPLIES. Without this line a
              small garage and a medium one both read "$1,000" for no visible
              reason, which looks like a made-up round number rather than a
              floor doing its job.
            */}
            {e.minimumApplied && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                That is our {usd(e.minimumUsd)} minimum on any garage — the area above calculates to{' '}
                {usd(e.calculatedUsd)}.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            A garage this size varies too much to price from a form, and we would rather look at it
            than guess. Send your details and we will measure it at the free inspection.
          </p>
        )}
      </div>

      {e && (
        <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
          <Cell label="Area" value={`${result.approximate ? 'approx. ' : ''}${formatSqft(e.squareFeet)}`} />
          <Cell label="Rate" value={`${usd(e.ratePerSqFtUsd)} per sq ft`} />
          <Cell label="Calculated" value={usd(e.calculatedUsd)} />
        </dl>
      )}

      {result.mathLine && (
        <p className="border-b border-border px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground text-pretty">
          {result.mathLine}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Check size={16} className="text-primary" aria-hidden="true" /> The standard system
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {ROUGH_ESTIMATE_SYSTEM.map((step) => (
              <li key={step} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {step}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Info size={16} className="text-primary" aria-hidden="true" /> May change your price
          </h3>
          {/*
            TAILORED TO WHAT THEY ANSWERED, which is the one thing this page has
            that /floor-designer does not: it asked about damage, coatings and
            added surfaces, so it can name the specific things an estimator will
            be looking at on this floor. None of them moved the figure above —
            they move the conversation.

            The standing exclusions are appended so a visitor who reported a
            perfect slab still sees what the rate does not cover.
          */}
          <ul className="mt-3 flex flex-col gap-2">
            {[...result.factorsThatMayChangePrice, ...ROUGH_ESTIMATE_EXCLUSIONS].map((factor) => (
              <li key={factor} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-6 mb-6 flex gap-3 rounded-md border border-border bg-muted/30 p-4">
        <ClipboardCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">{ROUGH_ESTIMATE_NOTICE}</p>
      </div>

      <div className="border-t border-border p-6">
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center justify-center bg-primary px-6 py-4 text-base font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get My Written Estimate
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Rough estimate generated {generatedLabel}. No upfront payment.
        </p>
      </div>
    </div>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
    </div>
  )
}
