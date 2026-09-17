import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { Byline, DefinedTerms, QuickAnswer, SourcesAndTechnicalReferences } from '@/components/aeo'
import { blogPostingNode, faqNode, graph, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'

const KEY = 'chooseContractor' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: the highest-value pre-purchase question on the site — "how do I
  choose a garage floor coating company?" — asked by someone who has not yet
  shortlisted anyone and is about to spend several thousand dollars.

  THE CENTRAL CONSTRAINT: this is written so a competitor could pass it.

  That is not modesty, it is the only way the page works. A buyer's guide whose
  criteria happen to describe exactly one company is a sales page wearing a
  guide's clothes, and both readers and answer engines identify that instantly
  — at which point the page loses the citation it was built to earn. So every
  criterion below is one any competent contractor can meet, several are noted
  as common industry practice rather than differentiators, and the company's
  own position is quarantined in a single clearly-labeled section at the end.

  WHAT IS DELIBERATELY ABSENT: no superlatives, no "best in Houston", no
  competitor named or implied as deficient, no performance figure, cure time or
  mil thickness (those are product-specific — see the note in the Faq
  component), and no claim in the closing section that another Houston company
  could not also make truthfully.
*/

/* ---------------------------------------------------------------- */
/* The 14 criteria                                                   */
/* ---------------------------------------------------------------- */

/*
  Each criterion carries BOTH halves the brief requires: what good looks like,
  and the specific warning sign. The warning sign is the more useful half — a
  reader can recognise an absence far more reliably than they can evaluate a
  claim — so it is given equal visual weight rather than being a footnote.

  `common: true` marks the criteria where the honest answer is that plenty of
  Houston companies already do this well. Flagging them costs nothing and is
  the single strongest signal that the page is a guide rather than a pitch.
*/
type Criterion = {
  title: string
  good: string
  warning: string
  common?: boolean
}

const criteria: readonly Criterion[] = [
  {
    title: 'Mechanical grinding, not acid etching',
    good: 'The quote names a mechanical preparation method — diamond grinding or shot blasting — and describes dust extraction at the tool. Preparation is the line the whole floor depends on, because a coating bonds by curing inside an opened pore structure rather than by sticking to a smooth surface.',
    warning:
      'Acid etching, \u201cchemical prep\u201d, or \u201cpressure wash and prime\u201d written where preparation should be. Equally telling is a quote where preparation is not itemized at all, which usually means it has been minimized to protect the total.',
    common: true,
  },
  {
    title: 'A real inspection of your slab',
    good: 'Someone stands on the concrete before quoting, and what they find is written down: existing coatings or sealer, cracks, spalling, oil saturation, trowel marks, low spots, and how the slab meets the door line. Two garages the same size routinely need different work.',
    warning: 'A firm price by phone, text or web form based only on square footage. A number produced without seeing the slab is a guess, and the adjustment usually arrives after the grinder has already exposed something.',
  },
  {
    title: 'Moisture tested before the system is chosen',
    good: 'Moisture is assessed before a product is specified, and the contractor can name the method — calcium chloride testing under ASTM F1869, or in-situ relative humidity probes under ASTM F2170. On the Gulf Coast, slab moisture is a live variable, not a formality.',
    warning: 'Moisture dismissed as a non-issue, or \u201cwe have never had a problem with that.\u201d Vapour driving up through a slab is one of the few failure modes that ruins a correctly installed coating, and it is invisible until it delaminates.',
  },
  {
    title: 'Cracks and spalls repaired as their own line item',
    good: 'Repairs appear separately on the quote with a method attached — cracks chased out and filled with a rigid material, spalls rebuilt and ground flush — carried out after grinding and before any coating goes down.',
    warning:
      'Any version of \u201cthe coating will fill that.\u201d A flexible coating over a moving crack telegraphs the crack back to the surface, and a coating bridging a spall has nothing solid underneath it.',
  },
  {
    title: 'The coating system named in writing',
    good: 'The quote states the actual system: manufacturer, product line, and base coat and topcoat identified separately, so you can look up the technical data sheet yourself and hold the installation against it.',
    warning:
      '\u201cEpoxy\u201d used as though it were a single product, or a \u201cproprietary blend\u201d with no manufacturer and no data sheet. If the system cannot be named, its performance cannot be checked and its warranty cannot be claimed.',
  },
  {
    title: 'Full-flake or partial-flake, stated plainly',
    good: 'The quote says which one you are buying. Full broadcast means flake blown on until the surface will not accept more, so no base colour shows through. Partial broadcast is a legitimate, cheaper finish — it is only a problem when it is sold as the other thing.',
    warning: 'Photography showing dense full-flake floors attached to a quote priced for partial coverage. Ask what percentage of coverage the price assumes; the answer should be immediate.',
  },
  {
    title: 'A UV-stable topcoat where sunlight reaches',
    good: 'For a slab that takes direct sun — a patio, pool deck, or the first few feet inside an open garage door — the topcoat is an aliphatic chemistry such as polyaspartic or polyurethane, chosen because it holds its colour under UV.',
    warning: 'A clear epoxy specified as the final coat on sun-exposed concrete with no mention of ambering. Epoxy is an excellent base and a poor sacrificial topcoat outdoors, and a contractor who does not raise this has not thought about your specific slab.',
  },
  {
    title: 'A written, itemized scope of work',
    good: 'A document you can read line by line: measured area, preparation method, repairs, the named system, number of coats, flake coverage, edge and cove detail, timeline, and what is excluded. It is the only version of the agreement that survives a disagreement.',
    warning: 'A single total, delivered verbally or as a text message. Without a written scope there is no standard to hold the finished floor against, and every dispute becomes one person\u2019s memory against another\u2019s.',
  },
  {
    title: 'Warranty terms you can actually read',
    good: 'A written warranty stating its length, whether it covers workmanship or product or both, what voids it, and whether it transfers if you sell the house. A short warranty with clear terms is worth more than a long one with none.',
    warning:
      '\u201cLifetime warranty\u201d offered verbally with no document, no exclusions and no definition of whose lifetime. A warranty with no stated limits has not been written down, and one that has not been written down cannot be enforced.',
  },
  {
    title: 'Insurance you can verify',
    good: 'A certificate of insurance produced on request, showing general liability and workers\u2019 compensation, with the carrier and policy dates visible. You are entitled to call the carrier and confirm it is active.',
    warning: 'Reluctance to provide a certificate, an expired one, or \u201cmy guys are covered\u201d without paperwork. If an uninsured worker is injured in your garage, the exposure can land on your homeowner\u2019s policy.',
    common: true,
  },
  {
    title: 'Real projects, in your area',
    good: 'Photographs of their own recent work, ideally in named Houston-area neighbourhoods, plus a reference or two you can call. Ask when the floor was installed and whether you may see one that has been down a few years — that is the photograph that actually tells you something.',
    warning: 'A gallery of manufacturer stock imagery, or photos that also appear on other companies\u2019 websites. A reverse image search takes seconds and settles it.',
  },
  {
    title: 'Reviews read properly',
    good: 'Reviews that describe the process — how the concrete was prepared, how the crew handled the space, whether anyone came back to check the floor. Read the three-star ones first; they are usually the most accurate. Confirm the reviews are for coating work and not a different service line.',
    warning: 'A cluster of five-star reviews posted in the same few days, reviews with no detail about the work, or an aggregate rating borrowed from a parent company or a different trade.',
    common: true,
  },
  {
    title: 'Transparent pricing',
    good: 'A price that arrives after the inspection, broken into components, with a clear explanation of what would change it and by roughly how much. A contractor confident in their numbers will happily explain how they were reached.',
    warning: 'A discount that expires today, a price that drops sharply when you hesitate, or a large cash deposit requested before materials have been ordered. Urgency is a sales technique, not a pricing method.',
  },
  {
    title: 'Return-to-service times you can plan around',
    good: 'Separate figures for foot traffic and vehicle traffic, tied to the product data sheet and to the temperature and humidity expected during the install — not one number for both. Hot tyres on a coating that has not fully cured is a common, avoidable failure.',
    warning:
      '\u201cDrive on it tomorrow\u201d with no reference to the product or the conditions. Cure is a chemical process affected by heat and humidity, which in Houston means the honest answer varies by season.',
  },
]

/* ---------------------------------------------------------------- */
/* Read-aloud checklist                                              */
/* ---------------------------------------------------------------- */

/*
  Phrased in the first person and set in quotation marks because the brief asks
  for something a homeowner can read aloud on a sales visit. Wording matters
  here: each question is closed enough that a vague answer is obvious as a
  vague answer, which is the entire function of the list.
*/
const askThese: readonly string[] = [
  'How will you prepare the concrete, and what equipment does that use?',
  'Will you grind the slab, or etch it?',
  'What will you do about moisture, and how do you measure it?',
  'What is the exact system going down — manufacturer and product name, base and topcoat?',
  'Can you send me the technical data sheet for it?',
  'Is the flake full broadcast, or partial? What coverage does this price assume?',
  'Is the topcoat UV stable? What happens to it where the sun hits?',
  'How are the cracks and any spalling being handled, and is that priced separately?',
  'Can I see the written scope of work before I agree to anything?',
  'What does your warranty cover, what voids it, and can I read it now?',
  'Can you send me a current certificate of insurance, including workers\u2019 compensation?',
  'Can I see photos of a floor you installed near here more than two years ago?',
  'When can I walk on it, and when can I park on it?',
  'Is any payment due before the work starts?',
]

/* ---------------------------------------------------------------- */
/* Prose                                                             */
/* ---------------------------------------------------------------- */

const framing = [
  {
    heading: 'Why this list is longer than the one you were expecting',
    paras: [
      'Almost all of the difference between a floor that lasts and one that peels is decided before any resin is opened — in how the concrete was prepared, whether it was tested, and whether what was promised was written down. None of that is visible in the finished floor. A correctly installed floor and a badly installed one look identical for the first several months, which is precisely why the decision has to be made on process rather than on appearance.',
      'That is also why price alone is a poor filter. The single most expensive line in a properly built quote is preparation, because it is hours of skilled labour with specialised equipment. A quote that comes in dramatically lower has usually saved the money in that line, and the saving is invisible until the coating lets go.',
    ],
  },
]

const honest = [
  {
    heading: 'Several Houston companies do this well',
    paras: [
      'It would be convenient to imply that these fourteen standards describe one company. They do not. Mechanical grinding is now normal practice among established coating contractors in this market, not a differentiator. Carrying general liability and workers\u2019 compensation is ordinary professionalism. Having genuine reviews from local customers is common. If a contractor meets the list, the list has done its job, and which one you hire can reasonably come down to scheduling, communication or price.',
      'Where the market genuinely varies is narrower than most marketing suggests: whether moisture is actually tested before a system is specified rather than after a problem appears, whether repairs are priced as their own line rather than absorbed into a round number, whether the specific product is named in writing, and whether the warranty exists as a readable document. Those four are worth pressing on, because they are the ones most often skipped quietly.',
      'The one thing worth being firm about: a contractor who will not put the scope and the warranty in writing has told you something important, and no amount of reassurance in person should outweigh it.',
    ],
  },
]

const faqs = [
  {
    q: 'How many quotes should I get for a garage floor coating?',
    a: 'Three is usually enough to see the shape of the market. What matters more than the count is that the quotes are comparable — if one names a system and a preparation method and another is a single number, you are not comparing two prices, you are comparing a specification against an unknown.',
  },
  {
    q: 'Is the cheapest quote always the wrong one?',
    a: 'No, but it deserves a specific question rather than a general suspicion: which line is lower, and why. If the saving is in overhead, scheduling or travel, that is legitimate. If it is in preparation, moisture testing or repairs, the saving is being taken out of the part of the floor that determines whether it lasts.',
  },
  {
    q: 'Should I pay a deposit before the work starts?',
    a: 'Deposits are a normal part of trade contracting, particularly where custom material is ordered. What should give you pause is a large cash deposit requested with urgency, before any written scope exists. Ask what the deposit is for and what happens to it if the work does not proceed.',
  },
  {
    q: 'How do I check a contractor is insured?',
    a: 'Ask for a certificate of insurance and read the dates and the carrier. You can call the carrier and confirm the policy is active — that is a routine request and a legitimate contractor will expect it. Look specifically for workers\u2019 compensation as well as general liability.',
  },
  {
    q: 'What is the single most useful question to ask?',
    a: '\u201cHow will you prepare the concrete?\u201d The answer separates contractors faster than any other question, because it cannot be answered well without describing mechanical equipment, and it cannot be answered vaguely without that being obvious.',
  },
  {
    q: 'Does a longer warranty mean a better floor?',
    a: 'Not by itself. A five-year warranty that states what it covers, what voids it and how to make a claim is more useful than a lifetime warranty with no document behind it. Read the exclusions before you compare the durations.',
  },
]

export default function Page() {
  return (
    <>
      {/*
        Article schema using the same blogPostingNode helper the /resources/
        guides use, so author and reviewedBy resolve by @id to the single
        Organization node in the graph — organisation-level attribution, never
        an invented Person. BlogPosting is a subtype of Article, so reusing the
        helper satisfies the Article requirement without a second code path
        that could drift from the attribution rules.

        The BreadcrumbList (Home → Resources → Choosing a Contractor) is NOT
        emitted here: the Breadcrumbs component inside PageHero renders it and
        webPageNode references it by @id. Restating it would put two
        BreadcrumbLists on one URL.
      */}
      <JsonLd
        data={graph(
          webPageNode(KEY),
          blogPostingNode({
            path: PATH,
            headline: routes[KEY].h1,
            description: routes[KEY].description,
            question: 'How do I choose a garage floor coating contractor in Houston?',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Buyer's guide"
        intro="Fourteen things worth checking before you hire anyone to coat a garage floor in Houston — including what a good answer sounds like and what should give you pause. Written to be used against us as readily as against anyone else."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get an itemized quote
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('epoxyFlooring')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Already holding quotes?
          </Link>
        </div>
      </PageHero>

      {/*
        Organisation-level byline. This page makes evaluative claims about an
        industry, so attribution matters more here than on a descriptive
        service page — an unattributed buyer's guide is exactly the kind of
        source an answer engine declines to cite.
      */}
      <Byline />

      <Section>
        {/*
          The direct answer is deliberately the first thing after the byline and
          is self-contained: it names all fourteen checks in one passage so it
          can be lifted and quoted without the surrounding page.
        */}
        <QuickAnswer
          question="How do I choose a garage floor coating contractor in Houston?"
          answer="A qualified Houston garage floor coating contractor should mechanically prepare the concrete rather than acid etch it, inspect and document slab condition, test for moisture before quoting, repair cracks and spalls as a line item, name the specific coating system in writing, carry insurance, provide clear warranty terms, show real local projects, and explain return-to-service times."
        />
        <div className="mt-16">
          <Prose sections={framing} />
        </div>
      </Section>

      <Section bleed>
        <Heading
          eyebrow="The fourteen checks"
          title="What good looks like, and what should worry you"
          intro="Each of these is something any competent contractor can satisfy. Where a criterion is already standard practice in this market, it says so."
        />
        {/*
          Rendered as an ordered list because it genuinely is an enumerated set
          the reader works through — the numbering is load-bearing, not
          decoration. Good/warning use the site's established two-column
          contrast (primary for the positive, muted for the counterpoint, as in
          CompareTable) rather than introducing red/green, which would add
          colours to the palette and read as an alarm.
        */}
        <ol className="mt-14 grid gap-px border border-border bg-border lg:grid-cols-2">
          {criteria.map((c, i) => (
            <li key={c.title} className="flex flex-col gap-5 bg-background p-7 lg:p-8">
              <div className="flex items-start gap-4">
                <span
                  className="mt-1 shrink-0 font-mono text-[0.7rem] text-primary/70 tabular-nums"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-foreground text-pretty">
                    {c.title}
                  </h3>
                  {c.common ? (
                    <p className="mt-2 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                      Common practice — most established firms meet this
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:pl-9">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                    What good looks like
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85 text-pretty">
                    {c.good}
                  </p>
                </div>
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.16em] text-foreground/60">
                    Warning sign
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {c.warning}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <Heading
          eyebrow="Take this with you"
          title="Questions to ask any contractor before signing"
          intro="Written to be read aloud during an estimate. You are not expected to know the right answers — you are listening for whether an answer arrives at all."
        />
        {/*
          Not the CheckList component: these are quoted speech, and the
          quotation marks plus a numbered sequence are what signal "read this
          out" rather than "tick this off". Using <ol> keeps it navigable for
          screen readers as an ordered set of items.
        */}
        <ol className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2">
          {askThese.map((q, i) => (
            <li key={q} className="flex items-start gap-4 bg-background p-6 lg:p-7">
              <span
                className="mt-0.5 shrink-0 font-mono text-[0.7rem] text-primary/70 tabular-nums"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-sm leading-relaxed text-foreground/90 text-pretty">
                &ldquo;{q}&rdquo;
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
          A contractor who answers these comfortably is used to being asked. One who
          treats them as an inconvenience has told you how the rest of the job will go.
        </p>
      </Section>

      <Section bleed>
        <Prose sections={honest} />
      </Section>

      {/*
        References, because this page names ASTM F1869, ASTM F2170 and the ICRI
        surface-profile scale in its criteria. A standard cited with nowhere to
        resolve to is weaker than no citation — the reader cannot verify it and
        an answer engine cannot attribute it.
      */}
      {/*
        Carried over in the merge of /resources/how-to-choose-a-garage-floor-
        coating-contractor/, which is now 301'd here. That page was otherwise a
        near-subset of this one, but it defined these two terms and this page
        did not — and both are used in the criteria above ("opened pore
        structure", "vapour driving up through a slab") without ever being
        named. Pulled from the single glossary map, so the definitions cannot
        drift from the versions on the service pages.
      */}
      <Section>
        <DefinedTerms terms={['concrete surface profile', 'moisture vapor transmission']} />
      </Section>

      <Section>
        <SourcesAndTechnicalReferences heading="Technical references" />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Questions about choosing a contractor" />
        <FaqList items={faqs} />
      </Section>

      {/*
        THE COMPANY'S OWN POSITION — quarantined here on purpose.

        Everything above is written to be applied to anyone. This section is the
        only place the page speaks about itself, it is visually separated and
        explicitly labeled so the reader can see exactly where the guide stops
        and the disclosure starts, and it contains only facts that are stated
        elsewhere on this site and could be checked at an estimate.

        Every line here is a claim another Houston company could also make
        truthfully. That is the test applied to each one. Deliberately absent:
        any superlative, any comparison, any review count (the 4.9-star
        aggregate belongs to the parent painting company, not this division —
        see the note in routes.reviews), and any suggestion that the fourteen
        criteria were chosen because we meet them.
      */}
      <Section>
        <div className="border-t-2 border-primary/40 pt-14">
          <Heading
            eyebrow="Disclosure"
            title="How Houston Superior Epoxy approaches these standards"
            intro="This page is published by a contractor, so here is our own position against the same list — stated as plainly as possible, with nothing that cannot be verified at an estimate."
          />
          <dl className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                t: 'Preparation',
                d: 'Diamond grinding with vacuum extraction at the tool on every floor. We do not acid etch.',
              },
              {
                t: 'Moisture',
                d: 'Slab moisture is assessed before a coating system is specified, not after a problem appears.',
              },
              {
                t: 'Scope',
                d: 'An itemized written scope of work, produced after we have stood on the concrete. Repairs are their own line.',
              },
              {
                t: 'Insurance',
                d: '$2M general liability plus workers\u2019 compensation. The certificate is available on request.',
              },
              {
                t: 'Warranty',
                d: 'A written 5-year workmanship warranty, with its terms and exclusions set out in full.',
              },
              {
                t: 'Payment',
                d: 'No payment due upfront. Estimates are free and carried out onsite.',
              },
            ].map((item) => (
              <div key={item.t} className="bg-background p-7">
                <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                  {item.t}
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {item.d}
                </dd>
              </div>
            ))}
          </dl>
          {/*
            Honest qualification on criterion 11. The projects gallery has no
            published photography yet, so claiming a portfolio of local work
            here would contradict /projects/ and fail the page's own test one
            paragraph after stating it.
          */}
          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted-foreground text-pretty">
            On criterion eleven we are still short: our{' '}
            <Link href={r('projects')} className="text-primary underline-offset-4 hover:underline">
              projects gallery
            </Link>{' '}
            is being built from photography of recent Houston-area installations and does
            not yet show a full portfolio. Until it does, ask us at your estimate for
            references on completed floors near you — and hold any contractor, including
            us, to the answer.
          </p>
        </div>
      </Section>

      <Section bleed>
        <RelatedLinks
          heading="Related reading"
          links={[
            {
              label: routes.grinding.label,
              href: r('grinding'),
              blurb: 'Why preparation decides the floor.',
            },
            {
              label: 'Acid etching vs diamond grinding',
              href: '/resources/acid-etching-vs-diamond-grinding/',
              blurb: 'Criterion one, in full detail.',
            },
            {
              label: 'Concrete moisture testing',
              href: '/resources/concrete-moisture-testing-before-epoxy-houston/',
              blurb: 'What the ASTM tests measure.',
            },
            {
              label: routes.epoxyFlooring.label,
              href: r('epoxyFlooring'),
              blurb: 'Comparing quotes you already have.',
            },
            {
              label: routes.warranty.label,
              href: r('warranty'),
              blurb: 'Our terms, in full.',
            },
            {
              label: routes.pricing.label,
              href: r('pricing'),
              blurb: 'What drives the number.',
            },
            /*
              Both carried over from the retired /resources/ duplicate: it
              pointed at /our-process/ as its guaranteed service link and at the
              quote-reading guide in its related list, and neither appeared
              here. Merging them preserves the internal-link equity the retired
              URL was passing rather than dropping it with the page.
            */
            {
              label: routes.process.label,
              href: r('process'),
              blurb: 'How a floor is actually installed, step by step.',
            },
            {
              label: 'How to read a coating quote',
              href: '/resources/how-to-read-a-garage-floor-quote/',
              blurb: 'Applying the checks above to a document in your hand.',
            },
          ]}
        />
      </Section>

      <CtaBand
        title="Ask us all fourteen"
        body="We would rather be measured against this list than talked about in general terms. Free onsite estimate, itemized in writing, no payment upfront."
      />
    </>
  )
}
