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

const KEY = 'removal' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: someone whose existing floor has failed — often one they already paid
  for. The job is diagnostic honesty: help them identify what failed and why,
  and be explicit that removal cost cannot be quoted sight-unseen.
*/

const failureModes = [
  {
    tag: 'Adhesion',
    title: 'Peeling in sheets',
    body: 'The coating lifts away in large flexible pieces, often with clean grey concrete underneath. The coating never bonded, which almost always traces back to preparation — acid etching or a quick scuff instead of mechanical grinding.',
  },
  {
    tag: 'Moisture',
    title: 'Bubbling and blistering',
    body: 'Small domes across the surface, sometimes holding moisture. Vapor drove up out of the slab faster than the coating could handle, or it went down over concrete still releasing water. Common on Houston slabs with no vapor barrier beneath them.',
  },
  {
    tag: 'Product',
    title: 'Hot tire pickup',
    body: 'Coating lifts in patches exactly where tires park. Hot rubber softens an under-cured or low-grade film and pulls it off the slab. Largely a thin single-part product problem, not something we see on a cured polyaspartic topcoat.',
  },
  {
    tag: 'UV',
    title: 'Yellowing and chalking',
    body: 'The floor has gone amber, or leaves powder on your hand. Aromatic epoxy is not UV-stable, so sun exposure drives discoloration. The film may still be bonded — sometimes this is a topcoat problem, not a full-removal problem.',
  },
  {
    tag: 'Substrate',
    title: 'Cracking that follows the slab',
    body: 'The coating has split along a line running through the concrete. The slab moved and the coating went with it. Repairing the coating without addressing the crack means it comes straight back.',
  },
  {
    tag: 'Recoat',
    title: 'Delamination between coats',
    body: 'The topcoat separates from the base coat while the base stays stuck to the slab. Recoat windows were missed, or the surface was contaminated between passes. Sometimes only the top layer needs to come off.',
  },
]

const sequence = [
  {
    step: '01',
    text: 'Diagnose before removing anything — how the failure presents, adhesion tested in several spots, moisture checked. What failed and why determines the method, and occasionally says the floor can stay.',
  },
  {
    step: '02',
    text: 'Determine the method — well-bonded coatings need aggressive grinding or shot blasting; loose coatings may scrape first. Thick industrial buildups can take multiple passes.',
  },
  {
    step: '03',
    text: 'Mechanical removal under HEPA vacuum extraction — the same dust-controlled equipment as standard prep, running longer and more aggressively.',
  },
  {
    step: '04',
    text: 'Expose and assess the bare slab. This is the part nobody can quote in advance: previous repairs, spalling that was coated over, or moisture problems all surface here.',
  },
  {
    step: '05',
    text: 'Repair the concrete — cracks, spalls and pitting as their own step. Frequently more work on a removal job, because problems were buried rather than fixed.',
  },
  {
    step: '06',
    text: 'Profile and re-inspect — once clean and repaired, the slab is ground to the profile the new system needs, then inspected again before product goes down.',
  },
  {
    step: '07',
    text: 'Install the new system — base coat, broadcast where appropriate, scrape, and topcoat, exactly as on any other floor.',
  },
]

const body = [
  {
    heading: 'Coating failure is not random',
    paras: [
      'Each way a floor comes apart points to a specific cause, and the cause matters more than the symptom. It tells us whether the whole system has to come off, whether only the topcoat is compromised, and whether the slab underneath has a problem that will take out the next floor too.',
      'This is also the job type where we are most likely to talk someone out of work. Removal is the largest single variable in a coating quote. If your existing floor is sound and the issue is cosmetic, saying so costs us a line item and saves you a great deal of money.',
    ],
  },
  {
    heading: 'Why we will not quote removal from photographs',
    paras: [
      'The cost is driven by how tenaciously the old coating is stuck and what condition the slab is in beneath it. Neither is visible in a photo. A floor that looks catastrophic can lift off quickly; a floor with one peeling corner can be bonded like stone everywhere else.',
      'We can tell you from photos what we would need to check. The adhesion testing that actually determines the number happens at the onsite inspection.',
    ],
  },
]

