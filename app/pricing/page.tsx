import type { Metadata } from 'next'
import { FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { Estimate } from '@/components/estimate'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { Pricing } from '@/components/pricing'
import { CostFactorTable, LineItems } from '@/components/pricing-detail'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { pricing } from '@/lib/site'

import { PageAnswer } from '@/components/aeo'

const KEY = 'pricing' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: price shopper.

  NO DOLLAR FIGURES ON THIS PAGE. The starting prices it used to publish are
  unconfirmed and are now {{TOKEN}}s in lib/site.ts. Interpolating them would
  render "{{PRICE_PER_SQFT_RANGE}}" to visitors and into the FAQPage rich
  result, so the copy below was rewritten to be genuinely figure-free rather
  than to hold a token.

  The page still has to earn its place for someone who came here to find out
  what a floor costs. It does that by explaining what drives the number and
  what the quote guarantees — which was always the stronger half of the
  argument. See the restore checklist on `pricing` in lib/site.ts.
*/

const body = [
  {
    heading: 'Why we are not publishing a number today',
    paras: [
      'We would rather show you a figure here, and we will once we can stand behind it. What we are not willing to do is publish a starting price we have not re-confirmed, because a number on a website becomes the number you remember — and finding out on the driveway that it was optimistic is exactly the experience this page exists to argue against.',
      `In the meantime, what we can tell you is what a starting rate would assume: ${pricing.assumes}. Almost no real floor matches that description exactly, which is the honest reason a single advertised figure tells you so little.`,
      'A number is only meaningful if the work behind it is defined, and in this trade it usually is not. The same garage can be quoted three ways — a thin single-part product rolled over an etched slab, a mid-grade epoxy on a partially ground floor, and a full diamond-ground system with a polyaspartic topcoat. Those are not competing prices for one job. They are prices for three different jobs, and ours is the third.',
      'So what we publish instead is the variables. If you understand what moves the number, you can compare any two quotes on equal terms — including ours against someone else’s.',
    ],
  },
  {
    heading: 'What you get in writing',
    paras: [
      'Every estimate is itemized. Preparation, repair, the coating system, and any removal appear as separate lines, so you can see what each portion of the work costs rather than being handed one number for everything.',
      'No payment is due upfront. You are not asked for a deposit to hold a date, and there is no charge for the inspection or the quote itself.',
    ],
  },
]

/*
  The quote-comparison argument, kept as prose deliberately.

  Most of this page has been converted to tables and labeled lists because
  answer engines lift those more reliably. This section is the exception: it is
  a line of reasoning, and reasoning does not survive being chopped into
  bullets. The three-quote scenario only lands if the reader follows it from one
  quote to the next, so it stays as connected paragraphs.
*/
const comparison = [
  {
    heading: 'Three quotes, three different jobs',
    paras: [
      'Picture the same two-car garage quoted by three contractors. The first prices a single-part product rolled over an acid-etched slab, finished in an afternoon. The second prices a mid-grade epoxy over a partially ground floor, with the existing coating left in place where it still looks sound. The third prices full diamond grinding across the whole slab, crack and spall repair as separate lines, a full-broadcast flake system and a polyaspartic clear topcoat.',
      'Those three numbers are not competing bids. They are accurate prices for three genuinely different pieces of work with three different service lives, and the cheapest one is cheapest because it contains the least work — not because that contractor found an efficiency the others missed.',
      'The reason this is so hard to see from the outside is that all three floors look similar on the day they are finished. Preparation is invisible once the coating is down. You cannot inspect it, photograph it, or verify it after the fact, which makes it the easiest line for a bid to quietly reduce and the hardest one for a homeowner to check.',
    ],
  },
  {
    heading: 'The four questions that make quotes comparable',
    paras: [
      'Ask every bidder these, and the spread usually explains itself. First: how are you preparing the concrete, specifically — mechanical grinding, or etching? Second: is the existing coating being removed, and if not, why is it safe to bond over it? Third: is the flake broadcast full, to refusal, or a scatter? Fourth: what is the topcoat chemistry, and is it UV stable?',
      'A contractor pricing real preparation will answer all four without hesitation, because those answers are the work. If a bid cannot survive those questions, the gap between it and a higher number is not a discount — it is a difference in scope that you would discover eighteen months later, when the floor starts lifting at the tyre contact patches.',
    ],
  },
]

const faqs = [
  {
    q: 'Why won’t you give me a firm price over the phone?',
    /*
      Published in FAQPage structured data as well as on the page, so a figure
      in this string is a price claim made to Google. Answers the question by
      naming the cost drivers instead.
    */
    a: 'Because the two largest cost drivers are the condition of your slab and whether an existing coating has to come off, and neither is something you can describe accurately over the phone or that we can assess from a photo. What we can do over the phone is walk you through what those factors mean for a floor like yours, and what the itemized quote will break out. The onsite inspection that produces the real number is free, and no payment is due upfront.',
  },
  {
    q: 'Is the cheapest quote ever the right one?',
    a: 'Sometimes, if it is genuinely the same scope of work. Usually the gap between a low quote and a higher one is preparation: grinding is slow, dusty, equipment-intensive work, and it is the easiest thing to skip because the customer cannot see whether it was done properly once the coating is down. Ask every bidder specifically how they are preparing the concrete.',
  },
  {
    q: 'Do you charge for the estimate?',
    a: 'No. The onsite inspection and the written itemized quote are free, and no payment is due upfront if you decide to proceed.',
  },
  {
    q: 'Will the price change after work starts?',
    a: 'Only if we expose something that genuinely changes the scope, which happens mainly on removal jobs where the old coating was hiding the slab. If that occurs, we stop, show you what we found, and give you a revised number before continuing. You will not discover a change on the invoice.',
  },
  {
    q: 'Do you offer financing?',
    a: 'Contact us to discuss payment arrangements for your specific project. Since no payment is due upfront, there is nothing to arrange before the work is scheduled.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Pricing"
        intro="What your floor costs depends almost entirely on what your concrete is doing — far more than on its square footage. So here is exactly what we measure, why each factor moves the cost, and what the written quote guarantees."
      />

      <Section>
        <PageAnswer routeKey={KEY} />
      </Section>

      <Section>
        <Prose sections={body} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="The variables"
          title="What moves the number, and in which direction"
          intro="These are the factors we actually measure during the inspection. Read down the table and you can interrogate any quote you receive — including ours — on equal terms."
        />
        <CostFactorTable />
      </Section>

      {/*
        The "why three quotes differ" section.

        The brief titled this "why three quotes for the same garage differ by
        $2,000". The explanation is kept; the specific dollar figure is not,
        because it is an unverified number about market variance and this page
        has just had every unconfirmed figure stripped out of it. Publishing a
        precise spread we cannot source would reintroduce exactly the problem
        the cleanup fixed — and the argument does not need it, because the point
        is that the three quotes describe different work, not that the gap is
        any particular size.
      */}
      <Section>
        <Heading
          eyebrow="Comparing quotes"
          title="Why three quotes for the same garage differ so widely"
          intro="Not because one contractor is greedy and another is generous. Almost always because they are pricing three different jobs."
        />
        <Prose sections={comparison} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Line by line"
          title="How each part of a floor is quoted"
          intro="Every line that can appear on your estimate, what drives it, and how it is broken out. No figures here yet — what is published is what we can stand behind today."
        />
        <LineItems />
      </Section>

      <Pricing />

      <Section bleed>
        <Heading eyebrow="Questions" title="Pricing and quotes" />
        <FaqList items={faqs} />
      </Section>

      <Estimate />

      <Section>
        <RelatedLinks
          heading="Understand the work behind the number"
          links={[
            { label: routes.grinding.label, href: r('grinding'), blurb: 'The preparation step that drives most of the cost gap.' },
            { label: routes.removal.label, href: r('removal'), blurb: 'The single largest variable in a quote.' },
            { label: routes.repair.label, href: r('repair'), blurb: 'Why repair is quoted as its own line.' },
            { label: routes.epoxyFlooring.label, href: r('epoxyFlooring'), blurb: 'How to compare contractors properly.' },
            { label: routes.process.label, href: r('process'), blurb: 'The nine steps you are paying for.' },
            { label: routes.warranty.label, href: r('warranty'), blurb: 'What the warranty actually covers.' },
          ]}
        />
      </Section>
    </>
  )
}
