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
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'

import { AtAGlance, PageAnswer, PageTerms } from '@/components/aeo'

const KEY = 'epoxyFlooring' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: the comparison shopper holding two or three quotes who cannot tell
  why they differ by thousands of dollars.

  Deliberately NOT on this page: what a finished garage is like to live with
  (that is /garage-floor-coatings-houston/) and resin chemistry
  (that is /polyaspartic-floor-coatings-houston/). This page is about how to
  read a quote and vet the company behind it.
*/

const quoteRows = [
  {
    point: 'Surface preparation',
    ours: 'Mechanical diamond grinding, which opens the concrete profile so the resin keys into the slab.',
    theirs: 'Acid etching or a pressure wash. Cheaper and faster, and the most common reason a coating peels.',
  },
  {
    point: 'Crack and spall repair',
    ours: 'Itemized as its own line, repaired before any coating goes down.',
    theirs: 'Not mentioned, which usually means the coating goes straight over the damage.',
  },
  {
    point: 'Flake coverage',
    ours: 'Broadcast to refusal, then scraped and vacuumed so the surface is even.',
    theirs: '"Partial" or "light" broadcast — noticeably less material, and the base coat shows through.',
  },
  {
    point: 'Topcoat',
    ours: 'A named topcoat product appropriate to the system and the exposure.',
    theirs: '"Clear coat" with no product named, so there is no way to check what it is.',
  },
  {
    point: 'Insurance',
    ours: '$2M general liability plus workers’ compensation, certificate available on request.',
    theirs: '"Insured" as a claim on a website, with no certificate offered.',
  },
  {
    point: 'Warranty',
    ours: 'A written 5-year workmanship warranty you receive as a document.',
    theirs: 'A verbal "lifetime" claim, or a manufacturer material warranty presented as if it covered labor.',
  },
  {
    point: 'How the price was reached',
    ours: 'After an onsite inspection of your actual slab.',
    theirs: 'Over the phone or from a square-footage number, then revised upward once work starts.',
  },
  {
    point: 'Payment',
    ours: 'No payment due upfront.',
    theirs: 'A significant deposit before any work happens.',
  },
]

const redFlags = [
  {
    title: 'A price before anyone saw the slab',
    body: 'Concrete condition is the single largest variable in the job. A number quoted sight-unseen is a placeholder, and it moves once the grinder hits a soft or previously coated surface.',
    tag: 'Estimating',
  },
  {
    title: 'Acid etching described as preparation',
    body: 'Etching is a chemical rinse, not mechanical profiling. It cannot produce the surface profile a coating needs to bond to, and it is the most common root cause of a floor that peels within a couple of years.',
    tag: 'Preparation',
  },
  {
    title: '"Lifetime warranty" with nothing in writing',
    body: 'Ask which document it lives in and what it excludes. A warranty that cannot be produced as paper is a sales line, not a commitment.',
    tag: 'Warranty',
  },
  {
    title: 'A one-day install on a damaged slab',
    body: 'Speed is not automatically a problem, but a slab with cracks or spalls needs those repaired as a distinct step. If the schedule has no room for repair, repair is not happening.',
    tag: 'Scheduling',
  },
  {
    title: 'A large deposit up front',
    body: 'We do not take payment before the work. A company that needs your money to start the job is telling you something about how it is funded.',
    tag: 'Payment',
  },
  {
    title: 'No named products anywhere',
    body: 'A quote that says "epoxy" and "clear coat" with no manufacturer or product identified cannot be compared against anything, which is usually the point.',
    tag: 'Materials',
  },
]

const askThem = [
  'Will you mechanically grind the slab, and with what equipment?',
  'Can you send me your certificate of insurance?',
  'Is your warranty on workmanship, materials, or both — and can I read it before I sign?',
  'What specific products are you installing, by name?',
  'How are cracks and spalls priced, and is that in this quote?',
  'What happens to the price if the slab turns out to be in worse shape than expected?',
  'Do you require a deposit?',
  'Who is actually on site — your crew, or a subcontractor?',
]

