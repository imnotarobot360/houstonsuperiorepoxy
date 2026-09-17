import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CardGrid,
  CheckList,
  CompareTable,
  FaqList,
  Heading,
  Prose,
  RelatedLinks,
  Section,
} from '@/components/blocks'
import { BuyersGuideLink } from '@/components/buyers-guide-link'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'

import { AtAGlance, PageAnswer, PageTerms } from '@/components/aeo'

const KEY = 'solidColor' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: someone who wants function over decoration — dust control, a
  cleanable surface, a sealed slab. Frame it as the correct specification for
  a set of problems, never as the budget compromise.
*/

const useCases = [
  {
    title: 'Stopping concrete dust',
    body: 'An uncoated slab sheds fine grey powder continuously. Sealing the surface stops it at the source, which is frequently the entire reason a warehouse or storage space gets coated at all.',
    tag: 'Function',
  },
  {
    title: 'A surface that can be cleaned',
    body: 'Bare concrete is porous and absorbs whatever lands on it. A sealed surface means spills sit on top and get mopped up rather than soaking in and staining permanently.',
    tag: 'Function',
  },
  {
    title: 'Brightening a dim space',
    body: 'A light solid color reflects a great deal more light than grey concrete. In a windowless garage, storage room or back-of-house area that difference is immediately obvious.',
    tag: 'Function',
  },
  {
    title: 'Seamlessness for hygiene',
    body: 'No seams and no grout lines means nowhere for contamination to collect. This is why solid systems dominate in food service, medical and veterinary spaces.',
    tag: 'Function',
  },
  {
    title: 'Color-coded zones',
    body: 'Uniform color makes a floor legible — walkways, equipment zones and hazard areas can be laid out in different colors, which decorative finishes cannot do cleanly.',
    tag: 'Function',
  },
  {
    title: 'Large areas, consistently',
    body: 'Across a very large slab a solid color is easier to keep visually consistent than a hand-worked decorative finish, and easier to touch up later in a specific area.',
    tag: 'Function',
  },
]

const versus = [
  {
    point: 'What you are buying',
    ours: 'A sealed, cleanable, dust-free surface in a uniform color.',
    theirs: 'That, plus a decorative layer that hides imperfections.',
  },
  {
    point: 'Texture underfoot',
    ours: 'Smooth. Texture can be added to the topcoat where slip resistance is needed.',
    theirs: 'Inherent texture from the scraped flake layer.',
  },
  {
    point: 'Hiding slab imperfections',
    ours: 'Shows more. Patches, repairs and unevenness are more likely to stay visible.',
    theirs: 'Very forgiving — visual noise disguises patch lines well.',
  },
  {
    point: 'Showing dust and marks',
    ours: 'Shows dust and tire marks more readily, particularly in darker colors.',
    theirs: 'Multi-tone blend breaks up dust and marks visually.',
  },
  {
    point: 'Layer count',
    ours: 'Fewer layers, no broadcast step, no scrape-and-vacuum step.',
    theirs: 'Base coat, broadcast, scrape, topcoat.',
  },
  {
    point: 'Typical use',
    ours: 'Warehouses, utility spaces, kitchens, medical, color-coded zones.',
    theirs: 'Residential garages and most customer-facing spaces.',
  },
]

const included = [
  'Diamond grinding with dust-control equipment',
  'Crack, spall and pitting repair as an itemized step',
  'Pigmented coating in your selected color',
  'Topcoat appropriate to the exposure and traffic',
  'Added texture in the topcoat where slip resistance is required',
  'Zone or lane color changes as a separate itemized scope',
  'Coving and drain detail assessed for hygiene-critical spaces',
  'Written 5-year workmanship warranty',
]

const notes = [
  {
    heading: 'This is a specification, not a downgrade',
    paras: [
      'Solid color gets described as the entry-level option, which misses what it is for. If the problem you are solving is concrete dust in your inventory, a floor that can be sanitized, or a surface that needs to read clearly as three different zones, then a decorative flake finish is not a better answer — it is the wrong answer with more steps.',
      'There are fewer layers because fewer layers are required, not because something has been left out. The preparation underneath is identical: the same diamond grinding, the same crack and spall repair, the same standard of bond to the slab. Preparation is never where a system gets simplified.',
    ],
  },
  {
    heading: 'Where it is genuinely the wrong choice',
    paras: [
      'On a slab with extensive patching that you want disguised, solid color is unforgiving — every repair is more likely to stay perceptible, and flake exists precisely to solve that. In a residential garage that gets worked in and rarely swept, a mid-tone flake blend will look better for longer with less effort.',
      'We will tell you which of these applies to your slab during the inspection. If solid color is the right answer we will say so, and if it is not we will explain why rather than quoting whatever was asked for.',
    ],
  },
  {
    heading: 'Color choice does real work',
    paras: [
      'Light grey and beige tones maximize reflected light, which transforms a dim space and hides dust reasonably well. Mid greys are the most forgiving all-round choice. Dark colors look sharp when clean and show every footprint and tire mark when not.',
      'For commercial work, color also carries information — traffic lanes, walkways and equipment zones in distinct colors make a space navigable. That is quoted as its own scope because it is additional layout and cut-in labor.',
    ],
  },
]

