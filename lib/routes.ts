/*
  Single source of truth for the site's route structure.

  Every entry here feeds three things automatically:
    1. the crawlable header / footer navigation
    2. the visible breadcrumb trail + BreadcrumbList JSON-LD
    3. app/sitemap.ts

  Adding a route means adding it here — never hardcode a path in a nav or a
  sitemap, or the three will drift apart.
*/

type RouteMeta = {
  /* Trailing slash matches the requested URL structure. */
  path: string
  /* Rendered as the page's single H1. */
  h1: string
  /* <title> — kept distinct from the H1 so SERP and page do not read identically. */
  title: string
  description: string
  /*
    Parent route key, used to build the breadcrumb chain. `null` = top level.

    Typed as a plain string rather than RouteKey on purpose: `routes` is
    validated with `satisfies Record<string, RouteMeta>`, so referring to
    RouteKey here would make RouteMeta depend on `typeof routes` while
    `typeof routes` depends on RouteMeta — a circular reference that silently
    degrades the whole registry to `any`. isRouteKey() below does the
    validation at runtime instead.
  */
  parent: string | null
  /* Short label used in breadcrumbs and nav. */
  label: string
}

export const routes = {
  home: {
    path: '/',
    h1: 'Premium Garage Floor Coatings in Houston, TX',
    title: 'Garage Epoxy Flooring Houston | Houston Superior Epoxy',
    description:
      'Diamond-ground epoxy and polyaspartic floor coatings for Houston garages, patios and commercial slabs. $2M insured, 5-year workmanship warranty, no upfront payment.',
    parent: null,
    label: 'Home',
  },

  /* ---- Core service pages (differentiated by search intent) ---- */
  garageCoatings: {
    path: '/garage-floor-coatings-houston/',
    h1: 'Garage Floor Coatings in Houston',
    title: 'Garage Floor Coatings Houston | Flake & Polyaspartic Systems',
    description:
      'Houston garage floor coatings built on diamond-ground concrete, full-broadcast flake and a polyaspartic topcoat. Hot-tire resistant, warrantied 5 years.',
    parent: null,
    label: 'Garage Floors',
  },
  epoxyFlooring: {
    path: '/epoxy-flooring-houston/',
    h1: 'Epoxy Flooring Contractors in Houston',
    title: 'Epoxy Flooring Contractors Houston | How to Vet an Installer',
    description:
      'What separates a real epoxy flooring contractor from a cheap quote: preparation standards, insurance, written warranty and an itemized onsite estimate.',
    parent: null,
    label: 'Epoxy Flooring',
  },
  polyaspartic: {
    path: '/polyaspartic-floor-coatings-houston/',
    h1: 'Polyaspartic Floor Coatings in Houston',
    title: 'Polyaspartic vs Epoxy Floor Coatings | Houston Technical Guide',
    description:
      'A technical comparison of polyaspartic and epoxy floor coatings for Houston slabs — UV stability, cure speed, temperature sensitivity, and when each is the right call.',
    parent: null,
    label: 'Polyaspartic',
  },

  /* ---- System / finish pages ---- */
  flake: {
    path: '/flake-epoxy-garage-floors/',
    h1: 'Full-Broadcast Flake Garage Floors',
    title: 'Flake Epoxy Garage Floors | Full-Broadcast Systems Houston',
    description:
      'Vinyl flake broadcast to full refusal over an epoxy base and locked under polyaspartic. The most common garage floor system we install in Houston.',
    parent: 'garageCoatings',
    label: 'Flake Floors',
  },
  metallic: {
    path: '/metallic-epoxy-floors/',
    h1: 'Metallic Epoxy Floors',
    title: 'Metallic Epoxy Floors Houston | Hand-Worked Pigment Finishes',
    description:
      'Pearlescent metallic epoxy floors, hand-worked while the resin is open so no two floors match. Built for showrooms, studios and interior feature spaces.',
    parent: 'garageCoatings',
    label: 'Metallic Floors',
  },
  solidColor: {
    path: '/solid-color-epoxy-floors/',
    h1: 'Solid-Color Epoxy Floors',
    title: 'Solid-Color Epoxy Floors Houston | Seamless Sealed Concrete',
    description:
      'Uniform pigmented epoxy with no decorative broadcast — the simplest way to seal a slab, stop concrete dusting and get a cleanable surface.',
    parent: 'garageCoatings',
    label: 'Solid Color',
  },

  /* ---- Commercial ---- */
  commercial: {
    path: '/commercial-epoxy-flooring-houston/',
    h1: 'Commercial Epoxy Flooring in Houston',
    title: 'Commercial Epoxy Flooring Houston | Phased, After-Hours Installs',
    description:
      'Commercial epoxy and polyaspartic floors for Houston businesses, phased around your operating hours so the space stays usable. $2M insured.',
    parent: null,
    label: 'Commercial',
  },
  warehouse: {
    path: '/warehouse-floor-coatings-houston/',
    h1: 'Warehouse Floor Coatings in Houston',
    title: 'Warehouse Floor Coatings Houston | Heavy-Traffic Slab Systems',
    description:
      'Warehouse and industrial floor coatings for Houston distribution, manufacturing and storage slabs. Forklift traffic, joint detail, line striping.',
    parent: 'commercial',
    label: 'Warehouse Floors',
  },
  patio: {
    path: '/patio-concrete-coatings-houston/',
    h1: 'Patio & Pool Deck Concrete Coatings',
    title: 'Patio & Pool Deck Coatings Houston | Textured Exterior Concrete',
    description:
      'Textured concrete coatings for Houston patios and pool decks. Exterior slabs are assessed separately for sun, standing water and slip resistance.',
    parent: null,
    label: 'Patios & Pool Decks',
  },

  /* ---- Preparation & remediation ---- */
  removal: {
    path: '/epoxy-coating-removal/',
    h1: 'Epoxy Coating Removal & Resurfacing',
    title: 'Epoxy Coating Removal Houston | Failed Floor Resurfacing',
    description:
      'Mechanical removal of failed, peeling or delaminating epoxy floors, then resurfacing. Usually the single largest variable in a Houston coating quote.',
    parent: null,
    label: 'Coating Removal',
  },
  grinding: {
    path: '/concrete-grinding-preparation/',
    h1: 'Concrete Grinding & Surface Preparation',
    title: 'Concrete Grinding & Surface Prep Houston | Diamond Grinding',
    description:
      'Professional diamond grinding with dust-control equipment — the mechanical preparation step every coating we install is built on.',
    parent: null,
    label: 'Grinding & Prep',
  },
  repair: {
    path: '/garage-floor-repair/',
    h1: 'Garage Floor Crack & Spall Repair',
    title: 'Garage Floor Crack & Spall Repair Houston | Slab Repair',
    description:
      'Crack, spall and pitting repair on Houston garage slabs, handled as its own step before any coating goes down — never coated over.',
    parent: null,
    label: 'Crack & Spall Repair',
  },

  /* ---- Company / conversion ---- */
  pricing: {
    path: '/pricing/',
    h1: 'What a Garage Floor Coating Costs in Houston',
    title: 'Garage Floor Coating Cost Houston | Itemized Pricing',
    description:
      'What actually drives the price of a Houston garage floor coating, the ten cost factors we quote against, and why the number comes after an onsite inspection.',
    parent: null,
    label: 'Pricing',
  },
  process: {
    path: '/our-process/',
    h1: 'How We Install a Floor',
    title: 'Our 9-Step Floor Installation Process | Houston Superior Epoxy',
    description:
      'The nine-step sequence we run on every floor: inspection, diamond grinding, dust control, repair, base coat, broadcast, scrape, topcoat, final walkthrough.',
    parent: null,
    label: 'Our Process',
  },
  colors: {
    path: '/colors/',
    h1: 'Flake Blends & Color Options',
    title: 'Flake Blends & Color Options | Houston Superior Epoxy',
    description:
      'Flake blend and color selection for your floor. Blends are chosen from physical samples during your onsite estimate, under your own lighting.',
    parent: null,
    label: 'Colors',
  },
  floorDesigner: {
    path: '/floor-designer/',
    h1: 'Design Your Garage Floor',
    title: 'Garage Floor Designer | Preview Flake Blends | Houston Superior Epoxy',
    description:
      'Preview our stocked vinyl flake blends on a garage floor, see how each reads in bright and dim light, get a starting estimate, and book a free onsite inspection.',
    parent: 'garageCoatings',
    label: 'Floor Designer',
  },
  projects: {
    path: '/projects/',
    h1: 'Completed Projects',
    title: 'Completed Epoxy Floor Projects | Houston Superior Epoxy',
    description:
      'Completed garage, patio and commercial floor coating projects across Greater Houston.',
    parent: null,
    label: 'Projects',
  },
  reviews: {
    path: '/reviews/',
    h1: 'Customer Reviews',
    title: 'Customer Reviews | Houston Superior Epoxy',
    /*
      No rating or review count here. This string is the meta description AND
      the Open Graph description, so the "4.9-star average across 200+ Google
      reviews" it used to carry was the parent company's aggregate republished
      as this entity's in search results and link previews.
    */
    description:
      'Read reviews of Houston Superior Epoxy on our Google Business Profile — unedited and in full. Ask at your free estimate for references on completed floors near you.',
    parent: null,
    label: 'Reviews',
  },
  about: {
    path: '/about/',
    h1: 'About Houston Superior Epoxy',
    title: 'About Us | Houston Superior Epoxy',
    description:
      'Houston Superior Epoxy is the concrete coatings division of Houston Superior Painting, serving Greater Houston. $2M insured, 5-year workmanship warranty.',
    parent: null,
    label: 'About',
  },
  warranty: {
    path: '/warranty/',
    h1: 'Our Workmanship Warranty',
    title: 'Our 5-Year Workmanship Warranty | Houston Superior Epoxy',
    description:
      'Every floor we install carries a written 5-year workmanship warranty, backed by $2M general liability and workers’ compensation coverage.',
    parent: null,
    label: 'Warranty',
  },
  serviceAreas: {
    path: '/service-areas/',
    h1: 'Where We Work',
    title: 'Service Areas | Epoxy Flooring Across Greater Houston',
    description:
      'Houston Superior Epoxy is a service-area business covering Greater Houston, including Richmond, Katy, Sugar Land, Cypress, Fulshear and Pearland.',
    parent: null,
    label: 'Service Areas',
  },
  resources: {
    path: '/resources/',
    h1: 'Guides & Technical Resources',
    title: 'Guides & Technical Resources | Houston Superior Epoxy',
    description:
      'Plain-language guides to concrete coatings for Houston property owners: preparation, chemistry, moisture, maintenance and how to read a quote.',
    parent: null,
    label: 'Resources',
  },
  /*
    Buyer's guide. Answers "how do I choose a garage epoxy contractor in
    Houston?" — a question asked before any brand is in mind, which is why the
    page is written to be objective enough that a competitor could pass it.

    `parent: 'resources'` gives the breadcrumb chain Home → Resources →
    Choosing a Contractor while the path stays at root level. Parent and path
    are independent in this registry, so the trail can express topical
    hierarchy without burying a high-intent URL a directory deeper.

    NOT added to headerNav or footerNav: those are hand-built lists, so a new
    key here does not push anything into the menus. It DOES enter
    app/sitemap.ts automatically, which is the intent.

    SCOPE BOUNDARY vs `epoxyFlooring` (/epoxy-flooring-houston/): that page is
    for a reader already holding quotes and comparing them line by line. This
    page is for a reader who does not yet know what to look for. The two are
    cross-linked and the split is kept sharp deliberately — two pages chasing
    one query split their own authority, so neither ranks.
  */
  chooseContractor: {
    path: '/how-to-choose-epoxy-contractor-houston/',
    h1: 'How to Choose a Garage Floor Coating Company in Houston',
    /* Kept distinct from the H1 so the SERP line and the page do not duplicate. */
    title: 'How to Choose a Garage Floor Coating Company | Houston Buyer’s Guide',
    description:
      'An objective guide to vetting a Houston garage floor coating contractor: preparation method, moisture testing, coating chemistry, warranty, insurance, and the questions to ask before you sign.',
    parent: 'resources',
    label: 'Choosing a Contractor',
  },

  contact: {
    path: '/contact/',
    h1: 'Contact Houston Superior Epoxy',
    title: 'Contact Us | Houston Superior Epoxy',
    description:
      'Call or text (346) 782-0903, or send photos of your slab. Free onsite estimates across Greater Houston, no payment due upfront.',
    parent: null,
    label: 'Contact',
  },
  /* ---- Legal / policy (linked from the footer on every page) ---- */
  privacy: {
    path: '/privacy-policy/',
    h1: 'Privacy Policy',
    title: 'Privacy Policy | Houston Superior Epoxy',
    description:
      'How Houston Superior Epoxy collects, uses and protects the information you submit when requesting an estimate.',
    parent: null,
    label: 'Privacy Policy',
  },
  terms: {
    path: '/terms/',
    h1: 'Terms of Use',
    title: 'Terms of Use | Houston Superior Epoxy',
    description:
      'The terms governing use of the Houston Superior Epoxy website, including estimate requests and SMS communication consent.',
    parent: null,
    label: 'Terms of Use',
  },
  accessibility: {
    path: '/accessibility/',
    h1: 'Accessibility Statement',
    title: 'Accessibility Statement | Houston Superior Epoxy',
    description:
      'Our commitment to WCAG 2.2 AA conformance, the measures we take, known limitations, and how to report an accessibility barrier.',
    parent: null,
    label: 'Accessibility',
  },

  schedule: {
    path: '/schedule/',
    h1: 'Schedule Your Free Onsite Estimate',
    title: 'Schedule a Free Onsite Estimate | Houston Superior Epoxy',
    description:
      'Book a free onsite estimate for your Houston garage, patio or commercial slab. We inspect the concrete, then give you an itemized written quote.',
    parent: null,
    label: 'Schedule',
  },
  /*
    There is deliberately no `book` route.

    /book/ was a second indexable landing page for the external booking app
    (site.bookingUrl). Because everything here feeds the nav and the sitemap, it
    competed with /schedule/ for the same "book an estimate" queries, and it
    pushed visitors to a scheduler whose bookings never reach this project's
    lead inbox.

    /book/ now 301-redirects to /schedule/ in next.config.mjs, and /schedule/
    links out to the scheduler as a secondary option. Re-adding a route here
    would put the duplicate straight back into the sitemap.
  */
} as const satisfies Record<string, RouteMeta>

