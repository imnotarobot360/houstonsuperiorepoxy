/*
  Single source of truth for verified business facts.

  SERVICE-AREA BUSINESS: there is no public street address. Never add one here,
  in page copy, or in structured data — the mailbox suite that used to live in
  this file was removed because publishing it risks a Google Business Profile
  suspension.

  Anything not confirmed by the owner must NOT be invented. Render it as a
  visible {{TOKEN}} instead and leave it visible in the UI, so an unfilled
  value looks unfinished rather than looking like a fact. See `author` in
  lib/content/authority.ts for the pattern still in use.

  Every figure in this file is now owner-confirmed, so no token map remains
  here. Do not reintroduce estimated or illustrative values.
*/

/*
  THERE IS NO `rating` CONSTANT, AND NO REVIEW COUNT. DO NOT REINTRODUCE ONE.

  A 4.9 average over 200+ reviews used to live here and fed both the visible
  page and an AggregateRating node. Those reviews belong to Houston Superior
  PAINTING — a separate business. Publishing them as this entity's rating was
  false attribution, and doing it in structured data is the kind Google issues
  manual actions for, because the markup asserts the reviews are reviews OF
  Houston Superior Epoxy.

  The corporate relationship is real and stays (see `parentCompany` and the
  Organization `parentOrganization` link). The reviews do not transfer with it.

  When the epoxy division has its own Google reviews, they may be published
  here — sourced from ITS profile, not the parent's. Until then the honest move
  is to link to the profile and let the reader see the real number, which is
  what /reviews/ now does.
*/

export const site = {
  company: 'Houston Superior Epoxy',
  division: 'Epoxy & Concrete Coatings',
  tagline: 'Strong Floors. Built to Impress.',
  parentCompany: 'Houston Superior Painting',
  logo: {
    lockup: '/images/hse-logo-lockup.png',
    mark: '/images/hse-mark.png',
  },
  phone: '(346) 782-0903',
  phoneHref: 'tel:+13467820903',
  smsHref: 'sms:+13467820903',
  // E.164 for structured data. Schema.org wants a dialable international
  // number, not the display format with parentheses.
  phoneIntl: '+1-346-782-0903',
  email: 'info@houstonsuperiorepoxy.com',
  canonical: 'https://houstonsuperiorepoxy.com',
  parentSite: 'https://houstonsuperiorpainting.com',
  /*
    Self-serve scheduling app, hosted by the parent group (InsightPaint), so it
    is a different origin from this site.

    Two consequences worth knowing before changing anything here:

    1. Appointments booked there land in InsightPaint, NOT in this project's
       `estimate_leads` table. They will not appear at /admin/leads and will
       not trigger the owner-notification email. The /schedule/ form remains
       the path this site captures and emails itself, which is why both exist.
    2. It opens in a new tab rather than an iframe. The URL is a full landing
       page with its own hero, logo and CTAs — embedding it would nest a second
       landing page inside ours, and because it is cross-origin this site
       cannot scroll the frame down to the booking wizard.
  */
  bookingUrl: 'https://app.houstonsuperiorgroups.com/book/houston-superior-epoxy',
  /*
    The epoxy division's own Google Business Profile.

    Now the ONLY way the site refers to reviews: we link here and let the reader
    read whatever is actually on it. No number is copied out of it onto this
    site, because a hardcoded snapshot both goes stale and — while the profile
    is thin — invites borrowing the parent company's figures again.
  */
  googleBusinessProfile: 'https://www.google.com/maps?cid=12278763065042880776',
  /*
    TODO(owner): business hours are NOT part of the confirmed fact set.
    Confirm or replace before launch — these values are published in
    structured data as well as in the footer, so an incorrect entry here is a
    factual claim to Google, not just a display detail.

    `dayOfWeek` / `opens` / `closes` are the machine-readable twin of `time`.
    A day with `opens: null` is treated as closed and is omitted from
    openingHoursSpecification rather than published as a zero-length window.
  */
  hours: [
    {
      days: 'Mon – Fri',
      time: '7:00 AM – 7:00 PM',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:00',
      closes: '19:00',
    },
    {
      days: 'Saturday',
      time: '8:00 AM – 4:00 PM',
      dayOfWeek: ['Saturday'],
      opens: '08:00',
      closes: '16:00',
    },
    { days: 'Sunday', time: 'Closed', dayOfWeek: ['Sunday'], opens: null, closes: null },
  ],
  serviceAreas: [
    'Houston',
    'Richmond',
    'Katy',
    'Cypress',
    'Sugar Land',
    'The Woodlands',
    'Memorial',
    /*
      River Oaks: owner-confirmed via the content plan, which called for a
      combined Memorial / River Oaks page. Both names are represented by the
      `memorial-river-oaks` city page (see its `covers` field), so neither
      appears in the "also served" chips — they surface as that page instead.
    */
    'River Oaks',
    'The Heights',
    'Bellaire',
    'Pearland',
    'Fulshear',
    'Magnolia',
    /*
      Owner-confirmed additions. Deliberately listed here WITHOUT dedicated
      pages: this array is the coverage claim, and it drives `areaServed` in the
      schema plus the "also served" list on /service-areas/.

      A page only follows once there is something true and specific to say about
      that area's slabs — see the rule at the top of lib/content/cities.ts.
      Claiming coverage is a fact the owner supplied; writing a page is a content
      obligation, and the two are not the same thing.
    */
    'Spring',
    'Tomball',
    'Missouri City',
  ],
} as const

