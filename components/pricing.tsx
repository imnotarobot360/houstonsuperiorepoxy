import Link from 'next/link'
import { Info } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { costFactors, site } from '@/lib/site'

/*
  THE THREE-CARD STARTING-PRICE GRID WAS REMOVED.

  It rendered $4.50/sq ft, $1,000 and $1,800 from `pricing` in lib/site.ts.
  Those figures are no longer confirmed, so they are {{TOKEN}}s — and this grid
  existed only to display them in 2xl mono type. Interpolating the tokens would
  have published "{{PRICE_2_CAR_STARTING}}" to visitors and to Google, so the
  section now leads with the cost factors instead.

  TO RESTORE once figures are re-confirmed: rebuild a `startingPoints` array of
  { label, value, note } from `pricing` and render it as a
  `sm:grid-cols-3` dl above the cost-factor list. Every label must say "from" —
  a floor presented as a typical price is what turns an advertised rate into a
  misrepresentation.
*/

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
          intro="Two quotes on the same garage can describe completely different work, so a single number would tell you very little on its own. Rather than advertise a figure that may not survive contact with your slab, here is every variable that decides what your floor costs — and what the quote itself guarantees."
        />

        <p className="mt-14 flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
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