const why = [
  {
    heading: 'Why two quotes on the same garage differ by thousands',
    paras: [
      'Almost always, the gap is preparation. Grinding a slab properly takes hours of labor and specialized equipment, and it produces a surface profile that the resin can mechanically key into. Etching a slab takes a fraction of the time and costs a fraction as much. Both can be described in a quote as "surface preparation."',
      'The second-largest gap is material volume. A flake floor broadcast to refusal consumes considerably more flake than one broadcast lightly, and the difference is visible for the life of the floor. A quote can say "flake system" either way.',
      'The third is what has been left out. Crack repair, stem walls, moisture testing and removal of an existing coating are all real costs. Omitting them makes a quote look competitive until the work starts.',
    ],
  },
  {
    heading: 'What we can and cannot tell you about our own work',
    paras: [
      'We can tell you exactly how we prepare a slab, what our warranty covers, what our insurance is, and that we do not ask for money before the job. Those are verifiable, and we put them in writing.',
      'We are not going to give you performance numbers we cannot substantiate, or a price for your floor before we have looked at it. If a competitor will do both of those things instantly, that is worth weighing rather than reassuring.',
    ],
  },
]

const faqs = [
  {
    q: 'Why will you not quote over the phone?',
    a: 'Because the price depends on what the concrete is doing, and we cannot see that over the phone. Slab condition, existing coatings, cracks and moisture all move the number. Quoting blind means either padding the price or revising it upward later, and we would rather look at the floor.',
  },
  {
    q: 'Is epoxy or polyaspartic better?',
    a: 'Neither is universally better — they are different chemistries with different strengths, and most quality floors use both in layers. We cover the actual differences on our polyaspartic page.',
  },
  {
    q: 'What does "$2M insured" actually mean?',
    a: 'It means we carry $2 million in general liability coverage plus workers’ compensation for our crew. If someone is hurt or something is damaged on your property, that is covered rather than becoming your problem. Ask any contractor for the certificate — a real one will send it.',
  },
  {
    q: 'Should I be suspicious of a cheap quote?',
    a: 'Not automatically, but you should be able to explain why it is cheap. Compare the preparation method, the flake coverage, the named products and what is itemized. If the cheap quote matches on all four, it is a genuinely better price. Usually it does not match on preparation.',
  },
  {
    q: 'Do you subcontract the work?',
    a: 'The floor is installed by our own crew. It is a fair question to ask anyone you are considering, because it determines who is accountable if something goes wrong and whether the insurance you were shown applies to the people actually on your property.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Epoxy Flooring Installation',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Epoxy floor coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Choosing an installer"
        intro="If you are holding two or three quotes and cannot work out why they differ by thousands of dollars, this page is for you. Here is where the money actually goes, and what to ask before you sign anything."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get an itemized estimate
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('pricing')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            What drives the price
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
          eyebrow="Reading a quote"
          title="The eight lines where quotes actually differ"
          intro="Two quotes can use identical language and describe completely different work. These are the points to compare, and what a weaker answer tends to look like."
        />
        <CompareTable rows={quoteRows} oursLabel="What to look for" theirsLabel="What a weak quote says" />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Warning signs"
          title="Six things that should slow you down"
          intro="None of these prove a company does bad work. All of them are worth a direct question before you commit."
        />
        <CardGrid items={redFlags} />
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="Your list" title="Eight questions to ask every installer" />
            <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground text-pretty">
              Ask us the same ones. If an answer is vague from anybody, including us, treat that as
              the answer.
            </p>
            <CheckList items={askThem} className="mt-10" />
          </div>
          <div className="lg:pt-4">
            <Prose sections={why} />
          </div>
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Questions about hiring a contractor" />
        <FaqList items={faqs} />
      </Section>

      <Section>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Go deeper"
          links={[
            { label: routes.pricing.label, href: r('pricing'), blurb: 'The ten factors behind the number.' },
            { label: routes.process.label, href: r('process'), blurb: 'Our nine-step install sequence.' },
            { label: routes.grinding.label, href: r('grinding'), blurb: 'Why mechanical prep matters.' },
            { label: routes.warranty.label, href: r('warranty'), blurb: 'What our warranty covers.' },
            { label: routes.polyaspartic.label, href: r('polyaspartic'), blurb: 'Epoxy vs polyaspartic, technically.' },
            { label: routes.reviews.label, href: r('reviews'), blurb: 'Read our Google reviews.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
