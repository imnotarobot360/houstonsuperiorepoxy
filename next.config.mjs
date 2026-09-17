/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
    The route structure is specified with trailing slashes (/pricing/), which
    is also what lib/routes.ts, the sitemap and every internal link emit.
    Without this, Next.js would 308-redirect every one of those URLs to the
    non-slash form and the canonical/sitemap set would disagree with reality.
  */
  trailingSlash: true,
  /*
    content/projects/ is read from disk at runtime by lib/content/projects.ts.

    /projects/ is a DYNAMIC route (it reads searchParams for the archive
    filters), so its module is evaluated inside a serverless function on each
    request rather than being baked at build time. Next traces the files a
    route needs by following imports, and a runtime fs.readdirSync() of a
    computed path is invisible to that analysis — so without this the JSON and
    the folder simply would not be deployed alongside the function.

    The failure that causes is quiet and confusing: the statically rendered
    pages (homepage, /colors/) would show a published project correctly,
    because they read the files at build time, while /projects/ and the project
    pages would insist the archive is empty. Same data, two answers.
  */
  outputFileTracingIncludes: {
    '/projects': ['./content/projects/**/*'],
    '/projects/[slug]': ['./content/projects/**/*'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    /*
      `unoptimized: true` was here, and it silently defeated the entire image
      pipeline: every next/image on the site shipped the original JPG or PNG at
      full resolution to every device, with no srcset and no format
      negotiation. The `sizes` attributes were being computed and then ignored.

      With optimization on, next/image serves AVIF or WebP based on the
      request's Accept header and picks a candidate from the srcset that
      matches the device — which is what makes the flake-blend grid (23 JPGs)
      and the project photography affordable on a phone.

      Formats are ordered by preference. AVIF is roughly 20% smaller than WebP
      at equal quality but slower to encode; listing both means an older
      browser still gets WebP rather than the original.
    */
    formats: ['image/avif', 'image/webp'],
    /*
      Breakpoints the srcset is generated at. Trimmed from the default set —
      there is no 3840px image on this site, and every extra entry is another
      variant to build and cache for no benefit.
    */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    /* For the small fixed-size images: the flake thumbnails and the logo mark. */
    imageSizes: [64, 96, 128, 256, 384],
    /*
      Optimized variants are immutable — the URL contains the source path and
      the width — so they can be cached for a year rather than the 60-second
      default, which otherwise makes the optimizer re-encode the same flake
      swatch all day.
    */
    minimumCacheTTL: 31_536_000,
  },
  async redirects() {
    return [
      /*
        The old multi-step funnel at /lp/garage-floor/ was replaced by the
        instant-estimate page at /garage-floor-estimator-houston/. Both were
        noindexed paid-traffic destinations, so this exists purely to catch live
        Meta Ads links and any bookmarked URL while the ad destination is
        updated — a dead ad-click URL wastes spend outright.

        The thank-you child is listed FIRST and both are exact, slashless
        sources (matched after `trailingSlash: true` normalisation), consistent
        with every other rule here. 301 for the same cross-tool compatibility
        reason as /book/ below.
      */
      {
        source: '/lp/garage-floor/thank-you',
        destination: '/garage-floor-estimator-houston/',
        statusCode: 301,
      },
      {
        source: '/lp/garage-floor',
        destination: '/garage-floor-estimator-houston/',
        statusCode: 301,
      },

      /*
        /book/ was a second booking page whose buttons handed visitors off to
        the external scheduler. It competed with /schedule/ for the same "book
        an estimate" searches, and worse, it routed people AWAY from the form
        that files a lead in our own database — a booking made there was
        invisible to the lead inbox.

        Folded into /schedule/, which keeps the estimate form primary and still
        offers the scheduler as a secondary option.

        `statusCode: 301` rather than `permanent: true`. `permanent` emits a
        308, and while Google treats 308 as equivalent to 301 for ranking
        purposes, 308 is not universally handled: some older crawlers, link
        checkers and SEO audit tools only recognise 301/302 and will report a
        308 as an unresolved redirect. 301 is the lowest-risk permanent
        redirect and there is nothing to gain from 308 here — 308's distinctive
        property is preserving the request method on POST, and /book/ was only
        ever a GET landing page.

        NOTE ON BOTH FORMS: `trailingSlash: true` means /book -> /book/ is
        itself a 308 normalisation emitted by Next before this rule matches, so
        `source` must be the slashless '/book' to catch the canonical /book/
        URL. Verified: /book/ returns 301 directly to /schedule/.

        Confirmed at the time of this change: no internal link points at /book/,
        it is absent from the sitemap, and it is not a key in lib/routes.ts — so
        this rule exists purely to catch external inbound links and stale index
        entries. Keep it permanently; it costs nothing.
      */
      {
        source: '/book',
        destination: '/schedule/',
        statusCode: 301,
      },

      /*
        /app/ and /catalog/ are the SHORT URLS PRINTED ON QR CODES — on sample
        boards, door hangers and the estimate folder. They are not pages and
        they are never linked from the site; their only job is to survive being
        printed, which means they must resolve for as long as the paper exists.

        Destination depends on FLAKECOLOR_URL (the FlakeColor mobile catalog):

          SET   -> 308 to the catalog. Permanent is correct here: this is the
                   address the printed code was always meant to reach.
          UNSET -> 307 to /colors/, so a scanned code lands on the blend page
                   instead of a 404 while the catalog is being set up.

        THE 307 IS LOAD-BEARING, DO NOT "TIDY" IT TO 308. A permanent redirect
        is cached by the browser indefinitely, so if the fallback were 308 then
        every phone that scanned a code BEFORE the catalog existed would keep
        going to /colors/ forever — the early scanners, the ones holding the
        first printed boards, would be the only people the catalog never
        reaches, and no server-side change could fix it. 307 keeps the fallback
        uncached so the moment FLAKECOLOR_URL is set, every code starts working.

        Both are disallowed in app/robots.ts and neither is a key in
        lib/routes.ts, so neither enters the sitemap.
      */
      ...(() => {
        const catalog = process.env.FLAKECOLOR_URL
        /* Slashless sources, matched after trailingSlash normalisation — see /book above. */
        return ['/app', '/catalog'].map((source) =>
          catalog
            ? { source, destination: catalog, statusCode: 308 }
            : { source, destination: '/colors/', statusCode: 307 },
        )
      })(),

      /*
        The flat /sitemap.xml was replaced by /sitemap-index.xml over five
        themed children (see lib/sitemaps.ts).

        This redirect exists because /sitemap.xml is the URL that has already
        been submitted in Search Console and is referenced by any external tool
        pointed at this site. Deleting app/sitemap.ts without it would turn a
        live, submitted sitemap into a 404 — reported as "couldn't fetch" and
        eventually dropping the submission. Google follows a 301 on a sitemap
        URL, so the existing submission resolves to the new index.

        Not worth removing later either: it costs one rule and it is the only
        thing catching anything still pointed at the old filename.
      */
      {
        source: '/sitemap.xml',
        destination: '/sitemap-index.xml',
        statusCode: 301,
      },

      /*
        The /resources/ buyer guide duplicated /how-to-choose-epoxy-contractor-
        houston/ — same question, both 200, both self-canonical, both in the
        sitemap. The standalone page was kept (Houston qualifier in the H1 and
        title, URL matching the query, materially more complete) and the unique
        parts of this one were merged into it. See the removal note in
        lib/content/resources.ts.

        `statusCode: 301` for the same reason as /book/ above: `permanent: true`
        emits a 308, which some link checkers and audit tools report as an
        unresolved redirect. Nothing here needs 308's method preservation.

        Source is slashless so it matches after `trailingSlash: true`
        normalisation, consistent with every other rule in this list.
      */
      {
        source: '/resources/how-to-choose-a-garage-floor-coating-contractor',
        destination: '/how-to-choose-epoxy-contractor-houston/',
        statusCode: 301,
      },

      /*
        Five guides were renamed to the phrasing people actually search, rather
        than phrasing that presupposed the answer ("why diamond grinding
        matters" -> "acid etching vs diamond grinding").

        These are 308s rather than new pages published alongside the old ones.
        Keeping both versions would have put two of our own URLs in competition
        for a single query, splitting whatever authority each had accumulated
        and giving an answer engine two near-identical sources with no reason to
        prefer either. One upgraded page per query, with the old URL's history
        forwarded into it, is strictly better than two competing ones.

        Keep these entries permanently. They cost nothing and they are the only
        thing preserving any inbound link to the previous URLs.
      */
      {
        source: '/resources/why-diamond-grinding-matters',
        destination: '/resources/acid-etching-vs-diamond-grinding/',
        permanent: true,
      },
      {
        source: '/resources/epoxy-vs-polyaspartic',
        destination: '/resources/epoxy-vs-polyaspartic-houston/',
        permanent: true,
      },
      {
        source: '/resources/slab-moisture-in-houston',
        destination: '/resources/concrete-moisture-testing-before-epoxy-houston/',
        permanent: true,
      },
      {
        source: '/resources/why-garage-floor-coatings-fail',
        destination: '/resources/why-do-epoxy-garage-floors-peel/',
        permanent: true,
      },
      {
        source: '/resources/caring-for-a-coated-floor',
        destination: '/resources/how-to-clean-epoxy-garage-floor/',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value:
              "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://va.vercel-scripts.com; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
          },
        ],
      },
    ]
  },
}

export default nextConfig
