import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CardGrid,
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
import { MaterialSample } from '@/components/material-sample'
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'
import { finishSamples } from '@/lib/site'

import { AtAGlance, PageAnswer, PageTerms } from '@/components/aeo'

const KEY = 'polyaspartic' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: the technical researcher who wants to understand the chemistry
  before deciding, and who is likely comparing "epoxy" against "polyaspartic"
  as if they were competing products.

  Deliberately NOT on this page: outcome/lifestyle copy (that is
  /garage-floor-coatings-houston/) and contractor vetting (that is
  /epoxy-flooring-houston/). Qualitative behavior only — no performance
  figures we cannot substantiate.
*/

const compare = [
  {
    point: 'Role in the system',
    ours: 'Topcoat. It goes over a cured base and takes the abuse — traffic, UV, chemicals.',
    theirs: 'Base coat. It wets into the ground concrete profile and creates the bond to the slab.',
  },
  {
    point: 'UV stability',
    ours: 'Stable in sunlight, which is why it is the right call on anything exposed.',
    theirs: 'Ambers over time under UV — a clear epoxy left in the sun yellows.',
  },
  {
    point: 'Cure speed',
    ours: 'Fast. This is what compresses install timelines and lets a floor get its topcoat sooner.',
    theirs: 'Slower, which is a feature in the base coat — it gives the resin time to penetrate.',
  },
  {
    point: 'Working window',
    ours: 'Short. Less room for error, so it rewards a crew that has done it repeatedly.',
    theirs: 'Longer and more forgiving to place and flatten.',
  },
  {
    point: 'Temperature and humidity sensitivity',
    ours: 'Sensitive — cure behavior shifts with ambient conditions, which matters a great deal in Houston.',
    theirs: 'Also sensitive, particularly to a cold or damp slab, but over a longer window.',
  },
  {
    point: 'Film character',
    ours: 'Tougher, more flexible film, better at resisting abrasion and scratching.',
    theirs: 'Harder and more rigid; excellent adhesion, less forgiving of slab movement.',
  },
]

const houstonFactors = [
  {
    title: 'Heat during the install',
    body: 'Both chemistries cure faster as temperature rises, and polyaspartic already has a short working window. On a hot Houston slab that window gets shorter still, which is a scheduling and crew-experience issue rather than a product problem.',
    tag: 'Climate',
  },
  {
    title: 'Humidity and slab moisture',
    body: 'Concrete on grade in this region can carry meaningful moisture, and moisture moving up through a slab is a bonding problem for any coating. This is why slab condition gets assessed before a system is specified.',
    tag: 'Climate',
  },
  {
    title: 'Direct sun on exterior slabs',
    body: 'A patio or pool deck is under UV all day. A clear epoxy exposed like that will amber, so exterior work gets a UV-stable topcoat instead. This is the clearest case where the chemistry choice is not a preference.',
    tag: 'Exposure',
  },
  {
    title: 'Hot tires in a closed garage',
    body: 'A warm tire parked on a coating puts sustained heat and pressure on one spot. Resistance comes primarily from how well the base coat is mechanically bonded to a ground slab, and secondarily from the toughness of the topcoat film.',
    tag: 'Exposure',
  },
  {
    title: 'Slab movement',
    body: 'Regional soils move, and slabs move with them. A more flexible topcoat film handles minor movement better than a rigid one, though no coating substitutes for repairing cracks properly first.',
    tag: 'Substrate',
  },
  {
    title: 'Getting the space back sooner',
    body: 'Fast cure is the practical reason polyaspartic dominates as a topcoat. It shortens the gap between the last coat and the moment you can use the room again.',
    tag: 'Schedule',
  },
]

const explainer = [
  {
    heading: 'They are not competitors — they are layers',
    paras: [
      'The most common misunderstanding is treating "epoxy floor" and "polyaspartic floor" as two products you pick between. In practice a well-built floor is a system of layers, and the two chemistries are doing different jobs at different depths.',
      'Epoxy is generally the base. Its strength is adhesion: applied to a properly ground slab it wets into the open concrete profile and creates the mechanical bond the whole floor depends on. Polyaspartic is generally the topcoat. Its strengths are UV stability, abrasion resistance and speed.',
      'So when a quote says "polyaspartic floor," the useful question is not which chemistry it is, but what is in each layer and what is underneath all of it. A polyaspartic topcoat over an unprepared slab is still going to fail, because the failure happens at the concrete, not at the top.',
    ],
  },
  {
    heading: 'Where a single-layer approach makes sense',
    paras: [
      'Not every slab needs a decorative multi-layer build. A warehouse that needs dust control and a cleanable surface may be better served by a simpler pigmented system, and a straightforward seal is sometimes the correct specification rather than a compromise.',
      'What does not make sense is a decorative floor with a fast topcoat over preparation that was skipped to save time. That is the combination that produces a floor which looks excellent for one season.',
    ],
  },
  {
    heading: 'How we decide which system your slab gets',
    paras: [
      'The specification comes out of the onsite inspection, not from a catalogue. What the concrete is doing, whether it has been coated before, how the space is used and how much sun it sees all feed into which layers get specified.',
      'We name the products on the quote so you can look them up. Citadel SLE-100 and Polyaspartic F61 are what we typically build with, and if your slab calls for something different we tell you why.',
    ],
  },
]

