import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Heading, Prose, Section } from '@/components/blocks'
import { BuyersGuideLink } from '@/components/buyers-guide-link'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { articles } from '@/lib/content/resources'
import { r, routes } from '@/lib/routes'
import { graph, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'

const KEY = 'resources' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

const body = [
  {
    heading: 'Written to be useful before you buy',
    paras: [
      'These guides exist because most of what is published about garage floor coatings is either a product brochure or a sales page. Neither helps you work out whether a quote in front of you is any good.',
      'Nothing here contains manufacturer performance figures, mil thicknesses or cure times. Those numbers are product-specific and change between systems, so quoting them generically would be inventing precision we cannot stand behind.',
    ],
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph({
          /*
            CollectionPage is this page's WebPage node, not a second node beside
            it — one URL, one page entity.

            `hasPart` @ids are the same `#article` identifiers the individual
            article pages emit, so a crawler resolves each entry to the real
            BlogPosting rather than treating it as a separate stub.
          */
          ...webPageNode({
            path: PATH,
            name: routes[KEY].title,
            description: routes[KEY].description,
            type: 'CollectionPage',
          }),
          hasPart: articles.map((a) => ({
            '@type': 'BlogPosting',
            '@id': `${site.canonical}${PATH}${a.slug}/#article`,
            headline: a.h1,
            description: a.description,
            url: `${site.canonical}${PATH}${a.slug}/`,
          })),
        })}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Guides"
        intro="Plain-language explanations of how concrete coatings actually work, written so you can judge a quote — including ours — on something other than the total at the bottom."
      />

      <Section>
        <Prose sections={body} />
      </Section>

      {/*
        The buyer's guide sits ABOVE the article grid rather than inside it.

        The grid below is generated from the `articles` registry — everything in
        it lives at /resources/<slug>/. This page is at root level, so it cannot
        be added to that registry without either inventing a fake slug or
        breaking the href pattern the grid relies on. Featuring it separately is
        the honest structural fit, and it also reflects reading order: it is the
        guide to read before any of the technical ones.
      */}
      <Section>
        <Heading
          eyebrow="Start here"
          title="If you have not chosen a contractor yet"
          intro="The other guides explain how coatings work. This one explains how to judge the person quoting on yours."
        />
        <div className="mt-12">
          <BuyersGuideLink />
        </div>
      </Section>

      <Section bleed>
        <Heading eyebrow="All guides" title="Start wherever your question is" />
        <ul className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2">
          {articles.map((a) => (
            <li key={a.slug} className="bg-background">
              <Link
                href={`${PATH}${a.slug}/`}
                className="flex h-full flex-col gap-3 p-7 hover:bg-secondary lg:p-8"
              >
                <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                  {a.kicker}
                </span>
                <span className="flex items-start justify-between gap-3 font-serif text-xl tracking-tight text-foreground text-pretty">
                  {a.h1}
                  <ArrowUpRight
                    size={16}
                    aria-hidden="true"
                    className="mt-1.5 shrink-0 text-primary"
                  />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {a.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        title="Still want a straight answer about your own slab?"
        body="Reading only gets you so far. We will look at the concrete, test it, and tell you what it needs."
      />

      <Section>
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-10 text-sm">
          <Link href={r('pricing')} className="text-primary underline-offset-4 hover:underline">
            What a floor costs
          </Link>
          <Link href={r('process')} className="text-primary underline-offset-4 hover:underline">
            How we install
          </Link>
          <Link href={r('colors')} className="text-primary underline-offset-4 hover:underline">
            Color options
          </Link>
          <Link href={r('schedule')} className="text-primary underline-offset-4 hover:underline">
            Book an estimate
          </Link>
        </div>
      </Section>
    </>
  )
}
