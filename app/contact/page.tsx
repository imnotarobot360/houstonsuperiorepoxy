import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import { CheckList, FaqList, Heading, Prose, Section, SocialProfiles } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { Estimate } from '@/components/estimate'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { faqNode, graph, webPageNode } from '@/lib/schema'
import { r, routes } from '@/lib/routes'
import { site } from '@/lib/site'

const meta = routes.contact

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.path },
  openGraph: { title: meta.title, description: meta.description, url: meta.path },
}

const faqs = [
  {
    q: 'How fast will someone get back to me?',
    a: 'Within one business day for form and email requests. If you call or text during working hours you will usually reach us the same day.',
  },
  {
    q: 'Do I have to be home for the estimate?',
    a: 'For a garage, someone needs to let us in so we can moisture test the slab and check for existing coatings. For commercial work we can coordinate with a property manager or building engineer instead.',
  },
  {
    q: 'Is the estimate really free, with nothing due upfront?',
    a: 'Yes. We inspect the concrete, put an itemized number in writing, and there is no payment due until work is scheduled.',
  },
]

/* Each channel is a real, working contact path. */
const channels = [
  {
    icon: Phone,
    label: 'Call',
    value: site.phone,
    href: site.phoneHref,
    note: 'Fastest during working hours. You will speak with someone who actually installs floors.',
  },
  {
    icon: MessageSquare,
    label: 'Text photos',
    value: site.phone,
    href: site.smsHref,
    note: 'Send a few photos of the slab — corners, any cracks, and the area near the garage door.',
  },
  {
    icon: Mail,
    label: 'Email',
    value: site.email,
    href: `mailto:${site.email}`,
    note: 'Best for commercial scopes, drawings, or anything with attachments.',
  },
]

const prepare = [
  'Roughly 30 to 45 minutes for a typical residential garage.',
  'Access to the whole slab, including corners and behind stored items.',
  'A standard outlet if possible, for moisture testing equipment.',
  'Any quotes you have already received — we are happy to explain them.',
]

const body = [
  {
    heading: 'Why we will not quote over the phone',
    paras: [
      'The two things that decide the price of a concrete floor are invisible until someone tests for them: how much moisture is driving up through the slab, and what is already bonded to the surface.',
      'A number given sight-unseen is a guess that gets revised upward once a crew is standing in your garage. We would rather spend forty minutes onsite and hand you something that does not move.',
    ],
  },
  {
    heading: 'What you get in writing',
    paras: [
      'Preparation, repair, primer, body coat, topcoat and labor listed separately, so you can compare it line by line against anyone else bidding the same slab.',
    ],
  },
]

export default function ContactPage() {
  return (
    <>
      {/*
        ContactPage is applied as the WebPage node's own type rather than added
        as a second node, so this URL is described exactly once.
      */}
      <JsonLd
        data={graph(
          webPageNode({
            path: meta.path,
            name: meta.title,
            description: meta.description,
            type: 'ContactPage',
          }),
          faqNode(meta.path, faqs),
        )}
      />

      <PageHero
        routeKey="contact"
        eyebrow="Contact"
        intro="Call, text, or send the form below. We are a service-area business, so every estimate happens at your property — which is the only way to quote concrete honestly."
      />

      <Section>
        <div className="grid gap-px border border-border bg-border lg:grid-cols-3">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              className="group bg-background p-7 transition-colors hover:bg-secondary lg:p-8"
            >
              <c.icon size={20} className="text-primary" aria-hidden="true" />
              <p className="mt-5 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-2 font-serif text-xl tracking-tight text-foreground group-hover:text-primary">
                {c.value}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                {c.note}
              </p>
            </a>
          ))}
        </div>
      </Section>

      <Section bleed>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Heading
              eyebrow="Hours & coverage"
              title="When and where you can reach us"
              intro="Crews are on jobsites during the day, so a text or the form will often get a faster answer than a call at 2pm."
            />
            <dl className="mt-10 space-y-6">
              <div className="flex gap-4">
                <Clock size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Working hours
                  </dt>
                  <dd className="mt-2 space-y-1 text-muted-foreground">
                    {site.hours.map((h) => (
                      <span key={h.days} className="block">
                        {h.days}: {h.time}
                      </span>
                    ))}
                  </dd>
                </div>
              </div>
              {/*
                Service-area business — NO street address is published, by
                design (see lib/site.ts and lib/schema.ts). So "location" here
                is a text link to our own Google Business Profile, not a map pin
                or an address: the GBP is where Google itself holds the verified
                location for a service-area business, and linking it corroborates
                the entity without implying a walk-in storefront.

                The URL is `site.googleBusinessProfile` (the Houston Superior
                EPOXY listing), never a hardcoded map link — that keeps this in
                step with the same profile used in schema `hasMap`/`sameAs`, and
                avoids re-pointing at the parent painting company's listing.
              */}
              <div className="flex gap-4">
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Service area
                  </dt>
                  <dd className="mt-2 leading-relaxed text-muted-foreground text-pretty">
                    Mobile service across Greater Houston. See the{' '}
                    <Link
                      href={r('serviceAreas')}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      full list of cities we cover
                    </Link>
                    , or{' '}
                    <a
                      href={site.googleBusinessProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      find us on Google
                    </a>
                    .
                  </dd>
                </div>
              </div>
            </dl>
          </div>
          <div>
            <Heading eyebrow="How to prepare" title="Very little is asked of you" />
            <CheckList items={prepare} className="mt-10" />
          </div>
        </div>
      </Section>

      <Section>
        <Prose sections={body} />
      </Section>

      <Estimate />

      <Section bleed>
        <Heading eyebrow="Questions" title="Before you call" />
        <FaqList items={faqs} />
      </Section>

      {/*
        DELIBERATELY NOT ADDED TO `channels` ABOVE.

        That array is documented as "a real, working contact path", and every
        entry in it reaches someone who installs floors — phone, SMS, email.
        Listing Instagram beside them would promise a monitored inbox: social
        DMs are easy to miss, and a quote request sitting unread in a message
        request folder is worse for the customer than never offering the option.

        So the profiles appear here as identity confirmation, below the real
        contact routes, with copy that points anyone wanting an answer back to
        phone or email. Revisit only if someone actually watches the DMs.
      */}
      <Section>
        <SocialProfiles
          heading="Find us elsewhere"
          intro="Our official profiles, if you want to see recent work or confirm we are who we say we are. For an estimate or a question that needs an answer, call or email — those reach us directly."
        />
      </Section>

      <CtaBand
        title="Ready for a real number?"
        body="We will inspect the slab, moisture test it, and give you an itemized written quote. Nothing is due upfront."
      />
    </>
  )
}
