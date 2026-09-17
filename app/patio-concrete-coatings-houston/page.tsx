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

const KEY = 'patio' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: homeowner with an exterior slab. The differentiator versus the
  garage page is that exterior slabs are a genuinely different engineering
  problem — UV, standing water, wet-slip, thermal cycling, drainage.
*/

const exteriorFactors = [
  {
    title: 'Slip resistance when wet',
    body: 'An exterior slab gets wet, and a pool deck gets wet constantly with bare feet on it. Texture is added deliberately to the topcoat rather than treated as an afterthought, and how much is a conversation about comfort versus grip.',
    tag: 'Safety',
  },
  {
    title: 'Constant UV exposure',
    body: 'A clear epoxy left in direct sun ambers over time. That is why exterior work gets a UV-stable topcoat — outdoors this is not a preference, it is the difference between a floor that holds its color and one that yellows.',
    tag: 'Exposure',
  },
  {
    title: 'Surface temperature underfoot',
    body: 'Color and finish affect how hot a slab gets in direct Houston sun, which matters on a pool deck people walk on barefoot. Lighter tones and texture both help, and we talk it through before you choose.',
    tag: 'Comfort',
  },
  {
    title: 'Drainage and standing water',
    body: 'Where water sits after rain tells us a lot. Slabs that pond need that understood before coating, because a coating does not fix a drainage problem and standing water works on any edge or detail it can find.',
    tag: 'Substrate',
  },
  {
    title: 'Thermal cycling',
    body: 'Exterior slabs expand and contract far more than a garage floor, cycling between full sun and cool rain. That movement is why crack detail on an exterior slab gets more attention, not less.',
    tag: 'Substrate',
  },
  {
    title: 'Pool chemicals and salt',
    body: 'Pool deck coatings live with chlorinated or salt water splashing on them continuously. Chemical exposure feeds into which system gets specified for the deck versus a covered patio.',
    tag: 'Exposure',
  },
]

const surfaces = [
  'Open patios and back porches',
  'Covered and screened patios',
  'Pool decks and surrounds',
  'Walkways and garden paths',
  'Outdoor kitchen and grill areas',
  'Front entries, stoops and landings',
  'Carports and porte-cochères',
  'Exterior stairs and landings',
]

const notes = [
  {
    heading: 'Why an exterior slab is assessed separately',
    paras: [
      'A garage floor lives in a stable, shaded, dry environment. An exterior slab in Houston deals with direct UV, driving rain, standing water, and a surface temperature that can swing significantly in a single afternoon. Those are different engineering conditions, and they lead to different specifications.',
      'This is the clearest case where the chemistry choice stops being a matter of taste. A clear epoxy topcoat outdoors will amber under sustained UV. The topcoat on an exterior slab needs to be UV-stable, and the texture in it needs to account for the surface being wet with people walking on it.',
    ],
  },
  {
    heading: 'Weather affects the schedule, not just the design',
    paras: [
      'Coatings cure in relation to ambient temperature and humidity, and an exterior install has no roof over it. Rain in the forecast, an unusually humid stretch or a very hot afternoon can all move an exterior start date.',
      'We would rather move a date than install into conditions that compromise the floor. When we schedule exterior work we tell you what the weather constraints are, so a reschedule is an expected possibility rather than a surprise.',
    ],
  },
  {
    heading: 'What we look at during the estimate',
    paras: [
      'Where water goes after rain, whether the slab has settled or cracked, how much direct sun it takes and at what time of day, what the transition looks like at doors and pool coping, and what the slab has been sealed or painted with before.',
      'Existing sealers matter more outdoors than people expect. A previously sealed patio may need that material removed mechanically first, because a new coating will not bond through it. That is assessed before any number is quoted.',
    ],
  },
]

const faqs = [
  {
    q: 'Will a patio coating be slippery when wet?',
    a: 'Texture is added to the topcoat specifically to address that, and how aggressive it is is a decision we make with you. More texture means more grip and a slightly rougher surface underfoot; less means smoother and more slip when wet. On pool decks we lean toward grip.',
  },
  {
    q: 'Will it get too hot to walk on barefoot?',
    a: 'Any concrete in direct Houston sun gets hot. Color choice and texture both influence how hot the finished surface feels, and lighter tones help. It is worth raising during the estimate if the deck is used barefoot.',
  },
  {
    q: 'Can you coat over my existing patio sealer or paint?',
    a: 'Not reliably. A new coating needs to bond to the concrete, not to whatever is currently on it, so existing sealers and paints generally have to come off mechanically first. We assess that onsite because it materially affects the quote.',
  },
  {
    q: 'What if my patio has cracks?',
    a: 'They get repaired as their own step before coating. Exterior slabs move more than interior ones because of thermal cycling, so crack detail outdoors gets more attention rather than less.',
  },
  {
    q: 'Will rain delay my install?',
    a: 'It can. Exterior coatings cure in relation to ambient temperature and humidity with no roof overhead, so rain or an unusually humid stretch can move a start date. We will tell you the constraints when we schedule rather than install into bad conditions.',
  },
  {
    q: 'Does water pooling on my patio matter?',
    a: 'Yes, and it is one of the first things we look at. A coating does not correct a drainage problem, and standing water works away at any edge or detail over time. If your slab ponds, we want to understand why before specifying anything.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Patio & Pool Deck Concrete Coatings',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Exterior concrete coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Exterior concrete"
        intro="An outdoor slab is not a garage floor with weather on it. UV, standing water, barefoot traffic and thermal movement make it a different specification — and we assess it separately."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Book an exterior estimate
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('polyaspartic')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Why UV stability matters
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
          eyebrow="Outdoor conditions"
          title="Six factors that only apply outside"
          intro="These are the reasons an exterior slab gets its own assessment rather than the garage specification applied outdoors."
        />
        <CardGrid items={exteriorFactors} />
      </Section>

      <Section bleed>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="Surfaces" title="Exterior surfaces we coat" />
            <CheckList items={surfaces} className="mt-10" />
          </div>
          <div className="lg:pt-4">
            {/* A labelled ILLUSTRATION of the finish, not one of our installs. */}
            <MaterialSample
              src={sceneIllustrations.patioDeck.src}
              alt={sceneIllustrations.patioDeck.alt}
              kind={sceneIllustrations.patioDeck.kind}
              caption={sceneIllustrations.patioDeck.caption}
              sizes="(min-width: 1024px) 46vw, 100vw"
            />
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
              That is an illustration of a textured exterior finish rather than a photograph of one
              of ours — the low light across it is there to show the slip-resistant texture.
              Exterior project photography is being shot on completed installs for{' '}
              <Link href={r('projects')} className="text-primary underline underline-offset-4">
                the project archive
              </Link>
              , rather than licensed from a stock library.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="What to expect"
          title="How exterior work differs in practice"
          intro="Specification, scheduling and assessment all change once the slab is outdoors."
        />
        <div className="mt-14">
          <Prose sections={notes} />
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Patio and pool deck questions" />
        <FaqList items={faqs} />
      </Section>

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Related reading"
          links={[
            { label: routes.polyaspartic.label, href: r('polyaspartic'), blurb: 'UV stability, explained.' },
            { label: routes.repair.label, href: r('repair'), blurb: 'Crack repair on moving slabs.' },
            { label: routes.grinding.label, href: r('grinding'), blurb: 'Removing existing sealers.' },
            { label: routes.colors.label, href: r('colors'), blurb: 'Color and heat underfoot.' },
            { label: routes.garageCoatings.label, href: r('garageCoatings'), blurb: 'Interior garage systems.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'What moves an exterior quote.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
