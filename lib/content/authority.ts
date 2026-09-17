import { site } from '@/lib/site'

/*
  E-E-A-T and answer-engine support data.

  Three jobs:
   1. Author / reviewer attribution for articles and technical pages.
   2. ONE canonical phrasing of each core entity fact, so the business name,
      phone and service-area description are byte-identical everywhere.
   3. Definitions for every technical term the site uses.

  Hard rule inherited from the rest of this project: nothing here asserts a
  product performance figure. No mil thickness, no cure schedule, no abrasion
  or chemical-resistance rating, no adhesion psi. Those live on the
  manufacturer's current technical data sheet, and until the owner supplies one
  the claim does not get made.
*/

/* ---------------------------------------------------------------- */
/* Authorship                                                        */
/* ---------------------------------------------------------------- */

/*
  Placeholders, not invented people. A fabricated author with fabricated
  credentials is the single worst E-E-A-T move available — it is the thing
  Google's guidelines are explicitly written against, and it is unrecoverable
  once indexed. These tokens render visibly until the owner supplies a real
  named installer.
*/
export const author = {
  name: '{{AUTHOR_NAME}}',
  /* e.g. "Lead installer, Houston Superior Epoxy" */
  role: '{{AUTHOR_ROLE}}',
  /* Hands-on experience — the "Experience" in E-E-A-T. */
  bio: '{{AUTHOR_BIO}}',
  /* Optional: named reviewer for technical accuracy. */
  reviewer: '{{REVIEWER_NAME}}',
} as const

/*
  ORGANISATION-LEVEL ATTRIBUTION — the byline that actually ships.

  The tokens above stay because a named human with real hands-on experience
  genuinely does outrank an organisation for E-E-A-T, and they are the refill
  point when the owner names one. But an article with NO author at all is an
  incomplete entity: answer engines weight authorship when deciding whether a
  source is citable, so omitting attribution entirely was costing us the
  citation.

  So attribution falls back to the company's own technical team, which is
  truthful — this content was written and checked by the people who do the
  work — and is a valid `Organization` author in schema.org terms. What it
  deliberately does NOT do is invent a person: no name, no job title, no years
  of experience, no certification, no biography. A fabricated expert is the one
  unrecoverable mistake here, and it is strictly worse than no expert.
*/
export const attribution = {
  /* Reads as a team, because it is one. Not a Person. */
  team: `${site.company} Technical Team`,
  /*
    The visible label. Deliberately "Reviewed by" rather than "Written by":
    review is the claim we can stand behind for every article, and it is the
    more meaningful signal on evergreen technical content anyway.
  */
  label: 'Reviewed by',
} as const

/*
  Article dates.

  Real ISO-8601 dates, because `datePublished` and `dateModified` are parsed
  as dates: a {{TOKEN}} here is an invalid value that Search Console reports
  as an error, and omitting them entirely leaves the entity incomplete.

  These are the batch defaults for content published as one set, which is what
  actually happened. Any individual article can override them with its own
  `published` / `reviewed` fields in lib/content/resources.ts, and the schema
  and byline both read the per-article value first — so a genuine revision
  history accumulates in the content source rather than being faked here.

  UPDATE `reviewed` WHEN YOU MATERIALLY REVISE AN ARTICLE. A last-reviewed date
  that never moves is worse than no date, because it advertises that nobody has
  looked at the guidance since it was written.
*/
export const contentDates = {
  published: '2026-08-29',
  reviewed: '2026-08-29',
} as const

/*
  True while a value is still an unfilled {{TOKEN}}.

  This matters for structured data specifically. A visible {{AUTHOR_NAME}} on
  the page is a useful reminder to the owner; the same token inside JSON-LD is
  a malformed value, and `datePublished: "{{PUBLISHED_DATE}}"` is an invalid
  date that Search Console will report as an error. So the page renders the
  token and the schema omits the property until it is real — absent structured
  data is always better than invalid structured data.
*/
export const isPlaceholder = (value: string) => value.startsWith('{{')

/* ---------------------------------------------------------------- */
/* Canonical entity facts                                            */
/* ---------------------------------------------------------------- */

/*
  Single phrasings. Import these rather than retyping — inconsistent NAP data
  across pages is a real local-SEO problem, and an answer engine reading three
  different service-area descriptions has no way to pick the right one.
*/
export const entity = {
  /* Who. */
  who: `${site.company} is a ${site.division.toLowerCase()} contractor serving Greater Houston, Texas.`,

  /* What. */
  what:
    'We install epoxy, polyaspartic and full-broadcast flake floor coating systems on residential garages, patios and pool decks, and on commercial and warehouse concrete. We also grind and prepare bare concrete, repair cracks and spalling, and strip failed coatings back to sound slab.',

  /* Where — the byte-identical service-area sentence. */
  where: `${site.company} is a service-area business with no showroom. We travel to the property. Coverage is Greater Houston, including ${site.serviceAreas.slice(0, 8).join(', ')} and surrounding communities.`,

  /* How work is won. */
  estimates:
    'Estimates are free, performed onsite, itemized in writing, and carry no upfront payment. We inspect the concrete, check for moisture and repair needs, and review flake and color samples under the lighting in the room the floor is going into.',

  /* What determines cost. */
  cost:
    'Cost is driven by slab square footage, the condition of the concrete, whether an existing coating has to be removed, how much crack and spall repair is required, the coating system selected, and whether stem walls or curbs are included.',

  /* Why preparation matters — the site's core technical argument. */
  preparation:
    'Coating adhesion is mechanical. Resin has to lock into the open pore structure of the concrete, so every slab is diamond-ground to remove laitance and the closed, power-troweled surface layer. Acid etching and pressure washing are not used as preparation methods because neither reliably opens a slab to a specified surface profile.',

  /* Credentials. */
  credentials: `${site.company} carries $2M general liability insurance plus workers' compensation, and backs its installations with a written 5-year workmanship warranty. Certificates of insurance are available on request.`,

  /* Contact — always the same string. */
  contact: `Call or text ${site.phone}, or email ${site.email}.`,
} as const

