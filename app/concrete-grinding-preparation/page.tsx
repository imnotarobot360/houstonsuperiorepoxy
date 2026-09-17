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
import { MaterialSample } from '@/components/material-sample'
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'
import { finishSamples } from '@/lib/site'

import {
  AtAGlance,
  PageAnswer,
  PageTerms,
  SourcesAndTechnicalReferences,
} from '@/components/aeo'

const KEY = 'grinding' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: the reader who has worked out that preparation is the variable that
  matters and wants to understand it. This is the technical keystone page that
  most other pages link back to.
*/

const prepVs = [
  {
    point: 'What it does',
    ours: 'Mechanically removes the weak top layer and opens the concrete pore structure, creating a profile.',
    theirs: 'Chemically reacts with the surface and rinses it. No mechanical profile is created.',
  },
  {
    point: 'Contaminants',
    ours: 'Removes existing sealers, adhesives, thin coatings and surface laitance along with the material.',
    theirs: 'Cannot remove a sealer or coating — the acid does not get through it to the concrete.',
  },
  {
    point: 'Surface left behind',
    ours: 'Clean, dry, open concrete ready to accept resin.',
    theirs: 'A rinsed surface that must be neutralized and fully dried, often with residue left in the pores.',
  },
  {
    point: 'Consistency',
    ours: 'Controlled and repeatable across the whole slab.',
    theirs: 'Varies with concrete hardness, acid strength, dwell time and how thoroughly it was rinsed.',
  },
  {
    point: 'Dust and waste',
    ours: 'Dust captured at the tool by vacuum. Waste is a contained solid.',
    theirs: 'No dust, but acidic rinse water has to go somewhere.',
  },
  {
    point: 'Cost and time',
    ours: 'Hours of skilled labor and specialized equipment. The most expensive line in the quote.',
    theirs: 'A fraction of the time and cost. This is why it still gets used.',
  },
]

const whatWeRemove = [
  {
    title: 'Laitance',
    body: 'The weak, fine layer at the very top of a poured slab, formed as water and fines rise during curing. It is not structurally sound, and a coating bonded to it is bonded to something that was always going to let go.',
    tag: 'Surface',
  },
  {
    title: 'Existing sealers',
    body: 'Most slabs have been sealed at some point, frequently without the owner knowing. A new coating cannot bond through a sealer, and no chemical prep will remove one.',
    tag: 'Contaminant',
  },
  {
    title: 'Old coatings and paint',
    body: 'Garage floor paint, previous epoxy and old sealers all have to come off mechanically. Where a full failed coating is involved, that becomes its own scope.',
    tag: 'Contaminant',
  },
  {
    title: 'Adhesive residue',
    body: 'Tile mastic, carpet adhesive and glue from previous flooring. Common on interior slabs and invisible until the grinder exposes it.',
    tag: 'Contaminant',
  },
  {
    title: 'Oil and grease penetration',
    body: 'Where oil has soaked into the concrete, grinding removes the affected material. Deep saturation may need additional treatment, which is assessed rather than assumed.',
    tag: 'Contaminant',
  },
  {
    title: 'High spots and trowel marks',
    body: 'Grinding also flattens. Trowel ridges, high spots and minor unevenness get taken down, which matters most under a smooth finish like metallic or solid color.',
    tag: 'Surface',
  },
]

const equipment = [
  'Walk-behind and hand-held diamond grinders sized to the area',
  'Vacuum extraction connected at the tool, not a shop vac afterwards',
  'HEPA-rated dust collection on the extraction',
  'Edge and corner tooling so the perimeter matches the field',
  'Containment of adjacent finished areas on interior and commercial work',
  'Moisture assessment before a system is specified',
  'Profile checked across the slab, not just where it was easy',
]

