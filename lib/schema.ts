import { author, contentDates, isPlaceholder } from '@/lib/content/authority'
import { type RouteKey, routes } from '@/lib/routes'
import { cities } from '@/lib/content/cities'
import { site, socialProfiles } from '@/lib/site'

/*
  ============================================================================
  STRUCTURED DATA
  ============================================================================

  One interconnected @graph. Three rules govern everything in this file:

  1. NOTHING IS INVENTED. Every value traces back to lib/site.ts or to page
     content a visitor can actually read. No foundingDate, no founder and no
     geo coordinates — none of those are confirmed, and `geo` specifically
     requires a real public location this business does not have.

     No `priceRange` and no `aggregateRating` either. The prices are
     unconfirmed, and the reviews belong to the parent company rather than to
     this entity — see the notes at each removal below.

  2. ENTITIES ARE DECLARED ONCE. The Organization, the LocalBusiness and the
     WebSite live in the root layout and are referenced everywhere else by
     `@id`. Re-declaring the business on all 39 pages tells a crawler there
     are 39 businesses; referencing one `@id` tells it there is one.

  3. NO CLAIM A USER CANNOT SEE. Placeholder tokens, unfilled authors and
     invisible FAQs are omitted rather than published.

  SERVICE-AREA BUSINESS: no street address anywhere. Coverage is expressed
  with `areaServed`, and the PostalAddress carries region and country only —
  publishing a mailbox suite risks a Google Business Profile suspension.
*/

/** Apex domain. Never the old subdomain. */
const ORIGIN = site.canonical

/** Stable identifiers for the site-wide entities. */
export const ID = {
  organization: `${ORIGIN}/#organization`,
  localBusiness: `${ORIGIN}/#localbusiness`,
  website: `${ORIGIN}/#website`,
  logo: `${ORIGIN}/#logo`,
} as const

/** Absolute URL for a root-relative path. Schema.org wants absolute URLs. */
export const abs = (path: string) => (path.startsWith('http') ? path : `${ORIGIN}${path}`)

/** Per-page node identifiers, derived from the page's canonical URL. */
export const webPageId = (path: string) => `${abs(path)}#webpage`
export const breadcrumbId = (path: string) => `${abs(path)}#breadcrumb`

/*
  sameAs means "this is the same entity elsewhere on the web", so it carries
  only the verified Google Business Profile plus owner-confirmed social
  profiles. Currently: GBP, Facebook, Instagram.

  Built from `socialProfiles` rather than a literal list, so the footer, the
  /about/ and /contact/ profile blocks, and this assertion can never disagree
  about which accounts are official. Add profiles in lib/site.ts only.

  The parent company's website is deliberately NOT here: it is a different
  organisation, and asserting sameAs would merge two businesses into one
  entity. That relationship is expressed with parentOrganization instead.

  Same reasoning applies to any third-party listing we do not control (a
  directory page, an aggregator profile): sameAs is an identity claim, not a
  citation list, so a page merely mentioning the business does not belong here.
*/
const sameAs = [site.googleBusinessProfile, ...socialProfiles.map((s) => s.href)]

/*
  Coverage, as the SAB substitute for a street address.

  DERIVED FROM THE CITY REGISTRY, NOT FROM `site.serviceAreas`. This is
  deliberately NARROWER than the visible coverage copy, and the two lists are
  answering different questions:

    - `site.serviceAreas` (16 entries) is the owner's coverage claim. It drives
      the visible "also serving" copy on /service-areas/ and in the footer.
    - `areaServed` here is what the SITE can evidence — the primary metro plus
      every area with a real page describing its slabs, taken from each city's
      `covers` list where present, otherwise its `name`.

  Five of the 16 (The Heights, Bellaire, Spring, Tomball, Missouri City) are
  owner-confirmed but have no page, so they stay in the visible copy and out of
  the markup. Memorial and River Oaks used to be in that group; they now share
  the `memorial-river-oaks` page, so both enter the markup via its `covers`
  list. Structured data is a machine-readable assertion about the entity, and
  under-claiming there is safe while over-claiming is not.

  Deriving from `cities` rather than hardcoding means a new city page enters
  `areaServed` automatically and a removed one leaves it — the markup cannot
  drift from the pages that back it.

  A page's `covers` list wins over its `name` here: the "Memorial & River Oaks"
  page emits two clean Place names, "Memorial, TX" and "River Oaks, TX", rather
  than the compound page title — both are real places now backed by that page,
  which is exactly the evidence bar this list holds itself to.
*/
const areaServed = [
  /* The primary metro. Named in the schema but not a city page in its own right. */
  'Houston',
  ...cities.flatMap((c) => c.covers ?? [c.name]),
].map((name) => ({
  '@type': 'Place',
  name: `${name}, TX`,
}))

