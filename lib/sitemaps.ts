import { type RouteKey, routes } from '@/lib/routes'
import { cities } from '@/lib/content/cities'
import { articles } from '@/lib/content/resources'
import { projects } from '@/lib/content/projects'
import { site } from '@/lib/site'

/*
  ============================================================================
  SITEMAP SOURCE OF TRUTH
  ============================================================================

  One flat /sitemap.xml was replaced with a sitemap index over five themed
  children. The reason is diagnostic, not cosmetic: Search Console reports
  coverage per submitted sitemap, so a flat file tells you "3 URLs not indexed"
  across the whole site, while these five tell you WHICH KIND of page is not
  being indexed. "The service pages are all indexed but no resource article is"
  is an actionable finding; the flat number is not.

  EVERY URL HERE IS DERIVED, NEVER HAND-LISTED. The groups below map route keys
  to a sitemap, and `assertEveryRouteGrouped` is a compile-time exhaustiveness
  check — add a route to lib/routes.ts and forget to group it and the build
  fails with a type error naming the missing key. That is the property the old
  flat sitemap had for free (it iterated Object.values(routes)) and it must not
  be lost by moving to explicit groups.

  WHAT MUST NEVER APPEAR:
    - a redirected URL (/book/, the retired /resources/ buyer guide). Both are
      absent structurally: /book is not a route key, and the buyer guide was
      deleted from the articles array. Neither can reappear here by accident.
    - a noindex URL. /admin/* is not in `routes` at all.
    - a filtered archive view (/projects/?city=katy). Those are noindex +
      canonical to /projects/ and are discovered by following links, which is
      the whole point of making the filters real anchors.
*/

/** The five children of the sitemap index. Order is the order in the index. */
export const SITEMAP_GROUPS = [
  'pages',
  'services',
  'locations',
  'resources',
  'projects',
] as const

export type SitemapGroup = (typeof SITEMAP_GROUPS)[number]

export const sitemapFilename = (group: SitemapGroup) => `sitemap-${group}.xml`

/*
  Date reported as each page's last substantive change.

  Carried over from the flat sitemap unchanged, including the reasoning: this is
  a fixed constant rather than `new Date()` because building the date at deploy
  time stamped every URL with a fresh timestamp on every deploy, telling Google
  the entire site had just been rewritten when the change was one CSS tweak.
  Crawlers that are misled that way learn to discount `lastmod` entirely.

  Bump by hand when content is actually revised.
*/
const CONTENT_REVISED = '2026-08-29T00:00:00.000Z'

/*
  Which sitemap each static route belongs in.

  `services` is the same twelve keys `SERVICE_KEYS` uses in lib/schema.ts for
  the OfferCatalog. They are NOT imported from there: that list answers "what do
  we sell" for schema.org, this one answers "which sitemap does this URL go in",
  and the two happening to coincide today does not make them the same question.
  Coupling them would mean a schema change silently moved a URL between
  sitemaps.

  `chooseContractor` sits in `resources` despite living at the site root. It is
  a buyer's guide — editorial content with a byline and a reviewed date — and
  grouping by what a page IS rather than where its URL happens to sit is what
  makes the per-sitemap coverage numbers meaningful.
*/
/*
  `as const satisfies`, NOT a `Record<SitemapGroup, readonly RouteKey[]>`
  annotation. This is not a style preference — it is what makes the
  exhaustiveness check below actually work.

  A type annotation widens the array element type to `RouteKey`, so
  `(typeof ROUTE_GROUPS)[SitemapGroup][number]` evaluates to `RouteKey` rather
  than the union of the keys actually listed. `Exclude<RouteKey, RouteKey>` is
  `never`, so the guard passes vacuously and a route missing from every group
  compiles clean — the exact failure the guard exists to prevent, with the
  added downside of looking like it is covered.

  `as const` keeps the literals; `satisfies` still rejects a typo'd or
  non-existent route key. Verified by adding an ungrouped route and confirming
  the assertion below fails by name.
*/
const ROUTE_GROUPS = {
  pages: [
    'home',
    'pricing',
    'process',
    'colors',
    'floorDesigner',
    'reviews',
    'about',
    'warranty',
    'contact',
    'schedule',
    'privacy',
    'terms',
    'accessibility',
  ],
  services: [
    'garageCoatings',
    'epoxyFlooring',
    'polyaspartic',
    'flake',
    'metallic',
    'solidColor',
    'commercial',
    'warehouse',
    'patio',
    'removal',
    'grinding',
    'repair',
  ],
  /* The hub and its city pages belong together — that is the unit of coverage. */
  locations: ['serviceAreas'],
  resources: ['resources', 'chooseContractor'],
  projects: ['projects'],
} as const satisfies Record<SitemapGroup, readonly RouteKey[]>

/*
  COMPILE-TIME EXHAUSTIVENESS CHECK.

  `Grouped` is the union of every key listed above. If a route exists in
  lib/routes.ts that is not in any group, `Exclude<RouteKey, Grouped>` is
  non-empty and the assignment below fails to compile, with the error naming the
  ungrouped key.

  This is the guard that makes the split safe. Without it, adding a route and
  forgetting to group it would silently drop it from the sitemap entirely — a
  page that exists, is indexable, and is advertised nowhere.
*/
type Grouped = (typeof ROUTE_GROUPS)[SitemapGroup][number]
type Ungrouped = Exclude<RouteKey, Grouped>

