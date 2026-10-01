import type { Metadata } from 'next'
import { CheckList, FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'
import { FurtherReading } from '@/components/further-reading'

const KEY = 'warranty' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  Two confirmed facts here: the Limited Lifetime residential workmanship
  warranty, and $2M GL + workers' comp. Everything else is explanation of what
  a workmanship warranty means as a category. Do NOT invent specific clause
  language, transferability terms, or claim procedures.

  THE WORD "LIFETIME" IS THE WHOLE RISK ON THIS PAGE. It is the one term a
  customer will remember and the one a competitor will quote back. So it is
  never used bare: every appearance is "Limited Lifetime", every appearance is
  scoped to QUALIFYING RESIDENTIAL GARAGE installations, and the definition of
  whose lifetime sits in its own section above the fold-ish rather than in a
  footnote. The site elsewhere criticises contractors who offer a verbal
  "lifetime warranty" with no document and no definition of whose lifetime —
  see /epoxy-flooring-houston and /how-to-choose-epoxy-contractor-houston —
  and that criticism only survives if this page does the opposite.

  TRANSFERABILITY IS NOT ADVERTISED. Until written transfer terms are formally
  adopted, the honest answer is that it is confirmed per job, which is what the
  FAQ below says.

  NOTHING HERE MAY PROMISE MORE THAN THE SIGNED WARRANTY DOCUMENT. The lists
  below are hedged as "designed to cover" and "subject to the written terms"
  on purpose; they are a plain-language summary of a legal document, not a
  substitute for it.
*/

const covered = [
  'Peeling, delamination or lifting of the coating system caused by our installation.',
  'Adhesion failure traceable to our preparation or our application of the system.',
  'Defects in our installation workmanship, including problems traceable to how we prepared the concrete.',
  'Blistering or bubbling caused by our application rather than by a pre-existing slab condition we identified and disclosed.',
  'Coating failure at concrete repairs we performed, where those repairs are included under the written warranty.',
] as const

const notCovered = [
  'Structural movement of the slab, foundation movement, and new cracks that open because the ground moved.',
  'Substrate failure, hydrostatic pressure and excessive moisture vapor transmission.',
  'Pre-existing slab conditions hidden at the time of inspection, or ones we identified and disclosed and you asked us to coat over anyway.',
  'Impact damage, abuse or misuse, and damage from vehicles, machinery or equipment used beyond the floor’s intended use.',
  'Cuts, gouges and scratches.',
  'Chemical exposure outside the installed system’s rated resistance — ask us what yours is rated for.',
  'Fire, flooding and natural disasters.',
  'Work, repairs or modifications by another contractor, and unauthorized repairs.',
  'Normal wear, and normal changes in gloss or surface appearance on a floor that gets used.',
] as const

/*
  The categories that do NOT get the residential term. Published because the
  alternative — saying nothing — lets a warehouse owner read the homepage
  headline and assume it applies to their forklift aisles.
*/
const otherCategories = [
  {
    label: 'Residential garage',
    terms: 'Limited Lifetime workmanship warranty on qualifying installations.',
  },
  {
    label: 'Exterior residential',
    terms:
      'Patios, pool surrounds and driveways are warranted under the approved exterior system. Outdoor concrete is a different exposure and does not take the garage term.',
  },
  {
    label: 'Commercial and industrial',
    terms:
      'Warehouse, retail, workshop and institutional floors carry a project-specific written warranty, with the term stated in the proposal for that job.',
  },
] as const

/*
  The definition of "Lifetime", lifted OUT of the prose body and into its own
  h2 section directly under the hero.

  It was a third-level heading in the body flow, which is where a definition
  goes to be skimmed past. This is the single disclosure that decides whether
  the headline term is honest, so it gets a section of its own at the top of
  the page. "Do not hide this in fine print" is the requirement, and heading
  level is part of not hiding it.
*/
const lifetimeMeaning = [
  'It means the period during which the original purchaser owns the property where we installed the coating system. That is the definition, and it sits at the top of this page rather than in fine print at the bottom — a warranty whose duration you have to go looking for is the kind this site warns you about.',
  'It is a Limited warranty, and the word is doing real work. It covers qualifying failures caused by our preparation and installation workmanship, on qualifying residential garage installations. It is not a promise that every form of damage or deterioration is covered forever, and it is not a guarantee about the concrete underneath. What is covered, what is excluded and how to claim are set out in the written warranty document, which governs.',
] as const

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
  {
    heading: 'Read the warranty before you sign anything',
    paras: [
      'That applies to ours as much as anyone’s. The written document we provide is the authoritative statement of what is covered, for how long, and under what conditions. This page is a plain-language explanation, not the contract.',
      'Ask for a copy at your estimate. Any contractor who cannot produce the warranty document in advance of the work is asking you to take a guarantee on trust.',
    ],
  },
]

