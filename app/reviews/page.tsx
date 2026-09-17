import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import { FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'

const KEY = 'reviews' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  CRITICAL, AND STRICTER THAN BEFORE.

  No invented testimonials, reviewer names or locations — and now NO RATING
  NUMBER AND NO REVIEW COUNT either. The 4.9 / 200+ aggregate this page used to
  publish is Houston Superior PAINTING's. Attributing it to the epoxy division
  was false attribution, in the page copy and in the AggregateRating markup
  that has since been removed from lib/schema.ts.

  Stating the corporate relationship is fine and accurate. Implying the parent's
  reviews are this division's is not — so the copy below names the relationship
  without borrowing the reputation.

  Do not add Review or AggregateRating structured data sourced from our own site.
*/

const body = [
  {
    heading: 'Part of Houston Superior Painting',
    paras: [
      `${site.company} is the concrete coatings division of ${site.parentCompany}, an established Houston painting contractor. The coatings crews, the equipment and the warranty described on this site are ours.`,
      'Our coatings work is reviewed on its own Google Business Profile, linked on this page. We would rather point you there and let you read what is actually posted than quote a figure at you — a number typed onto a website is only as current as the day someone typed it.',
    ],
  },
  {
    heading: 'Why we do not reprint reviews here',
    paras: [
      'A hand-picked quote on a company’s own website is worth very little, because the company chose it. There is no way for you to tell what was left out, whether the person exists, or whether the words were edited.',
      'So we send you to the source instead. On Google you get all of them, in full, in the reviewer’s own words, including any that are less than glowing. That is a meaningfully stronger signal than a curated carousel.',
    ],
  },
  {
    heading: 'What tends to come up',
    paras: [
      'Rather than characterise our own reviews, we would rather tell you what to look for when you read them. Pay attention to comments about preparation and cleanliness, about whether the crew showed up when they said they would, and about how the floor looked a year later. Those are the things that separate coating contractors.',
      'If you want something stronger than reviews, ask us at the estimate for references on completed floors near you. In most of our service area we can point you at a job within a few miles.',
    ],
  },
]

const faqs = [
  {
    q: 'Where can I read your reviews?',
    a: 'On our Google Business Profile, linked throughout this page. We deliberately do not reproduce selected quotes on this site, because a testimonial chosen by the company being reviewed does not tell you much. Google shows you all of them, unedited.',
  },
  {
    /*
      Replaces "Is the 4.9 rating current?" — a question that only made sense
      while the page asserted a rating. This answers the relationship question
      a reader will genuinely have instead, and answers it accurately.
    */
    q: 'Are these the same reviews as Houston Superior Painting?',
    a: `No. ${site.company} is the concrete coatings division of ${site.parentCompany}, and each has its own Google Business Profile. The link on this page goes to the coatings profile, so what you read there is reviews of coatings work rather than of the painting business.`,
  },
  {
    q: 'Can I speak to a previous customer?',
    a: 'Yes. Ask at your estimate and we will arrange references for completed floors in your area. This is the strongest form of proof available and we would rather offer it than ask you to trust a quote on a webpage.',
  },
  {
    q: 'Do you have reviews anywhere else?',
    a: 'Google is where the bulk of our reviews live, and our Google Business Profile is the one we link to here. If you find us listed elsewhere, treat Google as authoritative.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Reputation"
        intro="Our coatings work is reviewed on its own Google Business Profile. Rather than reprint the flattering ones here, we link you to all of them."
      />

      {/*
        The <Reviews /> card was removed from THIS page only — it still runs on
        the homepage, where it is the sole mention of reviews.

        Once the rating figure came out of it, the card said exactly what the
        hero and the first body section already say (parent company, plus a link
        to the profile) three times within one screen. Its own py-24 also
        stacked with the Section below it into a large empty band, which is what
        made the repetition so conspicuous. The profile link it carried is
        preserved below so the page keeps its one real call to action.
      */}
      <Section>
        <Prose sections={body} />
        <div className="mt-10">
          <a
            href={site.googleBusinessProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            Read our Google reviews
            <ArrowUpRight size={16} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Reviews and references" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Ask for a reference near you"
        body="Reviews are useful, but a floor you can go and look at is better. Mention it at your free onsite estimate and we will tell you what we have completed nearby."
      />

      <Section>
        <RelatedLinks
          heading="Continue reading"
          links={[
            { label: routes.about.label, href: r('about'), blurb: 'Who we are and how we are insured.' },
            { label: routes.warranty.label, href: r('warranty'), blurb: 'What is guaranteed in writing.' },
            { label: routes.projects.label, href: r('projects'), blurb: 'Completed floors as we photograph them.' },
            { label: routes.process.label, href: r('process'), blurb: 'The method behind the reviews.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'How quoting works.' },
            { label: routes.schedule.label, href: r('schedule'), blurb: 'Book a free estimate.' },
          ]}
        />
      </Section>
    </>
  )
}
