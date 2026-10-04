'use client'

import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { sqft as formatSqft } from '@/lib/garage-measurement'
import type { CoatingCondition } from '@/lib/pricing-config'

/*
  The running summary of what has been chosen, and the way out of the colour
  step into the estimate.

  IT REPORTS STATE, IT DOES NOT COLLECT IT. Size and slab condition are still
  asked once, in the estimator below, and this reads the same state back. The
  alternative — a second set of controls here — means two places to keep in
  sync and two places a visitor can answer the same question differently.

  So an unanswered fact is shown as a prompt that scrolls to where it is asked,
  rather than as a guess. The bar never invents "2-Car" or "400 sq ft" before
  anybody has said so, which matters on a page whose whole promise is that the
  numbers on it are honest.
*/

function Fact({ label, value, onPrompt }: { label: string; value: string | null; onPrompt: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {value ? (
        <span className="text-sm font-medium text-foreground">{value}</span>
      ) : (
        <button
          type="button"
          onClick={onPrompt}
          className="text-left text-sm font-medium text-primary underline underline-offset-2"
        >
          Choose
        </button>
      )}
    </div>
  )
}

export function ProjectSummary({
  blendName,
  areaLabel,
  squareFeet,
  approximate,
  condition,
  onJumpToDetails,
}: {
  blendName: string
  /*
    How the customer described the garage — "2-Car", or "24 ft x 24 ft
    (576 sq ft)". Taken from the designer rather than re-derived here, so the
    summary cannot disagree with the price card about what was measured.
  */
  areaLabel: string | null
  squareFeet: number | null
  approximate: boolean
  condition: CoatingCondition | null
  onJumpToDetails: () => void
}) {

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Your project
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <Fact label="Color" value={blendName} onPrompt={onJumpToDetails} />
          <Fact label="Garage" value={areaLabel} onPrompt={onJumpToDetails} />
          <Fact
            label="Area"
            /*
              Null until the customer has given a size we can price. "Larger"
              and "Other / Not Sure" produce no square footage on purpose, so
              this stays a prompt rather than printing a figure nobody measured.
            */
            value={
              squareFeet != null
                ? `${approximate ? 'Approx. ' : ''}${formatSqft(squareFeet)}`
                : null
            }
            onPrompt={onJumpToDetails}
          />
          <Fact label="Slab" value={condition} onPrompt={onJumpToDetails} />
        </div>

        <button
          type="button"
          onClick={onJumpToDetails}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Continue to estimate
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/*
  The phone version: pinned, compact, and it replaces the site-wide call bar on
  this page rather than stacking on top of it (see MarketingChromeBottom).

  Two fixed bars would take about a hundred pixels off an already short screen,
  on the one page where the thing being scrolled is a rail of colours. The call
  link is kept here so nothing is lost by suppressing the global bar.
*/
export function MobileProjectBar({
  blendName,
  areaLabel,
  onContinue,
}: {
  blendName: string
  areaLabel: string | null
  onContinue: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  /*
    Reserve the bar's height at the foot of the page.

    This one pads <body> rather than rendering an in-flow spacer the way the
    call bars do, because of WHERE it is mounted: the designer renders it
    inside <main>, so a spacer would sit above the site footer and leave the
    footer's last line under the bar. Padding the body puts the space at the
    end of the document, which is the only place that helps.

    Measured rather than hardcoded, and offsetHeight is 0 once lg:hidden takes
    the bar out, so the reservation follows the bar across the breakpoint.
    Restored on unmount, so leaving the page leaves the body as it was found.
  */
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = () => {
      document.body.style.paddingBottom = `${el.offsetHeight}px`
    }
    apply()

    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.body.style.paddingBottom = ''
    }
  }, [])

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{blendName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {areaLabel ?? 'Tap continue to size it'}
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Continue
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  )
}
