import type { Metadata } from 'next'
import { PageHero } from '@/components/page-hero'
import { Prose, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { graph, webPageNode } from '@/lib/schema'
import { routes } from '@/lib/routes'
import { site } from '@/lib/site'

const KEY = 'privacy' as const
const meta = routes[KEY]

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: meta.path },
}

/*
  A published privacy policy is a hard requirement for running Google Ads and
  Local Services Ads, which is the likeliest paid channel for this business.

  Describes only what this site actually does. The estimate form posts to our
  server (lead stored in Neon, any photos in private Vercel Blob), records
  marketing attribution on the submitted lead, and — depending on configuration
  — is measured by up to three tracking tools: Google Analytics 4, the Meta
  (Facebook) advertising pixel with its server-side Conversions API, and Google
  Tag Manager.

  EVERY tracking claim in the "Analytics and cookies" section is generated from
  the SAME environment variables that switch each tracker on (see the `flags`
  object below). The policy therefore cannot describe a tracker we are not
  running, or stay silent about one we are — including the fact that, when the
  Meta pixel + CAPI are live, hashed contact details are sent to Meta.

  TODO(owner): have counsel review the "Analytics" and "Calls and text
  messages" sections before running paid traffic. The SMS consent wording in
  particular is a TCPA-adjacent claim and is not legal advice.
*/
type TrackingFlags = { ga4: boolean; meta: boolean; capi: boolean; gtm: boolean }

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/*
  Builds the "Analytics and cookies" section from the live tracker flags. Kept
  as a pure function of (flags, email) so the disclosure is a deterministic
  reflection of configuration, not a hand-maintained paragraph.
*/
function trackingSection(flags: TrackingFlags, email: string): { heading: string; paras: string[] } {
  const heading = 'Analytics and cookies'
  const anyClientTracker = flags.ga4 || flags.meta || flags.gtm

  if (!anyClientTracker) {
    return {
      heading,
      paras: [
        'This site does not set advertising cookies and does not currently run a third-party ad pixel, tag manager, or analytics tracker. Your browser and our hosting provider generate ordinary server request logs, which is how the web works at a technical level rather than a tracking programme we operate.',
        'The site does record, together with any estimate request you submit, the page you landed on and any campaign tags or advertising click identifiers in the link you followed. That is attached to your enquiry, not to a browser profile, and it exists only if you choose to submit the form.',
        'If we switch on analytics or advertising measurement, this section changes at the same moment it goes live rather than afterwards.',
      ],
    }
  }

  const named = joinList(
    [
      flags.ga4 && 'Google Analytics 4',
      flags.meta && 'the Meta (Facebook) advertising pixel',
      flags.gtm && 'Google Tag Manager',
    ].filter((x): x is string => Boolean(x)),
  )

  const paras: string[] = [
    `This site uses ${named} to measure how people find and use it. These services set cookies in your browser and assign it a random identifier, so repeat visits can be counted as one person rather than several and an enquiry can be connected to the advertising that brought you here.`,
  ]

  if (flags.ga4) {
    paras.push(
      'Google Analytics 4 records the pages you view and a small set of actions we have chosen to measure — tapping a phone number, viewing and starting the estimate form, submitting it, and how far down a page you scroll. We have configured it so that the contents of your estimate request — your name, number, email, photos and description — are never sent to Google; what is measured is that a submission happened, not what was in it. IP addresses are handled by Google as part of delivering the service and we do not have access to them in a raw form.',
    )
  }

  if (flags.meta) {
    paras.push(
      'The Meta pixel records those same funnel actions in your browser so that Meta can attribute them to an ad you may have seen or clicked on Facebook or Instagram.',
    )
    if (flags.capi) {
      paras.push(
        'When you submit an estimate request or book an inspection, we also send a matching event to Meta directly from our server. So that Meta can connect that event to your ad click, we include your email address, phone number and ZIP code in irreversibly hashed (SHA-256) form — Meta receives a scrambled fingerprint, not the readable values — together with the pixel cookies from your browser, your IP address and your browser type. We do not send your photos, your description of the floor, or the estimate figure to Meta.',
      )
    }
    paras.push(
      `Running the pixel and sending these conversions to Meta may be treated as “sharing” of personal information for cross-context behavioural advertising under laws such as the California CPRA. You can opt out at any time: browser-level tracking protection or an ad blocker stops the pixel from loading, and you can email ${email} to ask that we exclude your enquiry from advertising measurement.`,
    )
  }

  if (flags.gtm) {
    paras.push(
      'Google Tag Manager is a container that loads and manages the measurement tags above. It does not by itself add tracking beyond the tags we place in it, but it does load from Google and uses a small in-page data layer to pass those events through.',
    )
  }

  paras.push(
    'If you would rather not be measured, browser-level tracking protection or an ad blocker will stop these scripts from loading, and the site will continue to work normally — nothing here is gated behind analytics or advertising tools.',
  )

  if (!flags.meta) {
    paras.push('We do not run a third-party advertising pixel, and we do not sell or share analytics data for cross-context behavioural advertising.')
  }

  return { heading, paras }
}

