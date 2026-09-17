import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { routes, serviceCards } from '@/lib/routes'

/*
  Section 5 of the homepage. One card per service, each a real crawlable link
  to its own page — the primary crawl path out of the homepage into the
  service tree. The list lives in lib/routes.ts so it cannot drift from the
  route registry.
*/
export function ServiceCards() {
  return (
    <section id="services" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Services"
          title="Ten things we do, and a page on each"
          intro="Every system and every preparation service has its own page with the technical detail behind it. Nothing here is a landing page built to catch a search term — if we do not do the work, there is no page for it."
        />

        <ul className="mt-16 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {/*
            No 01/02/03 markers here: these ten services are a set, not a
            sequence, and numbering them implies an order that does not exist.
            The Process section keeps its numbers because those steps really
            do happen in order.
          */}
          {serviceCards.map((s) => (
            <li key={s.key} className="bg-background">
              <Link
                href={routes[s.key].path}
                className="flex h-full flex-col gap-3 p-7 transition-colors hover:bg-secondary lg:p-8"
              >
                <h3 className="flex items-start justify-between gap-4 font-serif text-xl tracking-tight text-foreground">
                  {s.heading}
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="mt-1.5 shrink-0 text-primary"
                  />
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {s.blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
