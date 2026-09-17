import type { Metadata } from 'next'
import {
  CardGrid,
  CheckList,
  FaqList,
  Heading,
  Prose,
  RelatedLinks,
  Section,
} from '@/components/blocks'
import { CatalogButton } from '@/components/catalog-cta'
import { ShortlistBar } from '@/components/shortlist/shortlist-bar'
import { catalogEnabled } from '@/lib/catalog'
import { CtaBand } from '@/components/cta-band'
import { FlakeBlendGrid } from '@/components/flake-blend-grid'
import { JsonLd } from '@/components/json-ld'
import { MaterialSample } from '@/components/material-sample'
import { PageHero } from '@/components/page-hero'
import { activeBlends } from '@/lib/content/flake-blends'
import { r, routes } from '@/lib/routes'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { finishSamples } from '@/lib/site'

import { PageAnswer } from '@/components/aeo'

const KEY = 'colors' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/*
  INTENT: someone choosing an appearance.

  This page now publishes the real stocked blend range, because the owner
  supplied genuine manufacturer photographs of the blends we actually carry.
  That is the bar: real product photos of real stocked blends. Invented blend
  names, guessed hex swatches or AI-generated chip images would all still be
  fabrication and must not appear here.

  What did NOT change is the argument underneath. A backlit photo of loose
  flake is not the colour of a finished floor — different lighting, and on a
  real floor the chips sit in a base coat under a topcoat rather than packed
  loose. So the grid is framed for narrowing down, and final selection still
  happens against physical boards on the customer's own slab. See the note at
  the top of lib/content/flake-blends.ts for the full reasoning.
*/

const considerations = [
  {
    tag: 'Light',
    title: 'How much light the space gets',
    body: 'A dark blend in a garage with one bulb and no windows will read as near-black and make the space feel smaller. Lighter blends bounce what light you have. This is the single most common regret, and it is entirely avoidable by looking at samples in the actual room.',
  },
  {
    tag: 'Maintenance',
    title: 'What you want to stop noticing',
    body: 'Mid-tone multi-colour blends hide dust, tire marks and footprints better than anything else, because the visual noise breaks up what would otherwise read as a smudge on a flat field. If you want a floor that looks clean between cleanings, this matters more than the exact colour.',
  },
  {
    tag: 'Contrast',
    title: 'What the walls and door are doing',
    body: 'The floor is the largest single surface in a garage. A blend that looks excellent on a sample board can fight with a beige wall and a white door. We look at the whole space, not just the slab.',
  },
  {
    tag: 'Scale',
    title: 'Flake size changes the character',
    body: 'The same colour mix in a larger chip reads bolder and more granular; in a smaller chip it reads closer to a solid, more uniform surface from standing height. Two blends with identical colours can look like different products.',
  },
  {
    tag: 'Sun',
    title: 'Exterior exposure',
    body: 'On patios and pool decks, lighter tones stay meaningfully cooler underfoot in Houston summers. There is also a UV-stability question, which is a topcoat decision rather than a colour one.',
  },
  {
    tag: 'Resale',
    title: 'Whether you are selling',
    body: 'If the floor is going in ahead of a sale, a neutral mid-tone blend is the safer choice. Bold metallics photograph well and are genuinely striking, but they are a stronger personal statement than some buyers want.',
  },
]

const howToChoose = [
  'We bring physical sample boards to your estimate — not a printed brochure and not a screen.',
  'Samples get looked at in the actual space, under the lighting that room really has.',
  'We put them on the floor and step back, because a chip held at eye level tells you very little.',
  'We look at them next to your walls, door and trim rather than in isolation.',
  'Nothing is ordered until you have seen the blend in the room it is going into.',
] as const

