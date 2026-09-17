import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CardGrid,
  CheckList,
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

const KEY = 'warehouse' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: facilities / operations manager. Distinct from the commercial page
  by being about the slab itself under heavy load — joints, forklifts,
  racking, striping — rather than about scheduling around customers.
*/

const slabIssues = [
  {
    title: 'Control and construction joints',
    body: 'Warehouse slabs are full of joints, and joints move. A coating run straight across one without the joint being detailed will crack along that line. Joint treatment is assessed and priced separately.',
    tag: 'Slab detail',
  },
  {
    title: 'Forklift and pallet-jack traffic',
    body: 'Hard polyurethane wheels under load concentrate force into a small contact patch, and turning adds a shearing component. This is a different kind of stress than foot traffic and it drives the system choice.',
    tag: 'Loading',
  },
  {
    title: 'Spalling at joints and dock edges',
    body: 'Repeated wheel impact breaks concrete down at joint edges and around dock doors. That damage is repaired as its own step — coating over a spalled edge just conceals it briefly.',
    tag: 'Slab detail',
  },
  {
    title: 'Concrete dusting under traffic',
    body: 'An uncoated warehouse slab sheds fine dust continuously, which ends up in inventory, on racking and in equipment filters. Sealing the surface is often the primary business case for the coating.',
    tag: 'Operations',
  },
  {
    title: 'Racking and fixed equipment',
    body: 'Slabs with racking bolted down cannot always be fully cleared. We assess what can be worked around and what has to move, and phase accordingly.',
    tag: 'Access',
  },
  {
    title: 'Moisture in on-grade slabs',
    body: 'Large slabs on grade can carry significant moisture, and vapor moving upward is a bonding risk across a big area. Slab moisture is assessed before a system gets specified.',
    tag: 'Substrate',
  },
]

const scope = [
  'Slab and joint condition survey across the full area',
  'Joint detailing and crack repair itemized separately',
  'Spall repair at dock edges and joint shoulders',
  'Dust-controlled diamond grinding at scale',
  'System specified to the actual traffic, not a default build',
  'Traffic lane and walkway striping as its own scope',
  'Phased by bay or zone so operations continue',
  'Written 5-year workmanship warranty',
]

const detail = [
  {
    heading: 'Why warehouse work is priced differently',
    paras: [
      'Square footage is the least interesting number on a warehouse quote. What moves the price is linear feet of joint to detail, how much spall repair the dock edges and joint shoulders need, whether an existing coating has to come off, and how many phases the operation requires.',
      'A large clean slab with few joints and no existing coating is straightforward work at scale. The same square footage broken up by racking, with damaged joints and a failed coating from a previous contractor, is a substantially different job. Both get quoted from the survey rather than from an area rate.',
    ],
  },
  {
    heading: 'Joints are the part most quotes ignore',
    paras: [
      'Concrete slabs are cast with control joints on purpose, so the slab cracks where you chose rather than randomly. Those joints continue to move with temperature and load for the life of the building.',
      'A coating is a continuous film. Run it across a moving joint with no detail and the film has to absorb that movement, which it does by cracking in a straight line. Proper joint treatment is the difference between a warehouse floor that holds up and one that develops a grid of cracks in the first year.',
      'If a warehouse quote you are comparing does not mention joints at all, that is the first thing to ask about.',
    ],
  },
  {
    heading: 'Phasing a live facility',
    paras: [
      'Most warehouses cannot stop. Work is normally phased by bay, aisle or zone, with each area cleared, ground, repaired, coated and returned to service before the next begins. That means more mobilizations and a longer overall calendar, in exchange for continuous operation.',
      'The alternative — closing the whole floor for a single continuous run — is faster and cheaper per square foot. Which one makes sense is an operational decision, and you get both sequences costed so it is an informed one.',
    ],
  },
]

const faqs = [
  {
    q: 'Can you coat around our racking?',
    a: 'Often, yes. Fixed racking that cannot be dismantled gets worked around, and we assess during the survey what genuinely has to move versus what can stay. Coating up to and around bolted racking is more cut-in labor, so it is itemized.',
  },
  {
    q: 'Will the coating handle forklift traffic?',
    a: 'That is a specification question answered at the survey. Hard wheels under load put concentrated, shearing stress on a floor, so the system gets chosen for the actual traffic rather than defaulting to a residential build. What matters most is that the base coat is bonded to a properly ground slab.',
  },
  {
    q: 'What happens with our control joints?',
    a: 'They get detailed rather than coated straight across. Joints move for the life of the slab, and a continuous film run over a moving joint cracks along it. Joint treatment is surveyed in linear feet and priced as its own line.',
  },
  {
    q: 'Do you do line striping for traffic lanes?',
    a: 'Yes, quoted separately from the floor coating. Lanes, walkways, equipment zones and hazard marking are frequently phased differently or added after the coating is in service.',
  },
  {
    q: 'Can you work overnight so we do not lose production?',
    a: 'Yes. Overnight and weekend work, and phasing by zone, are both standard. Each adds mobilization cost, which you see broken out so you can weigh it against the cost of downtime.',
  },
  {
    q: 'Our existing warehouse coating is peeling. Can you go over it?',
    a: 'No — a new coating over a delaminating one fails with the old one. The failed material has to come off mechanically first. That is usually the largest single variable in a re-coat quote, and it is covered on our coating removal page.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Warehouse Floor Coatings',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Industrial and warehouse floor coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Industrial slabs"
        intro="On a warehouse slab, square footage is the least useful number. Joints, dock-edge spalling and forklift loading are what decide the specification and the price."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Request a slab survey
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('commercial')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Commercial overview
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
          eyebrow="What we survey"
          title="Six things that decide an industrial specification"
          intro="Every one of these is assessed onsite, because getting any of them wrong is what produces a warehouse floor that fails in its first year."
        />
        <CardGrid items={slabIssues} />
      </Section>

      <Section bleed>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="Scope" title="What an industrial install includes" />
            <CheckList items={scope} className="mt-10" />
          </div>
          <div className="lg:pt-4">
            <Prose sections={[detail[1]]} />
          </div>
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="Pricing & phasing"
          title="How industrial work gets costed"
          intro="Two sequences, two costs. You see both so the operational trade-off is yours to make."
        />
        <div className="mt-14">
          <Prose sections={[detail[0], detail[2]]} />
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Warehouse and industrial questions" />
        <FaqList items={faqs} />
      </Section>

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Related services"
          links={[
            { label: routes.commercial.label, href: r('commercial'), blurb: 'Scheduling and liability.' },
            { label: routes.solidColor.label, href: r('solidColor'), blurb: 'Dust control and cleanability.' },
            { label: routes.removal.label, href: r('removal'), blurb: 'Stripping a failed coating.' },
            { label: routes.repair.label, href: r('repair'), blurb: 'Spall and joint-edge repair.' },
            { label: routes.grinding.label, href: r('grinding'), blurb: 'Preparation at scale.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'What moves a quote.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