/*
  When this line errors, the message names the offending route key: the
  assignment fails with `Type 'true' is not assignable to type '"yourNewRoute"'`.
  That reads as "yourNewRoute is missing from ROUTE_GROUPS below" — add the key
  to whichever group it belongs to and the error clears.

  The named type alias is load-bearing for that error text; inlining it would
  reduce the message to a bare `true`/`never` mismatch.
*/
type EveryRouteMustBeInExactlyOneSitemapGroup = Ungrouped extends never ? true : Ungrouped
const assertEveryRouteGrouped: EveryRouteMustBeInExactlyOneSitemapGroup = true
void assertEveryRouteGrouped

/*
  And the reverse: a key cannot appear in two groups, which would put one URL in
  two sitemaps. Checked at runtime on module load rather than in types (a
  duplicate across two array literals is not expressible as a type error) and
  thrown, so it fails the build rather than shipping.
*/
{
  const seen = new Set<string>()
  for (const group of SITEMAP_GROUPS) {
    for (const key of ROUTE_GROUPS[group]) {
      if (seen.has(key)) {
        throw new Error(
          `[sitemaps] Route "${key}" is in more than one sitemap group. Each URL belongs in exactly one sitemap.`,
        )
      }
      seen.add(key)
    }
  }
}

export type SitemapEntry = {
  path: string
  lastmod: string
  changefreq: 'weekly' | 'monthly' | 'yearly'
  priority: string
}

/** Every URL in one group, in the order it should appear in the file. */
export function entriesFor(group: SitemapGroup): SitemapEntry[] {
  const staticEntries: SitemapEntry[] = ROUTE_GROUPS[group].map((key) => {
    const route = routes[key]
    const isHome = route.path === '/'
    /*
      Read via `in` rather than `route.parent`. Only some route entries declare
      a parent, so a direct property access is a type error on the union — and
      when a newly added route is missing from ROUTE_GROUPS, that error fires
      *here* and buries the assertEveryRouteGrouped error above, which is the
      one that actually says what is wrong. Keeping this access safe means the
      grouping guard is the only thing that fails, with its own message.
    */
    const isChild = 'parent' in route && Boolean(route.parent)
    return {
      path: route.path,
      lastmod: CONTENT_REVISED,
      changefreq: isHome ? 'weekly' : 'monthly',
      priority: isHome ? '1.0' : isChild ? '0.6' : '0.8',
    }
  })

  if (group === 'locations') {
    return [
      ...staticEntries,
      ...cities.map((c) => ({
        path: `/service-areas/${c.slug}/`,
        lastmod: CONTENT_REVISED,
        changefreq: 'monthly' as const,
        priority: '0.7',
      })),
    ]
  }

  if (group === 'resources') {
    return [
      ...staticEntries,
      ...articles.map((a) => ({
        path: `/resources/${a.slug}/`,
        lastmod: CONTENT_REVISED,
        changefreq: 'yearly' as const,
        priority: '0.5',
      })),
    ]
  }

  if (group === 'projects') {
    /* Empty until real projects are published — see lib/content/projects.ts. */
    return [
      ...staticEntries,
      ...projects.map((p) => ({
        path: `/projects/${p.slug}/`,
        lastmod: CONTENT_REVISED,
        changefreq: 'yearly' as const,
        priority: '0.5',
      })),
    ]
  }

  return staticEntries
}

/** Every canonical indexable URL on the site, across all groups. */
export function allSitemapPaths(): string[] {
  return SITEMAP_GROUPS.flatMap((g) => entriesFor(g).map((e) => e.path))
}

export const absoluteUrl = (path: string) => `${site.canonical}${path}`

/*
  XML escaping. Required by the sitemap protocol for the five predefined
  entities. None of the current paths contain any of them, but a slug with an
  ampersand would otherwise emit XML that fails validation, and a sitemap that
  fails to parse is a sitemap Google discards whole.
*/
const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/** A <urlset> document for one group. */
export function urlsetXml(group: SitemapGroup): string {
  const entries = entriesFor(group)
  const urls = entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${escapeXml(absoluteUrl(e.path))}</loc>\n` +
        `    <lastmod>${e.lastmod}</lastmod>\n` +
        `    <changefreq>${e.changefreq}</changefreq>\n` +
        `    <priority>${e.priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  )
}

/** The <sitemapindex> document listing the five children. */
export function sitemapIndexXml(): string {
  const children = SITEMAP_GROUPS.map(
    (group) =>
      `  <sitemap>\n` +
      `    <loc>${escapeXml(absoluteUrl(`/${sitemapFilename(group)}`))}</loc>\n` +
      `    <lastmod>${CONTENT_REVISED}</lastmod>\n` +
      `  </sitemap>`,
  ).join('\n')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${children}\n` +
    `</sitemapindex>\n`
  )
}

/*
  Served as a static file where possible: the URL set only changes when the
  registries change, which means a deploy.
*/
export const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
} as const
