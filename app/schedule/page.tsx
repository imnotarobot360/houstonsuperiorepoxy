import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { CheckList, FaqList, Heading, Prose, Section, Steps } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { Estimate } from '@/components/estimate'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { routes } from '@/lib/routes'
import { site } from '@/lib/site'

const meta = routes.schedule

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.path },
  openGraph: { title: meta.title, description: meta.description, url: meta.path },
}

/* What actually happens at the visit — sets expectations honestly. */
const visit = [
  {
    step: '01',
    text: 'We read the slab. Age, finish, existing coatings and how it was originally troweled all change what can go on top of it.',
  },
  {
    step: '02',
    text: 'We moisture test. Vapor drive from below is the most common reason a coating lets go in Houston, and testing takes minutes.',
  },
  {
    step: '03',
    text: 'We map the damage. Cracks, spalls and soft spots get measured, because repair is quoted separately from coating.',
  },
  {
    step: '04',
    text: 'We talk through finishes with real samples in hand, including the ones we would talk you out of for your space.',
  },
  {
    step: '05',
    text: 'You get an itemized number in writing — preparation, repair, primer, body coat, topcoat and labor listed separately.',
  },
  {
    step: '06',
    text: 'If the slab is a poor candidate, we tell you why rather than coat it and let the warranty absorb the problem.',
  },
]

const prepare = [
  'Roughly 30 to 45 minutes for a typical residential garage; longer for large commercial slabs.',
  'Access to the whole slab, including corners and the area behind anything stored against the walls.',
  'A standard outlet if possible, for moisture testing equipment.',
  'Every quote you have already received — we will explain what another contractor is proposing.',
]

const faqs = [
  {
    q: 'How far out are you booking?',
    a: 'It moves with the season and the weather. Tell us your timeline in the form and we will be straight with you about the earliest realistic start.',
  },
  {
    q: 'Do I need to move everything out of the garage first?',
    a: 'Not for the estimate — we can work around stored items to inspect the slab. For installation the space does need to be cleared, and we will tell you exactly what that means at the visit.',
  },
  {
    q: 'What if the slab turns out to be a bad candidate?',
    a: 'Then we tell you, and we tell you why. Coating a slab with an unaddressed moisture or structural problem wastes your money and our warranty, so we would rather quote the repair or decline the job.',
  },
]

const body = [
  {
    heading: 'Why the visit is not a sales call',
    paras: [
      'Nobody is going to sit at your kitchen table and run a discount that expires tonight. The visit exists because concrete cannot be diagnosed remotely, and because the finish you want may not be the finish your slab can hold.',
      'You will get a written number and a straight explanation of what drives it. What you do with that is entirely up to you.',
    ],
  },
]

export default function SchedulePage() {
  return (
    <>
      <JsonLd
        data={graph(webPageNode('schedule'), faqNode(meta.path, faqs))}
      />

      <PageHero
        routeKey="schedule"
        eyebrow="Book a visit"
        intro="Estimates are free, happen at your property, and nothing is due upfront. Send the form below or call and we will find a window that works."
      />

      <Section>
        <Heading
          eyebrow="The visit"
          title="What happens when we show up"
          intro="An honest quote for concrete cannot be produced over the phone, because the two things that decide the price are invisible until someone tests for them."
        />
        <Steps steps={visit} />
      </Section>

      <Section bleed>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="How to prepare" title="This is the whole list" />
            <CheckList items={prepare} className="mt-10" />
          </div>
          <Prose sections={body} />
        </div>
      </Section>

      <Estimate />

      {/*
        Secondary path to the external self-serve scheduler, absorbed from the
        old /book/ page when it was folded into this one.

        Placed AFTER the form on purpose. The form files the lead in our own
        database and emails it; a booking made in the external app exists only
        there. So the form stays the primary action and this is the fallback for
        people who would rather pick their own window than wait for a callback.

        Different origin, so a plain <a> with target="_blank". `noopener` is
        required alongside that — without it the destination can reach back
        through window.opener and navigate this tab. The arrow plus
        screen-reader text mean the new tab is announced, not a surprise.
      */}
      <Section>
        <div className="border border-border p-8 sm:p-10">
          <h2 className="font-sans text-xl font-medium text-foreground">
            Rather pick your own window?
          </h2>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Our live estimate calendar shows real open windows, so nothing offered is already
            taken. Booking a time is still just an inspection and a written number — free, with
            nothing due at the visit.
          </p>
          <a
            href={site.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 border border-border px-7 py-4 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary"
          >
            Open the booking calendar
            <ArrowUpRight size={16} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Scheduling" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Prefer to just talk it through?"
        body={`Call or text ${site.phone} and describe the space. We will tell you what we would need to see onsite.`}
      />
    </>
  )
}
