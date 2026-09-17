import type { Metadata } from 'next'
import { PageAnswer } from '@/components/aeo'
import { Section } from '@/components/blocks'
import { Faq } from '@/components/faq'
import { FinalCta } from '@/components/final-cta'
import { Gallery } from '@/components/gallery'
import { Hero } from '@/components/hero'
import { HomeownerReviews } from '@/components/homeowner-reviews'
import { JsonLd } from '@/components/json-ld'
import { Preparation } from '@/components/preparation'
import { Pricing } from '@/components/pricing'
import { Process } from '@/components/process'
import { Reviews } from '@/components/reviews'
import { ServiceArea } from '@/components/service-area'
import { ServiceCards } from '@/components/service-cards'
import { TrustBar } from '@/components/trust-bar'
import { faqs } from '@/lib/site'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'

export const metadata: Metadata = {
  title: routes.home.title,
  description: routes.home.description,
  alternates: { canonical: '/' },
}

/*
  Homepage section order is fixed and intentional:

   1 Utility bar          → app/layout.tsx
   2 Header               → app/layout.tsx (sticky, CTA persists on scroll)
   3 Hero                 → <Hero />
   4 Trust bar            → <TrustBar />
   5 Who we are (answer)  → <PageAnswer routeKey="home" />
   6 Service cards        → <ServiceCards />
   7 Installation system  → <Process />
   8 Why prep matters     → <Preparation />
   9 Before / after       → <Gallery />
  10 Pricing expectations → <Pricing />
  11 Homeowner quotes     → <HomeownerReviews />  (hidden until one is verified)
  12 Reviews              → <Reviews />
  13 Service area         → <ServiceArea />
  14 FAQ                  → <Faq />
  15 Final CTA            → <FinalCta />
  16 Footer               → app/layout.tsx

  One primary CTA per viewport. The only filled `bg-primary` buttons on this
  page are in the hero and the final CTA; every other action is a bordered
  secondary link, so nothing competes.
*/
export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode('home'), faqNode('/', faqs))} />

      <Hero />
      <TrustBar />

      {/*
        Placed here, not higher: the hero's job is conversion, so this sits in
        the first content slot below it — and before the service cards, so the
        definition of who we are precedes the list of what we sell.

        This was the only keyed route with no answer block, which is backwards:
        the homepage fields the broadest queries and is the page an answer engine
        reaches for first.
      */}
      <Section>
        <PageAnswer routeKey="home" />
      </Section>

      <ServiceCards />
      <Process />
      <Preparation />
      <Gallery />
      <Pricing detailHref={r('pricing')} />
      {/*
        Verified homeowner quotes, then the link out to the full profile.

        Order matters: specific evidence first, then the invitation to go read
        everything including what we did not choose. Renders nothing until
        content/reviews.ts has a verified entry, which it does not yet — so the
        page currently goes straight from Pricing to <Reviews /> as before.
      */}
      <HomeownerReviews />
      <Reviews />
      <ServiceArea />
      <Faq />
      <FinalCta />
    </>
  )
}
