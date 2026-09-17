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

const KEY = 'metallic' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: someone drawn to the look. The honest job of this page is to sell the
  effect AND set expectations — metallic is hand-worked, non-repeatable, and
  less forgiving than flake. Under-promising here prevents disappointment.
*/

const character = [
  {
    title: 'No two floors are the same',
    body: 'Metallic pigment is moved through the wet resin by hand. The pattern that results is a record of how the material was worked on that day, in that room — it cannot be repeated exactly, including by us.',
    tag: 'Character',
  },
  {
    title: 'Depth rather than pattern',
    body: 'The pigment suspends at different levels in the resin, so the finish reads as having depth below the surface rather than being a printed pattern sitting on top of it.',
    tag: 'Character',
  },
  {
    title: 'It changes with the light',
    body: 'Pearlescent pigment reflects differently depending on where you stand and where the light is coming from. The same floor genuinely looks different morning and evening.',
    tag: 'Character',
  },
  {
    title: 'Smoother than flake',
    body: 'There is no decorative broadcast, so the finished surface is considerably smoother. That is part of the appeal indoors and part of the reason it is a poor fit for wet areas.',
    tag: 'Trade-off',
  },
  {
    title: 'It shows the slab underneath',
    body: 'Without a flake layer to break things up visually, a metallic finish is far less forgiving of an uneven or patched slab. Slab condition matters more here than in any other system we install.',
    tag: 'Trade-off',
  },
  {
    title: 'It shows daily life too',
    body: 'A smooth reflective floor shows dust, footprints and scuffing more readily than a multi-tone flake blend. It rewards a space that gets kept clean.',
    tag: 'Trade-off',
  },
]

const goodFit = [
  'Showrooms and retail where the floor is part of the presentation',
  'Interior feature spaces — entries, lobbies, studios',
  'Home gyms, bars and finished basements',
  'Offices where a decorative floor replaces carpet or tile',
  'Display garages that are kept clean rather than worked in',
  'Interior slabs in genuinely good condition',
]

const poorFit = [
  'Exterior patios and pool decks — UV and wet-slip both work against it',
  'Wet areas, or any slab that regularly sees standing water',
  'Warehouse and forklift traffic, where abrasion dominates',
  'Slabs with extensive patching that you want disguised',
  'Working garages where the floor takes constant abuse and rarely gets cleaned',
  'Anywhere an exactly repeatable finish is a requirement',
]

const expectations = [
  {
    heading: 'Why we talk about this one differently',
    paras: [
      'Metallic is the most photogenic floor we install, and photographs are exactly the problem. What you find on the internet is a selection of the most dramatic results ever produced, generally shot in ideal light in an empty room. That is a fair representation of the ceiling of the finish, not of the average.',
      'The reality is that metallic is hand-worked, and the outcome depends on the resin, the room temperature, the slab and the person working it. We can show you the character of the finish and the palette. We cannot promise a specific pattern, and anybody who does is describing something they do not control.',
    ],
  },
  {
    heading: 'What we can commit to',
    paras: [
      'The palette and the general character — how light or dark, how high-contrast, how much movement. The preparation underneath, which is the same diamond-ground standard as every other system we install. The topcoat over it. The warranty on the workmanship.',
      'What we will not do is show you somebody else’s floor and imply yours will match it.',
    ],
  },
  {
    heading: 'Slab condition matters more here',
    paras: [
      'Because there is no flake layer breaking up the surface visually, a metallic floor telegraphs what is underneath it more than any other finish. An uneven slab, an old patch or a repaired crack is more likely to remain perceptible.',
      'That is not a reason to avoid metallic — it is a reason for the inspection to be honest. If your slab is not a good candidate for metallic we will tell you during the estimate and explain what we would recommend instead, rather than taking the job and hoping.',
    ],
  },
]

