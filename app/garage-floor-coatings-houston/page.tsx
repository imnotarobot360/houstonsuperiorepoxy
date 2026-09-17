import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CardGrid, CheckList, FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { BuyersGuideLink } from '@/components/buyers-guide-link'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { MaterialSample } from '@/components/material-sample'
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'
import { sceneIllustrations } from '@/lib/site'

import { AtAGlance, PageAnswer, PageTerms } from '@/components/aeo'

const KEY = 'garageCoatings' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: the homeowner who has decided they want their garage done and wants
  to know what they get and what the job is like.

  Deliberately NOT on this page: how to vet a contractor (that is
  /epoxy-flooring-houston/) and coating chemistry comparisons (that is
  /polyaspartic-floor-coatings-houston/). Keep it outcome-focused.
*/

const outcomes = [
  {
    title: 'A floor you can actually clean',
    body: 'Bare concrete is porous, so it absorbs oil, brake dust and whatever came off your tires. A coated floor is a sealed surface — spills sit on top and come up with a mop instead of staining permanently.',
    tag: 'Day-to-day',
  },
  {
    title: 'No more concrete dust',
    body: 'Untreated slabs shed a fine grey powder that ends up on everything stored in the garage. Sealing the surface stops it at the source.',
    tag: 'Day-to-day',
  },
  {
    title: 'Hot-tire resistance',
    body: 'A warm tire sitting on a poorly bonded coating pulls it away from the slab. Resistance to that comes from mechanical bond and a proper topcoat, not from a product claim on a box.',
    tag: 'Durability',
  },
  {
    title: 'Cracks dealt with, not hidden',
    body: 'Cracks and spalls are repaired as their own step before coating. A crack painted over is still a crack, and it will telegraph back through the finish.',
    tag: 'Durability',
  },
  {
    title: 'Brighter, more usable space',
    body: 'A finished light-reflective floor makes a significant difference to how bright a garage feels with the door shut, which matters if you use the space for anything besides parking.',
    tag: 'Appearance',
  },
  {
    title: 'A finish chosen in your own garage',
    body: 'Flake blends read completely differently under your lighting than on a screen. We bring physical samples to the estimate so the choice is made in the room it is going in.',
    tag: 'Appearance',
  },
]

const whatsIncluded = [
  'Onsite inspection of the slab before any number is quoted',
  'Professional diamond grinding with dust-control equipment',
  'Crack, spall and surface repair as a separate itemized step',
  'Flake broadcast to full refusal, then scraped and vacuumed even',
  'Polyaspartic clear topcoat where appropriate for the system',
  'Stem walls and curbs coated if you want them included',
  'Final walkthrough with care instructions for your specific floor',
  'Written 5-year workmanship warranty',
]

const jobFlow = [
  {
    heading: 'Before we arrive',
    paras: [
      'The garage needs to be empty — everything off the floor, and vehicles parked elsewhere for the duration of the install. Wall-mounted storage can usually stay, though anything within a few inches of the floor is easier to work around if it comes down.',
      'If you have a floor drain, a water heater, or a step down into the house, mention it when we schedule. Those are detail areas that affect how we sequence the work.',
    ],
  },
  {
    heading: 'While the work happens',
    paras: [
      'Grinding is the loud, dusty part, and it is done with dust-control equipment rather than left to settle over your house. You do not need to be home for it, but the garage door will be open for airflow during parts of the install.',
      'Once coating starts, the floor cannot be walked on until it has set. We tell you exactly when you get the space back at the point we hand over the schedule.',
    ],
  },
  {
    heading: 'Getting your garage back',
    paras: [
      'Foot traffic and vehicle traffic return at different points, and the sequence depends on the system installed and the conditions during the install. Your schedule comes with your itemized quote after the inspection, so you can plan around it rather than guess.',
      'At the final walkthrough we go over the floor together and leave you with care instructions specific to the system on your slab.',
    ],
  },
]

const faqs = [
  {
    q: 'Do I have to empty my whole garage?',
    a: 'Yes, the floor needs to be completely clear, and vehicles parked elsewhere for the duration. Wall storage can typically stay in place. We will confirm what needs to move when we schedule the install.',
  },
  {
    q: 'Will you coat the stem walls too?',
    a: 'We can. Coating up the stem walls or curbs is additional detail and cut-in work beyond the floor area, so it appears as its own line on your quote rather than being assumed either way.',
  },
  {
    q: 'How long before I can park on it?',
    a: 'Foot traffic and vehicle traffic come back at different points, and the timing depends on the system and the conditions during installation. You get a specific schedule with your itemized quote after the onsite inspection.',
  },
  {
    q: 'Which system should I pick for a working garage?',
    a: 'Most Houston homeowners end up on a full-broadcast flake system, because the flake layer hides slab imperfections, adds texture underfoot and disguises dust well. Metallic is the more dramatic option and solid color is the simplest. We talk through the trade-offs onsite.',
  },
  {
    q: 'Can you match a specific color?',
    a: 'Flake blends are selected from physical samples during your estimate. Blend and coverage choices do affect material cost, which is covered in the itemized quote.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Garage Floor Coatings',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Garage floor coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Residential garages"
        intro="You want the garage done, and you want it to still look right in five years. This page covers what you actually get, what the install is like, and what you need to do to get ready."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Book a free onsite estimate
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('flake')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            See the flake system
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
          eyebrow="What changes"
          title="What a coated garage floor actually does for you"
          intro="Not a feature list — the six differences homeowners tell us they notice."
        />
        <CardGrid items={outcomes} />
      </Section>

      <Section bleed>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading
              eyebrow="Scope"
              title="What is included in a residential garage install"
            />
            <CheckList items={whatsIncluded} className="mt-10" />
          </div>
          <div className="lg:pt-4">
            {/*
              A labelled ILLUSTRATION of the finish, not one of our installs.
              MaterialSample stamps a visible "Illustration" chip on the frame;
              ImageSlot is reserved for real photography of our own work.
            */}
            <MaterialSample
              src={sceneIllustrations.residentialGarage.src}
              alt={sceneIllustrations.residentialGarage.alt}
              kind={sceneIllustrations.residentialGarage.kind}
              caption={sceneIllustrations.residentialGarage.caption}
              sizes="(min-width: 1024px) 46vw, 100vw"
            />
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
              That is an illustration of a finished flake floor rather than a photograph of one of
              ours — it shows the full-broadcast finish and the coved stem-wall detail listed
              above. Photography of our own garages is being shot for{' '}
              <Link href={r('projects')} className="text-primary underline underline-offset-4">
                the project archive
              </Link>
              , and we are not filling this space with a stock image of somebody else&apos;s garage.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="The install"
          title="What the job is like from your side"
          intro="Three things homeowners want to know before they commit: what they have to do, what it is like while it happens, and when they get the space back."
        />
        <div className="mt-14">
          <Prose sections={jobFlow} />
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Garage-specific questions" />
        <FaqList items={faqs} />
      </Section>

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Pick a finish, or read the detail"
          links={[
            { label: routes.flake.label, href: r('flake'), blurb: 'The system most Houston garages get.' },
            { label: routes.metallic.label, href: r('metallic'), blurb: 'Hand-worked pigment, no two floors alike.' },
            { label: routes.solidColor.label, href: r('solidColor'), blurb: 'Simplest way to seal a slab.' },
            { label: routes.repair.label, href: r('repair'), blurb: 'How cracks and spalls are handled.' },
            { label: routes.colors.label, href: r('colors'), blurb: 'Flake blends and color selection.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'The ten factors that move a quote.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
