import type { Metadata } from 'next'
import { CheckList, FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'
import { FurtherReading } from '@/components/further-reading'
import {
  WARRANTY_CLAIM_STEPS,
  WARRANTY_COMMERCIAL_STATEMENT,
  WARRANTY_CONTROLLING_DISCLOSURE,
  WARRANTY_COVERED,
  WARRANTY_EFFECTIVE_DATE,
  WARRANTY_EXCLUDED,
  WARRANTY_INSPECTION_STEPS,
  WARRANTY_MAINTENANCE,
  WARRANTY_QUALIFIES,
  WARRANTY_REMEDY,
  WARRANTY_REMEDY_EXCLUDES,
  WARRANTY_TERM,
} from '@/lib/content/warranty'
import { PageAnswer } from '@/components/aeo'

const KEY = 'warranty' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  THE WARRANTY PAGE.

  Every figure, list and sentence of policy on this page comes from
  lib/content/warranty.ts. Nothing is retyped here — the last time warranty
  copy lived in the pages that used it, three pages were still advertising a
  five-year term weeks after it changed.

  THE RISK THIS PAGE MANAGES: "Lifetime" is the one word on this site a reader
  will hear as "forever, and everything". So the page is ordered against that
  reading rather than around it — the controlling-document disclosure is the
  first thing under the hero, the definition of whose lifetime is the first
  section, and the exclusions sit beside the coverage at the same size rather
  than below it in smaller type.

  WHAT IS DELIBERATELY ABSENT: an effective date, while the owner has not
  supplied one. The policy is not retroactive, so the date decides which
  warranty a real customer holds, and inventing it would misstate a term of
  somebody's contract. See OWNER_VERIFICATION_REQUIRED.md.
*/

/*
  The definition, in its own section directly under the hero rather than as a
  third-level heading inside the prose — which is where a definition goes to
  be skimmed past. This single disclosure decides whether the headline term is
  honest.
*/
const lifetimeMeaning = [
  'It means the period during which the original contracting homeowner owns the property where we installed the coating system. That is the definition, and it sits at the top of this page rather than in fine print at the bottom — a warranty whose duration you have to go looking for is the kind this site warns you about.',
  'It is a Limited warranty, and the word is doing real work. It covers qualifying failures caused by our preparation and installation workmanship, on qualifying residential garage installations. It is not a promise that every form of damage is covered, not a promise the coating will never wear, and not a guarantee about the concrete underneath. It does not last forever regardless of who owns the house, and it does not mean that materials made by somebody else are covered without limit.',
]

const body = [
  {
    heading: 'Workmanship warranty, not a product warranty',
    paras: [
      'These are two different things and the distinction matters when you compare guarantees. A product warranty comes from the material manufacturer and covers the material itself. A workmanship warranty comes from the installer and covers whether the installation was done correctly.',
      'Ours is a workmanship warranty, in writing, provided with qualifying residential garage installations. It is the more meaningful of the two for a coating job, because the overwhelming majority of coating failures are installation failures — specifically preparation failures — rather than defective product.',
    ],
  },
  {
    heading: 'Why we can stand behind the installation',
    paras: [
      'Because of what happens in the first four steps of the job. Every floor is diamond-ground rather than acid-etched, moisture is checked before anything goes down, cracks and spalls are repaired as their own step with their own cure time, and the slab is re-inspected before the base coat.',
      'A contractor who skips those steps is not in a position to guarantee much, which is why a verbal warranty — or one with no exclusions written down — is a useful signal about the preparation you are actually buying.',
    ],
  },
]

/*
  The categories that do NOT get the residential term. Published because the
  alternative — saying nothing — lets a warehouse owner read the homepage
  headline and assume it applies to their forklift aisles.
*/
const otherCategories = [
  {
    label: 'Residential garage',
    terms: `${WARRANTY_TERM} on qualifying installations, for the original contracting homeowner.`,
  },
  {
    label: 'Exterior residential',
    terms:
      'Patios, pool surrounds and driveways are warranted under the approved exterior system. Outdoor concrete is a different exposure and does not take the garage term.',
  },
  {
    label: 'Commercial and industrial',
    terms: WARRANTY_COMMERCIAL_STATEMENT,
  },
]

const faqs = [
  {
    q: 'Does Houston Superior Epoxy offer a Limited Lifetime warranty?',
    a: `Yes, for qualifying residential garage floor installations: our ${WARRANTY_TERM}. “Lifetime” here means for as long as the original contracting homeowner owns the property — not forever, and not regardless of who owns the house. It is a workmanship warranty, so it covers qualifying failures caused by our preparation and installation rather than every form of damage. The written warranty document provided with your project sets out the full terms.`,
  },
  {
    q: 'Does the Limited Lifetime warranty cover concrete cracks?',
    a: 'A coating workmanship warranty does not mean the concrete underneath is guaranteed against future movement. Structural movement, foundation movement, new slab cracks and other substrate conditions are excluded — they are conditions of the slab rather than of our work. Houston soil moves, and no coating contractor can warrant against that. We test and document what we find before installation, and we tell you.',
  },
  {
    q: 'Does the warranty transfer if I sell the house?',
    a: 'Assume it does not. The term is written for the original contracting homeowner and is non-transferable unless a signed contract explicitly says otherwise. If a transfer matters to you — because you are planning to sell, or buying a house with one of our floors — raise it before you sign and we will tell you in writing what is possible.',
  },
  {
    q: 'What will you actually do if a claim qualifies?',
    a: `${WARRANTY_REMEDY} We do not promise to replace an entire floor in every case, and the warranty does not provide cash refunds or cover consequential damages.`,
  },
  {
    q: 'What stops a warranty claim from qualifying?',
    a: 'Most commonly: damage rather than defect. Impact, scratches, chemicals outside the system’s rated resistance, a new crack from slab movement, work done by another contractor, or a floor that was driven on before the return-to-service time we gave you. Improper cleaning and customer-applied coatings over ours also void coverage on the affected area, which is why the maintenance section above is part of the warranty rather than a tip sheet.',
  },
  {
    q: 'Does the Limited Lifetime term apply to my patio or my warehouse?',
    a: 'No. The Limited Lifetime term is a residential garage term. Exterior concrete — patios, pool surrounds, driveways — is warranted under the approved exterior system, and commercial warranty terms are provided in the written project proposal and vary by coating system, substrate condition and intended use.',
  },
  {
    q: 'What about moisture coming up through the slab?',
    a: 'We test for it during the inspection and tell you what we find. If a slab has a vapor drive problem, that is a condition of the concrete rather than of our work, and it needs to be addressed before coating rather than warranted around. Moisture vapor and hydrostatic pressure are excluded. We will explain the options — what we will not do is quietly coat over it and hope.',
  },
  {
    q: 'How do I make a claim?',
    a: `Call or text us at ${site.phone}. We would far rather come and look at a floor that is not behaving than have you conclude the guarantee was decorative. We have the right to inspect the floor before determining whether a claim qualifies, and the full claim process is set out in the written warranty document.`,
  },
  {
    q: 'Can I read the warranty before I sign?',
    a: 'Yes, and you should. We bring the written document to the free estimate along with our certificate of insurance, and you can also ask us to email it in advance. Any contractor who cannot produce the warranty document before the work is asking you to take a guarantee on trust.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Guarantee"
        intro={`Qualifying Houston Superior Epoxy residential garage floor installations include our ${WARRANTY_TERM} against covered installation-related failures, backed by $2M general liability and workers’ compensation coverage. Here is what that means, what it excludes, and how to claim.`}
      />

      {/*
        The quick answer sits directly under the hero on purpose. It is the
        block an answer engine lifts, and burying it below the body means
        competing with whatever prose happens to come first.
      */}
      <Section>
        <PageAnswer routeKey={KEY} />
      </Section>

      {/*
        THE CONTROLLING-DOCUMENT DISCLOSURE, placed first and styled as a
        notice rather than as body text.

        It is the sentence that keeps this page a summary instead of an offer.
        A page a customer reads before signing, describing coverage in detail,
        is exactly what gets argued over later — so it says in its own words
        that it is not the agreement, above everything it then summarises.
      */}
      <Section>
        <p className="max-w-3xl rounded-lg border border-primary/40 bg-primary/5 p-5 text-sm leading-relaxed text-foreground text-pretty">
          {WARRANTY_CONTROLLING_DISCLOSURE}
        </p>
      </Section>

      <Section>
        <Heading eyebrow="Definition" title="What does Limited Lifetime mean?" />
        <div className="mt-10 max-w-3xl space-y-5 border-l-2 border-primary pl-6">
          {lifetimeMeaning.map((p) => (
            <p key={p} className="leading-relaxed text-muted-foreground text-pretty">
              {p}
            </p>
          ))}
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="Eligibility"
          title="Who qualifies, and whether it transfers"
          intro="Four conditions, each of them a term of the warranty rather than a detail."
        />
        <CheckList items={WARRANTY_QUALIFIES} className="mt-10 max-w-3xl" />
      </Section>

      <Section>
        <Prose sections={body} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Scope"
          title={`What the ${WARRANTY_TERM} covers`}
          intro="A plain-language summary, subject to the written warranty document provided with your floor — that document is the authoritative version and we encourage you to read it in full before you sign anything."
        />
        <div className="mt-14 grid gap-px border border-border bg-border lg:grid-cols-2">
          <div className="bg-background p-8 lg:p-10">
            <h3 className="font-serif text-xl tracking-tight text-foreground">Covered workmanship</h3>
            <CheckList items={WARRANTY_COVERED} className="mt-8" />
          </div>
          {/*
            The exclusions sit BESIDE the coverage at the same size, not below
            it in smaller type. A warranty page that lists what is covered and
            buries what is not is the pattern this company competes against.
          */}
          <div className="bg-background p-8 lg:p-10">
            <h3 className="font-serif text-xl tracking-tight text-foreground">What is not covered</h3>
            <ul className="mt-8 space-y-3">
              {WARRANTY_EXCLUDED.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 font-mono text-xs text-primary">
                    —
                  </span>
                  <span className="text-pretty">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-10 max-w-3xl border-l-2 border-primary pl-5 text-sm leading-relaxed text-muted-foreground text-pretty">
          Notice that most exclusions are conditions of the concrete rather than of the coating. That
          is why the inspection matters so much: identifying a moisture problem or a moving crack
          before installation is what keeps it from becoming your problem afterwards.
        </p>
      </Section>

      <Section>
        <Heading
          eyebrow="Remedy"
          title="What we do about a qualifying claim"
          intro={WARRANTY_REMEDY}
        />
        <div className="mt-10 max-w-3xl">
          <p className="text-sm font-medium text-foreground">What the warranty does not provide</p>
          <ul className="mt-4 space-y-3">
            {WARRANTY_REMEDY_EXCLUDES.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden="true" className="mt-0.5 shrink-0 font-mono text-xs text-primary">
                  —
                </span>
                <span className="text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="Your side"
          title="Required maintenance"
          intro="Improper cleaning and customer-applied products are excluded from coverage, so what counts as proper is published here rather than left for you to guess at after something goes wrong."
        />
        <CheckList items={WARRANTY_MAINTENANCE} className="mt-10 max-w-3xl" />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Claims"
          title="How to make a claim, and what happens next"
          intro="We would far rather come and look at a floor that is not behaving than have you conclude the guarantee was decorative."
        />
        <div className="mt-14 grid gap-px border border-border bg-border lg:grid-cols-2">
          <div className="bg-background p-8 lg:p-10">
            <h3 className="font-serif text-xl tracking-tight text-foreground">What you do</h3>
            <ol className="mt-8 space-y-4">
              {WARRANTY_CLAIM_STEPS.map((step, i) => (
                <li key={step} className="flex gap-4 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="shrink-0 font-mono text-xs text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-pretty">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Call or text{' '}
              <a href={site.phoneHref} className="font-medium text-foreground underline underline-offset-4">
                {site.phone}
              </a>
              .
            </p>
          </div>
          <div className="bg-background p-8 lg:p-10">
            <h3 className="font-serif text-xl tracking-tight text-foreground">What we do</h3>
            <ol className="mt-8 space-y-4">
              {WARRANTY_INSPECTION_STEPS.map((step, i) => (
                <li key={step} className="flex gap-4 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden="true" className="shrink-0 font-mono text-xs text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-pretty">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="By project type"
          title="The Limited Lifetime term is a residential garage term"
          intro="It does not travel to every surface we coat. Publishing which category gets what is how a warehouse owner avoids reading a garage headline and assuming it covers their forklift aisles."
        />
        <dl className="mt-12 grid gap-px border border-border bg-border lg:grid-cols-3">
          {otherCategories.map((c) => (
            <div key={c.label} className="bg-background p-8">
              <dt className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-primary">
                {c.label}
              </dt>
              <dd className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                {c.terms}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section>
        <Heading eyebrow="Effective date" title="Which warranty applies to your contract" />
        <div className="mt-10 max-w-3xl space-y-5">
          <p className="leading-relaxed text-muted-foreground text-pretty">
            {/*
              NO DATE IS PRINTED until the owner confirms one. The policy is
              not retroactive, so this date decides which warranty a real
              customer holds — a guess here would misstate a term of somebody's
              signed contract.
            */}
            {WARRANTY_EFFECTIVE_DATE
              ? `The ${WARRANTY_TERM} applies to contracts signed on or after ${WARRANTY_EFFECTIVE_DATE}.`
              : `The ${WARRANTY_TERM} applies to contracts signed on or after its effective date, which is being confirmed. The warranty document provided with your project states the term that applies to you, and it is the controlling agreement.`}
          </p>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            This policy is not retroactive. If you signed with us earlier under a five-year written
            workmanship warranty, that is the warranty you hold and it is unchanged — we have not
            altered a term you already agreed to, in either direction. If you are not sure which one
            you have, call us and we will tell you.
          </p>
        </div>
      </Section>

      <Section>
        <Heading eyebrow="Questions" title="Warranty and insurance" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Ask to read the warranty before you commit"
        body="We will bring the written document to your free estimate along with our certificate of insurance, and we will email it in advance if you ask. You should expect the same from every contractor you are considering."
      />

      <Section>
        <FurtherReading routeKey={KEY} />
      </Section>

      <Section>
        <RelatedLinks
          heading="Continue reading"
          links={[
            { label: routes.grinding.label, href: r('grinding'), blurb: 'The preparation the warranty rests on.' },
            { label: routes.process.label, href: r('process'), blurb: 'The nine steps behind the guarantee.' },
            { label: routes.removal.label, href: r('removal'), blurb: 'What happens when a warranty was worthless.' },
            { label: routes.about.label, href: r('about'), blurb: 'Insurance and company details.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'Why the cheapest bid rarely carries this.' },
            { label: routes.contact.label, href: r('contact'), blurb: 'Make a claim or ask a question.' },
          ]}
        />
      </Section>
    </>
  )
}