/*
  UNCONFIRMED PRICES — TOKENS, NOT FIGURES.

  This file previously published $4.50/sq ft, $1,000 and $1,800 as confirmed
  owner-supplied floors. That confirmation was withdrawn, so they are back to
  tokens and NOTHING renders them.

  Deliberately different from the `author` token pattern in
  lib/content/authority.ts, which renders `{{AUTHOR_NAME}}` visibly on the page
  as a nag. A visible `{{PRICE_2_CAR_STARTING}}` in 3rem type on /pricing/ would
  be published to visitors and crawled by Google, so these tokens are a REFILL
  POINT ONLY. Visible copy was rewritten to be genuinely price-free rather than
  to interpolate a token, and `isPlaceholder()` from authority.ts is the guard
  to use if any of these ever reach structured data.

  TO GO LIVE once the owner re-confirms, replace the three token values below
  and then re-wire the copy that was rewritten to remove them:
    - components/pricing.tsx      — the price grid was removed entirely
    - app/pricing/page.tsx        — intro, two body paragraphs, one FAQ answer
    - lib/site.ts                 — the two-car cost FAQ in `faqs`
    - lib/content/answers.ts      — the `pricing` route quickAnswer
    - lib/schema.ts               — `priceRange` on the LocalBusiness node

  `assumes` is NOT a price and stays: it describes what a starting rate would
  presuppose, and the cost-factor copy still needs it.
*/
export const pricing = {
  perSqFtFrom: '{{PRICE_PER_SQFT_RANGE}}',
  oneCarFrom: '{{PRICE_1_CAR_STARTING}}',
  twoCarFrom: '{{PRICE_2_CAR_STARTING}}',
  oneCarNote: 'minimum job charge',
  /* What a starting rate would presuppose. Still rendered — not a figure. */
  assumes:
    'the least expensive system on a sound slab with no existing coating to remove',
} as const

/*
  CONFIRMED TRACK RECORD — owner-supplied trust-bar counts.

  `projectsCompleted` keeps its own "+" because it is an open-ended floor, not
  an exact tally. Do not render a "+" after `yearsInBusiness`.

  MAINTENANCE TRAP: `yearsInBusiness` is a hardcoded count, so it silently
  becomes wrong on the next anniversary — a stale "7" is an inaccurate claim
  even though it was accurate when written. The robust fix is to store a
  confirmed founding year and compute the difference at render time, which
  never goes stale. That is deliberately NOT done here: deriving "founded 2019"
  from a rounded "7 years" would be an invented fact, and being off by a year
  in structured data is worse than a count that needs an annual review.

  TODO(owner): confirm the actual founding year (or month) and switch this to
  a computed value. Until then, re-check this number every year.

  Also why there is no schema.org `foundingDate`: it needs a real date, and we
  only have a rounded year count.
*/
export const trackRecord = {
  yearsInBusiness: '7',
  projectsCompleted: '100+',
} as const

/*
  OFFICIAL SOCIAL PROFILES — owner-confirmed. Single source of truth.

  This list is the only place profiles are declared. Adding one here puts it in
  three places at once: the footer link row, the `sameAs` array on both the
  Organization and LocalBusiness schema nodes (lib/schema.ts), and the profile
  list on /about/ and /contact/. Do not hardcode a profile URL anywhere else.

  THE BAR FOR ADDING A URL HERE IS OWNER CONFIRMATION, NOT A GUESSED HANDLE.
  `sameAs` is an identity assertion — it tells Google "this profile IS this
  business" — so a wrong URL merges someone else's account into this entity.
  Both URLs below were supplied by the owner as official.

  Note on the two URL forms:
    - Instagram uses the clean canonical profile URL, no tracking parameters,
      no trailing slash, no /?hl= locale suffix.
    - Facebook uses the permanent numeric `profile.php?id=` form. That 301s to
      /people/Houston-Superior-Epoxy/61592820986087/, and the /people/ slug is
      what Facebook currently calls canonical — but the slug contains the
      display name and changes if the page is renamed or a vanity username is
      set, whereas the numeric ID never changes. A stable URL that redirects is
      worth more in `sameAs` than a prettier one that can break.

  I could not independently verify the Instagram profile: instagram.com returns
  a 302 login redirect for real and non-existent handles alike, so HTTP status
  proves nothing either way. It is published on the owner's assertion. If the
  handle is ever wrong, fixing it here corrects every surface at once.
*/
export const socialProfiles: readonly { label: string; href: string }[] = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61592820986087' },
  { label: 'Instagram', href: 'https://www.instagram.com/houstonsuperiorepoxy' },
]

/*
  Only confirmed credentials appear here.

  The "4.9 average" and "200+ Google reviews" items were removed: they were the
  parent company's reviews, so presenting them as this entity's credentials was
  false attribution. Do not add a rating item back without reviews on the epoxy
  division's own profile.

  What remains are facts about THIS business — its insurance and its warranty —
  which is what a proof point should be.
*/
export const proofPoints: readonly {
  value: string
  label: string
  /* Kept on the type: a credential that cites a source should link to it. */
  link?: string
}[] = [
  { value: '$2M', label: 'Liability + workers’ comp' },
  { value: '5-Year', label: 'Workmanship warranty' },
]

