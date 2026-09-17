import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CardGrid,
  FaqList,
  Heading,
  Prose,
  RelatedLinks,
  Section,
  Steps,
} from '@/components/blocks'
import { BuyersGuideLink } from '@/components/buyers-guide-link'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { MaterialSample } from '@/components/material-sample'
import { PageHero } from '@/components/page-hero'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { sceneIllustrations } from '@/lib/site'

import { AtAGlance, PageAnswer, PageTerms } from '@/components/aeo'

const KEY = 'repair' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: someone with visible slab damage deciding whether it needs fixing
  before a coating. Core argument: repair is a discrete step with its own
  materials and cure time, and coating over damage is the most common corner
  cut in this trade.
*/

const damageTypes = [
  {
    tag: 'Common',
    title: 'Hairline and shrinkage cracks',
    body: 'Fine cracks from the concrete curing and shrinking, usually stable and not structural. They still have to be opened up and filled — a coating bridged across an unfilled crack will telegraph the line and eventually split along it.',
  },
  {
    tag: 'Common',
    title: 'Spalling',
    body: 'Sections where the top layer of concrete has flaked or broken away, leaving shallow craters. Common near garage doors where water sits, and around any spot that has taken an impact. Filled and levelled with repair mortar, not with coating.',
  },
  {
    tag: 'Surface',
    title: 'Pitting and pop-outs',
    body: 'Small holes scattered across the surface, often from de-icing salt tracked in or aggregate breaking loose. Individually minor, but a pitted floor coated without filling reads as a rough, speckled surface once it is glossy.',
  },
  {
    tag: 'Not a defect',
    title: 'Control and expansion joints',
    body: 'The deliberate lines cut into your slab so it can move. These are not damage and they do not get filled solid — they get treated so the coating can accommodate movement instead of tearing.',
  },
  {
    tag: 'Rework',
    title: 'Previous patchwork',
    body: 'Older repairs done with the wrong material, or a coating applied straight over damage. These often have to come out and be redone, because a coating is only as sound as the substrate underneath it.',
  },
  {
    tag: 'Referral',
    title: 'Moving structural cracks',
    body: 'Cracks that are actively opening, offset in height, or running through the full slab depth. This is a concrete problem rather than a coating problem, and we will say so rather than sell you a floor over it.',
  },
]

const sequence = [
  {
    step: '01',
    text: 'Map the damage during inspection — every crack, spall and pitted area identified before we quote. Repair scope is a line item on your written estimate, not a surprise found on install day.',
  },
  {
    step: '02',
    text: 'Open cracks out — cracks get chased, deliberately widened into a clean channel. A filler needs real cross-section to grip; squeezing material into a hairline gap accomplishes nothing.',
  },
  {
    step: '03',
    text: 'Clean out every void under vacuum. Loose material, dust and debris come out first, because repair material bonded to dust is repair material that fails.',
  },
  {
    step: '04',
    text: 'Fill with the appropriate material — a flexible filler where the slab needs to move, a rigid high-strength mortar where it does not. One product for everything is a shortcut with a predictable end.',
  },
  {
    step: '05',
    text: 'Let repairs cure, then grind flush. Filler has to harden before it can be levelled, so repairs end up flush with the surrounding slab and nothing reads as a bump through the finished coating.',
  },
  {
    step: '06',
    text: 'Re-inspect before coating. Repaired areas get checked again after grinding, and anything needing a second pass gets one before coating goes down.',
  },
]

const body = [
  {
    heading: 'A coating has no structural strength of its own',
    paras: [
      'A floor coating is a few millimetres of material bonded to the top of your slab. It cannot bridge a void and it cannot hold concrete together. Whatever the slab is doing underneath, the coating will eventually do the same thing on the surface.',
      'That is why repair is not an add-on here. It is a scheduled step between grinding and the base coat, and on damaged slabs it is where a meaningful share of the labour goes.',
    ],
  },
  {
    heading: 'Why cracks get deliberately widened',
    paras: [
      'The instinct is to force material into a crack exactly as it is. In practice that leaves a paper-thin line of filler with almost no bonded surface area, which pops straight back out under the first thermal cycle or wheel load.',
      'Chasing the crack — cutting it into a wider, cleaner channel — gives the repair real cross-section and two solid faces to bond to. The repair ends up wider than the original crack and dramatically more durable, then gets ground flush so none of that width reads through the finish.',
    ],
  },
]

