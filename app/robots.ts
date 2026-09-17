import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    /*
      /admin holds the lead inbox — customer names, phone numbers and photos of
      their homes. Disallowed here, `noindex` in the page metadata, and password
      gated. Each layer covers a different failure: robots.txt is only a request
      to well-behaved crawlers, `noindex` handles a URL discovered some other
      way, and the password is the one that actually stops a human.
    */
    /*
      /admin holds the private lead inbox. /lp is the paid-traffic funnel: it
      is intentionally kept out of organic search so it cannot compete with the
      real site pages for the same queries or dilute their ranking, and because
      a landing page divorced from the site nav is a poor organic result. It is
      reached only from ad clicks. Both are also `noindex` in page metadata.
    */
    /*
      /app/ and /catalog/ are the printed-QR short URLs. They are redirects to
      the FlakeColor mobile catalog (see next.config.mjs), not pages, so there
      is nothing at either address worth indexing and a crawler following one
      would be sent off-site.

      TRAILING SLASHES ARE REQUIRED HERE. robots.txt matches on raw path
      prefix, so a bare `/app` would also match `/apple-icon.png` and quietly
      disallow the touch icon. `/app/` matches only the redirect, which is the
      canonical form anyway under `trailingSlash: true`.
    */
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/lp', '/app/', '/catalog/'] },
    ],
    /*
      Points at the sitemap index, not a child and not the retired flat
      /sitemap.xml. One reference is correct: a crawler reads the index and
      discovers all five children from it, so listing the children here as well
      would just be the same URLs advertised twice.

      /sitemap.xml still resolves — it 301s to this index (see next.config.mjs)
      so an existing Search Console submission keeps working — but robots.txt
      should advertise the canonical location directly rather than send every
      crawler through a redirect.
    */
    sitemap: `${site.canonical}/sitemap-index.xml`,
    host: site.canonical,
  }
}