export const assurances = [
  '$2M general liability + workers’ comp',
  '5-year workmanship warranty',
  'No upfront payment',
] as const

/*
  System specs describe process and materials only. No mil thickness, cure
  time, coverage rate, chemical resistance, adhesion or UV figures — those
  require the current manufacturer technical data sheet.

  `sample` is a FINISH SAMPLE coupon photograph — a depiction of the material
  itself, in the same category as a paint chip card. It is rendered through
  components/material-sample.tsx, which stamps a visible "Finish sample" label
  on every one. These are deliberately NOT installed-floor photography: a
  photo implying a job we performed requires real photography and belongs in
  lib/content/projects.ts. Do not swap a project photo into this field.
*/
export const systems = [
  {
    name: 'Flake Broadcast',
    tagline: 'The Houston garage standard',
    sample: {
      src: '/images/materials/flake-broadcast-finish-sample.png',
      alt: 'A square coating sample coupon held between finger and thumb, its surface densely packed with charcoal, orange, bone and grey vinyl flake under a clear topcoat.',
      caption: 'Full-broadcast vinyl flake coupon',
    },
    body: 'Vinyl flake broadcast to full refusal over an epoxy base coat, then locked under a clear polyaspartic topcoat. The flake layer hides slab imperfections and adds texture underfoot.',
    specs: ['Citadel SLE-100 base', 'Broadcast to refusal', 'Polyaspartic F61 topcoat'],
    best: 'Residential garages',
  },
  {
    name: 'Metallic Epoxy',
    tagline: 'A statement floor',
    sample: {
      src: '/images/materials/metallic-epoxy-finish-sample.png',
      alt: 'A square coating sample coupon on a dark studio background, its high-gloss surface showing copper, orange and charcoal pigments swirled into a marbled pattern.',
      caption: 'Hand-worked metallic coupon — every floor differs',
    },
    body: 'Pearlescent pigments are hand-worked into the resin while it is still open, so the pattern is different on every floor. Finished to a high gloss.',
    specs: ['Hand-worked pigment', 'High-gloss finish', 'Custom color blend'],
    best: 'Showrooms & interiors',
  },
  {
    name: 'Quartz Broadcast',
    tagline: 'Heavier build',
    sample: {
      src: '/images/materials/quartz-broadcast-finish-sample.png',
      alt: 'A square coating sample coupon on a dark studio background, its surface covered in densely packed rounded quartz granules in tan, grey, bone and rust with a visible sandy texture.',
      caption: 'Kiln-dried quartz aggregate coupon',
    },
    body: 'Kiln-dried quartz aggregate broadcast to refusal instead of vinyl flake. Produces a heavier, more textured surface than a flake system.',
    specs: ['Kiln-dried quartz', 'Double broadcast', 'Textured surface'],
    best: 'Wet areas & work floors',
  },
  {
    name: 'Solid Color',
    tagline: 'Clean and seamless',
    sample: {
      src: '/images/materials/solid-color-finish-sample.png',
      alt: 'A square coating sample coupon on a dark studio background, its surface a completely uniform mid-grey satin coating with no flake or aggregate.',
      caption: 'Uniform pigmented coupon, no broadcast layer',
    },
    body: 'A uniform pigmented coating with no decorative broadcast. The simplest way to seal a slab and stop concrete dusting.',
    specs: ['Uniform pigment', 'Gloss or satin', 'No broadcast layer'],
    best: 'Workshops & warehouses',
  },
] as const