const faqs = [
  {
    q: 'Is polyaspartic better than epoxy?',
    a: 'The question does not quite work, because they usually are not alternatives. Epoxy is normally the base coat providing adhesion to the slab, and polyaspartic is normally the topcoat providing UV stability and abrasion resistance. Most quality floors use both.',
  },
  {
    q: 'Why does polyaspartic cost more?',
    a: 'The material costs more per unit, and it is less forgiving to install because the working window is short. That combination means both higher material cost and a crew that has to move deliberately.',
  },
  {
    q: 'Can polyaspartic go directly on concrete?',
    a: 'There are single-layer applications, but for decorative floors the layered approach is standard because the base coat is what handles adhesion to the prepared slab. Which approach your floor gets is decided at the inspection.',
  },
  {
    q: 'Will my floor turn yellow?',
    a: 'A clear epoxy exposed to sustained UV will amber over time — that is a known behavior of the chemistry. It is exactly why exterior slabs and sun-exposed interiors get a UV-stable topcoat instead of a clear epoxy left on top.',
  },
  {
    q: 'Does Houston humidity affect the install?',
    a: 'Yes. Ambient temperature and humidity affect cure behavior, and moisture in the slab itself affects bonding. Both are assessed before we specify a system, and both can affect scheduling.',
  },
  {
    q: 'What products do you install?',
    a: 'We typically build with Citadel SLE-100 and Polyaspartic F61, and the products appear by name on your quote. We do not publish performance figures for them — look them up against the manufacturer data rather than taking a contractor’s numbers.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Polyaspartic Floor Coatings',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Polyaspartic floor coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Technical comparison"
        intro="Most pages treat epoxy and polyaspartic as two products to choose between. They are usually layers in the same floor doing different jobs. Here is how each one behaves, and what that means on a Houston slab."
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
            href={r('grinding')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Preparation standards
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
          eyebrow="The misconception"
          title="Layers, not rivals"
          intro="Understanding which layer does what makes every quote you read easier to interpret."
        />
        <div className="mt-14">
          <Prose sections={explainer} />
        </div>
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Side by side"
          title="How the two chemistries behave"
          intro="Qualitative behavior only. We do not publish performance figures we cannot substantiate — check those against manufacturer data."
        />
        <CompareTable rows={compare} oursLabel="Polyaspartic" theirsLabel="Epoxy" />
      </Section>

      {/*
        UV ambering is the one difference between these chemistries a homeowner
        can verify with their own eyes years later, which makes it worth showing
        rather than tabulating. Labeled material sample, not project
        photography — see the note above finishSamples in lib/site.ts.
      */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <MaterialSample
            src={finishSamples.uvAmbering.src}
            alt={finishSamples.uvAmbering.alt}
            kind={finishSamples.uvAmbering.kind}
            caption={finishSamples.uvAmbering.caption}
            sizes="(min-width: 1024px) 46vw, 100vw"
          />
          <div>
            <Heading eyebrow="What UV does" title="Ambering is the visible difference" />
            <p className="mt-8 text-sm leading-relaxed text-muted-foreground text-pretty">
              An aromatic epoxy topcoat yellows and chalks under sustained UV. It is a
              property of the resin, not a defect in the installation, and no maintenance
              schedule reverses it. A UV-stable polyaspartic topcoat holds its clarity, so
              the flake blend you chose still reads as the colour you chose.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground text-pretty">
              This is why the topcoat matters more than the pigment on anything with sun on
              it — a patio, a pool deck, or a garage that sits open through a Houston
              afternoon. On a fully enclosed slab with no daylight, the distinction is much
              less important, and we will tell you so rather than sell up.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="Local conditions"
          title="Six things that matter specifically here"
          intro="Coating behavior is not climate-neutral. These are the Houston-specific factors that feed into which system a slab gets."
        />
        <CardGrid items={houstonFactors} />
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Technical questions" />
        <FaqList items={faqs} />
      </Section>

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Related reading"
          links={[
            { label: routes.grinding.label, href: r('grinding'), blurb: 'The preparation all of this depends on.' },
            { label: routes.flake.label, href: r('flake'), blurb: 'How the layers stack in a flake floor.' },
            { label: routes.removal.label, href: r('removal'), blurb: 'When an existing coating has failed.' },
            { label: routes.patio.label, href: r('patio'), blurb: 'Where UV stability is non-negotiable.' },
            { label: routes.epoxyFlooring.label, href: r('epoxyFlooring'), blurb: 'How to read a quote.' },
            { label: routes.resources.label, href: r('resources'), blurb: 'Longer technical guides.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
