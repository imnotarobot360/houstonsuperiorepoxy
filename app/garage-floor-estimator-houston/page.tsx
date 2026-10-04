import type { Metadata } from 'next'
import { EstimatorFunnel } from '@/components/lp/estimator-funnel'
import { EstimatorErrorBoundary } from '@/components/lp/estimator-error-boundary'
import { EstimatorFallback } from '@/components/lp/estimator-fallback'
import { EventDebugger } from '@/components/lp/event-debugger'
import { LpCallBar } from '@/components/lp/lp-call-bar'
import { ProofBar } from '@/components/lp/proof-bar'
import { LpHeader } from '@/components/lp/lp-header'
import { LpHero } from '@/components/lp/lp-hero'
import { LpBeforeAfter, LpServiceArea, LpSystem } from '@/components/lp/lp-sections'

/*
  Instant-estimate landing page — the Meta Ads destination.

  noindex/nofollow for the same reason as /lp/garage-floor: it is a paid-traffic
  page that must not compete with the real site in organic search. It relies on
  the meta robots tag rather than a robots.txt block so crawlers can actually
  read the noindex; the page carries no site chrome (see marketing-chrome.tsx).
*/
export const metadata: Metadata = {
  title: 'Instant Garage Floor Estimate in Houston | Free Onsite Inspection',
  description:
    'Answer 8 quick questions and see a rough garage floor coating estimate at $4.50 per sq ft before you talk to anyone. Free onsite inspection, written proposal, no upfront payment.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/garage-floor-estimator-houston' },
}

export default function GarageFloorEstimatorPage() {
  return (
    <>
      <LpHeader />

      <LpHero />

      {/* The estimator. scroll-mt clears the fixed header on the #estimate jump. */}
      <section id="estimate" className="scroll-mt-24 border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto mb-8 max-w-xl text-center">
            <h2 className="font-serif text-3xl text-foreground text-balance sm:text-4xl">
              See Your Estimate in Under a Minute
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
              Answer a few quick questions to see a rough estimate with the arithmetic shown — no contact details
              required to view it.
            </p>
          </div>

          {/* Honest trust signals above Step 1 (gated reviews — see ProofBar). */}
          <ProofBar />

          {/*
            The boundary guarantees the section is never blank: if the
            interactive estimator throws, the static fallback (form + call/text/
            book) takes its place.
          */}
          <EstimatorErrorBoundary fallback={<EstimatorFallback />}>
            <EstimatorFunnel />
          </EstimatorErrorBoundary>
        </div>
      </section>

      <LpBeforeAfter />
      <LpSystem />
      <LpServiceArea />

      {/*
        Pinned on phones only, where the header has no room for the number.
        It is the page's second phone affordance and its second route into the
        estimator — neither leaves the funnel.
      */}
      <LpCallBar />

      {/* Development-only tracking inspector; renders null in production builds. */}
      <EventDebugger />
    </>
  )
}