const faqs = [
  {
    q: 'Does Houston Superior Epoxy offer a lifetime warranty?',
    a: 'Yes, for qualifying residential garage floor installations: our Limited Lifetime workmanship warranty. “Lifetime” refers to the period during which the original purchaser owns the property, and it applies to covered workmanship-related failures, subject to the complete written warranty terms and exclusions. It is not an unlimited guarantee, and the written document is what governs.',
  },
  {
    q: 'Does the lifetime warranty cover concrete cracks?',
    a: 'A coating workmanship warranty does not mean the concrete underneath is guaranteed against future movement. Structural movement, foundation movement, new slab cracks and other substrate conditions may be excluded — they are conditions of the slab rather than of our work. See the written warranty for the coverage details, and ask at the inspection what we found in your slab.',
  },
  {
    q: 'Does the warranty cover peeling?',
    a: 'Peeling or delamination caused directly by covered preparation or installation workmanship may be covered under the Limited Lifetime workmanship warranty. Peeling from other causes — substrate or moisture-related conditions, impact, or work by another contractor — may be excluded. The cause is what determines it, which is why we would rather come and look at the floor than decide over the phone.',
  },
  {
    q: 'Does it apply to my patio, or to a commercial floor?',
    a: 'No. The Limited Lifetime term is a residential garage term. Exterior concrete — patios, pool surrounds, driveways — is warranted under the approved exterior system, and commercial, warehouse and industrial floors carry a project-specific written warranty with the term stated in that project’s proposal. Outdoor exposure and forklift traffic are not the same risk as a residential garage and are not warranted as though they were.',
  },
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
    a: 'The Limited Lifetime term is written for the original purchaser, so do not assume it transfers. Ask us directly and we will confirm what applies to your specific job — this is one of the details we will not paraphrase on a webpage, because the written document is what governs it. It is worth asking before you sign if you expect to sell.',
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
        intro="Qualifying Houston Superior Epoxy residential garage floor installations include our Limited Lifetime workmanship warranty against covered installation-related failures, backed by $2M general liability and workers’ compensation coverage. Professional preparation. Professional installation. Protection in writing — here is what that means, and what it does not."
      />

      <Section>
        <Heading eyebrow="Definition" title="What does Lifetime mean?" />
        <div className="mt-10 max-w-3xl space-y-5 border-l-2 border-primary pl-6">
          {lifetimeMeaning.map((p) => (
            <p key={p} className="leading-relaxed text-muted-foreground text-pretty">
              {p}
            </p>
          ))}
        </div>
      </Section>

      <Section>
        <Prose sections={body} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Scope"
          title="What the Limited Lifetime workmanship warranty is designed to cover"
          intro="A plain-language summary, subject to the written warranty document provided with your floor — that document is the authoritative version and we encourage you to read it in full before you sign anything."
        />
        <div className="mt-14 grid gap-px border border-border bg-border lg:grid-cols-2">
          <div className="bg-background p-8 lg:p-10">
            <h3 className="font-serif text-xl tracking-tight text-foreground">
              Designed to cover
            </h3>
            <CheckList items={covered} className="mt-8" />
          </div>
          <div className="bg-background p-8 lg:p-10">
            <h3 className="font-serif text-xl tracking-tight text-foreground">
              What is not covered
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
        <Heading eyebrow="Questions" title="Warranty and insurance" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Ask to read the warranty before you commit"
        body="We will bring the written document to your free estimate along with our certificate of insurance. You should expect the same from every contractor you are considering."
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