/*
  Region and country only. This is the maximum an SAB can publish without
  claiming a storefront it does not have.
*/
const address = {
  '@type': 'PostalAddress',
  addressRegion: 'TX',
  addressCountry: 'US',
}

/** Real hours only — a day with no `opens` value is omitted entirely. */
const openingHoursSpecification = site.hours
  .filter((h) => h.opens !== null && h.closes !== null)
  .map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [...h.dayOfWeek],
    opens: h.opens,
    closes: h.closes,
  }))

/*
  The logo, declared once as an ImageObject so both the Organization and the
  LocalBusiness can point at the same image entity.
*/
const logoNode = {
  '@type': 'ImageObject',
  '@id': ID.logo,
  url: abs(site.logo.lockup),
  contentUrl: abs(site.logo.lockup),
  caption: site.company,
}

/*
  NO AggregateRating NODE. DO NOT ADD ONE BACK.

  A 4.9 / 200+ AggregateRating used to be attached to the LocalBusiness here.
  Those reviews are Houston Superior PAINTING's. `itemReviewed` pointed at
  `ID.localBusiness`, so the markup asserted they were reviews of Houston
  Superior Epoxy — a different legal entity. That is false attribution, and
  Google treats misrepresented review markup as a manual-action offence rather
  than a quality signal to discount.

  The corporate relationship survives as `parentOrganization` below, which is
  accurate: this business IS the parent's coatings division. What does not
  follow is that the parent's reviews are this entity's reviews.

  Individual Review objects remain absent for the original reason too: marking
  up review text not supplied as verifiable would be fabrication.

  An AggregateRating may return only when the epoxy division's own profile has
  ratings, sourced from that profile, and visible on the page wherever the
  markup claims it.
*/

/*
  Topical expertise, for entity understanding rather than ranking.

  Every term here corresponds to a page on this site that explains it. That
  constraint is the point: `knowsAbout` is trivial to stuff with every phrase a
  business would like to be associated with, and a list making claims the site
  cannot back is worth less than a short honest one. If a topic is added here
  without a page behind it, this stops being evidence and becomes a wish list.

  Process terms (diamond grinding, moisture testing, crack and spall repair) are
  included deliberately alongside the product terms. Preparation is what the
  content is actually about, and it is what distinguishes this entity from
  companies that only sell a resin.
*/
const knowsAbout = [
  'Epoxy floor coatings',
  'Polyaspartic floor coatings',
  'Full-broadcast vinyl flake flooring',
  'Metallic epoxy flooring',
  'Solid color epoxy flooring',
  'Diamond grinding and concrete surface preparation',
  'Concrete moisture vapor testing',
  'Concrete crack and spall repair',
  'Failed coating removal',
  'Garage floor coatings',
  'Commercial and warehouse floor coatings',
  'Patio and pool deck concrete coatings',
]

/*
  The route keys that are genuine service offerings.

  Written out explicitly rather than derived. `parent` cannot discriminate these
  (23 routes are `parent: null`, including /pricing/ and /about/), and any other
  heuristic would silently pull /privacy-policy/ or /reviews/ into the catalog
  the first time a route was reorganised. An offer catalog listing a privacy
  policy as a service is worse than no catalog.

  Names and URLs still come from `routes`, so the catalog cannot drift from the
  real page titles — only membership is hand-maintained, and TypeScript rejects
  a key that stops existing.
*/
const SERVICE_KEYS = [
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
] as const satisfies readonly RouteKey[]

/*
  The offerings, as an OfferCatalog of Service nodes.

  Each Service points back at the provider by `@id` rather than repeating the
  business, for the same reason rule 2 exists at the top of this file. The
  catalog is attached to the LocalBusiness only, so it is declared once sitewide.
*/
const hasOfferCatalog = {
  '@type': 'OfferCatalog',
  name: `${site.division} — ${site.company}`,
  itemListElement: SERVICE_KEYS.map((key) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: routes[key].h1,
      url: abs(routes[key].path),
      serviceType: routes[key].label,
      provider: { '@id': ID.localBusiness },
      areaServed,
    },
  })),
}