/*
  MATERIAL AND FINISH SAMPLES — not project photography.

  Each entry here depicts a material, a finish characteristic or a substrate
  condition: the same category of image as a paint chip card or a countertop
  coupon. They are rendered through <MaterialSample>, which stamps a visible
  "sample" label on every one, and they are deliberately kept out of
  lib/content/projects.ts and out of the ImageObject project schema, because
  nothing here depicts a floor we installed for a customer.

  The rule that governs this file: an entry may illustrate a PROPERTY of the
  product ("gloss deepens colour", "full refusal leaves no base coat showing")
  or a METHOD we use ("this is what grinding does to a slab"), because both are
  true and checkable claims about materials and process. An entry may never be
  captioned or placed so that it reads as a finished job. If an image needs a
  city, an address, a date or a customer, it does not belong here — it belongs
  in projects.ts with real before/after photography.

  A method illustration carries one extra constraint: NO PEOPLE. Equipment on
  concrete illustrates a technique, but a figure operating it reads as this
  company's crew, and that is a claim about a specific workforce rather than
  about a method. Entries whose `kind` is "Illustration" are generated rather
  than photographed, which is exactly why their label says so.

  Captions are written to describe only what is actually visible in the frame.
  Do not upgrade a caption into a performance promise.
*/
export const finishSamples = {
  sheen: {
    src: '/images/materials/satin-vs-gloss-topcoat-finish-sample.png',
    alt: 'Two flake coating sample coupons side by side on a dark studio background. The left coupon has a low satin sheen with no reflection; the right coupon is high gloss, its colours deeper and a narrow highlight running across one corner.',
    kind: 'Finish sample',
    caption: 'Satin left, gloss right — gloss deepens colour and shows more',
  },
  flakeSize: {
    src: '/images/materials/flake-size-comparison-finish-sample.png',
    alt: 'Two flake coating sample coupons side by side on a dark studio background in the same charcoal, orange, bone and grey blend. The left coupon uses large quarter-inch chips reading as a bold chunky pattern; the right uses small eighth-inch chips reading almost like granite.',
    kind: 'Finish sample',
    caption: 'Same blend, quarter-inch chip left and eighth-inch right',
  },
  broadcast: {
    src: '/images/materials/full-vs-light-broadcast-finish-sample.png',
    alt: 'Two coating sample coupons side by side on a dark studio background. The left is broadcast to full refusal, flake completely covering the surface with no base coat visible; the right is a light partial broadcast with smooth grey base coat plainly showing between scattered chips.',
    kind: 'Finish sample',
    caption: 'Broadcast to refusal left, light broadcast right',
  },
  /*
    ILLUSTRATIVE, NOT A PHOTOGRAPH OF A JOB WE PERFORMED.

    A generated depiction of what the finished flake surface looks like: full
    refusal coverage, quarter-inch chip, gloss topcoat. It illustrates a
    PROPERTY of the system, which is what this registry is for, and it is
    rendered through <MaterialSample> so the "Illustration" label is visible on
    the image itself rather than living only in an alt attribute.

    It shows the surface plane only — no walls, no shelving, no garage door, no
    vehicle. That framing is deliberate and must be preserved if this image is
    ever regenerated: the moment a recognisable garage interior appears around
    it, the image stops reading as "this is what the finish looks like" and
    starts reading as "this is a garage we coated", which would be a
    misrepresentation. A real completed floor belongs in
    lib/content/projects.ts with before/after photography and a city.
  */
  flakeSurface: {
    src: '/images/materials/completed-flake-floor-surface-finish-sample.png',
    alt: 'Illustration of a finished vinyl flake floor surface in a charcoal, rust orange, bone and grey blend, viewed at a low angle across the plane. The chips are packed to full refusal with no base coat visible between them, and a soft band of daylight reflects off the clear gloss topcoat.',
    kind: 'Illustration',
    caption: 'How the finished surface reads — illustration, not a job photo',
  },
  /*
    ILLUSTRATIVE. NOT OUR CREW, AND NOT A JOB WE PERFORMED.

    Depicts the grinding STEP: a planetary grinder with dust extraction on a
    slab that is half done, so the boundary between the open matte profile and
    the untouched concrete is visible in a single frame. That boundary is the
    whole reason the image earns a place here — the difference between grinding
    and acid etching is the technical argument this business rests on, and it is
    genuinely hard to convey in prose.

    DELIBERATELY UNPEOPLED, AND IT MUST STAY THAT WAY. The slot it fills was
    labelled "our crew grinding a Houston garage slab", and generating figures
    to stand in for named employees — on the page whose schema subject IS this
    company — would fabricate the one claim a reader has no way to check.
    Equipment and concrete illustrate a method; invented people would assert a
    workforce. If this is ever regenerated: no faces, no hands, no boots, no
    silhouettes, no reflections.
  */
  grindingProcess: {
    src: '/images/materials/concrete-grinding-process-illustration.png',
    alt: 'Illustration of concrete grinding in progress: a walk-behind planetary grinder with a dust extraction hose stands unattended on a garage slab, with freshly ground matte concrete in the foreground meeting darker untouched concrete along a clear line behind the machine.',
    kind: 'Illustration',
    caption: 'What grinding does to a slab — illustration of the method, not our crew',
  },
  slipTexture: {
    src: '/images/materials/slip-texture-aggregate-finish-sample.png',
    alt: 'Extreme close-up of a flake coating surface lit from the side, showing fine translucent anti-slip aggregate suspended in the clear topcoat and several water droplets holding a beaded domed shape on the texture.',
    kind: 'Finish sample',
    caption: 'Fine aggregate in the topcoat, shown under raking light',
  },
  uvAmbering: {
    src: '/images/materials/topcoat-uv-ambering-finish-sample.png',
    alt: 'Two pale coating sample coupons side by side on a dark studio background. The left has yellowed to a warm tea-stained tone with a faint chalky haze; the right remains neutral and water-white.',
    kind: 'Finish sample',
    caption: 'An ambered topcoat left, a UV-stable one right',
  },
  groundConcrete: {
    src: '/images/materials/diamond-ground-concrete-csp2-material-sample.png',
    alt: 'Extreme close-up of bare uncoated concrete after diamond grinding, lit from the side to show faint circular grinder swirl patterns, open pinholes and pores, and fine sand and pale aggregate just exposed at the surface.',
    kind: 'Substrate sample',
    caption: 'Bare slab after diamond grinding — open, matte, no coating',
  },
} as const