/*
  Declared after `routes` so it reads the finished inferred type. This is the
  key-safe half of the tradeoff noted on RouteMeta.parent above.
*/
export type RouteKey = keyof typeof routes

/* Runtime narrowing for `parent`, which RouteMeta can only type as a string. */
export const isRouteKey = (key: string | null): key is RouteKey =>
  key !== null && Object.prototype.hasOwnProperty.call(routes, key)

export const r = (key: RouteKey) => routes[key].path

/* ---------------------------------------------------------------- */
/* Header navigation — grouped. Every href is a real crawlable URL.  */
/* ---------------------------------------------------------------- */

export type NavItem = {
  label: string
  href: string
  /* Optional dropdown children, all real routes. */
  children?: { label: string; href: string; blurb?: string }[]
}

/*
  Seven top-level items — at the stated ceiling, not past it. Everything not
  surfaced here is still one click away in a dropdown AND linked from the
  footer, so nothing loses a crawl path. The logo is the /,  which is why
  "Home" is not repeated as a nav item.

  WHY COLORS IS TOP-LEVEL AND NOT A DROPDOWN CHILD
  "What colour can I have?" is the question this business is actually asked
  first, and it was buried as the fifth item inside Garage Floors — reachable
  only by hovering something that reads like a service page. It is now visible
  in the bar without opening any menu, which is the whole point; do not fold it
  back into a dropdown to save width.

  Flake / Metallic / Solid Color stay INSIDE the Garage Floors dropdown, which
  is what buys the room for it. If an eighth item is ever proposed, take the
  width from there rather than from Colors.
*/
export const headerNav: NavItem[] = [
  {
    label: 'Garage Floors',
    href: r('garageCoatings'),
    children: [
      { label: routes.garageCoatings.label, href: r('garageCoatings'), blurb: 'Residential garage systems' },
      { label: routes.flake.label, href: r('flake'), blurb: 'Full-broadcast vinyl flake' },
      { label: routes.metallic.label, href: r('metallic'), blurb: 'Hand-worked pigment' },
      { label: routes.solidColor.label, href: r('solidColor'), blurb: 'Seamless sealed concrete' },
      { label: routes.floorDesigner.label, href: r('floorDesigner'), blurb: 'Preview blends and price it' },
    ],
  },
  /* Top-level, no dropdown — see the note above the list. */
  { label: routes.colors.label, href: r('colors') },
  {
    label: 'Patios & Prep',
    href: r('patio'),
    children: [
      { label: routes.patio.label, href: r('patio'), blurb: 'Exterior textured coatings' },
      { label: routes.grinding.label, href: r('grinding'), blurb: 'Diamond grinding prep' },
      { label: routes.repair.label, href: r('repair'), blurb: 'Cracks, spalls and pitting' },
      { label: routes.removal.label, href: r('removal'), blurb: 'Failed floor resurfacing' },
    ],
  },
  {
    label: 'Commercial',
    href: r('commercial'),
    children: [
      { label: routes.commercial.label, href: r('commercial'), blurb: 'Phased, after-hours installs' },
      { label: routes.warehouse.label, href: r('warehouse'), blurb: 'Heavy-traffic slabs' },
    ],
  },
  {
    label: 'Learn',
    href: r('process'),
    children: [
      { label: routes.process.label, href: r('process'), blurb: 'Our nine-step sequence' },
      { label: routes.pricing.label, href: r('pricing'), blurb: 'What drives the number' },
      { label: routes.epoxyFlooring.label, href: r('epoxyFlooring'), blurb: 'Choosing a contractor' },
      { label: routes.polyaspartic.label, href: r('polyaspartic'), blurb: 'Chemistry comparison' },
      { label: routes.resources.label, href: r('resources'), blurb: 'Guides and technical reading' },
    ],
  },
  {
    label: 'Company',
    href: r('about'),
    children: [
      { label: routes.about.label, href: r('about'), blurb: 'Who we are' },
      { label: routes.projects.label, href: r('projects'), blurb: 'Completed work' },
      { label: routes.reviews.label, href: r('reviews'), blurb: 'Read our Google reviews' },
      { label: routes.warranty.label, href: r('warranty'), blurb: 'What is covered' },
      { label: routes.serviceAreas.label, href: r('serviceAreas'), blurb: 'Where we work' },
    ],
  },
  { label: 'Contact', href: r('contact') },
]

