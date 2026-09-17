import type { Metadata } from 'next'
import Link from 'next/link'
import { CardGrid, FaqList, Heading, Prose, RelatedLinks, Section, SocialProfiles } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { MaterialSample } from '@/components/material-sample'
import { PageHero } from '@/components/page-hero'
import { cities } from '@/lib/content/cities'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { finishSamples, site } from '@/lib/site'

const KEY = 'about' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  SERVICE-AREA BUSINESS: no street address anywhere on this page. Only facts
  from lib/site.ts — insurance, warranty, parent company. No invented founding
  dates, employee counts, or staff bios.

  No rating or review count either: those belong to the parent company, so
  citing them as this division's credentials would be false attribution.
*/

const commitments = [
  {
    tag: 'Insurance',
    title: '$2M general liability',
    body: 'Plus workers’ compensation coverage. We can provide a certificate of insurance on request before any work starts, and you should ask any contractor for one — an uninsured crew working on your property is your exposure, not theirs.',
  },
  {
    tag: 'Warranty',
    title: '5-year written workmanship warranty',
    body: 'Provided in writing with every floor. A workmanship warranty covers our installation, which is a different thing from a product warranty covering the manufacturer’s material — worth understanding before you compare guarantees.',
  },
  {
    tag: 'Estimates',
    title: 'Free, onsite, itemized',
    body: 'We look at your concrete before quoting it, because the slab determines the scope. The quote comes back itemized so preparation, repair and coating are separate lines, and no payment is due upfront.',
  },
  {
    tag: 'Preparation',
    title: 'Mechanical grinding, always',
    body: 'Every floor is diamond-ground under dust-controlled extraction. We do not acid-etch as a substitute, which is the shortcut behind most of the failed floors we are called out to remove.',
  },
  {
    tag: 'Honesty',
    title: 'We will tell you not to coat',
    body: 'If your slab has a moisture problem, a moving structural crack, or an existing coating that is genuinely sound, we say so. Selling a floor onto concrete that cannot hold it produces a callback and a bad review, which serves nobody.',
  },
  {
    tag: 'Local',
    title: 'Greater Houston only',
    body: 'We work in and around Houston, which means we understand what this climate and this soil do to a slab. Humidity, vapor drive and clay movement are not edge cases here — they are the baseline conditions every floor has to survive.',
  },
]

/*
  Cities named in the entity paragraph below, derived from the page registry so
  the paragraph cannot claim a city the site has no page for. Same list that
  drives `areaServed` in lib/schema.ts, for the same reason.

  Kept separate from `site.serviceAreas` (15 entries) on purpose: six of those
  are owner-confirmed but page-less, and this paragraph is written to be quoted
  as evidence, so it names only what a reader can go and verify.
*/
const CITY_NAMES = cities.map((c) => c.name)
const cityPhrase = `${CITY_NAMES.slice(0, -1).join(', ')} and ${CITY_NAMES.at(-1)}`

const body = [
  {
    heading: 'Who we are and where we work',
    paras: [
      /*
        THE ENTITY PARAGRAPH. Written to be lifted verbatim by an answer engine,
        which drives two choices that look redundant on the page but are not:

        1. It opens with the company NAME, not "We". A pronoun-led sentence is
           useless once quoted away from this page — "we are the coatings
           division of…" has no antecedent in a search result. That is also why
           the heading no longer restates the relationship: the paragraph has to
           carry it alone, so the heading would only duplicate it.
        2. It is one self-contained sentence pair covering entity, parent
           relationship, service category, metro, named cities and the two
           verifiable commitments — because an engine quotes a passage, not a
           page.

        Every claim here appears elsewhere on the site: the relationship in the
        schema's parentOrganization, the cities as real pages, the warranty and
        grinding in `commitments` above.
      */
      `${site.company} is the concrete coatings division of ${site.parentCompany}, a service-area business installing garage floor, patio and pool deck, and commercial and warehouse coatings across Greater Houston — including ${cityPhrase}. Every floor is diamond-ground before coating, carries a five-year written workmanship warranty, and is quoted onsite and itemized in writing.`,
      'Coatings are not a sideline added to a general contracting business; they are the work. That focus is the reason this site is as technical as it is. The difference between a floor that lasts and one that peels in eighteen months is almost entirely in preparation and material selection, and those are decisions you should be able to interrogate before you hire anyone.',
    ],
  },
  {
    heading: 'Why we publish method instead of marketing',
    paras: [
      'The coating trade has a transparency problem. Prices are quoted without defining the work, "epoxy" is used as a catch-all for products with wildly different lifespans, and preparation — the single biggest determinant of whether a floor survives — is invisible once the job is done.',
      'So we have written this site to be genuinely useful rather than persuasive. If you read our pages on grinding, removal and epoxy versus polyaspartic, you will be able to evaluate any quote you receive, including ours. We think that is a better basis for hiring someone than a stock photograph and a countdown timer.',
    ],
  },
  {
    heading: 'How we work',
    paras: [
      'Every job starts with an onsite inspection: we look at the slab, test for moisture, check adhesion if there is an existing coating, and map any damage. That inspection is what produces a number we are willing to stand behind.',
      'From there the sequence is the same on every floor — grind, repair, base coat, broadcast where appropriate, scrape, topcoat. What varies is how long each stage takes on your particular concrete.',
    ],
  },
]

