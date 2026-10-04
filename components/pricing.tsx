import Link from 'next/link'
import { Info } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { costFactors, pricing, site } from '@/lib/site'

/*
  THE STARTING-PRICE GRID IS BACK — the owner re-confirmed the figures on
  2026-10-04, and this is the restore the previous note described.

  EVERY LABEL SAYS "FROM", which is the whole discipline here: these are a rate
  and a floor, not a typical price. The note under each one does the work the
  label cannot, and the line under the grid states the one condition that makes
  all three true — a sound slab with nothing to grind off.

  The values come from `pricing` in lib/site.ts, which derives them from
  lib/pricing-config.ts — the same constants the Floor Designer's calculator
  multiplies. The advertised number and the calculated number are therefore the
  same number by construction, and cannot drift.
*/
const startingPoints = [
  { label: 'From', value: pricing.perSqFtFrom, unit: 'per sq ft', note: 'Standard flake system, measured area' },
  { label: 'One-car from', value: pricing.oneCarFrom, unit: '', note: `Our ${pricing.oneCarNote} on any garage` },
  { label: 'Two-car from', value: pricing.twoCarFrom, unit: '', note: 'A typical 400 sq ft bay at the rate above' },
]

/*
  `detailHref` is passed on the homepage so the section links through to
  /pricing/. It is omitted on /pricing/ itself to avoid a self-link.
*/
export function Pricing({ detailHref }: { detailHref?: string }) {
  return (
    <section id="pricing" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Where pricing starts, and what moves it"
          intro="Here is where a garage floor starts, and here is everything that moves it. Two quotes on the same garage can describe completely different work, so the starting figure is only half the answer — the variables below are the half that lets you compare any two bids on equal terms."
        />

        <dl className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {startingPoints.map((p) => (
            <div key={p.label} className="flex flex-col gap-1 bg-background p-6">
              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {p.label}
              </dt>
              <dd className="flex items-baseline gap-1.5 font-mono text-2xl tracking-tight text-foreground">
                {p.value}
                {p.unit && <span className="text-sm text-muted-foreground">{p.unit}</span>}
              </dd>
              <p className="text-[0.7rem] leading-relaxed text-muted-foreground text-pretty">{p.note}</p>
            </div>
          ))}
        </dl>

        {/*
          THE SCOPE LINE, directly under the numbers and not further down the
          page. Everything above is a residential garage in the standard flake
          system; metallic, commercial, warehouse and patio work is not covered
          by any of it, and a reader who takes "$4.50" to their warehouse quote
          was misled by this page, not by their own optimism.
        */}
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground text-pretty">
          Those are starting points for a residential garage in our standard flake system, assuming{' '}
          {pricing.assumes}. Metallic floors, patios, warehouses and commercial work are quoted
          after inspection. Your written quote is the number that counts.
        </p>

        <p className="mt-10 flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            Slab condition drives cost more than square footage does. Whether an existing coating
            has to come off, how much crack and spall repair the floor needs, slab moisture and the
            system you choose all move the figure, and the only way to know by how much is to look
            at the concrete. The onsite inspection that produces your actual number is free, and the
            quote is itemized in writing with no payment due upfront.
          </span>
        </p>

        <h3 className="mt-20 font-serif text-2xl tracking-tight lg:text-3xl">
          The ten variables in every quote
        </h3>

        <ol className="mt-10 grid gap-x-10 gap-y-8 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-2">
          {costFactors.map((f, i) => (
            <li key={f.title} className="flex gap-5">
              <span
                className="font-mono text-xs text-primary/80 tabular-nums"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h4 className="text-sm font-medium text-foreground">{f.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {f.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl leading-relaxed text-muted-foreground text-pretty">
            The onsite estimate is free, itemized in writing, and carries no upfront payment.
          </p>
          {detailHref ? (
            <Link
              href={detailHref}
              className="shrink-0 border border-border px-8 py-4 text-center text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              Full pricing breakdown →
            </Link>
          ) : (
            <a
              href="#estimate"
              className="shrink-0 bg-primary px-8 py-4 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Schedule My Free Estimate
            </a>
          )}
        </div>

        <p className="sr-only">
          Call {site.company} at {site.phone} to schedule an onsite estimate.
        </p>
      </div>
    </section>
  )
}