/* ---------------------------------------------------------------- */
/* Mobile drawer navigation                                         */
/* ---------------------------------------------------------------- */

/*
  A drawer group. `href` is OPTIONAL, which is the one thing this type adds
  over NavItem: "Design Your Floor" is a heading over two links, not a
  destination of its own, and giving it a href purely to satisfy the type would
  put a third link to /colors/ in the drawer.
*/
export type DrawerGroup = {
  label: string
  /* Omitted for a heading-only group whose children carry every link. */
  href?: string
  children?: { label: string; href: string }[]
}

/* The two pages that answer "what will my floor look like?". */
const DESIGN_HREFS: string[] = [r('colors'), r('floorDesigner')]

/*
  The drawer opens with a different question than the desktop bar answers.

  On a phone, someone browsing blends is usually standing in their own garage,
  and the two pages that serve them were the fifth and sixth items inside a
  dropdown inside a drawer — three interactions deep. "Design Your Floor" hoists
  both to the top, above the service groups.

  DERIVED FROM headerNav, NOT HAND-WRITTEN. A second literal list would be a
  second thing to remember to update, and the file's whole premise (see the top)
  is that nav, breadcrumbs and sitemap come from one registry. The two
  transforms below are the only differences from the desktop bar:

    1. the top-level Colors item is dropped — it is in the design group instead
    2. Colors and Floor Designer are removed from the Garage Floors children, so
       neither appears twice in the same drawer
*/
export const mobileNav: DrawerGroup[] = [
  {
    label: 'Design Your Floor',
    children: [
      { label: routes.colors.label, href: r('colors') },
      { label: routes.floorDesigner.label, href: r('floorDesigner') },
    ],
  },
  ...headerNav
    .filter((item) => item.href !== r('colors'))
    .map((item) => {
      const children = item.children?.filter((c) => !DESIGN_HREFS.includes(c.href))
      /* A group emptied by the filter becomes a plain link, not an empty list. */
      return { label: item.label, href: item.href, children: children?.length ? children : undefined }
    }),
]