/*
  ────────────────────────────────────────────────────────────────────────────
  SCENE ILLUSTRATIONS — GENERATED. NONE OF THESE ARE OUR WORK.
  ────────────────────────────────────────────────────────────────────────────

  Kept deliberately separate from finishSamples above, because they cross a
  line that file does not. A finish sample is a coupon on a studio background:
  it depicts a MATERIAL and cannot be mistaken for a job. Everything below
  depicts a FINISHED SPACE — a garage with walls and a door, a warehouse bay,
  a patio with a fence and a lawn. Room context is exactly what makes an image
  read as "a floor they installed for somebody".

  So these carry a heavier disclosure burden, and the rules are absolute:

   1. Every one renders through <MaterialSample>, which stamps a visible
      "Illustration" chip on the frame. Never through <ImageSlot>, which is
      reserved for real photography of our own work.
   2. Every caption says the word "illustration" in the visible text. The chip
      alone is not enough on a room-context image.
   3. NO PEOPLE, in any of them, ever. See the grindingProcess note above.
   4. No house numbers, street signs, licence plates, business signage or
      recognisable landmarks. Nothing that implies a specific address.
   5. They are illustrations of a FINISH TYPE and a SPACE TYPE. They must never
      acquire a city, a date, a customer, a square footage or a slug. The
      moment an image needs any of those it belongs in lib/content/projects.ts
      as real photography with a before/after pair.
   6. They must never be used as project-card covers in the Gallery's
      hasProjects branch, or inside <ProjectPhoto>. Those render the real
      archive.

  WHY THEY EXIST AT ALL: the owner asked for the empty frames to be filled.
  The honest way to grant that is a labelled illustration of the finish and
  the space type; the dishonest way is an unlabelled render presented as a
  portfolio. This is the former, and the labelling is what makes it the
  former, so do not quietly strip the chips or soften the captions later.

  These are placeholders with a job to do, not a substitute for a portfolio.
  Delete each one as real photography of that space type comes in.
*/
export const sceneIllustrations = {
  residentialGarage: {
    src: '/images/materials/completed-residential-garage-illustration.png',
    alt: 'Illustration of a finished residential garage floor: an empty two-car garage with a full-broadcast vinyl flake floor in charcoal, rust and cream under a high-gloss topcoat, coved up the base of the stem walls, with a closed sectional garage door beyond.',
    kind: 'Illustration',
    caption: 'Illustration of a finished flake garage floor — not a photograph of our work',
  },
  commercialFloor: {
    src: '/images/materials/completed-commercial-floor-illustration.png',
    alt: 'Illustration of a finished commercial floor: an empty light-industrial warehouse bay with a seamless mid-grey industrial epoxy floor at a satin sheen, yellow safety walkway lines along one side, and daylight from high clerestory windows.',
    kind: 'Illustration',
    caption: 'Illustration of a finished commercial floor — not a photograph of our work',
  },
  patioDeck: {
    src: '/images/materials/completed-patio-deck-illustration.png',
    alt: 'Illustration of a finished patio coating: an empty covered residential patio with a matte, lightly textured sand-beige decorative concrete surface running out to a lawn and a wooden fence, lit by low warm afternoon daylight that reveals the slip-resistant texture.',
    kind: 'Illustration',
    caption: 'Illustration of a textured exterior finish — not a photograph of our work',
  },
  metallicFloor: {
    src: '/images/materials/completed-metallic-floor-illustration.png',
    alt: 'Illustration of a finished metallic epoxy floor: an empty plain white room with a seamless poured metallic floor in charcoal and pewter with silver-grey marbled veining and a mirror-like gloss reflecting a tall window.',
    kind: 'Illustration',
    caption: 'Illustration of a metallic pour — not a photograph of our work',
  },
  /*
    The two below are process rather than outcome, so they sit closer to
    grindingProcess in spirit — but they still show slab-in-a-garage context,
    which is why they live here under the stricter rules rather than above.
  */
  coatingRemoval: {
    src: '/images/materials/coating-removal-progress-illustration.png',
    alt: 'Illustration of coating removal in progress: a garage slab split diagonally, with an old grey-beige coating visibly blistered and peeling away in curling flakes on one side, and bare freshly ground concrete showing faint grinder swirls on the other.',
    kind: 'Illustration',
    caption: 'Illustration of removal in progress — old coating one side, stripped slab the other',
  },
  crackRepair: {
    src: '/images/materials/crack-repair-detail-illustration.png',
    alt: 'Illustration of a crack repair: a close-up of a concrete slab where a crack has been cut open into a clean-edged V-groove roughly an inch wide and filled with grey polyurea sitting slightly proud of the surrounding ground concrete, before flush grinding.',
    kind: 'Illustration',
    caption: 'Illustration of a chased and filled crack, before flush grinding',
  },
} as const

/*
  The actual installation sequence, owner-confirmed. Diamond grinding is the
  preparation method — never describe acid etching as the standard process.
  The phrase "when appropriate" on steps 5 and 8 is required: substrate
  conditions sometimes call for a different system.
*/
export const process = [
  { step: '01', text: 'Inspect the concrete and identify cracks, damage, contamination, and moisture concerns' },
  { step: '02', text: 'Mechanically prepare the concrete with professional diamond grinding' },
  { step: '03', text: 'Vacuum dust using professional dust-control equipment' },
  { step: '04', text: 'Repair eligible cracks, spalls, and surface imperfections' },
  { step: '05', text: 'Apply Citadel SLE-100 epoxy base coat when appropriate for the selected system' },
  { step: '06', text: 'Broadcast decorative flakes to full refusal for full coverage' },
  { step: '07', text: 'Scrape and vacuum loose flakes to create an even texture' },
  { step: '08', text: 'Apply Polyaspartic F61 clear topcoat when appropriate for the system' },
  { step: '09', text: 'Final quality inspection and care instructions' },
] as const