/* ---------------------------------------------------------------- */
/* Off-site entity consistency                                       */
/* ---------------------------------------------------------------- */

/*
  ENTITY DOCUMENTATION — what "the same business" has to look like off-site.

  The website can only assert identity; it cannot enforce it. `sameAs` in the
  JSON-LD (lib/schema.ts, built from `socialProfiles` in lib/site.ts) says
  "these profiles are this business". That assertion is only corroborated if
  the profiles themselves agree with the site — matching name, logo, phone,
  service area and positioning. Where they disagree, the conflict weakens the
  entity instead of strengthening it, which is worse than not linking at all.

  Verification is strongest when it is mutual: the site points out via
  `sameAs` and `rel="me"`, and each profile points back with the website field
  set to the canonical origin. A one-way link is a claim; a two-way link is
  corroboration.

  This list is deliberately data rather than prose — it is a checklist someone
  works through on each platform, and it is the same list for every profile.
  Nothing here is rendered; it is documentation for whoever maintains the
  profiles. If it should ever surface on the site, it needs rewriting for a
  customer audience first.
*/
export const profileConsistencyChecklist: readonly {
  field: string
  mustMatch: string
}[] = [
  { field: 'Business name', mustMatch: site.company },
  { field: 'Website field', mustMatch: site.canonical },
  { field: 'Phone', mustMatch: `${site.phone} — identical formatting to the site` },
  { field: 'Logo / profile image', mustMatch: 'The current site logo, not an older mark or a stock image' },
  { field: 'Service area', mustMatch: 'Greater Houston, Texas — matches entity.where, not a single city' },
  {
    field: 'Positioning',
    mustMatch:
      'Garage floor coatings / concrete coatings. Not "flooring" generally, and not a trade the site does not claim.',
  },
  {
    field: 'Service descriptions',
    mustMatch: 'Epoxy, polyaspartic and full-broadcast flake, per entity.what. No product performance figures.',
  },
  {
    field: 'Category',
    mustMatch: 'The same primary category as the Google Business Profile, so the entity reads consistently',
  },
] as const

/*
  Suggested profile bio. Owner-facing copy, not rendered.

  Kept consistent with the claims the site actually makes: the three systems in
  `entity.what`, diamond grinding and crack repair from `entity.preparation`,
  the Greater Houston coverage from `entity.where`, and the free onsite
  estimate from `entity.estimates`. Deliberately contains no rating, no review
  count, no job count and no performance figure — the same bar the site holds
  itself to, so a bio cannot become the one place an unverifiable claim leaks
  out. Do not add "5-star" or a review number here.
*/
export const profileBio = [
  'Houston Garage Floor Coatings',
  'Epoxy • Polyaspartic • Full Flake',
  'Diamond Grinding + Crack Repair',
  'Serving Greater Houston',
  'Free Estimates',
  site.canonical,
] as const

/* ---------------------------------------------------------------- */
/* Glossary                                                          */
/* ---------------------------------------------------------------- */