const faqs = [
  {
    q: 'Is solid color cheaper than flake?',
    a: 'There are fewer layers and no broadcast material, so generally yes — but it is not a discount version. It is the correct specification when what you need is a sealed, cleanable, dust-free surface rather than a decorative one. The preparation underneath is identical.',
  },
  {
    q: 'Will it show cracks and patches?',
    a: 'More than flake will, yes. Without a decorative layer breaking up the surface, repairs and unevenness are more likely to remain perceptible. If disguising slab history is a priority, flake is the better system and we will say so at the inspection.',
  },
  {
    q: 'Is a solid color floor slippery?',
    a: 'It is smoother than flake because there is no decorative broadcast. Where slip resistance matters, texture is added into the topcoat deliberately, and how much is a decision we make with you based on how the space is used.',
  },
  {
    q: 'Can you do different colors for different areas?',
    a: 'Yes, and it is one of the real advantages of a solid system. Traffic lanes, walkways, equipment zones and hazard marking can all be laid out in distinct colors. It is quoted as its own scope because of the extra layout and cut-in work.',
  },
  {
    q: 'Which color hides dirt best?',
    a: 'Mid greys are the most forgiving. Light tones maximize reflected light and brighten a dim space considerably. Dark colors look excellent when clean and show every footprint when not.',
  },
  {
    q: 'Is it suitable for a commercial kitchen?',
    a: 'A seamless non-absorbent surface is exactly what hygiene-driven spaces need, so yes — and coving and drain detail get assessed during the walkthrough, because in those spaces the perimeter and the drains matter as much as the field.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Solid-Color Epoxy Floors',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Solid-color epoxy floor coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="System detail"
        intro="Uniform pigmented coating with no decorative broadcast. When the job is to stop concrete dust and get a surface that can actually be cleaned, this is the right specification rather than the cheap one."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Have your slab assessed
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('warehouse')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Warehouse applications
          </Link>
        </div>
      </PageHero>

      <Section>
        <PageAnswer routeKey={KEY} />
        {/*
          The labeled spec table belongs in the SAME section as the answer,
          not further down the page: together they are the answer-first
          cluster the brief asks for, and an engine that lifts one usually
          reads the other.
        */}
        <div className="mt-16">
          <AtAGlance routeKey={KEY} />
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="What it solves"
          title="Six problems a solid floor is the answer to"
          intro="Every one of these is a functional requirement rather than an aesthetic preference — which is exactly why this system exists."
        />
        <CardGrid items={useCases} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Side by side"
          title="Solid color versus flake"
          intro="Neither is better in the abstract. They solve different problems, and the honest comparison includes where solid color loses."
        />
        <CompareTable rows={versus} oursLabel="Solid color" theirsLabel="Flake" />
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="Scope" title="What a solid-color install includes" />
            <CheckList items={included} className="mt-10" />
          </div>
          <div className="lg:pt-4">
            <Prose sections={[notes[2]]} />
          </div>
        </div>
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Positioning"
          title="When it is right, and when it is not"
          intro="We would rather talk you out of the wrong system than install it."
        />
        <div className="mt-14">
          <Prose sections={[notes[0], notes[1]]} />
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section>
        <Heading eyebrow="Questions" title="Solid-color questions" />
        <FaqList items={faqs} />
      </Section>

      <Section bleed>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Compare and continue"
          links={[
            { label: routes.flake.label, href: r('flake'), blurb: 'The decorative alternative.' },
            { label: routes.metallic.label, href: r('metallic'), blurb: 'The dramatic alternative.' },
            { label: routes.warehouse.label, href: r('warehouse'), blurb: 'Dust control at scale.' },
            { label: routes.commercial.label, href: r('commercial'), blurb: 'Hygiene-driven spaces.' },
            { label: routes.grinding.label, href: r('grinding'), blurb: 'Identical preparation standard.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'What moves the number.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