/*
  `sample` replaces the old `slot`. Each entry pointed at an empty labelled
  frame reading "Garage project photo"; it now points at a labelled
  illustration of that space type instead. The keys index sceneIllustrations,
  so the disclosure rules documented on that object govern these too — most
  importantly that <Applications> renders them through <MaterialSample>, never
  through <ImageSlot>.
*/
export const applications = [
  {
    title: 'Residential garages',
    sample: 'residentialGarage',
    body: 'One-, two- and three-car slabs. Diamond-ground, repaired, then coated in the flake or metallic system you choose.',
    tags: ['1–3 car', 'Flake or metallic', 'Diamond-ground prep'],
  },
  {
    title: 'Patios & pool decks',
    sample: 'patioDeck',
    body: 'Exterior concrete takes sun and standing water, so these slabs are assessed separately and finished with a textured surface.',
    tags: ['Textured finish', 'Exterior exposure', 'Covered or open'],
  },
  {
    title: 'Commercial & warehouse',
    sample: 'commercialFloor',
    body: 'Larger slabs phased around your operating hours, including nights and weekends, so the space stays usable.',
    tags: ['Phased installs', 'After-hours scheduling', 'Warehouses & showrooms'],
  },
] as const satisfies readonly {
  title: string
  sample: keyof typeof sceneIllustrations
  body: string
  tags: readonly string[]
}[]

/*
  Comparison covers process and contract terms only — the areas we can speak
  to directly. No performance figures.
*/
export const comparison = [
  {
    point: 'Surface preparation',
    ours: 'Mechanical diamond grinding with professional dust control',
    theirs: 'Acid etch or a pressure wash',
  },
  {
    point: 'Cracks & spalls',
    ours: 'Repaired as a separate step before any coating goes down',
    theirs: 'Coated straight over',
  },
  {
    point: 'Flake coverage',
    ours: 'Broadcast to full refusal, then scraped and vacuumed even',
    theirs: 'Partial scatter, thin coverage',
  },
  {
    point: 'Topcoat',
    ours: 'Polyaspartic F61 clear topcoat when appropriate for the system',
    theirs: 'Single-coat consumer kit',
  },
  {
    point: 'Insurance',
    ours: '$2M general liability plus workers’ compensation',
    theirs: 'Often unverified',
  },
  {
    point: 'Warranty',
    ours: 'Written 5-year workmanship warranty',
    theirs: 'Product-only, prorated at best',
  },
] as const

/*
  What actually moves a quote above the starting price. Deliberately carries no
  dollar figures of its own: the published numbers live in `pricing` so there is
  exactly one place to change them.
*/
export const costFactors = [
  {
    title: 'Square footage & layout',
    body: 'Total area sets the material and labor baseline. Tight, cut-up spaces take longer per foot than open slabs.',
  },
  {
    title: 'Existing coating removal',
    body: 'A previously coated or sealed slab has to be stripped back mechanically before new work starts. This is often the single largest variable.',
  },
  {
    title: 'Concrete condition',
    body: 'Cracks, spalls, pitting and past patchwork are repaired as their own step. More repair means more time before coating.',
  },
  {
    title: 'Moisture conditions',
    body: 'Slabs that push vapor are handled differently than dry slabs. We check for moisture during the inspection, not after.',
  },
  {
    title: 'Coating system chosen',
    body: 'Flake, metallic, quartz and solid color are not the same amount of material or labor.',
  },
  {
    title: 'Flake & color selection',
    body: 'Blend and coverage choices affect material cost and how many passes the install takes.',
  },
  {
    title: 'Vertical stem walls',
    body: 'Coating up the stem walls or curbs adds detail work and cut-in time beyond the floor area.',
  },
  {
    title: 'Number of coats',
    body: 'The system and the substrate together determine how many coats the floor needs.',
  },
  {
    title: 'Indoor vs exterior exposure',
    body: 'Exterior slabs face sun and water, which changes the specification and the surface texture.',
  },
  {
    title: 'Access & scheduling',
    body: 'Stairs, tight entries, occupied buildings and after-hours or weekend work all affect labor.',
  },
] as const