/*
  Every technical term the site uses, defined once. The brief requires each
  term be defined the first time it appears; `<Term>` in components/aeo.tsx
  reads from this map so a definition can never drift between pages.
*/
export const glossary = {
  'full-broadcast': {
    term: 'Full-broadcast',
    definition:
      'A flake floor in which vinyl chips are thrown into the wet base coat until the surface will not accept more, so the base coat is completely hidden. The alternative — a light scatter — leaves base coat visible between chips and uses a fraction of the material.',
  },
  refusal: {
    term: 'Refusal',
    definition:
      'The point during a flake broadcast at which the wet base coat will not hold any more chips. "Broadcast to refusal" is the specification; it is the clearest single thing to compare between two flake quotes.',
  },
  polyaspartic: {
    term: 'Polyaspartic',
    definition:
      'An aliphatic polyurea coating chemistry used as a clear topcoat. Being aliphatic, it is UV stable, which is why it goes on top of an epoxy base rather than the other way round. It also cures quickly, which shortens return-to-service but narrows the window an installer has to work the material.',
  },
  epoxy: {
    term: 'Epoxy',
    definition:
      'A two-part thermosetting resin used as a base coat. It bonds strongly into ground concrete and builds thickness well. It is aromatic, so it ambers and chalks under sustained sunlight — a documented property of the chemistry, and the reason it belongs underneath a UV-stable topcoat.',
  },
  laitance: {
    term: 'Laitance',
    definition:
      'A weak, dusty layer of fine cement particles brought to the surface during concrete finishing. A coating applied over laitance bonds to the laitance rather than to the slab, which is why the floor can peel away in sheets while the coating film itself is undamaged.',
  },
  spall: {
    term: 'Spall',
    definition:
      'A patch where the concrete surface has flaked, chipped or broken away, leaving a shallow crater. Spalls are repaired and levelled as their own step before any coating is applied.',
  },
  'moisture vapor transmission': {
    term: 'Moisture vapor transmission',
    definition:
      'Water vapor moving upward through a concrete slab from the soil beneath it. If the surface is sealed, pressure can build under the coating and lift it osmotically. Recognised test methods are ASTM F1869 (anhydrous calcium chloride) and ASTM F2170 (in-situ relative humidity probes).',
  },
  'hot-tire pickup': {
    term: 'Hot-tire pickup',
    definition:
      'Coating lifting from the slab where a warm tire sits. The tire softens the film and grips it as the rubber cools. The underlying cause is almost always inadequate bond to the concrete or a coating driven on before full cure — not a coating that was insufficiently hard.',
  },
  'mil thickness': {
    term: 'Mil thickness',
    definition:
      'Coating thickness measured in thousandths of an inch. Target thickness is specified by the coating manufacturer for the specific product and application, so we quote it from the technical data sheet for the system going on your slab rather than publishing a general figure.',
  },
  'concrete surface profile': {
    term: 'Concrete surface profile (CSP)',
    definition:
      'The ICRI scale describing how rough a prepared concrete surface is, from CSP 1 (nearly smooth) upward. Coating manufacturers name a target CSP in their data sheets; diamond grinding is how that profile is produced repeatably.',
  },
  dcof: {
    term: 'DCOF',
    definition:
      'Dynamic coefficient of friction — the measured standard for slip resistance, tested under ANSI A326.3. It is a number produced by a test, which is why we describe slip resistance in terms of what aggregate is added rather than with adjectives.',
  },
  aliphatic: {
    term: 'Aliphatic',
    definition:
      'A class of polymer chemistry that resists ultraviolet degradation. Aliphatic coatings such as polyaspartics and aliphatic urethanes hold their colour in sunlight; aromatic chemistries such as standard epoxy do not.',
  },
} as const

export type GlossaryKey = keyof typeof glossary

/* ---------------------------------------------------------------- */
/* Technical references                                              */
/* ---------------------------------------------------------------- */

/*
  Published standards only — organisations and the scope of what each standard
  covers. NO manufacturer data sheets are listed, because the owner has not
  supplied any and citing a data sheet we have not read would be worse than
  citing nothing.

  These are also deliberately not outbound links: standards live behind
  paywalls, and linking to a reseller page is not a citation.
*/
export const technicalReferences: readonly { org: string; ref: string; covers: string }[] = [
  {
    org: 'ICRI',
    ref: 'Guideline 310.2R — Concrete Surface Profile',
    covers:
      'The CSP scale used to specify how much a slab must be opened before coating. Referenced by most coating manufacturers in their preparation requirements.',
  },
  {
    org: 'ASTM International',
    ref: 'ASTM F1869 — Anhydrous Calcium Chloride Test',
    covers:
      'Measuring the rate of moisture vapor emission from a concrete slab. One of the two standard methods for assessing whether a slab is safe to seal.',
  },
  {
    org: 'ASTM International',
    ref: 'ASTM F2170 — In-Situ Relative Humidity',
    covers:
      'Measuring relative humidity inside a concrete slab using probes set into drilled holes. Generally the more reliable of the two moisture methods.',
  },
  {
    org: 'ASTM International',
    ref: 'ASTM D4258 / D4259 — Surface Preparation of Concrete',
    covers:
      'Standard practices for cleaning and abrading concrete prior to coating, including mechanical abrasion.',
  },
  {
    org: 'ANSI',
    ref: 'ANSI A326.3 — DCOF Test Method',
    covers:
      'The test method behind any credible slip-resistance figure for a hard surface.',
  },
  {
    org: 'SSPC / AMPP',
    ref: 'SSPC-SP 13 / NACE No. 6 — Surface Preparation of Concrete',
    covers:
      'Requirements for preparing concrete surfaces to receive protective coatings, widely referenced in commercial and industrial specifications.',
  },
]

/*
  What we deliberately do not cite, stated on the page rather than hidden. This
  is itself an authority signal: it tells a reader exactly where the boundary
  of our published claims is.
*/
export const referenceCaveat =
  'Product-specific figures — dry film thickness, cure and return-to-service times, abrasion and chemical-resistance ratings, and warranty terms on materials — come from the current technical data sheet for the exact product installed on your slab. We provide those data sheets on request and do not reproduce their numbers here, because a figure quoted from memory or from a competitor\u2019s site is how misinformation spreads.'