/* -------------------------------------------------------------------------- */
/* Site-wide nodes — root layout only                                          */
/* -------------------------------------------------------------------------- */

/** The publisher entity. Owns the brand, the logo and the social profiles. */
export const organizationNode = {
  '@type': 'Organization',
  '@id': ID.organization,
  name: site.company,
  /* Same variant as the LocalBusiness, so both nodes reconcile to one brand. */
  alternateName: 'Houston Superior Epoxy Flooring',
  url: ORIGIN,
  logo: { '@id': ID.logo },
  image: { '@id': ID.logo },
  telephone: site.phoneIntl,
  email: site.email,
  slogan: site.tagline,
  sameAs,
  address,
  areaServed,
  parentOrganization: {
    '@type': 'Organization',
    name: site.parentCompany,
    url: site.parentSite,
  },
}

/**
 * The operating business, as the HomeAndConstructionBusiness subtype.
 *
 * Declared once in the root layout. Every page that needs to name the
 * business references `ID.localBusiness` instead of repeating this node.
 */
export const localBusinessNode = {
  '@type': 'HomeAndConstructionBusiness',
  '@id': ID.localBusiness,
  name: site.company,
  /*
    Brand-name variant people and directories actually use. Helps a search
    engine reconcile "Houston Superior Epoxy Flooring" with this entity instead
    of treating it as a separate business.
  */
  alternateName: 'Houston Superior Epoxy Flooring',
  description: `${site.division}. ${site.tagline}`,
  url: ORIGIN,
  telephone: site.phoneIntl,
  email: site.email,
  image: { '@id': ID.logo },
  logo: { '@id': ID.logo },
  slogan: site.tagline,
  sameAs,
  hasMap: site.googleBusinessProfile,
  address,
  areaServed,
  knowsAbout,
  hasOfferCatalog,
  openingHoursSpecification,
  /*
    Points at the PARENT COMPANY, not at `ID.organization`.

    This previously read `{ '@id': ID.organization }`, but that node is named
    `site.company` — it is this brand's publisher entity, not the parent. So the
    markup asserted "Houston Superior Epoxy is a subsidiary of Houston Superior
    Epoxy": circular, and it never actually expressed the real relationship.
    A consumer following it learned nothing.

    Stated inline with the parent's real name and URL, matching the shape used
    on `organizationNode`. This is the ONLY relationship to the parent company
    the markup asserts — notably not its reviews.
  */
  parentOrganization: {
    '@type': 'Organization',
    name: site.parentCompany,
    url: site.parentSite,
  },
  currenciesAccepted: 'USD',
  /*
    NO `priceRange`. The starting prices it derived from are unconfirmed and are
    now {{TOKEN}}s in lib/site.ts, and `priceRange: '{{PRICE_1_CAR_STARTING}}'`
    would be malformed structured data — worse than the property being absent.
    Restore it only alongside re-confirmed figures visible on /pricing/.
  */
}

/** The website itself, published by the Organization. */
export const websiteNode = {
  '@type': 'WebSite',
  '@id': ID.website,
  url: ORIGIN,
  name: site.company,
  description: `${site.division} across the Houston metro. ${site.tagline}`,
  publisher: { '@id': ID.organization },
  inLanguage: 'en-US',
}

/**
 * The site-wide graph. Rendered exactly once, from the root layout.
 *
 * Pages emit their own smaller graph in a second script tag. That is valid
 * and expected: consumers merge all JSON-LD on the page into one graph and
 * resolve the cross-script `@id` references between them.
 */
export const siteGraph = graph(logoNode, organizationNode, localBusinessNode, websiteNode)

/* -------------------------------------------------------------------------- */
/* Graph wrapper                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Wraps nodes in a JSON-LD document.
 *
 * Nulls are filtered so node builders can decline to emit — `faqNode` returns
 * null when every pair still holds an unfilled placeholder, and a raw null
 * inside `@graph` is a parse error rather than a skipped node.
 */
export function graph(...nodes: (object | null)[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter((n): n is object => n !== null),
  }
}

/* -------------------------------------------------------------------------- */
/* Per-page nodes                                                              */
/* -------------------------------------------------------------------------- */