const faqs = [
  {
    q: 'Can you just coat over my failed epoxy floor?',
    a: 'Not if the existing coating has lost adhesion. Anything applied on top of a floor that is already letting go will fail on the same schedule, because the weak link is underneath. If the old coating is genuinely well bonded and the problem is limited to the topcoat, a recoat can sometimes work — but that determination requires adhesion testing onsite, not a photograph.',
  },
  {
    q: 'Is removal always necessary?',
    a: 'No, and we will tell you when it is not. Sometimes the base coat is sound and only the topcoat has failed. Sometimes what you are seeing is UV yellowing on a film that is still fully bonded. Removal is expensive and we would rather not sell it when the concrete does not need it.',
  },
  {
    q: 'How much more does a removal job cost than a bare slab?',
    a: 'Meaningfully more, because you are paying for the removal labor and then for everything a bare slab would have needed anyway. It is also the line item with the widest range, since it depends on adhesion and on what the slab looks like once exposed. Your written quote itemizes removal separately so you can see exactly what that portion costs.',
  },
  {
    q: 'What if you find problems after the old coating comes off?',
    a: 'We tell you before we proceed. If removal exposes something that changes the scope — an unexpected moisture problem, or spalling that was coated over rather than repaired — we stop, show you, and give you the revised number. You will not find out about it on the invoice.',
  },
  {
    q: 'How long does a removal job add to the schedule?',
    a: 'It depends entirely on how the old coating behaves and what the exposed slab needs. Removal is its own phase before preparation even begins, and repairs on a previously coated slab often take longer than on bare concrete. We give you a realistic schedule with the written quote rather than an optimistic one.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Epoxy Coating Removal & Resurfacing',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Epoxy coating removal and concrete resurfacing',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Preparation & remediation"
        intro="If your floor is peeling, bubbling or lifting under your tires, something went wrong underneath it. Removal starts with working out what failed and why — because that determines the method, the cost, and occasionally whether removal is needed at all."
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
          eyebrow="Diagnosis"
          title="What the failure is telling us"
          intro="Identify what your floor is doing and you are most of the way to knowing why. Bring photos of the worst areas to your estimate."
        />
        <CardGrid items={failureModes} cols={3} />
        <p className="mt-10 max-w-3xl border-l-2 border-primary pl-5 text-sm leading-relaxed text-muted-foreground text-pretty">
          A floor showing more than one of these usually has a preparation problem at the root. Hot
          tire pickup plus peeling in sheets is not two failures — it is one under-bonded coating
          failing in the two places it gets stressed hardest.
        </p>
      </Section>

      <Section>
        <Heading eyebrow="Sequence" title="How a removal job runs" />
        <Steps steps={sequence} />
      </Section>

      <Section bleed>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Heading
              eyebrow="The honest part"
              title="The slab under a failed floor is an unknown until it is exposed"
              intro="On a bare slab we can see almost everything during the estimate. On a removal job, the old coating is hiding the concrete."
            />
            <div className="mt-8 max-w-xl space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p className="text-pretty">
                We test adhesion, check moisture and read the failure pattern, and that gets us a
                well-founded number. But the full picture only arrives once the coating is off.
              </p>
              <p className="text-pretty">
                We handle that by itemizing removal separately in your written quote and by telling
                you immediately if what we expose changes the scope. What we will not do is give you
                a confident flat number over the phone and then revise it upward mid-job.
              </p>
            </div>
          </div>
          <div className="lg:pt-4">
            {/* A labelled ILLUSTRATION of the process, not one of our jobs. */}
            <MaterialSample
              src={sceneIllustrations.coatingRemoval.src}
              alt={sceneIllustrations.coatingRemoval.alt}
              kind={sceneIllustrations.coatingRemoval.kind}
              caption={sceneIllustrations.coatingRemoval.caption}
              aspect="1/1"
              sizes="(min-width: 1024px) 46vw, 100vw"
            />
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
              That is an illustration of what removal looks like partway through — failed coating
              lifting on one side, stripped slab on the other — rather than a photograph of one of
              our jobs. Removal photography is being shot on live jobs for{' '}
              <Link href={r('projects')} className="text-primary underline underline-offset-4">
                the project archive
              </Link>
              , so it will show real slabs at the point the old coating comes up.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section>
        <Heading eyebrow="Questions" title="Removal and resurfacing" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Send us photos of what your floor is doing"
        body="Text pictures of the worst areas and we will tell you which failure mode it looks like and what we would need to test onsite. Adhesion testing happens at the free estimate."
      />

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Continue reading"
          links={[
            { label: routes.grinding.label, href: r('grinding'), blurb: 'How a slab gets profiled once the old coating is gone.' },
            { label: routes.repair.label, href: r('repair'), blurb: 'Damage that was coated over instead of repaired.' },
            { label: routes.polyaspartic.label, href: r('polyaspartic'), blurb: 'Why the replacement topcoat matters.' },
            { label: routes.epoxyFlooring.label, href: r('epoxyFlooring'), blurb: 'Reading a quote so this does not happen twice.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'Where removal sits in the cost breakdown.' },
            { label: routes.garageCoatings.label, href: r('garageCoatings'), blurb: 'Choosing the replacement system.' },
          ]}
        />
      </Section>
    </>
  )
}
