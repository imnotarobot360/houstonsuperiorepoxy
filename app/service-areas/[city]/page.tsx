import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CardGrid, FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { cities, cityBySlug } from '@/lib/content/cities'
import { crumbsFor, r, routes } from '@/lib/routes'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'

/* Fully static — six known cities, no runtime fallback. */
export const dynamicParams = false

export function generateStaticParams() {
  return cities.map((c) => ({ city: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city: slug } = await params
  const city = cityBySlug(slug)
  if (!city) return {}

  const path = `/service-areas/${city.slug}/`
  const title = `Epoxy & Polyaspartic Floor Coatings in ${city.name}, TX | Houston Superior Epoxy`
  const description = `Garage floor coatings in ${city.name}, ${city.county}. We diamond grind, repair the slab and quote onsite — free estimates with nothing due upfront.`

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
  }
}

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params
  const city = cityBySlug(slug)
  if (!city) notFound()

  const path = `/service-areas/${city.slug}/`

  /* Lateral links to neighboring cities, resolved from the registry. */
  const neighborLinks = city.neighbors
    .map((n) => cityBySlug(n))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      label: c.name,
      href: `/service-areas/${c.slug}/`,
      blurb: c.county,
    }))

  const slabCards = city.slab.map((s) => ({ title: s.heading, body: s.body }))

  const body = [
    {
      heading: `Why we quote ${city.name} slabs onsite`,
      paras: [city.local],
    },
  ]

  return (
    <>
      {/*
        City pages carry a Service scoped to this one city — `areaServed` is
        narrowed to it rather than repeating the full metro list, so the markup
        describes the same coverage the page does.
      */}
      <JsonLd
        data={graph(
          webPageNode({
            path,
            name: `Epoxy & Polyaspartic Floor Coatings in ${city.name}, TX | ${site.company}`,
            description: `Garage floor coatings in ${city.name}, ${city.county}. We diamond grind, repair the slab and quote onsite.`,
          }),
          serviceNode({
            name: `Epoxy & polyaspartic floor coatings in ${city.name}, TX`,
            description: `Garage, patio and commercial concrete coatings in ${city.name}, ${city.county}.`,
            path,
            serviceType: 'Concrete floor coating',
            city: city.name,
          }),
          faqNode(path, city.faqs),
        )}
      />

      <PageHero
        h1={`Epoxy Floor Coatings in ${city.name}, TX`}
        eyebrow={city.county}
        intro={city.intro}
        trail={[...crumbsFor('serviceAreas'), { label: routes.serviceAreas.label, href: r('serviceAreas') }]}
        current={city.name}
        path={path}
      />

      <Section>
        <Heading
          eyebrow="Slab conditions"
          title={`What we find under ${city.name} garages`}
          intro="These are the conditions that actually change the specification here, rather than generic copy with a city name swapped in."
        />
        <CardGrid items={slabCards} cols={3} />
      </Section>

      <Section bleed>
        <Prose sections={body} />
      </Section>

      {/*
        NO "RECENT PROJECT" SECTION HERE WHILE THE ARCHIVE IS EMPTY.

        This slot held a dashed placeholder card reading "Awaiting real data"
        plus a call-us line, on all nine city pages. Three separate problems:

        1. It advertised absence. A visitor landing on the Katy page saw a
           labelled empty box where proof of local work should be, which is
           weaker than showing nothing at all.
        2. It was the same text on every city page — nine near-identical
           blocks of thin content across the set of URLs most exposed to
           duplicate-content assessment.
        3. The phone CTA it carried is already on this page twice.

        When a real project exists for a city, render it here as a genuine
        "Recent <city> project" summary linking to /projects/<slug>/ — the
        template and data model are ready and `projectsFor(city.slug)` in
        lib/content/projects.ts already returns that list. Until then this
        section is deliberately absent rather than empty.
      */}

      <Section bleed>
        <Heading eyebrow="Questions" title={`Asked by ${city.name} homeowners`} />
        <FaqList items={city.faqs} />
      </Section>

      <CtaBand
        title={`Get a free onsite estimate in ${city.name}`}
        body="We inspect the slab, moisture test it, and hand you an itemized written quote. Nothing is due upfront."
      />

      {neighborLinks.length > 0 && (
        <Section>
          <RelatedLinks heading="Nearby areas we serve" links={neighborLinks} />
        </Section>
      )}

      <Section bleed>
        <RelatedLinks
          heading="Before you decide"
          links={[
            { label: routes.pricing.label, href: r('pricing'), blurb: 'What drives the number on your quote.' },
            { label: routes.process.label, href: r('process'), blurb: 'Every step, in order, with nothing skipped.' },
            { label: routes.grinding.label, href: r('grinding'), blurb: 'The preparation that decides whether it lasts.' },
            { label: routes.warranty.label, href: r('warranty'), blurb: 'What our written warranty covers.' },
          ]}
        />
        <p className="mt-10 text-sm text-muted-foreground">
          Back to{' '}
          <Link href={r('serviceAreas')} className="text-primary underline-offset-4 hover:underline">
            all service areas
          </Link>
          .
        </p>
      </Section>
    </>
  )
}
