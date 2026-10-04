import type { Metadata } from 'next'
import { FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { FloorDesigner } from '@/components/floor-designer/floor-designer'
import { catalogEnabled } from '@/lib/catalog'
import { isProviderConfigured } from '@/lib/visualizer/provider'
import { activeBlends } from '@/lib/content/flake-blends'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'

const KEY = 'floorDesigner' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: someone who wants to SEE it before they commit — the design-first
  entry point, as opposed to the question-first estimator.

  The honesty bar is identical to /colors/: every preview is labelled as an AI
  edit of the visitor's own photograph and never as a finished floor,
  the pricing is the same gated engine (no invented number appears that the main
  estimator wouldn't), and final colour is still chosen from physical boards on
  the customer's own slab. The whole flow reuses the real lead + scheduler
  backend, so a booking here lands in Postgres, /admin/leads and info@ like any
  other lead.
*/

const body = [
  {
    heading: 'Design first, then price it',
    paras: [
      'Start with the part you actually care about — the colour. Pick a flake blend, then upload a photo of your garage and see that blend on your own floor before anything else. Then tell us how big the garage is and you get a rough estimate with the arithmetic shown, not a number invented to win a click.',
      'The blend you land on here is a shortlist, not a final answer. We bring the physical sample boards to your free inspection and look at them on your own slab, under your own light, because that is the only place the colour is real.',
    ],
  },
  {
    heading: 'Why your own lighting matters',
    paras: [
      'The single most common colour regret in a garage is a dark blend chosen in a bright showroom and installed in a space with one bulb and no windows. That is exactly why the preview works from a photo of your garage rather than a showroom shot, and why we push mid-tone, multi-colour blends for working garages — they hold up under the light you actually have and hide dust and tire marks between cleanings.',
    ],
  },
]

const faqs = [
  {
    q: 'Is the preview what my floor will actually look like?',
    a: 'No — it is an AI preview to help you narrow down, not a rendering of your finished floor. It edits your photo to show roughly how a blend reads in that space. On a real floor the chips sit in a pigmented base under a clear topcoat and are broadcast by hand, so the finished surface reads slightly darker and calmer and will never match the preview chip for chip. We bring physical boards to your inspection and choose the final colour on your own slab.',
  },
  {
    q: 'Where does the price come from?',
    a: 'Square footage times $4.50, with a $1,000 minimum on any garage. That is the whole calculation and the page shows you every step of it. It is a rough estimate, not a quote: nothing in that arithmetic can see your concrete, so removing an old coating, repairing or moisture-treating the slab, or coating stem walls and steps may change the final price. We confirm it in writing after the free onsite inspection.',
  },
  {
    q: 'What happens after I submit?',
    a: 'Your details are saved and you pick a two-hour arrival window for a free onsite inspection right here — no third-party scheduler. We confirm by phone, bring sample boards of your shortlist, and put the final scope and price in writing. There is no payment up front.',
  },
  {
    q: 'Can I change the blend later?',
    a: 'Yes, right up until the material is ordered for your job. The preview is for narrowing down; nothing is locked in by using it.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Design tool"
        intro={`Pick from our ${activeBlends.length} stocked flake blends, upload a photo of your garage to see one on your own floor, then get a rough estimate at $4.50 per sq ft and book a free onsite inspection — all in one place.`}
      />

      {/*
        pt-8 only below lg. The shared Section pads py-20, which puts 80px of
        dead space between the end of the intro and the tool on a phone — and
        on this page the tool IS the content, sitting directly under a hero
        that already describes it. Desktop keeps the site-wide lg:py-24, so
        this is a phone-only tightening rather than a page that spaces itself
        differently from every other one.
      */}
      <Section bleed className="pt-8">
        {/*
          FloorDesigner is a client component and FLAKECOLOR_URL is server-only,
          so the flag is read here and passed down — see lib/catalog.ts.

          Same shape for the photo visualizer: FLOOR_VIZ_API_KEY is server-only
          and must never reach the browser, so the question "is a provider
          configured" is answered here and only the ANSWER is sent down. Read
          at render on the server, which for this static page means a redeploy
          is needed after setting the variables — already the documented
          expectation in lib/visualizer/provider.ts.
        */}
        <FloorDesigner catalogEnabled={catalogEnabled} photoPreviewEnabled={isProviderConfigured()} />
      </Section>

      <Section>
        <Prose sections={body} />
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="How the designer works" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="Prefer to see the full color range first?"
        body="Every blend we stock is on the colors page, grouped light to dark. Build a shortlist there, then come back and preview your favorites on the floor."
      />

      <Section>
        <RelatedLinks
          heading="Keep going"
          links={[
            { label: routes.colors.label, href: r('colors'), blurb: 'All stocked blends, grouped light to dark.' },
            { label: routes.flake.label, href: r('flake'), blurb: 'How the flake system is built up.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'How our pricing actually works.' },
            { label: routes.schedule.label, href: r('schedule'), blurb: 'Book the free onsite inspection.' },
          ]}
        />
      </Section>
    </>
  )
}