const faqs = [
  {
    q: 'Will the repairs be invisible once the floor is coated?',
    a: 'On a full-broadcast flake floor, properly executed repairs effectively disappear — the flake layer is opaque and visually busy, which hides sound repair work well. Under a metallic or solid color finish, repairs are much harder to conceal because those finishes have depth and reflectivity with nothing to break up the surface. We will tell you honestly which of your repairs may remain faintly visible under the finish you are considering.',
  },
  {
    q: 'Can you fill a crack and coat the same day?',
    a: 'Sometimes, depending on the material and the size of the repair. Some products cure fast enough to grind and coat within the same visit; larger structural repairs need longer. We will not shortcut a cure window to compress the schedule — a repair that has not hardened cannot be ground flush, and coating over it means it shows through.',
  },
  {
    q: 'What if my crack is structural?',
    a: 'Then a coating is not the answer and we will tell you that. Cracks that are actively moving, vertically offset, or running through the full depth of the slab point to something happening below — settlement or soil movement. Coating over that hides it briefly and then splits. In Houston’s soil, this is common enough to be worth ruling out properly.',
  },
  {
    q: 'Do you fill the control joints in my garage?',
    a: 'Not solid, no. Those lines were cut into the slab on purpose so that when the concrete expands and contracts it cracks along a controlled line instead of randomly. Filling them rigidly removes that relief and the slab finds somewhere else to crack. We treat joints so the coating can handle the movement.',
  },
  {
    q: 'Is repair included in the coating price?',
    a: 'It is quoted as its own line so you can see exactly what it costs. Repair scope varies enormously between slabs — one garage may need a single spall filled, another extensive work across the whole floor — so folding it into a flat price per square foot would mean either overcharging clean slabs or underquoting damaged ones.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Garage Floor Crack & Spall Repair',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Concrete crack, spall and pitting repair',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Preparation & remediation"
        intro="Cracks, spalls and pitting get repaired as their own step, with their own materials and their own cure time, before any coating goes down. Coating over damage is the most common corner cut in this trade and the easiest one to spot later."
      />

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
        <Prose sections={body} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Assessment"
          title="What we are looking for in your slab"
          intro="Not all damage is the same, and not all of it is a coating problem. Some of it is a concrete problem wearing a coating problem’s clothes."
        />
        <CardGrid items={damageTypes} cols={3} />
        <p className="mt-10 max-w-3xl border-l-2 border-primary pl-5 text-sm leading-relaxed text-muted-foreground text-pretty">
          If a quote for a damaged garage floor does not itemize repair separately, ask what happens
          to the cracks. Filling them properly takes materials, labour and cure time — none of which
          are free, and all of which have to appear somewhere in the price.
        </p>
      </Section>

      <Section>
        <Heading eyebrow="Sequence" title="How repair work runs" />
        <Steps steps={sequence} />
      </Section>

      <Section bleed>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Heading
              eyebrow="Judgement call"
              title="Some slabs should not be coated at all"
              intro="Most damage is straightforward to repair. A smaller share points at something below the slab that a coating cannot fix."
            />
            <div className="mt-8 max-w-xl space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p className="text-pretty">
                A crack that is offset in height, still opening, or running the full depth of the
                slab is telling you the ground underneath has moved. Filling it and coating over the
                top produces a floor that looks finished and then splits along the same line.
              </p>
              <p className="text-pretty">
                When we see that at the inspection, we tell you before quoting a floor. It is a
                shorter conversation than the one that happens a year after a coating goes down over
                a moving crack.
              </p>
            </div>
          </div>
          <div className="lg:pt-4">
            {/* A labelled ILLUSTRATION of the repair detail, not one of our jobs. */}
            <MaterialSample
              src={sceneIllustrations.crackRepair.src}
              alt={sceneIllustrations.crackRepair.alt}
              kind={sceneIllustrations.crackRepair.kind}
              caption={sceneIllustrations.crackRepair.caption}
              aspect="1/1"
              sizes="(min-width: 1024px) 46vw, 100vw"
            />
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
              That is an illustration of the detail described above — the crack cut open into a
              clean channel and filled proud, before it is ground flush — rather than a photograph
              of one of our jobs. Repair photography is being shot mid-job on real slabs for{' '}
              <Link href={r('projects')} className="text-primary underline underline-offset-4">
                the project archive
              </Link>
              , since the point of the image is the cross-section of the filled channel.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section>
        <Heading eyebrow="Questions" title="Crack and spall repair" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Not sure whether your crack is cosmetic or structural"
        body="Text a photo with something for scale next to it. We will tell you what it looks like and what we would need to check onsite — and if it is a foundation matter rather than a coating one, we will say so."
      />

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Continue reading"
          links={[
            { label: routes.grinding.label, href: r('grinding'), blurb: 'The preparation step repairs sit between.' },
            { label: routes.removal.label, href: r('removal'), blurb: 'When damage was coated over instead of fixed.' },
            { label: routes.garageCoatings.label, href: r('garageCoatings'), blurb: 'What goes down once the slab is sound.' },
            { label: routes.process.label, href: r('process'), blurb: 'Where repair falls in the nine-step sequence.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'Why repair is quoted as its own line.' },
            { label: routes.flake.label, href: r('flake'), blurb: 'The finish that hides repairs best.' },
          ]}
        />
      </Section>
    </>
  )
}