type WebPageInput = {
  path: string
  name: string
  description: string
  /** Root-relative or absolute image URL, when the page has a real one. */
  image?: string
  /** Home has no breadcrumb trail; every other page does. */
  breadcrumb?: boolean
  /*
    A more specific WebPage subtype — ContactPage, AboutPage, CollectionPage,
    FAQPage. Set this rather than emitting a second node alongside the WebPage:
    two nodes describing one URL is a duplicate even when the types differ, and
    the subtype IS the page rather than something the page contains.
  */
  type?: string
  /*
    Emit `mainEntity` → the LocalBusiness.

    Distinct from the `about` reference every page already carries. `about` says
    the page mentions the entity; `mainEntity` says the entity IS the page's
    primary subject. That is true of /about/ and false of a service or city
    page, so it is opt-in — setting it everywhere would make it meaningless.
  */
  mainEntity?: boolean
}

/**
 * The WebPage node for a single URL.
 *
 * Pass a route key to pull the title, description and path straight from the
 * route registry — that keeps the markup identical to the `<title>` and meta
 * description without restating them. Dynamic routes (cities, projects,
 * articles) pass an explicit object.
 *
 * `breadcrumb` points at the BreadcrumbList the Breadcrumbs component renders
 * for this same path, which is what ties the visible trail to the graph.
 */
export function webPageNode(
  input: RouteKey | WebPageInput,
  /*
    Extras for the route-key form, so a page can set `type` or `mainEntity`
    without restating path/name/description and losing the registry as the
    single source of those three.
  */
  overrides?: Partial<Omit<WebPageInput, 'path' | 'name' | 'description'>>,
) {
  const cfg: WebPageInput =
    typeof input === 'string'
      ? {
          path: routes[input].path,
          name: routes[input].title,
          description: routes[input].description,
          breadcrumb: routes[input].path !== '/',
          ...overrides,
        }
      : { breadcrumb: true, ...input, ...overrides }

  return {
    '@type': cfg.type ?? 'WebPage',
    '@id': webPageId(cfg.path),
    url: abs(cfg.path),
    name: cfg.name,
    description: cfg.description,
    isPartOf: { '@id': ID.website },
    /* The page is about the business; the business is not redeclared here. */
    about: { '@id': ID.localBusiness },
    ...(cfg.mainEntity ? { mainEntity: { '@id': ID.localBusiness } } : {}),
    inLanguage: 'en-US',
    ...(cfg.breadcrumb ? { breadcrumb: { '@id': breadcrumbId(cfg.path) } } : {}),
    ...(cfg.image
      ? {
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: abs(cfg.image),
            contentUrl: abs(cfg.image),
          },
        }
      : {}),
  }
}

/**
 * A Service node for an offering page.
 *
 * `provider` references the LocalBusiness by `@id` rather than embedding it.
 * `areaServed` defaults to the full service area; city pages narrow it to one
 * city so the page and the markup describe the same scope.
 */
export function serviceNode({
  name,
  description,
  path,
  serviceType,
  city,
}: {
  name: string
  description: string
  path: string
  serviceType: string
  /** City page override — scopes the service to a single place. */
  city?: string
}) {
  return {
    '@type': 'Service',
    '@id': `${abs(path)}#service`,
    name,
    description,
    serviceType,
    provider: { '@id': ID.localBusiness },
    areaServed: city ? [{ '@type': 'Place', name: `${city}, TX` }] : areaServed,
    mainEntityOfPage: { '@id': webPageId(path) },
  }
}

/**
 * BlogPosting for a written guide.
 *
 * ATTRIBUTION IS ALWAYS EMITTED, because an article with no author is an
 * incomplete entity and answer engines weight authorship when deciding whether
 * a source is worth citing. Omitting it entirely — the previous behaviour —
 * was costing us the citation on all twenty guides.
 *
 * The fallback is the `Organization` itself, referenced by `@id` so it resolves
 * to the single fully-described Organization node in the graph rather than
 * duplicating a partial copy of it. That is truthful: the company did write and
 * check this content. What is NOT emitted is an invented `Person` — no name, no
 * jobTitle, no description. A fabricated expert is unrecoverable once indexed,
 * and it is strictly worse than organisation-level credit.
 *
 * If the owner later names a real installer in lib/content/authority, `author`
 * upgrades to a `Person` who `worksFor` the Organization, which outranks
 * organisation attribution for E-E-A-T. Until then this is the honest ceiling.
 *
 * Dates are driven by the content source: each article may carry its own
 * `published` / `reviewed`, falling back to the batch defaults. Both are real
 * ISO-8601 values, so `datePublished` and `dateModified` always parse.
 */
