import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { costFactors, lineItems, type CostDirection } from '@/lib/content/pricing-detail'

/*
  Pricing detail: the cost-factor table and the per-line-item sections.

  WHY THESE ARE REAL TABLES AND LISTS
  The brief's premise is that answer engines lift tables and lists far more
  reliably than paragraphs, and that is the whole reason this content is
  structured rather than written as prose. A `<table>` with proper `<th scope>`
  is also what makes the same content usable by a screen reader, so the
  extractability win and the accessibility win are the same change.

  WHY THERE ARE NO DOLLAR FIGURES
  Every price on this site is unconfirmed and now lives as a {{TOKEN}} in
  lib/site.ts. Only three tokens exist (per-square-foot, 1-car, 2-car); the
  other eight line items below have no confirmed figure at all. Rendering the
  tokens would publish the literal text "{{PRICE_2_CAR_STARTING}}" to visitors
  and into the FAQ rich result, and inventing the missing eight would be worse.

  So each section explains what drives that specific line and what the written
  quote breaks out. That is genuinely useful to a price shopper, it is true
  today, and it is the half of the argument that does not expire. Each entry in
  lib/content/pricing-detail.ts carries a `refill` note naming the figure to add
  once confirmed.
*/

/* ---------------------------------------------------------------- */
/* Cost factor table                                                 */
/* ---------------------------------------------------------------- */

const DIRECTION: Record<CostDirection, { label: string; icon: typeof ArrowUp; tone: string }> = {
  up: { label: 'Increases', icon: ArrowUp, tone: 'text-primary' },
  down: { label: 'Reduces', icon: ArrowDown, tone: 'text-muted-foreground' },
  varies: { label: 'Varies', icon: Minus, tone: 'text-muted-foreground' },
}

export function CostFactorTable() {
  return (
    <div className="mt-12">
      {/*
        Horizontal scroll rather than a stacked card layout on mobile: this is
        genuinely tabular data, and collapsing it to cards would break the
        row-wise comparison that is the entire point of the table.

        The scroll container is a focusable labelled region on purpose. A plain
        `overflow-x-auto` div is reachable by mouse and touch but NOT by
        keyboard — a keyboard-only user simply cannot read the clipped "Why"
        column, which on a 390px viewport is most of the content. `tabIndex={0}`
        with `role="region"` and a name makes it a scrollable landmark the
        keyboard can enter, which is the documented fix for this pattern.
      */}
      <div
        role="region"
        aria-label="Cost factors table, scrollable horizontally"
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <caption className="sr-only">
            Factors that move the cost of a concrete coating quote, the direction each moves it,
            and why
          </caption>
          <thead>
            <tr className="border-y border-border">
              <th
                scope="col"
                className="py-4 pr-6 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary"
              >
                Factor
              </th>
              <th
                scope="col"
                className="py-4 pr-6 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary"
              >
                Impact
              </th>
              <th
                scope="col"
                className="py-4 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary"
              >
                Why
              </th>
            </tr>
          </thead>
          <tbody>
            {costFactors.map((f) => {
              const d = DIRECTION[f.direction]
              const Icon = d.icon
              return (
                <tr key={f.factor} className="border-b border-border align-top">
                  <th
                    scope="row"
                    className="py-5 pr-6 text-sm font-medium text-foreground text-pretty"
                  >
                    {f.factor}
                  </th>
                  <td className="py-5 pr-6 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-2 text-sm ${d.tone}`}>
                      <Icon size={14} aria-hidden="true" />
                      {d.label}
                    </span>
                  </td>
                  <td className="py-5 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {f.why}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/*
        Visible only where the table actually clips, so it never lies. Without
        it the "Why" column is cut off at the viewport edge with nothing to
        indicate there is more to read.
      */}
      <p className="mt-4 text-xs text-muted-foreground md:hidden" aria-hidden="true">
        Scroll the table sideways to read why each factor moves the price.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Line items                                                        */
/* ---------------------------------------------------------------- */

/**
 * The eleven quoted line items, each as its own subsection.
 *
 * Separate sections rather than one long list because the brief asks for them
 * individually — someone searching "3 car garage epoxy cost houston" should
 * land on a heading that matches their question rather than on a generic
 * pricing page, and an engine answering that question needs a discrete block
 * to lift.
 */
export function LineItems() {
  return (
    <div className="mt-14 flex flex-col gap-14">
      {lineItems.map((item) => (
        <section key={item.id} id={item.id} className="scroll-mt-28 border-t border-border pt-8">
          <h3 className="font-serif text-xl tracking-tight text-foreground text-balance sm:text-2xl">
            {item.heading}
          </h3>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground text-pretty">
            {item.what}
          </p>

          <dl className="mt-7 grid max-w-4xl gap-7 sm:grid-cols-2 sm:gap-10">
            <div>
              <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">
                What drives this line
              </dt>
              <dd className="mt-3">
                <ul className="flex flex-col gap-2">
                  {item.drivers.map((d) => (
                    <li
                      key={d}
                      className="flex gap-3 text-sm leading-relaxed text-foreground/90 text-pretty"
                    >
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-primary" />
                      {d}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">
                How it appears on your quote
              </dt>
              <dd className="mt-3 text-sm leading-relaxed text-foreground/90 text-pretty">
                {item.onQuote}
              </dd>
            </div>
          </dl>
        </section>
      ))}
    </div>
  )
}