/*
  Sits beside the "selection happens on your slab" checklist. Replaces the
  PendingBlock that used to occupy this column, so the layout keeps its
  two-column balance now that the blend range is published.
*/
const narrowing = [
  {
    heading: 'Come to the estimate with a shortlist',
    paras: [
      'Three or four blends is the ideal number to have in mind. That is enough for us to bring the right boards and enough for you to compare properly in the room, without the paralysis of looking at the whole range on a driveway.',
      'If you are not sure, tell us the tone and family — "mid-tone, warm" or "dark, cool grey, no brown" — and we will bring a focused set. Narrowing by tone first is faster than picking a favourite name.',
    ],
  },
]

const body = [
  {
    heading: 'How to read the blends below',
    paras: [
      'Every image on this page is a real manufacturer photograph of a blend we actually stock. Use them to work out the direction you are leaning — cool grey or warm earth, light or dark, busy or restrained. That narrowing is genuinely useful and it is most of the decision.',
      'What these photos cannot do is tell you the finished colour of your floor, for three reasons. Your monitor brightness and colour profile shift what you are seeing. The photos show loose flake packed tightly, whereas on a real floor the chips sit in a pigmented base coat under a clear topcoat, so the surface usually reads slightly darker and calmer. And they are shot close, so the chips look larger than they will from standing height.',
      'So treat the grid as a shortlist, not a final answer. We bring the physical boards to your estimate and put them on your own slab, under your own light, before anything is ordered.',
    ],
  },
  {
    heading: 'Colour is the last decision, not the first',
    paras: [
      'Which system you install — flake, metallic or solid colour — determines what colour options exist at all. A full-broadcast flake floor is chosen from blends; a metallic is a pigment-and-technique decision with a much less predictable result; a solid colour is a straightforward pick with nothing to hide imperfections behind.',
      'So it is worth settling the system question first. Once that is decided, the colour conversation is short and much easier.',
    ],
  },
]