/* Footer columns, also generated from the registry. */
export const footerNav: { heading: string; items: { label: string; href: string }[] }[] = [
  {
    heading: 'Residential',
    items: [
      { label: routes.garageCoatings.label, href: r('garageCoatings') },
      { label: routes.flake.label, href: r('flake') },
      { label: routes.metallic.label, href: r('metallic') },
      { label: routes.solidColor.label, href: r('solidColor') },
      /*
        Colors and Floor Designer sit together here because they answer the
        same question. Colors is also listed under Company below, which is
        where it already was — a footer link appearing in two columns costs
        nothing and removing it would break an existing crawl path.
      */
      { label: routes.colors.label, href: r('colors') },
      { label: routes.floorDesigner.label, href: r('floorDesigner') },
      { label: routes.patio.label, href: r('patio') },
    ],
  },
  {
    heading: 'Commercial',
    items: [
      { label: routes.commercial.label, href: r('commercial') },
      { label: routes.warehouse.label, href: r('warehouse') },
      { label: routes.epoxyFlooring.label, href: r('epoxyFlooring') },
      { label: routes.polyaspartic.label, href: r('polyaspartic') },
    ],
  },
  {
    heading: 'Preparation',
    items: [
      { label: routes.grinding.label, href: r('grinding') },
      { label: routes.removal.label, href: r('removal') },
      { label: routes.repair.label, href: r('repair') },
      { label: routes.process.label, href: r('process') },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: routes.pricing.label, href: r('pricing') },
      { label: routes.colors.label, href: r('colors') },
      { label: routes.projects.label, href: r('projects') },
      { label: routes.reviews.label, href: r('reviews') },
      { label: routes.warranty.label, href: r('warranty') },
      { label: routes.about.label, href: r('about') },
      { label: routes.resources.label, href: r('resources') },
      { label: routes.serviceAreas.label, href: r('serviceAreas') },
      { label: routes.contact.label, href: r('contact') },
    ],
  },
]