export function blogPostingNode({
  path,
  headline,
  description,
  question,
  image,
  published,
  reviewed,
}: {
  path: string
  headline: string
  description: string
  question?: string
  image?: string
  /* Per-article ISO dates; fall back to the batch defaults in authority.ts. */
  published?: string
  reviewed?: string
}) {
  const named = !isPlaceholder(author.name)
  const datePublished = published ?? contentDates.published
  const dateModified = reviewed ?? contentDates.reviewed

  return {
    '@type': 'BlogPosting',
    '@id': `${abs(path)}#article`,
    headline,
    description,
    url: abs(path),
    inLanguage: 'en-US',
    publisher: { '@id': ID.organization },
    isPartOf: { '@id': ID.website },
    mainEntityOfPage: { '@id': webPageId(path) },
    /* A named human author outranks an organisation for E-E-A-T purposes. */
    author: named
      ? {
          '@type': 'Person',
          name: author.name,
          ...(isPlaceholder(author.role) ? {} : { jobTitle: author.role }),
          ...(isPlaceholder(author.bio) ? {} : { description: author.bio }),
          worksFor: { '@id': ID.organization },
        }
      : { '@id': ID.organization },
    /*
      Reviewer mirrors author: a named human when one exists, otherwise the
      Organization. `reviewedBy` on an Organization is valid and matches the
      visible "Reviewed by ... Technical Team" byline exactly, which is the
      point — the rendered page and the structured data must state the same
      fact, or the schema is contradicted by the document it describes.
    */
    reviewedBy:
      named && !isPlaceholder(author.reviewer)
        ? { '@type': 'Person', name: author.reviewer }
        : { '@id': ID.organization },
    ...(isPlaceholder(datePublished) ? {} : { datePublished }),
    ...(isPlaceholder(dateModified) ? {} : { dateModified }),
    ...(image ? { image: { '@type': 'ImageObject', url: abs(image), contentUrl: abs(image) } } : {}),
    /*
      The article's opening question, as the machine-readable twin of the
      visible QuickAnswer block.
    */
    ...(question ? { about: { '@type': 'Thing', name: question } } : {}),
  }
}

/**
 * A completed job, as an Article with its photography attached.
 *
 * `locationCreated` is city-level only. A customer's street address is never
 * published, and `contentLocation` on each photo would be the same leak — so
 * every ImageObject gets the city, and nothing narrower, as its provenance.
 *
 * Article rather than CreativeWork: the page is a written account of the job
 * (problem, specification, outcome) illustrated with photography, which is
 * what Article describes. CreativeWork is its parent type and says strictly
 * less about the same URL.
 *
 * The BreadcrumbList for this page is emitted by the Breadcrumbs component
 * from the visible trail (Home → Projects → City → this project) and joined to
 * the graph through `webPageNode`'s `breadcrumb` reference — it is deliberately
 * not restated here, or the page would carry two BreadcrumbLists.
 */