/*
  The site's differentiator section.

  Every claim here is either (a) a description of our own process, or (b)
  publicly documented industry standard / polymer chemistry. Deliberately NO
  performance numbers: no adhesion psi, no DCOF value, no mil thickness, no
  chemical-resistance rating, no lifespan figure. Those belong to the
  manufacturer's current technical data sheet, not to marketing copy.
*/
export const preparationTopics = [
  {
    title: 'Adhesion is mechanical, not magical',
    body: 'A floor coating is held down by resin locking into the open pore structure of the concrete. A power-troweled slab is closed at the surface and usually carries laitance — a weak, dusty layer of fines brought up during finishing. Coat over it and the resin bonds to the laitance instead of the concrete, so the floor can peel off in sheets while the coating film itself is still perfectly intact.',
  },
  {
    title: 'Concrete surface profile is a specification',
    body: 'The industry measures surface roughness on the ICRI concrete surface profile scale, and coating manufacturers name a target profile in their technical data sheets. Diamond grinding is how that profile gets produced repeatably. Acid etching and pressure washing clean a slab but do not reliably open it to a specified profile, which is why we do not use them as our preparation method.',
  },
  {
    title: 'Cracks get treated, not bridged',
    body: 'Cracks are repaired as their own step before any coating goes down. Part of the inspection is judging whether a crack is dormant or still moving, because a moving crack telegraphs straight back through a coating that was simply filmed over it. Control and expansion joints are handled deliberately rather than buried, since a joint exists to let the slab move.',
  },
  {
    title: 'Moisture gets evaluated before anything is quoted',
    body: 'Concrete on grade can drive water vapor upward from the soil below, and a coating that seals a slab pushing vapor can blister osmotically from underneath. The recognised test methods are ASTM F1869 (anhydrous calcium chloride) and ASTM F2170 (in-situ relative humidity probes). We look for moisture indicators during the inspection so the specification accounts for it, instead of discovering it after the floor is down.',
  },
  {
    title: 'UV stability is a chemistry question',
    body: 'Standard epoxy resins are aromatic, and aromatic chemistry ambers and chalks under sustained ultraviolet exposure — a well-documented property, not a defect. Aliphatic chemistries such as polyaspartics and aliphatic urethanes are the UV-stable option, which is why the topcoat matters far more than the base coat on any slab that sees daylight.',
  },
  {
    title: 'Chemical resistance belongs to the topcoat',
    body: 'What a finished floor tolerates — brake fluid, road salt, battery acid, pool chemicals, degreasers — is a property of the topcoat chemistry and the specific reagent and dwell time, not of "epoxy" in general. We specify from the manufacturer\'s current resistance data for the system going on your slab rather than publishing a blanket rating, and we tell you what the floor is not rated for.',
  },
  {
    title: 'Hot-tire pickup is a bond failure',
    body: 'When a tire comes home hot from a Houston summer drive, it softens the coating at the contact patch and lifts it as the car cools and the rubber grips. The reason it lifts is almost always inadequate bond to the concrete or a coating driven into service before it reached full cure — not a coating that was insufficiently hard. Adequate profile, a fully cured system and a topcoat appropriate to vehicle traffic are what prevent it.',
  },
  {
    title: 'Slip resistance is a choice you make',
    body: 'A full-broadcast flake floor already has texture from the flake edges under the clear coat. Where more is needed — patios, pool decks, wash bays, commercial walkways — aluminium oxide or polymer grit can be suspended in the topcoat. This is a real tradeoff: more aggressive texture is more secure underfoot and harder to mop, and slip resistance is measured as DCOF under ANSI A326.3 rather than described with adjectives.',
  },
  {
    title: 'Preparation is what sets service life',
    body: 'The failure interface on nearly every peeling floor we strip out is between the coating and the concrete, not inside the coating film. That means the resin can never outperform the bond underneath it, and preparation is the one variable a low bid removes first because it is invisible in the finished floor. It is also the variable we will not trade away, which is the honest reason our number is rarely the cheapest one you receive.',
  },
] as const

