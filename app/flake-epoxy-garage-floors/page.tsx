import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  CardGrid,
  CheckList,
  FaqList,
  Heading,
  Prose,
  RelatedLinks,
  Section,
  Steps,
} from '@/components/blocks'
import { BuyersGuideLink } from '@/components/buyers-guide-link'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { MaterialSample } from '@/components/material-sample'
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, serviceNode, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'
import { finishSamples } from '@/lib/site'

import { AtAGlance, PageAnswer, PageTerms } from '@/components/aeo'

const KEY = 'flake' as const
const PATH = routes[KEY].path

export const metadata: Metadata = {
  title: routes[KEY].title,
  description: routes[KEY].description,
  alternates: { canonical: PATH },
}

/* INTENT: someone who has narrowed to flake and wants to understand the build. */

const layers = [
  { step: '01', text: 'Ground slab — diamond-ground to an open profile so the resin has something mechanical to key into.' },
  { step: '02', text: 'Repairs — cracks, spalls and pitting filled and levelled as their own step, before any coating.' },
  { step: '03', text: 'Base coat — pigmented epoxy, which does the adhesion work and provides the background color.' },
  { step: '04', text: 'Flake broadcast — vinyl chips thrown into the wet base to full refusal, meaning until the surface will not take more.' },
  { step: '05', text: 'Scrape and vacuum — the cured flake layer is scraped back and vacuumed so the surface is even underfoot rather than sharp.' },
  { step: '06', text: 'Polyaspartic topcoat — the clear layer that locks the flake down and takes the traffic, UV and chemical exposure.' },
]

const whyFlake = [
  {
    title: 'It hides what concrete does',
    body: 'A slab is never perfectly uniform, and a solid color shows every variation in it. The visual noise of a flake blend disguises minor imperfections, patch lines and repairs far better than a flat finish.',
    tag: 'Appearance',
  },
  {
    title: 'Texture you can feel',
    body: 'The scraped flake layer leaves a subtle profile rather than a slick surface. That matters in a garage where a wet tire or a spilled bottle would otherwise make a smooth floor genuinely slippery.',
    tag: 'Safety',
  },
  {
    title: 'It disguises dust and tire marks',
    body: 'A dark solid floor shows every footprint and every bit of dust. A multi-tone blend breaks that up visually, which is why flake floors look cleaner between cleanings.',
    tag: 'Day-to-day',
  },
  {
    title: 'Blend controls the whole room',
    body: 'Chip size, color mix and how densely it is broadcast completely change the read of the floor — from a fine, near-uniform speckle to a bold high-contrast terrazzo effect.',
    tag: 'Appearance',
  },
  {
    title: 'Full refusal is the differentiator',
    body: 'Broadcasting to refusal uses substantially more flake than a light scatter. It is the single biggest visual and cost difference between a proper flake floor and a cheap one that shows base coat through the gaps.',
    tag: 'Build quality',
  },
  {
    title: 'Repairs disappear into it',
    body: 'On a slab that needed crack or spall work, flake is the most forgiving finish available. The same repair under a solid color or metallic is much more likely to remain visible.',
    tag: 'Build quality',
  },
]

const included = [
  'Diamond grinding with dust-control equipment',
  'Crack, spall and pitting repair as an itemized step',
  'Pigmented epoxy base coat',
  'Flake broadcast to full refusal',
  'Scrape and vacuum of the cured flake layer',
  'Polyaspartic clear topcoat',
  'Stem walls and curbs on request, itemized separately',
  'Written 5-year workmanship warranty',
]

