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
import { MaterialSample } from '@/components/material-sample'
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'
import { sceneIllustrations } from '@/lib/site'

import { AtAGlance, PageAnswer, PageTerms } from '@/components/aeo'

const KEY = 'commercial' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: a business decision-maker whose primary concern is downtime and
  liability, not aesthetics. Copy leads with operational continuity and
  insurance rather than appearance.
*/

const sectors = [
  {
    title: 'Retail and showrooms',
    body: 'Customer-facing floors where appearance carries weight and the space cannot be closed for long. Usually phased so a portion stays open, or run overnight.',
    tag: 'Sector',
  },
  {
    title: 'Automotive and service bays',
    body: 'Slabs that see oil, brake fluid, hot tires and rolling tool chests. Chemical resistance and a cleanable surface matter more than finish drama.',
    tag: 'Sector',
  },
  {
    title: 'Commercial kitchens and food service',
    body: 'Health-code-driven work where a seamless, sanitary, non-absorbent surface is the point. Coving and drain detail get assessed during the walkthrough.',
    tag: 'Sector',
  },
  {
    title: 'Medical and veterinary',
    body: 'Spaces that need to be disinfected repeatedly without degrading the floor. Seamlessness matters because seams collect what you are trying to remove.',
    tag: 'Sector',
  },
  {
    title: 'Gyms and studios',
    body: 'High foot traffic, dropped weight, and equipment dragged across the surface. Abrasion and impact behavior drive the specification.',
    tag: 'Sector',
  },
  {
    title: 'Offices and lobbies',
    body: 'Where a polished decorative finish is doing architectural work. Metallic and solid-color systems both come into play.',
    tag: 'Sector',
  },
]

const operational = [
  'Phased installation so part of the space stays operational',
  'After-hours, overnight and weekend scheduling',
  'Dust-control equipment on all grinding, not open-air grinding',
  'Containment and protection of adjacent finished areas',
  'Certificate of insurance issued to your property manager on request',
  'Coordination with your building management and access requirements',
  'Line striping and traffic marking as a separate itemized scope',
  'Written 5-year workmanship warranty on the installed floor',
]

const planning = [
  {
    heading: 'Downtime is a scoping decision, not a surprise',
    paras: [
      'The question every operator asks first is how long the space is unusable. The honest answer is that it depends on the square footage, the condition of the slab, the system specified and how much of the space can be closed at one time — which is why the schedule comes out of the walkthrough rather than off a rate card.',
      'What we can commit to is that you get the sequence in writing before work starts, including which areas are down on which days and when each returns to service. Phasing costs more in mobilization than doing the whole floor at once, and that trade-off is yours to make with real numbers in front of you.',
    ],
  },
  {
    heading: 'Liability and access',
    paras: [
      'We carry $2 million in general liability plus workers’ compensation, and we will issue a certificate naming your entity or property manager if your lease requires it. For tenants in managed buildings, that requirement usually surfaces late and delays a start date — raising it during the walkthrough avoids that.',
      'Access logistics matter as much as the coating. Loading dock availability, freight elevator hours, after-hours building access and where equipment can be staged all affect the schedule, so we cover them onsite.',
    ],
  },
  {
    heading: 'What the walkthrough covers',
    paras: [
      'We assess slab condition, existing coatings, moisture, joint and crack detail, drain locations and traffic patterns. For warehouse and industrial slabs there is additional detail around joint treatment and forklift loading, covered on the warehouse page.',
      'You receive an itemized proposal: preparation, repair, each coating layer, striping if applicable, phasing and mobilization broken out separately. No payment is due upfront.',
    ],
  },
]

const faqs = [
  {
    q: 'Can you work outside our business hours?',
    a: 'Yes. After-hours, overnight and weekend scheduling is standard for commercial work, and phasing so part of the space stays open is common. Both affect cost through mobilization, so they appear as their own line rather than being hidden in a square-foot rate.',
  },
  {
    q: 'How long will our space be out of service?',
    a: 'It depends on area, slab condition, the system specified and how much can be closed at once. You get a written day-by-day sequence with your proposal after the walkthrough, so you can plan staffing and deliveries around it.',
  },
  {
    q: 'Can you issue a certificate of insurance to our landlord?',
    a: 'Yes. We carry $2M general liability plus workers’ compensation and can issue a certificate naming your entity or property manager. If your lease has specific coverage or additional-insured requirements, send them over during the walkthrough.',
  },
  {
    q: 'Do you handle line striping and safety marking?',
    a: 'Yes, as a separate itemized scope. Traffic lanes, walkways and equipment zones are quoted distinctly from the floor coating because they are often phased differently or added later.',
  },
  {
    q: 'Is the grinding going to shut down the rest of our building?',
    a: 'Grinding is done with dust-control equipment and containment of adjacent areas rather than open-air. It is still the loudest part of the job, which is a common reason commercial clients choose overnight scheduling.',
  },
  {
    q: 'Do you require a deposit for commercial work?',
    a: 'No payment is due upfront.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Commercial Epoxy Flooring',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Commercial floor coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Commercial & industrial"
        intro="For a business, the floor is secondary to the downtime. We phase commercial installs around your operating hours, carry $2M in coverage, and put the day-by-day sequence in writing before anything starts."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Request a site walkthrough
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('warehouse')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Warehouse & industrial
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
          eyebrow="Operations first"
          title="How we keep you running"
          intro="The scope items commercial clients actually negotiate on — all of them itemized rather than assumed."
        />
        <div className="mt-12 grid gap-14 lg:grid-cols-2 lg:gap-20">
          <CheckList items={operational} />
          <div>
            {/* A labelled ILLUSTRATION of the finish, not one of our installs. */}
            <MaterialSample
              src={sceneIllustrations.commercialFloor.src}
              alt={sceneIllustrations.commercialFloor.alt}
              kind={sceneIllustrations.commercialFloor.kind}
              caption={sceneIllustrations.commercialFloor.caption}
              sizes="(min-width: 1024px) 46vw, 100vw"
            />
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
              That is an illustration of an industrial coating and safety-line layout rather than a
              photograph of one of our installs. Commercial project photography is being shot on
              completed jobs for{' '}
              <Link href={r('projects')} className="text-primary underline underline-offset-4">
                the project archive
              </Link>
              , rather than licensed from a stock library.
            </p>
          </div>
        </div>
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Sectors"
          title="Spaces we coat"
          intro="Different sectors drive different specifications. What the floor has to survive determines the system, not the other way round."
        />
        <CardGrid items={sectors} />
      </Section>

      <Section>
        <Heading
          eyebrow="Planning"
          title="Downtime, liability and access"
          intro="The three things that decide whether a commercial floor project goes smoothly, all settled before work begins."
        />
        <div className="mt-14">
          <Prose sections={planning} />
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Commercial questions" />
        <FaqList items={faqs} />
      </Section>

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Related services"
          links={[
            { label: routes.warehouse.label, href: r('warehouse'), blurb: 'Forklift traffic and joint detail.' },
            { label: routes.solidColor.label, href: r('solidColor'), blurb: 'Dust control and cleanability.' },
            { label: routes.metallic.label, href: r('metallic'), blurb: 'Showrooms and lobbies.' },
            { label: routes.removal.label, href: r('removal'), blurb: 'Existing failed coatings.' },
            { label: routes.grinding.label, href: r('grinding'), blurb: 'Dust-controlled preparation.' },
            { label: routes.warranty.label, href: r('warranty'), blurb: 'Coverage and what it includes.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
