import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { CheckList, Prose, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { graph, webPageNode } from '@/lib/schema'
import { routes } from '@/lib/routes'
import { site } from '@/lib/site'

const KEY = 'accessibility' as const
const meta = routes[KEY]

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.path },
}

/*
  Accessibility statement.

  Claims conformance "substantially meets" rather than "fully conforms" — the
  honest wording when no formal third-party audit has been performed, and the
  wording that does not manufacture legal exposure. The measures listed are
  ones actually implemented in this codebase, and the known limitations
  section exists because a statement with no limitations reads as untested.
*/
export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Legal"
        intro="We want this site usable by everyone, including visitors using a screen reader, keyboard navigation, or magnification. Here is where we stand, honestly."
      />

      <Section>
        <Prose
          sections={[
            {
              heading: 'Our target',
              paras: ['We build to the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA. Our assessment is that this site substantially meets that standard. We say "substantially" deliberately rather than claiming full conformance, because no independent third-party audit has been carried out — and a statement claiming perfection is not a statement you can trust.'],
            },
          ]}
        />
      </Section>

      <Section bleed>
        <h2 className="text-2xl tracking-tight sm:text-3xl">Measures actually in place</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground text-pretty">
          These are implemented in the site as built, not aspirations:
        </p>
        <div className="mt-8">
          <CheckList
            items={[
              'Semantic HTML landmarks — header, nav, main and footer — so assistive technology can skip between regions.',
              'A single H1 per page with a logical heading order beneath it, never chosen for visual size.',
              'Every interactive control is a real button or link, reachable and operable by keyboard alone.',
              'Visible focus indicators are preserved rather than removed for aesthetics.',
              'The FAQ uses native details and summary elements, so it expands with a keyboard and is readable with JavaScript disabled.',
              'Text alternatives on informative images; decorative images are hidden from screen readers instead of being announced as noise.',
              'Colour contrast targeted at WCAG AA for body text and interface controls.',
              'Colour is never the only way information is conveyed.',
              'Layout reflows to a single column on small screens and tolerates zoom without content being cut off.',
              'Breadcrumb navigation on every subpage, marked up so its structure is announced correctly.',
              'Telephone and email actions use tel:, sms: and mailto: links so they work with device assistive features.',
            ]}
          />
        </div>
      </Section>

      <Section>
        <Prose
          sections={[
            {
              heading: 'Known limitations',
              paras: ['Project photography is presented in before-and-after pairs. We describe what changed in accompanying text, but a photograph of a finished floor cannot fully convey a visual result to a visitor who cannot see it — if you want a floor described to you properly, call us and we will do it in words. We also rely on the browser\'s native handling of some interactions rather than custom widgets, which is generally more accessible but means behaviour can vary slightly between browsers.'],
            },
            {
              heading: 'Third-party content',
              paras: ['This site links to our Google Business Profile and to our parent company. We do not control the accessibility of those external services.'],
            },
            {
              heading: 'Assessment approach',
              paras: ['Accessibility was evaluated by self-assessment during development: keyboard-only navigation, structural review of headings and landmarks, and contrast checking. No formal external audit has been commissioned.'],
            },
            {
              heading: 'Tell us if something blocks you',
              paras: [`If any part of this site is difficult or impossible for you to use, we want to hear about it — that is a defect on our side, not yours. Email ${site.email} or call or text ${site.phone}. Tell us the page and what happened, and we will fix it and reply to you.`],
            },
            {
              heading: 'Getting the same information another way',
              paras: [`Nothing on this site is information you can only get by reading it. Every service description, price range, warranty term and process detail can be explained over the phone, and the estimate itself is an in-person visit. If the website is not working for you, ${site.phone} gets you the same answers from a person.`],
            },
          ]}
        />
      </Section>

      <CtaBand
        title="Prefer to talk it through?"
        body={`Call or text ${site.phone}. Free onsite estimate, no upfront payment, and we will walk your slab with you.`}
      />
    </>
  )
}