export const faqs = [
  {
    q: 'How much does a two-car garage floor coating cost in Houston?',
    /*
      Answers the cost question without a figure, because this string is
      published in FAQPage structured data as well as on the page — a number
      here is a price claim made to Google, not just to a reader.

      It still has to be a real answer. "It depends" is worthless, so this names
      the four things that actually move the number, in rough order of impact,
      and states what the quote process guarantees. That is genuinely useful to
      someone comparing bids and is all true.
    */
    a: 'Cost is driven by four things, and slab condition matters more than square footage. First, whether an existing coating has to be ground off — that is the single largest swing. Second, crack and spall repair, which is quoted as its own line because scope varies enormously between floors. Third, slab moisture, which can change which system will bond reliably. Fourth, the system itself: a solid colour, a full flake broadcast and a metallic finish are different amounts of material and labour. We inspect the slab, itemize all of it in writing, and take no payment upfront.',
  },
  {
    q: 'How long does the installation take?',
    a: 'Most residential garages are an install measured in days rather than weeks, and you get a specific schedule with your itemized quote. What moves it is slab size, how much crack and spall repair the concrete needs, whether an old coating has to come off first, and the system being installed. We commit to the schedule after the inspection rather than guessing over the phone.',
  },
  {
    q: 'When can I walk on it and when can I park on it?',
    a: 'Foot traffic returns before vehicle traffic, and vehicle traffic is the one worth waiting for. The exact return-to-service times are set by the manufacturer\'s current technical data sheet for the system installed and by the temperature and humidity during cure, so we give you the specific hours in writing at the final walkthrough instead of publishing a number here that might not apply to your floor. Driving on a coating before full cure is one of the most common causes of hot-tire pickup.',
  },
  {
    q: 'Epoxy or polyaspartic — which is right for a Houston garage?',
    a: 'For most Houston garages the answer is both, in layers: an epoxy base coat for build and bond into the ground concrete, and a polyaspartic clear topcoat for the wearing surface. They are not competitors so much as different jobs. Polyaspartic is aliphatic and therefore UV stable, and it cures fast enough to be workable in a wide temperature window; epoxy is aromatic and will amber in sunlight, which is exactly why it belongs underneath rather than on top.',
  },
  {
    q: 'Will the floor be slippery when it gets wet?',
    a: 'A full-broadcast flake floor has meaningful texture built in, because the flake edges sit under the clear coat rather than being smoothed flat. Where you want more grip — a patio, a pool deck, a wash bay — we can suspend aluminium oxide or polymer grit in the topcoat. It is a genuine tradeoff to decide before install: more texture is more secure underfoot and harder to mop clean.',
  },
  {
    q: 'How do you prepare the concrete?',
    a: 'We mechanically prepare every slab with professional diamond grinding and capture the dust with dust-control equipment. Grinding removes laitance and the closed, troweled surface, and opens the concrete to a profile the coating can lock into. Acid etching is not our preparation method.',
  },
  {
    q: 'Can you coat a cracked concrete floor?',
    a: 'Usually yes — cracks are repaired as a separate step before any coating goes down, never coated over. During the inspection we judge whether each crack is dormant or still moving, because an active crack will telegraph back through a coating that was simply filled and filmed. Houston clay soils mean seasonal slab movement is normal here, and control joints are treated deliberately rather than buried.',
  },
  {
    q: 'Can you remove an old peeling coating?',
    a: 'Yes, and on a failing floor that is the only honest starting point. Failed coating is removed mechanically back to sound concrete, the slab is then re-profiled and repaired, and the new system goes down on bare concrete. Removal is often the single largest variable in a quote, which is why we want to see the floor before pricing it.',
  },
  {
    q: 'Can you apply epoxy over self-leveling concrete or an overlay?',
    a: 'Sometimes, but it depends entirely on what the overlay is and how well it is bonded to the slab beneath it. A coating cannot be stronger than what it is stuck to, so a self-leveler that is hollow-sounding, chalky or delaminating has to come off rather than be coated. We sound and test the overlay during the inspection and tell you plainly if it needs to go.',
  },
  {
    q: 'Does Houston humidity affect the installation?',
    a: 'Yes, in two separate ways. Ambient humidity and dew point affect how coatings cure and can cause blush or cloudiness if a system is installed outside its window, and separately, moisture driving up through a slab on grade can blister a coating from underneath. We work to the manufacturer\'s stated conditions for the system and check the slab for moisture indicators during the inspection, before quoting.',
  },
  {
    q: 'What actually causes a garage floor coating to peel?',
    a: 'Inadequate bond to the concrete, in the large majority of cases. When we strip a failed floor, the separation is almost always between the coating and the slab rather than inside the coating film — the signature of a surface that was never mechanically opened, or was coated over laitance, an old sealer or moisture. Driving on a coating before it reaches full cure is the other common cause.',
  },
  {
    q: 'What is a full-broadcast flake system?',
    a: 'It means vinyl flake is broadcast into the wet base coat until the surface will not accept any more — broadcast to refusal — rather than scattered thinly for looks. The loose flake is then scraped and vacuumed to an even texture and locked under a clear polyaspartic topcoat. Full coverage hides slab imperfections, adds texture underfoot, and produces a consistent surface instead of visible bare patches between flakes.',
  },
  {
    q: 'How long will the floor last?',
    a: 'Our workmanship carries a written 5-year warranty. Beyond that, honest service life depends on preparation quality, the system specified, and how the floor is used — a lightly used residential garage and a forklift aisle are not the same question, and we would rather point you at the warranty we actually stand behind than publish a lifespan figure we cannot support. What we can tell you is that preparation, not the resin, is what determines it.',
  },
  {
    q: 'Do you coat patios and outdoor kitchens?',
    a: 'Yes, and exterior slabs are assessed separately from garages. Sun exposure makes a UV-stable aliphatic topcoat essential rather than optional, standing water and pool chemicals change the specification, and slip resistance usually needs to be increased with aggregate in the topcoat. Drainage and how the slab was originally poured matter more outdoors than in.',
  },
  {
    q: 'Do you take commercial and warehouse work?',
    a: 'Yes. Commercial installs are phased around your operating hours — including nights and weekends — so the space stays usable, and larger slabs bring their own considerations like joint detail, forklift traffic and line striping. We carry $2M general liability plus workers\' compensation and can provide certificates of insurance for your facility requirements on request.',
  },
  {
    q: 'How do I clean the finished floor?',
    a: 'A dust mop and a damp mop with a pH-neutral cleaner handles routine cleaning; a coated floor is far easier to maintain than bare concrete because there is no open pore structure to absorb oil. Avoid the things that dull or attack a coating: harsh solvents, acidic cleaners and abrasive pads. You get written care instructions specific to your system at the final walkthrough.',
  },
  {
    q: 'Are estimates really free?',
    a: 'Yes — the onsite estimate is free, itemized in writing, and carries no obligation and no upfront payment. We come to your slab, inspect the concrete, check for moisture and repair needs, and go through flake and colour samples under your own lighting. Quoting a floor without seeing it is how surprises end up on invoices.',
  },
  {
    q: 'Which Houston areas do you serve?',
    a: `We are a service-area business covering Greater Houston, including ${site.serviceAreas.slice(0, 8).join(', ')} and surrounding communities. There is no showroom to visit — we come to your concrete. Estimates are free everywhere we serve.`,
  },
] as const
