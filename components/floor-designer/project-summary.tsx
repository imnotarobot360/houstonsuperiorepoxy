'use client'

import { ArrowRight } from 'lucide-react'
import { TYPICAL_SQFT, type CoatingCondition, type GarageSize } from '@/lib/pricing-config'

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
      <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
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
  size,
  condition,
  onJumpToDetails,
}: {
  blendName: string
  size: GarageSize | null
  condition: CoatingCondition | null
  onJumpToDetails: () => void
}) {
  const sqft = size ? TYPICAL_SQFT[size] : null

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Your project
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <Fact label="Color" value={blendName} onPrompt={onJumpToDetails} />
          <Fact label="Garage" value={size} onPrompt={onJumpToDetails} />
          <Fact
            label="Area"
            /*
              TYPICAL_SQFT is null for "Larger" and "Other / Not Sure" on
              purpose — those cannot be turned into a number without measuring,
              and printing one anyway is exactly the invented figure this site
              does not publish.
            */
            value={sqft ? `Approx. ${sqft} sq ft` : size ? 'Measured onsite' : null}
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
  size,
  onContinue,
}: {
  blendName: string
  size: GarageSize | null
  onContinue: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{blendName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {size ? `${size} garage` : 'Tap continue to size it'}
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