const detail = [
  {
    heading: 'Bond is mechanical, not chemical',
    paras: [
      'A coating does not glue itself to concrete. It works because the liquid resin flows into an open, roughened pore structure and cures inside it, locking into the surface like a key in a lock. The technical term is surface profile, and creating one is the entire point of grinding.',
      'This is why preparation is not a step that can be substituted with a cheaper equivalent. Without a profile there is nothing for the resin to key into, so the coating is effectively sitting on top of the slab held there by surface tension. It will look identical on day one. It comes off in sheets when a warm tire or a shifting slab gives it a reason to.',
    ],
  },
  {
    heading: 'Why acid etching persists',
    paras: [
      'Etching is fast, cheap, requires no specialized equipment and produces no dust. Those are real advantages for a contractor working to a price, and it is genuinely better than doing nothing at all.',
      'What it cannot do is create a mechanical profile, remove an existing sealer, or produce a consistent result across a slab. It also leaves behind a surface that has to be neutralized and completely dried before coating, and residual moisture is its own bonding problem. When a floor peels within a year or two, inadequate preparation is the usual root cause.',
      'If a quote you are comparing describes "surface preparation" without saying mechanically ground, ask which method. It is the single most useful question you can ask.',
    ],
  },
  {
    heading: 'Dust control is not optional',
    paras: [
      'Grinding concrete generates a very large volume of extremely fine dust that carries a genuine respiratory hazard. It also travels — through a house, into HVAC returns, and across a commercial tenancy.',
      'Extraction is connected at the tool so dust is captured as it is produced rather than swept up afterwards, with HEPA-rated collection on the vacuum. On interior and commercial work, adjacent areas get contained as well. This is a cost and it is not negotiable.',
    ],
  },
  {
    heading: 'What grinding reveals',
    paras: [
      'Grinding is also diagnostic. It is the point at which a slab stops being an unknown: soft or friable concrete, adhesive residue, previously repaired areas, oil penetration and the true extent of cracking all become visible once the top layer is off.',
      'This is a genuine reason we do not quote a firm price over the phone. We assess as much as possible at the inspection, and if grinding exposes something materially different we tell you before continuing rather than absorbing it silently or presenting a revised invoice at the end.',
    ],
  },
]