const faqs = [
  {
    q: 'Can I see the colour options before the estimate?',
    a: 'Yes — every blend we stock is shown on this page, grouped light to dark. Use them to build a shortlist of three or four. What we would still rather not do is let you choose finally from a screen, because monitor calibration and the loose-flake photography both shift the colour; we bring the physical boards and look at them on your slab.',
  },
  {
    q: 'Which blend hides dirt best?',
    a: 'A mid-tone blend with several colours in it. Very dark and very light finishes both show everything; a busy mid-tone gives dust and tire marks nothing clean to contrast against. From the range on this page, Creekbed, Cabin Fever, Outback and Madras are the ones doing the most visual work in that respect. This is usually the practical answer for a working garage.',
  },
  {
    q: 'Do the photos on this page match the finished floor exactly?',
    a: 'No, and it is worth being direct about that. They are real manufacturer photographs of the blends we stock, so the colours and chip mix are accurate to the product — but they show loose flake packed tightly, whereas on your floor the chips sit in a pigmented base coat under a clear topcoat. The finished surface usually reads slightly darker and calmer than the chip photo, and the chips look smaller from standing height than they do in a close crop.',
  },
  {
    q: 'Can I match my floor to a specific colour?',
    a: 'Within limits. Flake blends are made from stocked chip colours, so an exact match to an arbitrary paint colour is generally not possible, though we can often get close in family and tone. Solid colour systems give you far more precision if matching is the priority.',
  },
  {
    q: 'Will the colour fade?',
    a: 'That depends on the topcoat rather than the pigment. An aromatic epoxy topcoat will amber and chalk under UV exposure; a UV-stable polyaspartic topcoat will not. On any floor with sun exposure — a patio, a pool deck, or a garage that sits with the door open — the topcoat chemistry is the deciding factor.',
  },
  {
    q: 'Can I change my mind after the estimate?',
    a: 'Yes, up until the material is ordered for your job. Tell us as soon as you know, and we will confirm what the cutoff is for your specific schedule.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY), faqNode(PATH, faqs))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Appearance"
        intro={`All ${activeBlends.length} vinyl flake blends we stock, grouped by how light or dark they read. Use these to narrow down the direction you want — then we bring the physical boards to your estimate and look at them on your own slab, because a screen is not the colour of a finished floor.`}
      />

      {/*
        Directly below the intro, above everything else on the page: someone who
        already knows they want to browse blends on their phone should not have
        to scroll the full explainer to find out they can. Renders nothing while
        FLAKECOLOR_URL is unset — see components/catalog-cta.tsx.
      */}
      <CatalogButton enabled={catalogEnabled} />

      <Section>
        <PageAnswer routeKey={KEY} />
      </Section>

      <Section>
        <Prose sections={body} />
      </Section>

      <Section bleed>
        <Heading
          eyebrow="Choosing"
          title="Six things that decide whether you like the floor in a year"
          intro="Colour regret in a garage almost always traces back to one of these, and every one of them is easy to check with a sample board in the room."
        />
        <CardGrid items={considerations} cols={3} />
      </Section>

      {/*
        Two variables that the blend name cannot carry. A visitor can pick
        "Stonehenge" off the grid below and still end up with a floor they did
        not expect, because sheen and chip size change the read of an identical
        blend far more than most people assume. Labeled material samples, not
        project photography — see the note above finishSamples in lib/site.ts.
      */}
      <Section>
        <Heading
          eyebrow="Beyond the blend"
          title="Two things the blend name does not tell you"
          intro="Sheen and chip size are chosen separately from colour, and they change the finished look of the same blend more than the colour family does. Both are easier to see side by side than to describe."
        />
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {[finishSamples.sheen, finishSamples.flakeSize].map((s) => (
            <MaterialSample
              key={s.src}
              src={s.src}
              alt={s.alt}
              kind={s.kind}
              caption={s.caption}
            />
          ))}
        </div>
      </Section>

      {/*
        The stocked range. Replaces the "Awaiting real data" PendingBlock that
        stood here until the owner supplied genuine manufacturer photographs of
        these blends.
      */}
      {/*
        Fixed to the bottom of the viewport, so it is placed here only for
        document order — it appears once a blend is saved and is invisible
        otherwise. See the positioning note in the component.
      */}
      <ShortlistBar />

      <Section bleed id="blends">
        <Heading
          eyebrow="The range"
          title={`${activeBlends.length} stocked flake blends`}
          intro="Grouped light to dark, because that is the decision that most often gets regretted. Colour family is noted on each so you can tell a cool grey from a warm earth tone at a glance."
        />
        <FlakeBlendGrid />
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Heading eyebrow="How it works" title="Selection happens on your slab" />
            <CheckList items={howToChoose} className="mt-10" />
          </div>
          <div className="lg:pt-4">
            <Prose sections={narrowing} />
          </div>
        </div>
      </Section>

      <Section bleed>
        <Heading eyebrow="Questions" title="Colours and blends" />
        <FaqList items={faqs} />
      </Section>

      <CtaBand
        title="We will bring sample boards to your estimate"
        body="Tell us the space and the direction you are leaning and we will bring a focused set of physical samples to look at on your own floor, under your own light. The visit is free."
      />

      <Section>
        <RelatedLinks
          heading="Decide the system first"
          links={[
            { label: routes.flake.label, href: r('flake'), blurb: 'Chosen from blends — the most common choice.' },
            { label: routes.metallic.label, href: r('metallic'), blurb: 'A technique, not a colour pick.' },
            { label: routes.solidColor.label, href: r('solidColor'), blurb: 'Maximum colour precision, nothing to hide behind.' },
            { label: routes.polyaspartic.label, href: r('polyaspartic'), blurb: 'The topcoat that decides whether colour fades.' },
            { label: routes.patio.label, href: r('patio'), blurb: 'Where lighter tones stay cooler underfoot.' },
            { label: routes.schedule.label, href: r('schedule'), blurb: 'Book the visit and see the samples.' },
          ]}
        />
      </Section>
    </>
  )
}
