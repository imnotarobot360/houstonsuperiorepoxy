import type { Metadata } from 'next'

/*
  Open Graph images, supplied once.

  THE BUG THIS EXISTS TO END. app/layout.tsx declares a default `openGraph`
  with the brand card in `images`. Next.js does NOT deep-merge that: a page
  that exports its own `openGraph` object REPLACES the parent's, so any page
  setting `{ title, description, url }` silently loses the image.

  Five templates did exactly that, which was 34 pages — /contact/, /schedule/,
  all 22 resource articles, all 9 city pages and the project page. More than
  half the indexable site shared to Facebook, LinkedIn, WhatsApp, iMessage and
  Slack as a bare text link, which is the format least likely to be clicked.
  Nothing was broken on the page itself, so nothing ever surfaced it.

  The audit missed most of it too, because it walked the static routes in
  lib/routes.ts and the worst-affected pages are dynamic. scripts/audit-seo.mjs
  now samples a dynamic page per template for that reason.

  USE `og()` FOR EVERY PAGE-LEVEL openGraph. It carries the default image
  unless a page genuinely has a better one of its own.
*/

export const OG_IMAGE = {
  url: '/images/og-card.png',
  width: 1200,
  height: 630,
  alt: 'Houston Superior Epoxy — Strong Floors. Built to Impress.',
} as const

type OpenGraph = NonNullable<Metadata['openGraph']>

/*
  `image` overrides the default for a page that has a real photograph worth
  sharing — a project page, say. It takes a site-relative path; `metadataBase`
  in the layout resolves it to an absolute URL.
*/
export function og(
  fields: { title: string; description: string; url: string; type?: 'website' | 'article' },
  image?: { url: string; alt: string },
): OpenGraph {
  return {
    ...fields,
    images: image ? [{ url: image.url, width: 1200, height: 630, alt: image.alt }] : [OG_IMAGE],
  } as OpenGraph
}