const faqs = [
  {
    q: 'Why can you not just acid etch my floor?',
    a: 'Etching is a chemical rinse, not mechanical profiling. It cannot create the surface profile the resin needs to key into, and it cannot remove an existing sealer or coating. It is the most common root cause of a floor that peels within a couple of years, which is why we grind every slab.',
  },
  {
    q: 'How much dust does grinding create?',
    a: 'A lot — which is why extraction is connected directly to the tool with HEPA-rated collection, rather than sweeping up afterwards. On interior and commercial work we also contain adjacent areas. You should not end up with concrete dust through your house.',
  },
  {
    q: 'Do you have to grind if my slab is brand new?',
    a: 'Yes. New concrete has laitance at the surface — a weak layer of fines that rose during curing. It is not sound material, and a coating bonded to it is bonded to something that will eventually let go. New slabs also need to have cured sufficiently before coating.',
  },
  {
    q: 'What if you find something unexpected under the surface?',
    a: 'We tell you before continuing. Grinding exposes soft concrete, adhesive residue, oil penetration and the real extent of cracking. If it materially changes the scope you hear about it at that point, not on the final invoice.',
  },
  {
    q: 'Is grinding the same as concrete polishing?',
    a: 'They use related equipment but have different goals. Grinding here is preparation — creating a profile for a coating to bond to. Polishing is a finish in its own right, progressively refining the concrete surface to a sheen with no coating applied over it.',
  },
  {
    q: 'Can I grind my own slab before you arrive?',
    a: 'We would rather you did not. Profile depth and consistency matter, and correcting an over- or under-ground slab is more work than doing it once properly. It is also the step our warranty depends on, so it needs to be ours.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Concrete Grinding & Surface Preparation',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Diamond concrete grinding and surface preparation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Preparation"
        intro="Every floor we install is built on this step, and it is where quotes differ most. A coating bonds mechanically into an open concrete profile — if that profile was never created, nothing above it matters."
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
            href={r('epoxyFlooring')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            How to read a quote
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
          eyebrow="The fundamental"
          title="Why bond is mechanical"
          intro="Understanding this one idea makes every coating quote you read easier to evaluate."
        />
        {/*
          The ground-slab sample sits with this explanation deliberately: "the
          coating needs somewhere to key into" is abstract until you see the
          open pore structure it keys into. Labeled substrate sample of bare
          concrete, not project photography — see the note above finishSamples
          in lib/site.ts.
        */}
        <div className="mt-14 grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <Prose sections={[detail[0]]} />
          <div className="lg:pt-1">
            <MaterialSample
              src={finishSamples.groundConcrete.src}
              alt={finishSamples.groundConcrete.alt}
              kind={finishSamples.groundConcrete.kind}
              caption={finishSamples.groundConcrete.caption}
              sizes="(min-width: 1024px) 46vw, 100vw"
            />
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground text-pretty">
              This is what a slab should look like before any resin touches it: matte,
              open, and slightly dusty, with the pinholes and grinder swirl left in place.
              A slab that still looks sealed or shiny after preparation has not been
              opened, and no product bonds to a closed surface.
            </p>
          </div>
        </div>
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Side by side"
          title="Diamond grinding versus acid etching"
          intro="Both get written on a quote as surface preparation. They are not comparable processes."
        />
        <CompareTable rows={prepVs} oursLabel="Diamond grinding" theirsLabel="Acid etching" />
      </Section>

      <Section>
        <Heading
          eyebrow="What comes off"
          title="Six things grinding removes"
          intro="Some of these are visible before we start. Several only appear once the top layer is gone."
        />
        <CardGrid items={whatWeRemove} />
      </Section>

      <Section bleed>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="Equipment & method" title="How we prepare a slab" />
            <CheckList items={equipment} className="mt-10" />
          </div>
          <div className="lg:pt-4">
            <Prose sections={[detail[2]]} />
          </div>
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="Context"
          title="Why etching persists, and what grinding reveals"
          intro="Two things worth knowing: why the cheaper method is still common, and why grinding is also a diagnostic step."
        />
        <div className="mt-14">
          <Prose sections={[detail[1], detail[3]]} />
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      {/*
        Technical references, matching /resources/what-causes-hot-tire-pickup/
        and the eight other guides that carry this block.

        This page needed it more than any of them. Its glossary terms put ICRI
        (the CSP scale), ASTM F1869, ASTM F2170 and "the technical data sheet"
        on the rendered page, so it was already citing primary standards in its
        body while being the one technical keystone page with nowhere those
        citations resolved to. An unresolved standards reference is weaker than
        no reference: a reader cannot verify it and an answer engine cannot
        attribute it.

        Placed after PageTerms and before the FAQ, which is the same position it
        holds on the resource articles — the standards support the definitions
        immediately above them, and the FAQ stays adjacent to the CTA.

        The component renders published standards only, unlinked, plus the
        caveat naming what we deliberately do not quote. Manufacturer data
        sheets are referenced as a category rather than cited individually,
        because the owner has supplied none and citing a data sheet we have not
        read would be worse than citing nothing.
      */}
      <Section bleed>
        <SourcesAndTechnicalReferences heading="Technical references" />
      </Section>

      <Section>
        <Heading eyebrow="Questions" title="Preparation questions" />
        <FaqList items={faqs} />
      </Section>

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Related reading"
          links={[
            { label: routes.removal.label, href: r('removal'), blurb: 'When a coating has already failed.' },
            { label: routes.repair.label, href: r('repair'), blurb: 'Cracks and spalls, handled first.' },
            { label: routes.process.label, href: r('process'), blurb: 'Where prep sits in the sequence.' },
            { label: routes.polyaspartic.label, href: r('polyaspartic'), blurb: 'What goes on top of it.' },
            { label: routes.epoxyFlooring.label, href: r('epoxyFlooring'), blurb: 'Comparing quotes.' },
            { label: routes.resources.label, href: r('resources'), blurb: 'Longer technical guides.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
