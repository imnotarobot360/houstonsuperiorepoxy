import type { Metadata } from 'next'
import { FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { Process } from '@/components/process'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'

import { PageAnswer } from '@/components/aeo'

const KEY = 'process' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: someone vetting method rather than price. The nine steps come from
  lib/site.ts verbatim (including the "when appropriate" qualifiers) via the
  shared <Process> component, so this page and the homepage cannot drift.
*/

const body = [
  {
    heading: 'The sequence does not change',
    paras: [
      'Every floor we install runs through the same nine steps in the same order. What changes between jobs is how long each step takes — a slab with extensive spalling spends far longer in repair, and a previously coated floor adds a removal phase before preparation even begins.',
      'What does not change is the order, or whether a step happens at all. Preparation is not skipped because the concrete looks clean, and repairs are not coated over to save a cure window.',
    ],
  },
  {
    heading: 'Where jobs go wrong',
    paras: [
      'Almost every coating failure traces back to one of the first four steps rather than the coating itself. A floor that was not mechanically ground, a slab that was still releasing moisture, or damage that was filled with the wrong material will take down even an excellent topcoat.',
      'That is the reason this page exists in the detail it does. The parts of the job that determine whether your floor lasts are the parts you cannot see once it is finished.',
    ],
  },
]

const faqs = [
  {
    q: 'How long does a typical garage take?',
    a: 'Most residential garages are a multi-day job rather than a single visit, because cure windows between coats are real and cannot be compressed. Your written quote includes a realistic schedule for your specific floor, including when you can walk on it and when you can park on it — those are two different dates.',
  },
  {
    q: 'Why does grinding matter so much?',
    a: 'Mechanical grinding opens the concrete’s pore structure so the resin can key into it. Acid etching, by contrast, chemically roughens only the very top surface and leaves residue behind. A coating over an etched slab is relying on a much weaker bond, which is why peeling-in-sheets failures are so often traced back to preparation.',
  },
  {
    q: 'What does "when appropriate" mean in steps five and eight?',
    a: 'It means those steps depend on the system being installed and what the slab needs. Not every floor gets the same treatment at every stage, and we would rather qualify the description accurately than claim a step happens universally when it does not.',
  },
  {
    q: 'Do you contain the dust?',
    a: 'Yes. Grinding runs under HEPA vacuum extraction rather than open. It is not dust-free, but it is a controlled, contained operation rather than a cloud through your house.',
  },
  {
    q: 'Can I stay home while you work?',
    a: 'In most cases yes. Garage work is largely self-contained, and the dust-control equipment keeps the mess in the work area. We will tell you at the estimate whether any part of your specific job needs you out of the space.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Method"
        intro="Nine steps, in the same order, on every floor. The steps you cannot see once the job is finished are the ones that determine whether it lasts, which is why we publish them in full."
      />

      <Section>
        <PageAnswer routeKey={KEY} />
      </Section>

      <Section>
        <Prose sections={body} />
      </Section>

      <Process />

      <Section bleed>
        <Heading eyebrow="Questions" title="How the work runs" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Ask us to walk you through it on your own slab"
        body="The inspection is where the sequence gets applied to your specific concrete — what it needs, how long each step will take, and what that costs. It is free and comes back itemized in writing."
      />

      <Section>
        <RelatedLinks
          heading="The steps in detail"
          links={[
            { label: routes.grinding.label, href: r('grinding'), blurb: 'Step two, and the one that matters most.' },
            { label: routes.repair.label, href: r('repair'), blurb: 'Cracks and spalls, handled before coating.' },
            { label: routes.removal.label, href: r('removal'), blurb: 'When there is an old floor in the way first.' },
            { label: routes.polyaspartic.label, href: r('polyaspartic'), blurb: 'The topcoat chemistry, step eight.' },
            { label: routes.flake.label, href: r('flake'), blurb: 'How the broadcast and scrape steps work.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'What each step contributes to the cost.' },
          ]}
        />
      </Section>
    </>
  )
}
