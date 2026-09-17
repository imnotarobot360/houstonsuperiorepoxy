import type { Metadata } from 'next'
import { CheckList, FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'

const KEY = 'warranty' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  Only two confirmed facts here: 5-year written workmanship warranty, and
  $2M GL + workers' comp. Everything else is explanation of what a workmanship
  warranty means as a category. Do NOT invent specific clause language,
  transferability terms, or claim procedures.
*/

const covered = [
  'Adhesion failure of the coating system we installed — peeling, delamination or lifting from the slab.',
  'Defects in our installation workmanship, including problems traceable to how we prepared the concrete.',
  'Blistering or bubbling caused by our application rather than by a pre-existing slab condition we identified and disclosed.',
  'Coating failure at repairs we performed as part of the job.',
] as const

const notCovered = [
  'Damage from impact, abuse, dragging heavy equipment, or dropped tools.',
  'Damage from chemicals outside the system’s rated resistance — ask us what yours is rated for.',
  'New structural movement in the slab, including cracks that open after installation because the ground moved.',
  'Moisture problems in the concrete that we identified and disclosed before installation and you asked us to coat over anyway.',
  'Normal wear, and gradual loss of gloss on a floor that gets used.',
] as const

const body = [
  {
    heading: 'Workmanship warranty, not a product warranty',
    paras: [
      'These are two different things and the distinction matters when you compare guarantees. A product warranty comes from the material manufacturer and covers the material itself. A workmanship warranty comes from the installer and covers whether the installation was done correctly.',
      'Ours is a workmanship warranty: five years, in writing, provided with every floor we install. It is the more meaningful of the two for a coating job, because the overwhelming majority of coating failures are installation failures — specifically preparation failures — rather than defective product.',
    ],
  },
  {
    heading: 'Why we can offer five years',
    paras: [
      'Because of what happens in the first four steps of the job. Every floor is diamond-ground rather than acid-etched, moisture is checked before anything goes down, cracks and spalls are repaired as their own step with their own cure time, and the slab is re-inspected before the base coat.',
      'A contractor who skips those steps is not in a position to guarantee much, which is why very short warranties — or verbal ones — are a useful signal about the preparation you are actually buying.',
    ],
  },
  {
    heading: 'Read the warranty before you sign anything',
    paras: [
      'That applies to ours as much as anyone’s. The written document we provide is the authoritative statement of what is covered, for how long, and under what conditions. This page is a plain-language explanation of the category, not the contract.',
      'Ask for a copy at your estimate. Any contractor who cannot produce the warranty document in advance of the work is asking you to take a guarantee on trust.',
    ],
  },
]

const faqs = [
  {
    q: 'Is the warranty in writing?',
    a: 'Yes. It is provided as a written document with every floor we install, and you can ask to read it at the estimate stage before committing to anything. A verbal assurance of a warranty is not a warranty.',
  },
  {
    q: 'What is the difference between a workmanship and a product warranty?',
    a: 'A product warranty is from the manufacturer and covers the material. A workmanship warranty is from us and covers the installation. Most coating failures are installation failures rather than product defects, so the workmanship warranty is generally the one that will matter if something goes wrong.',
  },
  {
    q: 'What if my slab has a moisture problem?',
    a: 'We test for it during the inspection and tell you what we find. If a slab has a vapor drive problem, that is a condition of the concrete rather than of our work, and it needs to be addressed before coating rather than warranted around. We will explain the options — what we will not do is quietly coat over it and hope.',
  },
  {
    q: 'Are you insured as well as warranted?',
    a: 'Yes, and they cover different risks. The warranty covers the floor. Our $2M general liability and workers’ compensation coverage protects you if something goes wrong on your property or a crew member is injured there. We can provide a certificate of insurance on request before work starts.',
  },
  {
    q: 'Does the warranty transfer if I sell the house?',
    a: 'Ask us directly and we will confirm the terms for your specific job — this is one of the details we will not paraphrase on a webpage, because the written document is what governs it. It is worth asking before you sign if you expect to sell.',
  },
  {
    q: 'How do I make a claim?',
    a: `Call us at ${site.phone}. We would far rather come and look at a floor that is not behaving than have you conclude the guarantee was decorative. The claim process is set out in the written warranty document.`,
  },
]

export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Guarantee"
        intro="Every floor we install carries a written 5-year workmanship warranty, backed by $2M general liability and workers’ compensation coverage. Here is what that actually means — and what it does not."
      />

      <Section>
        <Prose sections={body} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Scope"
          title="What a workmanship warranty covers"
          intro="A plain-language summary of the category. The written document provided with your floor is the authoritative version, and we encourage you to read it in full."
        />
        <div className="mt-14 grid gap-px border border-border bg-border lg:grid-cols-2">
          <div className="bg-background p-8 lg:p-10">
            <h3 className="font-serif text-xl tracking-tight text-foreground">
              Generally covered
            </h3>
            <CheckList items={covered} className="mt-8" />
          </div>
          <div className="bg-background p-8 lg:p-10">
            <h3 className="font-serif text-xl tracking-tight text-foreground">
              Generally not covered
            </h3>
            <ul className="mt-8 space-y-3">
              {notCovered.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                >
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
        <Heading eyebrow="Questions" title="Warranty and insurance" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Ask to read the warranty before you commit"
        body="We will bring the written document to your free estimate along with our certificate of insurance. You should expect the same from every contractor you are considering."
      />

      <Section>
        <RelatedLinks
          heading="Continue reading"
          links={[
            { label: routes.grinding.label, href: r('grinding'), blurb: 'The preparation that makes five years possible.' },
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