export function projectNode({
  path,
  title,
  summary,
  city,
  photos,
  /** Route path of the service page this job belongs to. */
  servicePath,
  /** Route path of the city page this job belongs to. */
  cityPath,
  /** Exact completion date, ISO. Omitted unless it is genuinely known. */
  completedISO,
  /** Coating system family, e.g. "Full-broadcast vinyl flake". */
  system,
  /** Garage / space type, e.g. "Two-car attached garage". */
  spaceType,
}: {
  path: string
  title: string
  summary: string
  city: string
  /*
    Alt text is guaranteed on any photo carrying a `src` — see the ShotPhoto /
    PlannedPhoto split in lib/content/projects. So the ImageObject `caption`
    below reads `alt` directly instead of falling back to the label.
  */
  photos: readonly ({ src: string; label: string; alt: string } | { src?: undefined; label: string })[]
  servicePath?: string
  cityPath?: string
  completedISO?: string
  system?: string
  spaceType?: string
}) {
  /*
    Only real, resolvable images become ImageObjects.

    A planned-but-unshot frame renders as a labelled empty box on the page, and
    emitting an ImageObject for it would assert a photograph that does not
    exist at a URL that would 404.
  */
  const images = photos
    .filter((p): p is { src: string; label: string; alt: string } => Boolean(p.src))
    .map((p) => ({
      '@type': 'ImageObject',
      url: abs(p.src),
      contentUrl: abs(p.src),
      /* The factual description of the frame, not the display caption. */
      caption: p.alt,
      /* City-level provenance only — never the customer's address. */
      contentLocation: { '@type': 'Place', name: `${city}, TX` },
    }))

  /*
    NO `Review` NODE, AND NO `AggregateRating`, EVEN WHEN THE PROJECT CARRIES
    A `customerReview`. DO NOT WIRE ONE UP.

    A project's `customerReview` renders as visible, attributed text on the
    page and stops there. Turning it into `Review` markup with `itemReviewed`
    pointing at this business would be us publishing machine-readable ratings
    of ourselves, selected by ourselves — which is precisely the practice
    /reviews/ tells visitors we do not engage in, and precisely what Google's
    self-serving review policy excludes from rich results.

    The quote is worth showing because it is attached to a dated, photographed
    job in a named city, so a reader can weigh it. That argument supports
    displaying it. It does not support marking it up as a rating, and the two
    should not be conflated the next time this file is edited.

    See the AggregateRating note near the top of this file for the conditions
    under which rating markup could legitimately return.
  */

  /*
    What the job WAS, as entity references rather than free text: the service
    performed and the place it was performed in. `mentions` is the honest
    property for this — `about` already points at the business, and claiming
    two primary subjects for one page dilutes both.
  */
  const mentions = [
    ...(servicePath ? [{ '@id': `${abs(servicePath)}#service` }] : []),
    ...(cityPath ? [{ '@id': webPageId(cityPath) }] : []),
  ]

  return {
    '@type': 'Article',
    '@id': `${abs(path)}#project`,
    headline: title,
    name: title,
    description: summary,
    url: abs(path),
    inLanguage: 'en-US',
    author: { '@id': ID.organization },
    publisher: { '@id': ID.organization },
    isPartOf: { '@id': ID.website },
    mainEntityOfPage: { '@id': webPageId(path) },
    locationCreated: { '@type': 'Place', name: `${city}, TX` },
    about: { '@id': ID.localBusiness },
    ...(mentions.length > 0 ? { mentions } : {}),
    /*
      Only emitted when the registry carries a real ISO date. A guessed
      day-of-month here would be a fabricated fact in machine-readable form,
      which is worse than the property being absent.
    */
    ...(completedISO ? { datePublished: completedISO, dateModified: completedISO } : {}),
    /*
      The spec, as keywords a crawler can read without parsing the table.
      Kept to the two facets that describe the job rather than every spec row —
      a keyword list restating the whole page is stuffing.
    */
    ...(system || spaceType
      ? { keywords: [system, spaceType].filter(Boolean).join(', ') }
      : {}),
    ...(images.length > 0 ? { image: images } : {}),
  }
}

/**
 * FAQPage node scoped to a specific URL.
 *
 * Only ever called from a page that renders the same pairs in a visible
 * FaqList, since FAQ markup on content absent from the server-rendered HTML
 * is a structured-data violation.
 *
 * Any pair whose text still contains an unfilled {{TOKEN}} is dropped. On the
 * page itself a visible {{YEARS_IN_BUSINESS}} is a useful reminder to the
 * owner, but FAQ markup is rich-result eligible — so the token could be
 * rendered verbatim as fact in Google's own SERP. Dropping the entry costs one
 * FAQ; leaving it risks publishing a placeholder as a fact.
 *
 * The price tokens this guard was originally written for are now confirmed
 * values, so the two-car cost FAQ passes the filter and becomes rich-result
 * eligible for the first time. The guard stays for the remaining tokens.
 *
 * Returns null when nothing survives, because an empty `mainEntity` is
 * invalid.
 */
export function faqNode(path: string, items: readonly { q: string; a: string }[]) {
  const ready = items.filter((f) => !f.a.includes('{{') && !f.q.includes('{{'))
  if (ready.length === 0) return null

  return {
    '@type': 'FAQPage',
    '@id': `${abs(path)}#faq`,
    mainEntity: ready.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
    isPartOf: { '@id': webPageId(path) },
  }
}
