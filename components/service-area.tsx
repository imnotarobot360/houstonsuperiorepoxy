import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { r } from '@/lib/routes'
import { site } from '@/lib/site'
import { cities } from '@/lib/content/cities'

/*
  Section 11 of the homepage.

  Interactivity here is CSS-only (hover/focus reveal on real anchors) rather
  than a JavaScript map. That is deliberate: every city is a genuine <a href>
  present in the server-rendered HTML, so the six city pages are crawlable
  without executing script. A canvas or SVG map with click handlers would look
  the same and be invisible to a crawler.
*/
export function ServiceArea() {
  const extras = site.serviceAreas.filter((a) => !cities.some((c) => c.name === a))

  return (
    <section
      id="service-area"
      className="scroll-mt-24 border-y border-border bg-card/40 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Service Area"
          title="Where we work, and why it changes the job"
          intro="We are a service-area business — there is no showroom, we come to your slab. Soil and construction era vary enough across Greater Houston that each of these areas gets its own page rather than a template with the city name swapped out."
        />

        <ul className="mt-16 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <li key={c.slug} className="bg-background">
              <Link
                href={`/service-areas/${c.slug}/`}
                className="group flex h-full flex-col gap-3 p-7 transition-colors hover:bg-secondary lg:p-8"
              >
                <span className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                  <MapPin size={12} aria-hidden="true" />
                  {c.county}
                </span>
                <span className="flex items-start justify-between gap-4 font-serif text-2xl tracking-tight text-foreground">
                  {c.name}
                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    className="mt-1.5 shrink-0 text-primary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {c.slab[0]?.heading}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 grid gap-8 border-t border-border pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h3 className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Also serving
            </h3>
            <p className="mt-4 max-w-3xl leading-relaxed text-foreground/85 text-pretty">
              {extras.join(' · ')}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              These communities are covered but do not have a dedicated page yet — a city only gets
              one when we can write something about its slabs that is not true everywhere else.
            </p>
          </div>
          <Link
            href={r('serviceAreas')}
            className="shrink-0 border border-border px-6 py-3.5 text-center text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            All service areas
          </Link>
        </div>
      </div>
    </section>
  )
}
