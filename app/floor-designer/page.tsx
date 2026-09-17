import type { Metadata } from 'next'
import { FaqList, Heading, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { FloorDesigner } from '@/components/floor-designer/floor-designer'
import { catalogEnabled } from '@/lib/catalog'
import { activeBlends, flakeBlends } from '@/lib/content/flake-blends'
import { coverPhoto, projectForBlend } from '@/lib/content/projects'
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

  The honesty bar is identical to /colors/: the preview is explicitly stylized,
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
      'Start with the part you actually care about — the colour. Pick a flake blend and it drops onto a stylized garage floor so you can see how light or dark it reads before anything else. Then tell us two things about the space and you get an honest starting estimate, not a number invented to win a click.',
      'The blend you land on here is a shortlist, not a final answer. We bring the physical sample boards to your free inspection and look at them on your own slab, under your own light, because that is the only place the colour is real.',
    ],
  },
  {
    heading: 'Why the lighting toggle matters',
    paras: [
      'The single most common colour regret in a garage is a dark blend chosen in a bright showroom and installed in a space with one bulb and no windows. Flip the preview to "one bulb" and you will see why we push mid-tone, multi-colour blends for working garages — they hold up under the light you actually have and hide dust and tire marks between cleanings.',
    ],
  },
]

const faqs = [
  {
    q: 'Is the preview what my floor will actually look like?',
    a: 'No — it is a stylized preview to help you narrow down, not a rendering of your finished floor. The blend images are real manufacturer photos of loose flake; on a real floor the chips sit in a pigmented base under a clear topcoat, so the surface reads slightly darker and calmer. We bring physical boards to your inspection and choose the final colour on your own slab.',
  },
  {
    q: 'Where does the price come from?',
    a: 'The same gated estimate engine as our main estimator. When your size and slab condition qualify for a known starting point, you see it; otherwise it is priced after the free onsite inspection. We do not show invented dollar ranges, because the concrete condition is what moves the number and we cannot see that from a form.',
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

/*
  Real installed floors, keyed by blend slug.

  Built HERE rather than inside the designer because lib/content/projects reads
  content/projects from disk — importing it into a client component would break
  the build. The designer is a client component, so it receives the finished map.

  Only blends with both a published project and an area name qualify: the tile is
  captioned "Installed — <area>", and a caption with nothing in it is worse than
  falling back to a render.
*/
function installedByBlend() {
  const out: Record<string, { src: string; alt: string; neighborhood: string }> = {}
  for (const b of flakeBlends) {
    if (b.installedPhoto) {
      out[b.slug] = b.installedPhoto
      continue
    }
    const project = projectForBlend(b.name)
    const photo = project ? coverPhoto(project) : undefined
    if (project?.neighborhood && photo) {
      out[b.slug] = { src: photo.src, alt: photo.alt, neighborhood: project.neighborhood }
    }
  }
  return out
}

export default function Page() {
  const installed = installedByBlend()

  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Design tool"
        intro={`Preview any of our ${activeBlends.length} stocked flake blends on a garage floor, see how each reads in bright and dim light, then get an honest starting estimate and book a free onsite inspection — all in one place.`}
      />

      <Section bleed>
        {/*
          FloorDesigner is a client component and FLAKECOLOR_URL is server-only,
          so the flag is read here and passed down — see lib/catalog.ts.
        */}
        <FloorDesigner catalogEnabled={catalogEnabled} installed={installed} />
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