const detail = [
  {
    heading: 'What "broadcast to refusal" actually means',
    paras: [
      'The flake is thrown into the wet base coat by hand, continuously, until the surface will not accept any more chips — the point of refusal. Done properly the base coat is completely obscured, and what you see is a solid layer of flake rather than chips scattered across a colored floor.',
      'This is where a lot of quotes quietly differ. A "flake system" broadcast lightly uses a fraction of the material, and you can see the base coat between the chips. It costs less because it is less floor. If you are comparing quotes, ask specifically whether the broadcast is to refusal.',
    ],
  },
  {
    heading: 'Why the floor gets scraped after the flake cures',
    paras: [
      'Flake broadcast to refusal does not land flat. Chips stand up at angles, and the raw cured surface is sharp enough to be unpleasant barefoot and difficult to topcoat evenly.',
      'So once the base has cured with the flake in it, the whole floor is scraped back and thoroughly vacuumed. That knocks down the high edges, produces a consistent profile and gives the topcoat a uniform surface to flow over. Skipping it is why some flake floors feel rough and look uneven.',
    ],
  },
  {
    heading: 'Choosing a blend in your own garage',
    paras: [
      'Flake blends read completely differently under your lighting than they do on a screen or in a showroom. Garage lighting is usually cooler and more directional than the light a sample was photographed in, and the size of the room changes how busy a blend looks.',
      'We bring physical samples to the estimate so the decision gets made in the room the floor is going in, under the light it will actually live under. Blend choice does affect material cost, so it is reflected in the itemized quote rather than assumed.',
    ],
  },
]

const faqs = [
  {
    q: 'What does "broadcast to refusal" mean?',
    a: 'Flake is thrown into the wet base coat until the surface will not take any more. The base coat ends up completely covered, so you see a solid flake layer rather than chips scattered over a colored floor. It uses considerably more material than a light broadcast, and it is the main thing to compare between flake quotes.',
  },
  {
    q: 'Is a flake floor slippery?',
    a: 'The scraped flake layer leaves a subtle texture rather than a slick surface, which is one of the practical reasons it suits garages. If you want more grip than standard — for a wet area or a slope — that is a conversation we have during the estimate.',
  },
  {
    q: 'Can I pick any color combination?',
    a: 'Blends are selected from physical samples we bring to your estimate, so you see them under your own lighting. Chip size, color mix and broadcast density all change how the floor reads, and they do affect material cost, which shows on the itemized quote.',
  },
  {
    q: 'Will the flake come loose over time?',
    a: 'The flake is locked between the base coat it was thrown into and the polyaspartic topcoat over it, so it is encapsulated rather than sitting on the surface. Failure in a flake floor almost always starts at the bond between the base coat and the concrete, which is why the grinding step matters so much.',
  },
  {
    q: 'Does flake hide cracks I have repaired?',
    a: 'It is the most forgiving finish we install in that respect. A repair under a solid color or a metallic finish is much more likely to stay visible; the visual noise of a flake blend disguises patch lines well. The repair still has to be done properly first.',
  },
  {
    q: 'How is this different from a solid color floor?',
    a: 'A solid color is a pigmented coating with no decorative broadcast — simpler, flatter and smoother. Flake adds a texture layer and visual complexity that hides slab imperfections and dust. Both are legitimate; the solid color page covers when it is the better call.',
  },
]

