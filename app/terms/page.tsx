import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { Prose, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { graph, webPageNode } from '@/lib/schema'
import { routes } from '@/lib/routes'
import { site } from '@/lib/site'

const KEY = 'terms' as const
const meta = routes[KEY]

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.path },
}

/*
  Terms of use for the website only — NOT the contract for the work.

  Kept deliberately separate: the binding agreement for an installation is the
  signed itemized quote, and this page says so explicitly rather than trying
  to pre-empt it. The pricing and warranty sections point at the quote and the
  warranty page instead of restating figures that could then disagree.
*/
export default function Page() {
  return (
    <>
      <JsonLd data={graph(webPageNode(KEY))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Legal"
        intro="These terms cover the use of this website. The agreement for actual work is the itemized quote you sign, not this page."
      />

      <Section>
        <Prose
          sections={[
            {
              heading: 'This website is information, not an offer',
              paras: ['Everything here describes services we provide and how we provide them. Nothing on this site is a binding offer, a fixed price, or a guarantee that a particular system is right for your slab. A floor cannot responsibly be specified or priced without someone standing on the concrete.'],
            },
            {
              heading: 'The quote is the contract',
              paras: ['If you hire us, the agreement is the written itemized quote we produce after the onsite inspection, including its scope, price, schedule and warranty terms. Where anything on this website differs from your signed quote, the quote governs. No payment is due upfront to receive one.'],
            },
            {
              heading: 'Pricing shown here is a range',
              paras: ['Any figures on this site are typical ranges to help you budget, not a quotation. Actual price depends on slab size, the condition of the concrete, whether an existing coating has to be removed, repair work required, and the system specified. Your number comes from the inspection.'],
            },
            {
              heading: 'Estimates',
              paras: ['Onsite estimates are free and carry no obligation to proceed. We do ask that you are the owner of the property or authorised to make decisions about it, since we will be discussing permanent changes to the concrete.'],
            },
            {
              heading: 'Consent to be contacted',
              paras: [`When you submit an estimate request, call, or text ${site.phone}, you are agreeing that we may contact you back at the number and email you gave us, about the project you raised. Message and data rates may apply to texts depending on your carrier plan. Reply STOP to any text to stop receiving them, or just tell us and we will stop.`],
            },
            {
              heading: 'Technical information on this site',
              paras: ['We reference published industry standards and general polymer chemistry to explain why we prepare concrete the way we do. That material is educational. The authority for any specific product — return-to-service times, chemical resistance, moisture tolerance, coverage rates — is the manufacturer\'s current technical data sheet for the system actually installed on your floor, which we provide.'],
            },
            {
              heading: 'Warranty',
              paras: ['Our workmanship warranty runs 5 years and is described on the warranty page, with the operative terms stated in your signed quote. Manufacturer warranties on materials are separate, belong to the manufacturer, and vary by product.'],
            },
            {
              heading: 'Photographs',
              paras: ['Project photographs on this site are of work we performed. Because concrete varies, lighting varies, and decorative systems like metallic epoxy are hand-worked and never repeat exactly, photographs illustrate our work rather than promise an identical result on your slab. Flake and color choices should be confirmed against physical samples in your own light.'],
            },
            {
              heading: 'Intellectual property',
              paras: [`The text, photographs, and design of this site belong to ${site.company} or its parent. You are welcome to read it, quote it with attribution, and share links to it. Republishing it wholesale as your own marketing is not permitted.`],
            },
            {
              heading: 'Limitation of liability',
              paras: ['This website is provided as-is. We take care to keep it accurate, but we are not liable for decisions made purely on the basis of website content without an inspection — which is precisely why we insist on inspecting before quoting. Liability for work we actually perform is governed by your signed quote and our insurance, not by this page.'],
            },
            {
              heading: 'Governing law',
              paras: ['These terms are governed by the laws of the State of Texas, and any dispute about the website is subject to the jurisdiction of the courts serving Harris County, Texas.'],
            },
            {
              heading: 'Contact',
              paras: [`Questions about these terms: email ${site.email} or call ${site.phone}.`],
            },
          ]}
        />
      </Section>

      <CtaBand
        title="Ready for a real number instead of a range?"
        body="The onsite estimate is free, itemized in writing, and carries no upfront payment."
      />
    </>
  )
}