const faqs = [
  {
    q: 'Can you match a metallic floor I saw online?',
    a: 'Not exactly, and neither can anyone else. The pattern comes from how pigment is hand-worked through wet resin, so it is never precisely repeatable. We can match the palette and the general character — how dark, how much contrast, how much movement — but a specific pattern is not something any installer genuinely controls.',
  },
  {
    q: 'Is metallic good for a garage?',
    a: 'It can be, for a display garage that gets kept clean. For a working garage, flake is usually the better call: it hides dust and tire marks, has more texture underfoot and is far more forgiving of slab imperfections.',
  },
  {
    q: 'Can I have a metallic patio?',
    a: 'We do not recommend it. Exterior slabs deal with UV and get wet with people walking on them, and a smooth metallic finish is the wrong answer to both. Exterior work gets a textured, UV-stable system instead.',
  },
  {
    q: 'Is it slippery?',
    a: 'It is smoother than a flake floor because there is no decorative broadcast, so it has less inherent texture. That is fine for a dry interior space and a genuine consideration anywhere that gets wet. We will raise it if the space you have in mind is a concern.',
  },
  {
    q: 'Does it need more maintenance?',
    a: 'Not fundamentally different maintenance, but a smooth reflective surface shows dust and footprints more readily than a multi-tone flake blend, so it looks like it needs attention sooner. Care instructions specific to your floor come at the final walkthrough.',
  },
  {
    q: 'Why is metallic priced differently to flake?',
    a: 'Different material and, more significantly, different labor — the pigment has to be worked while the resin is open, which is skilled, time-sensitive work. Which one costs more on your specific slab depends on the slab, so both get quoted from the inspection rather than from a rate card.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Metallic Epoxy Floors',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Metallic epoxy floor coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="System detail"
        intro="Pearlescent pigment moved through wet resin by hand. The result has real depth and genuinely cannot be repeated — which is the appeal, and also the thing to understand before you choose it."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Discuss a metallic floor
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('flake')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Compare with flake
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
          eyebrow="Character"
          title="What the finish is actually like"
          intro="Three things that make metallic worth choosing, and three trade-offs that come with it. Both halves matter."
        />
        <CardGrid items={character} />
      </Section>

      <Section bleed>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="Good fit" title="Where metallic works well" />
            <CheckList items={goodFit} className="mt-10" />
          </div>
          <div>
            <Heading eyebrow="Poor fit" title="Where we would talk you out of it" />
            <CheckList items={poorFit} className="mt-10" />
          </div>
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="Expectations"
          title="The honest version"
          intro="Metallic is the finish most likely to disappoint someone who chose it from a photograph. Here is why, and what we will and will not promise."
        />
        <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_20rem] lg:gap-20">
          <Prose sections={expectations} />
          <div>
            {/*
              Fixed 20rem column at lg, full width below it.

              THE CAPTION HERE CARRIES MORE WEIGHT THAN ELSEWHERE. This section
              is headed "The honest version" and argues that metallic is the
              finish most likely to disappoint someone who chose it from a
              photograph. An unlabelled flattering image in that exact spot
              would refute the paragraph beside it.

              So the disclosure is doubled: the "Illustration" chip on the
              frame, plus caption text that explicitly turns the image into an
              instance of the page's own warning. Do not soften this one.

              Square source, so 1/1 rather than the component default 4/3.
            */}
            <MaterialSample
              src={sceneIllustrations.metallicFloor.src}
              alt={sceneIllustrations.metallicFloor.alt}
              kind={sceneIllustrations.metallicFloor.kind}
              caption={sceneIllustrations.metallicFloor.caption}
              aspect="1/1"
              sizes="(min-width: 1024px) 20rem, 100vw"
            />
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
              And this is a case in point: an illustration of a metallic pour, not a photograph of a
              floor we installed. It is the kind of image metallic gets sold on, which is exactly
              why your own floor should be judged from physical samples in your room instead.
              Photography of our own completed metallic floors is being shot for{' '}
              <Link href={r('projects')} className="text-primary underline underline-offset-4">
                the project archive
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Metallic questions" />
        <FaqList items={faqs} />
      </Section>

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Compare and continue"
          links={[
            { label: routes.flake.label, href: r('flake'), blurb: 'More forgiving, more texture.' },
            { label: routes.solidColor.label, href: r('solidColor'), blurb: 'Simplest of the three.' },
            { label: routes.commercial.label, href: r('commercial'), blurb: 'Showrooms and lobbies.' },
            { label: routes.grinding.label, href: r('grinding'), blurb: 'Why slab prep matters more here.' },
            { label: routes.repair.label, href: r('repair'), blurb: 'Repairs show through metallic.' },
            { label: routes.projects.label, href: r('projects'), blurb: 'Our completed work.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
