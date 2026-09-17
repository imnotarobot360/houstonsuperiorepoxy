'use client'

import { Check, Info, ClipboardCheck } from 'lucide-react'
import type { EstimateResult } from '@/lib/estimate-calc'

/*
  The price-reveal card, shown BEFORE any contact details are requested (the
  spec's core promise). Everything it displays comes from computeEstimate — it
  invents nothing.

  In gated mode `result.headline` is a confirmed starting anchor ("Starting at
  $1,000") or "Priced after your free inspection"; it never shows a fabricated
  low–high band. The verbatim disclaimer and the onsite-inspection requirement
  are always shown so the number is never mistaken for a binding quote.
*/
export function EstimateResult({
  result,
  onContinue,
}: {
  result: EstimateResult
  onContinue: () => void
}) {
  const generated = new Date(result.generatedAtISO)
  const generatedLabel = generated.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-6 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Your Preliminary Garage Floor Estimate
        </p>
        {result.mode === 'calculated' && (
          <p className="mt-3 text-sm font-medium text-muted-foreground">Estimated investment</p>
        )}
        <p className="mt-2 font-serif text-4xl font-semibold text-primary text-balance sm:text-5xl">
          {result.headline}
        </p>
        {result.squareFeet != null && (
          <p className="mt-3 text-sm text-muted-foreground">
            Based on approximately {result.squareFeet.toLocaleString('en-US')} sq. ft.
          </p>
        )}
        {result.mode === 'gated' && result.startingAnchorUsd == null && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            Your selections fall outside our published starting points, so we price this one after a
            quick onsite look rather than guess a number.
          </p>
        )}
        {result.qualifiesForTwoCarAnchor && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Applies to a qualifying bare, sound two-car slab with no existing-coating removal or
            major repairs.
          </p>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
        <div className="bg-card p-5">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Calculated square footage
          </dt>
          <dd className="mt-1 text-lg font-semibold text-foreground">
            {result.squareFeet != null
              ? `${result.squareFeetApproximate ? 'approx. ' : ''}${result.squareFeet.toLocaleString('en-US')} sq ft`
              : 'Measured onsite'}
          </dd>
        </div>
        <div className="bg-card p-5">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Selected system</dt>
          <dd className="mt-1 text-lg font-semibold text-foreground">{result.finishLabel}</dd>
        </div>
      </dl>

      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Check size={16} className="text-primary" aria-hidden="true" /> Included in every job
          </h3>
          <ul className="mt-3 flex flex-col gap-2">
            {result.includedSteps.map((step) => (
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
          <ul className="mt-3 flex flex-col gap-2">
            {result.factorsThatMayChangePrice.map((factor) => (
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
        <p className="text-xs leading-relaxed text-muted-foreground">
          {result.disclaimer}
        </p>
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
          Range generated {generatedLabel}. No upfront payment.
        </p>
      </div>
    </div>
  )
}