export default function Page() {
  /*
    Read on the server at render time, one flag per tracker, from the exact
    variables the tracker components themselves key off (GA4, Meta pixel/CAPI,
    GTM). The policy and the site's real behaviour therefore cannot drift apart.
  */
  const flags: TrackingFlags = {
    ga4: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    meta: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    capi: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_ACCESS_TOKEN),
    gtm: Boolean(process.env.NEXT_PUBLIC_GTM_ID),
  }

  /*
    The "what we do not do" promise gains an honest carve-out when the Meta
    pixel is live, because CAPI does share hashed identifiers with an ad
    platform — a claim of "we never share" would then be false.
  */
  const doNotShareText = flags.meta
    ? 'We do not sell your information. We do not rent, trade or share it with lead brokers, marketing lists or other contractors. The one exception is the advertising measurement described under “Analytics and cookies” below, where hashed identifiers — never the contents of your request — may be shared with our advertising platform to attribute enquiries to ads.'
    : 'We do not sell your information. We do not rent, trade or share it with lead brokers, marketing lists or other contractors. We do not use it for anything other than the project you contacted us about.'

  return (
    <>
      <JsonLd data={graph(webPageNode(KEY))} />

      <PageHero
        routeKey={KEY}
        eyebrow="Legal"
        intro="This policy explains what we collect when you ask us for an estimate, why we collect it, and what we do not do with it."
      />

      <Section>
        <Prose
          sections={[
            {
              heading: 'What we collect',
              paras: [
                'What you type into an estimate request: your name and phone number, which are the only required fields, plus anything else you choose to give us — email address, ZIP code, the approximate square footage, which space the slab is in, the coating system you are interested in, the current condition of the floor, your timeframe, how you prefer to be contacted, and whatever you tell us in your own words about the floor.',
                'If you attach photos of your floor, we receive those images. Photographs can carry embedded metadata such as the time the picture was taken and, on some phones, GPS coordinates; we do not strip that metadata, so please do not attach a photo you would not want us to hold.',
                'We also record how you arrived at the site alongside your enquiry: the page you landed on, the referring site, and any campaign tags or advertising click identifiers in the link you followed. This tells us which advertising actually produces work, and it is attached to your enquiry rather than held separately.',
                'Nothing on this site requires an account, and we do not ask for payment information at any point — there is no upfront payment to take.',
              ],
            },
            {
              heading: 'How the estimate form works',
              paras: [
                'When you submit the estimate form it is sent to our server and stored in our own database so that a request cannot be lost. Any photos you attach are stored in private file storage that is not publicly reachable — the files are not given public web addresses, and they can only be retrieved by us through an authenticated request.',
                `We reply from ${site.email} or by phone or text to the number you gave us. If you would rather not submit a form at all, calling or texting ${site.phone} reaches the same people and leaves no form record.`,
              ],
            },
            {
              heading: 'Where it is stored and who processes it',
              paras: [
                'Your enquiry is stored on infrastructure operated by our hosting and database providers, who process it on our behalf and under their own security controls rather than for their own purposes. This is ordinary vendor processing: the same relationship as a filing cabinet supplier, except the cabinet is a managed database.',
                'We do not operate our own mailing list software and we do not upload your details into an advertising platform to build audiences.',
              ],
            },
            {
              heading: 'Why we use it',
              paras: ['To reply to you, schedule an onsite inspection, prepare an itemized quote, and carry out work you hire us for. We also keep normal business records of jobs we have completed so we can honor the workmanship warranty on a floor years after it was installed.'],
            },
            {
              heading: 'Calls and text messages',
              paras: [
                `If you call or text ${site.phone}, we keep your number so we can respond and follow up about your project. If you contact us by text, you are consenting to receive replies about your estimate at that number.`,
                'The estimate form has a separate, unticked box asking whether we may text you about your request. It is optional, ticking it is not a condition of getting a quote, and leaving it alone does not stop us replying by phone or email. Message and data rates may apply.',
                'We do not send marketing blasts, and you can tell us to stop contacting you at any time by replying STOP or simply saying so.',
              ],
            },
            {
              heading: 'What we do not do',
              paras: [doNotShareText],
            },
            {
              heading: 'Who else can see it',
              paras: ['Only the people who need it to do the work: our own crew, and any supplier or subcontractor directly involved in your specific job. We may also disclose information where the law requires it — a subpoena, a court order, or a legitimate government request.'],
            },
            /*
              Generated from the live tracker flags (see trackingSection). What
              renders is decided by the env vars that switch GA4, the Meta
              pixel/CAPI and GTM on — not by anyone remembering to edit this file.
            */
            trackingSection(flags, site.email),
            {
              heading: 'Third-party links',
              paras: ['This site links out to our Google Business Profile and to our parent company. Those are separate services with their own privacy practices, and this policy does not govern what they collect once you leave our site.'],
            },
            {
              heading: 'How long we keep it',
              paras: [
                'Estimate enquiries that do not become jobs are kept only as long as they are commercially useful for following up, including any photos you attached. Records of completed work are kept longer, because the workmanship warranty needs to be verifiable against the job that was actually performed.',
                'You can ask us to delete an enquiry and its photos at any point before it becomes a job, and we will do it.',
              ],
            },
            {
              heading: 'Children',
              paras: ['This is a contracting business for property owners and facility managers. The site is not directed at children and we do not knowingly collect information from anyone under 13.'],
            },
            {
              heading: 'Your choices',
              paras: [`You can ask us what we hold about you, ask us to correct it, or ask us to delete it — email ${site.email} or call ${site.phone}. If you ask us to delete records tied to a warrantied floor, understand that we may be unable to verify a future warranty claim without them, and we will tell you that before acting.`],
            },
            {
              heading: 'Changes to this policy',
              paras: ['If our practices change, this page changes with them. Because this policy makes specific negative claims — no data sale, no lead brokers, no advertising pixel — any change to those practices requires this text to be revised in the same update, not at the next convenient moment.'],
            },
          ]}
        />
      </Section>

      <CtaBand
        title="Questions about any of this?"
        body={`Call or text ${site.phone}, or email ${site.email}. A real person here will answer you.`}
      />
    </>
  )
}