export default function Page() {
  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY),
          serviceNode({
            name: 'Flake Epoxy Garage Floors',
            description: routes[KEY].description,
            path: PATH,
            serviceType: 'Full-broadcast flake floor coating installation',
          }),
          faqNode(PATH, faqs),
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="System detail"
        intro="The system most Houston garages end up with. Vinyl flake broadcast into a wet epoxy base until the surface will not take more, then scraped flat and locked under polyaspartic."
      >
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            See blends at your estimate
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={r('colors')}
            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Blends & colors
          </Link>
        </div>
      </PageHero>

      <Section>
        <PageAnswer routeKey={KEY} />
        {/*
          The labeled spec table belongs in the SAME section as the answer,
          not further down the page: together they are the answer-first
          cluster the brief asks for, and an engine that lifts one usually
          reads the other.
        */}
        <div className="mt-16">
          <AtAGlance routeKey={KEY} />
        </div>
      </Section>

      <Section>
        <Heading
          eyebrow="The build"
          title="Six layers, bottom to top"
          intro="Every one of these is a discrete step. The order is not flexible, and skipping any of them is what produces a floor that fails early."
        />
        <Steps steps={layers} />
      </Section>

      {/*
        "Broadcast to refusal" is the single most load-bearing phrase on this
        page and the easiest one for a competitor to quietly not do, because a
        light broadcast looks acceptable on the day and only shows itself later.
        Worth showing rather than asserting. Labeled material samples, not
        project photography — see the note above finishSamples in lib/site.ts.
      */}
      <Section>
        <Heading
          eyebrow="The detail that matters"
          title="What “broadcast to refusal” actually looks like"
          intro="Refusal means flake is fed into the wet base coat until the surface will not accept another chip. It is the difference between a flake floor and a floor with some flake on it, and it is visible in the coupon long before it is visible in a warranty claim."
        />
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {[finishSamples.broadcast, finishSamples.slipTexture].map((s) => (
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

      <Section bleed>
        <Heading
          eyebrow="Why this system"
          title="What flake does that other finishes do not"
          intro="Six reasons this is the default recommendation for a working residential garage."
        />
        <CardGrid items={whyFlake} />
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading eyebrow="Scope" title="What a flake install includes" />
            <CheckList items={included} className="mt-10" />
          </div>
          {/*
            An ILLUSTRATION of the finished surface, not a job photograph.

            Routed through <MaterialSample> rather than <ImageSlot> on purpose.
            ImageSlot is reserved for real photography of our own work and says
            so in its own header comment; putting a generated image in it would
            have placed an unlabelled render under a heading a reader takes as
            a completed customer floor. MaterialSample stamps a visible
            "Illustration" chip onto the frame instead, so the disclosure is on
            the image where a visitor actually sees it.

            The caption underneath changed with it. It used to promise we were
            "shooting completed installs instead of using a stock image", which
            an illustration sitting directly above it would have made false.
          */}
          <div className="lg:pt-4">
            <MaterialSample
              src={finishSamples.flakeSurface.src}
              alt={finishSamples.flakeSurface.alt}
              kind={finishSamples.flakeSurface.kind}
              caption={finishSamples.flakeSurface.caption}
            />
            <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground">
              The image above is an illustration of the finished surface, not one of our installs —
              photography of completed Houston-area floors is being added to{' '}
              <Link href={r('projects')} className="text-primary underline underline-offset-4">
                the project archive
              </Link>
              . Flake blends also read differently under your own lighting, so confirm a blend
              against a physical sample rather than a screen.
            </p>
          </div>
        </div>
      </Section>

      <Section bleed>
        <Heading
          eyebrow="The detail"
          title="Three things worth understanding"
          intro="These are the points where a flake floor is either built properly or quietly cheapened."
        />
        <div className="mt-14">
          <Prose sections={detail} />
        </div>
      </Section>

      <Section>
        <PageTerms routeKey={KEY} />
      </Section>

      <Section>
        <Heading eyebrow="Questions" title="Flake system questions" />
        <FaqList items={faqs} />
      </Section>

      <Section bleed>
        <BuyersGuideLink className="mb-12" />
        <RelatedLinks
          heading="Compare and continue"
          links={[
            { label: routes.metallic.label, href: r('metallic'), blurb: 'The dramatic alternative.' },
            { label: routes.solidColor.label, href: r('solidColor'), blurb: 'The simpler alternative.' },
            { label: routes.colors.label, href: r('colors'), blurb: 'How blends are selected.' },
            { label: routes.grinding.label, href: r('grinding'), blurb: 'The step underneath all of it.' },
            { label: routes.garageCoatings.label, href: r('garageCoatings'), blurb: 'What the install is like.' },
            { label: routes.pricing.label, href: r('pricing'), blurb: 'What moves the number.' },
          ]}
        />
      </Section>

      <CtaBand />
    </>
  )
}