/* Legal strip in the footer utility row. */
export const legalNav: { label: string; href: string }[] = [
  { label: routes.privacy.label, href: r('privacy') },
  { label: routes.terms.label, href: r('terms') },
  { label: routes.warranty.label, href: r('warranty') },
  { label: routes.accessibility.label, href: r('accessibility') },
]

/*
  The ten service pages, in the order the homepage presents them. Kept here so
  the homepage cards, and anything else that needs the full service list,
  cannot drift from the route registry.
*/
export const serviceCards: { key: RouteKey; heading: string; blurb: string }[] = [
  {
    key: 'garageCoatings',
    heading: 'Garage floor coatings',
    blurb: 'The core residential install — diamond-ground concrete, repaired, then coated in the system your slab calls for.',
  },
  {
    key: 'flake',
    heading: 'Full-broadcast flake',
    blurb: 'Vinyl flake broadcast to refusal over an epoxy base, scraped even and locked under clear polyaspartic.',
  },
  {
    key: 'solidColor',
    heading: 'Solid-color epoxy',
    blurb: 'A uniform pigmented coating with no decorative broadcast. The simplest way to seal a slab and stop dusting.',
  },
  {
    key: 'metallic',
    heading: 'Metallic epoxy',
    blurb: 'Pearlescent pigment hand-worked while the resin is open, so the pattern is different on every floor.',
  },
  {
    key: 'polyaspartic',
    heading: 'Polyaspartic coatings',
    blurb: 'Aliphatic, UV-stable topcoat chemistry — and where it genuinely differs from epoxy on a Houston slab.',
  },
  {
    key: 'patio',
    heading: 'Patio & exterior concrete',
    blurb: 'Pool decks, patios and outdoor kitchens, assessed separately for sun, standing water and slip resistance.',
  },
  {
    key: 'commercial',
    heading: 'Commercial floors',
    blurb: 'Phased installs scheduled around your operating hours, including nights and weekends. $2M insured.',
  },
  {
    key: 'warehouse',
    heading: 'Warehouse & shop floors',
    blurb: 'Heavy-traffic slabs with forklift wear, joint detail and line striping to work through.',
  },
  {
    key: 'grinding',
    heading: 'Concrete grinding & preparation',
    blurb: 'The mechanical preparation step every coating we install is built on, with professional dust control.',
  },
  {
    key: 'removal',
    heading: 'Coating removal & resurfacing',
    blurb: 'Stripping a failed, peeling or delaminating floor back to sound concrete before anything new goes down.',
  },
]

/* ---------------------------------------------------------------- */
/* Breadcrumbs                                                      */
/* ---------------------------------------------------------------- */

export type Crumb = { label: string; href: string }

/** Walks `parent` links up to the homepage. Excludes the current page. */
export function crumbsFor(key: RouteKey): Crumb[] {
  const chain: Crumb[] = []
  let cursor: string | null = routes[key].parent
  /* isRouteKey both narrows the string and stops a bad parent from crashing. */
  while (isRouteKey(cursor)) {
    const node: RouteMeta = routes[cursor]
    chain.unshift({ label: node.label, href: node.path })
    cursor = node.parent
  }
  if (key !== 'home') chain.unshift({ label: 'Home', href: '/' })
  return chain
}
