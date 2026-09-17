import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { CheckList, Heading, Prose, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { cities } from '@/lib/content/cities'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'

const KEY = 'serviceAreas' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  Only cities with genuinely distinct content get their own page. Everywhere
  else we serve is listed as plain text below — a link to a thin duplicate page
  would be worse for the reader and worse for the site.

  A name drops out of the chips if a city page represents it: either as that
  page's own `name`, or via its `covers` list (e.g. the "Memorial & River Oaks"
  page covers both "Memorial" and "River Oaks"). That guarantees an area never
  shows up as both a page card above and an unlinked chip here.
*/
const covered = new Set(
  cities.flatMap((c) => [c.name, ...(c.covers ?? [])]).map((n) => n.toLowerCase()),
)
const alsoServed = site.serviceAreas.filter((a) => !covered.has(a.toLowerCase()))

const body = [
  {
    heading: 'We are a service-area business',
    paras: [
      'There is no showroom to visit. Crews travel to your property, which is the only place a concrete floor can honestly be assessed — the two things that decide the price, slab moisture and whatever is already bonded to the surface, are invisible until someone tests for them onsite.',
      'That also means we do not publish a street address. If a contractor lists a Houston address but sends a truck from an hour away, the address was marketing rather than information.',
    ],
  },
  {
    heading: 'Why the city pages are not interchangeable',
    paras: [
      'Soil and construction era genuinely change the work. A 1970s slab in Richmond and a two-year-old slab in Fulshear need close to opposite scopes — one is weighted toward crack and spall repair, the other almost entirely toward grinding off a power-troweled surface.',
      'So each city page below covers conditions specific to that area. Where we could not write something that was only true of a place, we left it off this list rather than generate filler.',
    ],
  },
]

const coverage = [
  'Free onsite estimates throughout the coverage area, with nothing due upfront.',
  'The same written five-year workmanship warranty regardless of which city you are in.',
  'The same diamond grinding and repair standards on every slab we coat.',
  'Residential garages, patios and pool decks, plus commercial and warehouse slabs.',
]

const faqs = [
  {
    q: 'Do you charge for travel to outlying areas?',
    a: 'The estimate is free everywhere we list. For jobs at the far edge of the coverage area, any mobilization cost is stated as its own line on the quote rather than buried in the square-foot price.',
  },
  {
    q: 'My city is not listed. Will you still come out?',
    a: 'Often yes — call and ask. The list reflects where we work regularly, not a hard boundary. If a job is genuinely too far to service properly and stand behind, we will tell you rather than take it and cut corners.',
  },
  {
    q: 'Why is there no street address on the site?',
    a: 'Because we are a mobile installer, not a retail location. Publishing an address we do not operate out of would be misleading, and there is nothing at it for a customer to visit.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Coverage"
        intro="We install across Greater Houston and quote every job onsite. Six areas have their own page below because the slab conditions there genuinely differ."
      />

      <Section>
        <Prose sections={body} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="City pages"
          title="Areas with conditions worth their own page"
          intro="Each covers the soil, the typical construction era and the questions we actually get from that area."
        />
        <ul className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <li key={c.slug} className="bg-background">
              <Link
                href={`${PATH}${c.slug}/`}
                className="flex h-full flex-col gap-3 p-7 hover:bg-secondary lg:p-8"
              >
                <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                  {c.county}
                </span>
                <span className="flex items-start justify-between gap-3 font-serif text-xl tracking-tight text-foreground">
                  {c.name}
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-primary"
                  />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {c.slab[0].heading}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="Also served" title="The rest of the coverage area" />
            <p className="mt-6 leading-relaxed text-muted-foreground text-pretty">
              We work in these areas on the same terms. They do not have their own pages because we
              would only be repeating what is on the pages above.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {alsoServed.map((a) => (
                <li
                  key={a}
                  className="border border-border px-4 py-2 text-sm text-muted-foreground"
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Heading eyebrow="Everywhere we work" title="What does not change by city" />
            <CheckList items={coverage} className="mt-10" />
          </div>
        </div>
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Coverage and travel" />
        <div className="mt-12 max-w-4xl border-t border-border">
          {faqs.map((f) => (
            <details key={f.q} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left">
                <span className="font-serif text-lg tracking-tight text-foreground text-pretty">
                  {f.q}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-primary transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-6 leading-relaxed text-muted-foreground text-pretty lg:max-w-3xl">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Find out what your slab actually needs"
        body={`Free onsite estimate anywhere we work, with nothing due upfront. Call or text ${site.phone}.`}
      />

      <Section>
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-10 text-sm">
          <Link href={r('pricing')} className="text-primary underline-offset-4 hover:underline">
            What a floor costs
          </Link>
          <Link href={r('process')} className="text-primary underline-offset-4 hover:underline">
            How we install
          </Link>
          <Link href={r('warranty')} className="text-primary underline-offset-4 hover:underline">
            Our warranty
          </Link>
          <Link href={r('schedule')} className="text-primary underline-offset-4 hover:underline">
            Book an estimate
          </Link>
        </div>
      </Section>
    </>
  )
}