const faqs = [
  {
    q: 'Are you licensed and insured?',
    a: 'We carry $2M general liability insurance and workers’ compensation coverage, and can provide a certificate of insurance on request before work begins. Texas does not license concrete coating contractors as a trade, which is precisely why insurance documentation and a written warranty matter as much as they do when you are comparing bids.',
  },
  {
    q: 'Do you have a showroom I can visit?',
    a: 'We are a service-area business, so we come to you rather than operating a walk-in location. That works in your favour on the part that matters — colour and blend selection happens on your own slab under your own lighting, which is far more reliable than choosing under showroom lights.',
  },
  {
    q: 'What is your relationship with Houston Superior Painting?',
    a: `${site.company} is the concrete coatings division of ${site.parentCompany}. The coatings work is specialised and equipment-intensive enough to warrant its own team and its own division rather than being handled as an add-on service.`,
  },
  {
    q: 'Do you subcontract the work?',
    a: 'Ask us directly at your estimate and we will tell you exactly who will be on your property and what they are covered by. It is a fair question and one you should put to every contractor you get a bid from.',
  },
  {
    q: 'How far do you travel?',
    a: 'Across Greater Houston, including Richmond, Katy, Sugar Land, Cypress, Fulshear and Pearland. Our service areas page lists the communities we work in regularly — if you are near the edge of it, call and ask.',
  },
]

export default function Page() {
  return (
    <>
      {/*
        AboutPage rather than the generic WebPage, with `mainEntity` pointing at
        the LocalBusiness: this is the page whose primary subject IS the company,
        which is exactly the signal an entity resolver looks for when deciding
        which URL describes the business.
      */}
      <JsonLd
        data={graph(
          webPageNode(KEY, { type: 'AboutPage', mainEntity: true }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="About us"
        intro={`The concrete coatings division of ${site.parentCompany}, serving Greater Houston. $2M insured, with a written 5-year workmanship warranty on every floor.`}
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <Prose sections={body} />
          {/*
            An ILLUSTRATION of the grinding step — not our crew.

            The slot here previously read "our crew grinding a Houston garage
            slab". Filling that literally would have meant generating people and
            presenting them as this company's employees, on the one page whose
            schema subject IS the company. Equipment on concrete demonstrates a
            method; invented figures would assert a workforce, which is the
            claim a reader has no way to check. So the frame shows the machine
            and the half-ground slab, and no people.

            Routed through <MaterialSample> rather than <ImageSlot> because
            ImageSlot is reserved for real photography of our own work and says
            so in its own header comment. MaterialSample stamps a visible
            "Illustration" chip on the frame, so the disclosure sits on the
            image instead of hiding in an alt attribute.
          */}
          <div className="lg:pt-4">
            {/* The 1fr of a [1.5fr_1fr] grid — about 28vw at lg, capped by the 7xl container. */}
            <MaterialSample
              src={finishSamples.grindingProcess.src}
              alt={finishSamples.grindingProcess.alt}
              kind={finishSamples.grindingProcess.kind}
              caption={finishSamples.grindingProcess.caption}
              /*
                Square, matching the source file. The default 4/3 would
                centre-crop the frame and cut off the ground/unground boundary
                that is the entire point of the image.
              */
              aspect="1/1"
              sizes="(min-width: 1024px) 28vw, 100vw"
            />
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
              Above is an illustration of the grinding step, not a photograph of our crew — the
              ground and unground halves of the slab are what a proper mechanical profile looks
              like. Photography of our own crews on real jobs is being shot for{' '}
              <Link href={r('projects')} className="text-primary underline underline-offset-4">
                the project archive
              </Link>
              , and we are not substituting stock images of other people’s work in the meantime.
            </p>
          </div>
        </div>
      </Section>

      <Section bleed>
        <Heading
          eyebrow="What you can hold us to"
          title="Six commitments, all of them checkable"
          intro="Every item here is either a document we can hand you or a method you can ask us to demonstrate. None of it requires you to take our word for it."
        />
        <CardGrid items={commitments} cols={3} />
      </Section>

      <Section>
        <Heading eyebrow="Questions" title="About the company" />
        <FaqList items={faqs} />
      </Section>

      {/*
        Official profiles, on the page where a reader is already deciding
        whether this is a real company. These are corroboration, not marketing
        links: the same business name, logo and phone number appearing on
        independently-hosted profiles is what makes the entity verifiable, and
        the JSON-LD on this page asserts the same set via `sameAs`.

        Sourced from `socialProfiles` in lib/site.ts, so this block and the
        schema cannot list different profiles.
      */}
      <Section>
        <SocialProfiles
          heading="Official profiles"
          intro="These are our verified accounts. We do not operate any other profile under this name — if you find one, it is not us."
        />
      </Section>

      <CtaBand
        title="Ask us the hard questions at the estimate"
        body="Bring your other quotes. We are happy to explain what a competitor is proposing and where our scope differs — including the cases where theirs is the better value for what you need."
      />

      <Section>
        <RelatedLinks
          heading="Continue reading"
          links={[
            { label: routes.warranty.label, href: r('warranty'), blurb: 'What the 5-year warranty covers.' },
            { label: routes.reviews.label, href: r('reviews'), blurb: 'Read our Google reviews at the source.' },
            { label: routes.process.label, href: r('process'), blurb: 'The nine steps on every floor.' },
            { label: routes.serviceAreas.label, href: r('serviceAreas'), blurb: 'Where we work.' },
            { label: routes.epoxyFlooring.label, href: r('epoxyFlooring'), blurb: 'How to vet any coating contractor.' },
            { label: routes.contact.label, href: r('contact'), blurb: 'Get in touch.' },
          ]}
        />
      </Section>
    </>
  )
}
