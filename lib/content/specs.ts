import type { GlossaryKey } from '@/lib/content/authority'
import type { RouteKey } from '@/lib/routes'

/*
  Labeled spec fields for the "at a glance" block.

  WHY THIS FILE EXISTS SEPARATELY FROM answers.ts
  answers.ts holds prose — a question and a 40-70 word paragraph. This holds
  short labeled values. They are different shapes with different rules, and an
  answer engine treats them differently: it quotes the paragraph, but it reads
  the labeled fields as key/value pairs it can lift individually. Mixing them
  in one file made the "no invented figures" rule harder to audit, because the
  fields are where a number would be most tempting to invent.

  THE FIGURE RULE, RESTATED FOR THIS FILE
  Cure times, return-to-service hours, mil thickness and coverage rates are all
  properties of the specific product installed, published in the manufacturer's
  current technical data sheet, and modified by slab temperature and humidity on
  the day. This business does not have one fixed value for any of them.

  So every such field below is QUALITATIVE and says the exact figure comes in
  writing after inspection. That is not hedging — it is the only accurate answer
  available, and it is more defensible than a number that would be wrong for
  half the floors it is applied to. Search "RETURN_TO_SERVICE" here and in
  lib/site.ts to see the same policy stated at both layers.

  Only two constants below are hard facts about THIS business rather than about
  a product: the warranty term and the preparation method. Both are
  owner-confirmed and both already appear in lib/site.ts.
*/

/*
  Shared values, defined once.

  These three are identical on all 14 pages because they are facts about how
  this company works, not about the system being described. Repeating the
  strings per page would let them drift apart — and a warranty term that
  disagrees with itself across pages is worse than no warranty statement.
*/
const WARRANTY = '5-year written workmanship warranty'

const PREPARATION = 'Mechanical diamond grinding with dust control. Never acid etching.'

const RETURN_TO_SERVICE =
  'Foot traffic returns before vehicle traffic. Exact hours are set by the installed system\u2019s technical data sheet and by cure-day temperature and humidity, so they are given in writing at the final walkthrough rather than published as a fixed number.'

export type PageSpec = {
  /*
    A one-line verdict. NOT a copy of the 40-70 word quick answer that renders
    directly above this block on every page — that would be the same text twice
    within one screen. This is the compressed judgement: the single sentence to
    keep if you keep nothing else.
  */
  verdict: string
  bestFor: readonly string[]
  notRecommendedWhen: readonly string[]
  installationTime: string
  returnToService?: string
  preparationMethod?: string
  warranty?: string
  whatDrivesCost: readonly string[]
}

export const pageSpecs: Partial<Record<RouteKey, PageSpec>> = {
  garageCoatings: {
    verdict:
      'For a Houston garage, a ground slab with an epoxy base and a polyaspartic clear topcoat is the system that lasts.',
    bestFor: [
      'Residential garages of any size, one to four cars',
      'Slabs with hot-tire pickup from a previous coating or bare concrete staining',
      'Owners who want a floor that can be swept and mopped rather than degreased',
    ],
    notRecommendedWhen: [
      'The slab has active moisture vapour transmission that has not been addressed first',
      'Structural cracking or settlement is present — that is a concrete repair question before it is a coating question',
      'You need the garage back in service within a day or two of starting',
    ],
    installationTime:
      'A typical residential garage is a multi-day installation because grinding, base coat, broadcast and topcoat each have to happen in sequence with cure time between them. The specific schedule for your floor is confirmed in writing before work starts.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Square footage, though not linearly — mobilisation is a fixed cost spread across the area',
      'Slab condition: existing coating removal, crack and spall repair, and stem wall work are separate scopes',
      'System specified — a full-broadcast flake floor and a metallic floor are different labour',
      'Access and obstructions, including whether the garage is emptied before the crew arrives',
    ],
  },

  epoxyFlooring: {
    verdict:
      'Epoxy is the right base coat for its build and bond, but it ambers in sunlight and belongs under a UV-stable topcoat rather than on top.',
    bestFor: [
      'The base layer of a garage or commercial floor system, bonded into freshly ground concrete',
      'Interior slabs with no direct sunlight exposure',
      'Applications needing film build to level a slightly irregular surface',
    ],
    notRecommendedWhen: [
      'It is being sold as a single-coat finished floor with no topcoat over it',
      'The surface sees direct sunlight and colour stability matters — epoxy is aromatic and will amber',
      'The slab was not mechanically profiled first, in which case no resin will hold',
    ],
    installationTime:
      'Installed as one layer within a multi-day system rather than as a standalone job. Sequence and schedule are confirmed in writing before work starts.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Number of coats and total film build specified',
      'Slab condition and how much repair precedes coating',
      'Whether a UV-stable topcoat is included over it, which it should be',
    ],
  },

  polyaspartic: {
    verdict:
      'Polyaspartic is the correct clear topcoat because it is aliphatic and holds its colour in sunlight, but it is not a one-coat replacement for a full system.',
    bestFor: [
      'The clear wearing surface over an epoxy base and flake broadcast',
      'Floors with sun exposure where an epoxy top layer would amber',
      'Projects where a shorter return to service genuinely matters',
    ],
    notRecommendedWhen: [
      'Someone is offering it as a one-coat replacement for a complete system',
      'The installer is inexperienced — the fast cure narrows the working window and punishes hesitation',
      'The slab underneath has not been properly ground and repaired',
    ],
    installationTime:
      'Applied as the final layer of a multi-day system. The fast cure shortens the wait between coats but does not compress the whole installation into one day.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Area and number of clear coats',
      'Whether anti-slip aggregate is suspended in the topcoat',
      'The base system it is going over',
    ],
  },

  flake: {
    verdict:
      'A full-broadcast flake floor is the default recommendation for a Houston garage: it hides slab imperfection, has slip texture built in, and wears well.',
    bestFor: [
      'Residential garages where appearance and durability both matter',
      'Slabs with minor cosmetic imperfection — the flake layer conceals what a solid colour would highlight',
      'Owners who want texture underfoot without a separate anti-slip additive',
    ],
    notRecommendedWhen: [
      'You want a completely smooth, uniform surface — a flake floor has deliberate texture',
      'The specification is a partial broadcast being sold as full broadcast; ask which it is',
      'The slab needs structural repair that has not been scoped',
    ],
    installationTime:
      'A multi-day installation: grind, base coat, broadcast flake to refusal, scrape and vacuum the excess, then clear topcoat. Each stage needs the previous one cured.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Whether the broadcast is full — to refusal — or partial, which changes flake volume substantially',
      'Area, slab condition and repair scope',
      'Number of clear coats over the broadcast',
    ],
  },

  metallic: {
    verdict:
      'A metallic floor is a decorative finish with real installer variability; it is a design choice first and a durability choice second.',
    bestFor: [
      'Interior feature floors — showrooms, entries, retail, finished basements',
      'Owners who want a one-off appearance and accept that no two pours match',
      'Spaces where the floor is meant to be looked at rather than worked on',
    ],
    notRecommendedWhen: [
      'You need a predictable, repeatable appearance or a colour match to a sample',
      'The floor will take heavy vehicle or forklift traffic',
      'Slip resistance is a priority and no aggregate is being added',
    ],
    installationTime:
      'A multi-day installation, and the decorative coat cannot be rushed. Schedule confirmed in writing before work starts.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Complexity of the effect and the number of pigments involved',
      'Labour, which is the dominant factor — metallic is skill-intensive',
      'Area, slab condition and clear coat specification',
    ],
  },

  solidColor: {
    verdict:
      'A solid colour is the cleanest, most uniform finish and the least forgiving of a slab that is not flat.',
    bestFor: [
      'Commercial and industrial spaces wanting a uniform, easily inspected surface',
      'Owners who want a deliberately plain, architectural floor',
      'Slabs that are genuinely flat and sound',
    ],
    notRecommendedWhen: [
      'The slab has cosmetic imperfection — a solid colour highlights everything a flake floor would hide',
      'You want slip texture without adding a separate aggregate',
      'Sunlight exposure is significant and no UV-stable topcoat is specified',
    ],
    installationTime:
      'A multi-day installation. Fewer stages than a broadcast floor, but cure time between coats still governs the schedule.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Area and number of coats',
      'How much slab levelling and repair is needed first, which a solid colour makes visible',
      'Whether anti-slip aggregate is added',
    ],
  },

  commercial: {
    verdict:
      'Commercial work is scoped around downtime and use, not just square footage — the schedule is usually the hardest constraint.',
    bestFor: [
      'Retail, warehouse, workshop and institutional slabs',
      'Facilities that need a cleanable, inspectable surface',
      'Projects that can be phased around operating hours',
    ],
    notRecommendedWhen: [
      'The facility cannot release any area for the sequence of grind, coat and cure',
      'Slab moisture has not been assessed on a large pour',
      'The specification is being driven purely by lowest bid, which is where preparation gets cut',
    ],
    installationTime:
      'Scoped per project and phased around your operating hours. The written quote states the sequence and the areas released at each stage.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Total area and how many phases the work has to be split into',
      'Out-of-hours or weekend working to protect operations',
      'Slab condition across a large pour, including joints and moisture',
      'System specified for the actual traffic — foot, pallet or forklift',
    ],
  },

  warehouse: {
    verdict:
      'Warehouse slabs are a traffic and joint problem before they are a coating problem; forklift aisles and foot areas are not the same specification.',
    bestFor: [
      'Distribution and storage floors needing a durable, cleanable surface',
      'Facilities marking traffic routes and pedestrian zones',
      'Slabs where dust control from bare concrete is a concern',
    ],
    notRecommendedWhen: [
      'Joints and cracks have not been assessed — they move, and a coating alone will not stop that',
      'The whole floor is being specified to one system regardless of traffic type',
      'No area can be taken out of service for the required sequence',
    ],
    installationTime:
      'Phased across zones so the facility keeps operating. The written scope states which areas are released when.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Area, and how many phases operations require',
      'Joint treatment and crack repair, which on a warehouse slab is often the largest line',
      'Different systems for forklift aisles versus pedestrian areas',
      'Line marking and zone demarcation',
    ],
  },

  patio: {
    verdict:
      'Outdoor concrete needs a UV-stable topcoat and deliberate slip texture; an interior garage specification does not transfer outside.',
    bestFor: [
      'Patios, pool surrounds and walkways exposed to sun and water',
      'Surfaces that are walked on barefoot and wet',
      'Owners wanting a finished look on existing outdoor concrete',
    ],
    notRecommendedWhen: [
      'The specification uses an epoxy top layer, which will amber outdoors',
      'Slip resistance is not being addressed for a wet, barefoot surface',
      'The slab has drainage or moisture problems that coating would trap',
    ],
    installationTime:
      'A multi-day installation, and outdoor work is weather-dependent — humidity and dew point affect cure, so dates can move.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Area and shape complexity — pool surrounds have far more edge per square foot',
      'Anti-slip aggregate, which outdoor surfaces should have',
      'Slab condition, drainage and any repair needed first',
    ],
  },

  removal: {
    verdict:
      'Removing a failed coating is its own scope with its own cost, and what is underneath is only fully known once it is off.',
    bestFor: [
      'Slabs with a peeling, delaminating or hot-tire-damaged existing coating',
      'Floors previously sealed or coated over inadequate preparation',
      'Any recoat where the existing film cannot be reliably bonded to',
    ],
    notRecommendedWhen: [
      'The existing coating is sound and a compatible recoat has been verified',
      'Nobody has inspected what is under the coating — expect the scope to change once it is removed',
    ],
    installationTime:
      'Quoted as a separate stage ahead of the new floor. Duration depends on how many layers there are and how well they are bonded, which is why it is inspected before it is quoted.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Number of coats and how tenaciously they are bonded — a well-bonded old floor is harder to remove',
      'Coating type, since some soften and load the tooling',
      'Slab damage revealed underneath, which is genuinely unknown until removal',
      'Area and access for equipment and dust control',
    ],
  },

  grinding: {
    verdict:
      'Diamond grinding is the whole foundation of the job: it is what removes laitance and opens the slab to a profile the coating can lock into.',
    bestFor: [
      'Every slab this company coats, without exception',
      'Removing laitance, old sealers and the closed troweled surface',
      'Producing a specified concrete surface profile repeatably',
    ],
    notRecommendedWhen: [
      'Never skipped. If a bid omits mechanical preparation, that is the bid to question.',
      'Acid etching is not a substitute — it cleans but does not reliably open a slab to profile',
    ],
    installationTime:
      'The first stage of every installation, sized to the slab area and condition.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Area and slab hardness',
      'How much existing coating or sealer has to come off first',
      'Dust control requirements, which are higher in occupied buildings',
    ],
  },

  repair: {
    verdict:
      'Cracks and spalls are repaired before coating because a coating spans nothing — it follows whatever is underneath it.',
    bestFor: [
      'Spalled edges, pop-outs and surface damage ahead of coating',
      'Non-structural cracks that need filling before a floor goes down',
      'Stem walls and transitions that would otherwise show at the perimeter',
    ],
    notRecommendedWhen: [
      'The crack is structural or the slab is settling — that needs a structural assessment, not a filler',
      'Active moisture movement through the crack has not been diagnosed',
      'It is being skipped to reduce a quote, which is where the next failure starts',
    ],
    installationTime:
      'Quoted as a stage before coating, with duration set by the extent of the damage found at inspection.',
    returnToService: RETURN_TO_SERVICE,
    preparationMethod: PREPARATION,
    warranty: WARRANTY,
    whatDrivesCost: [
      'Linear feet of cracking and total spalled area',
      'Depth of damage and whether edges need rebuilding',
      'Stem wall height and length if included',
    ],
  },
}

/*
  Which technical terms each page defines.

  The brief requires every technical term be defined at first use on each page
  INDEPENDENTLY — a reader arriving from a search result lands on one page and
  never sees the others, so a definition that only exists on a sibling page
  might as well not exist.

  Listing the terms per page here, rather than defining them per page, is what
  makes that safe: each page declares only the terms it actually uses, but all
  twelve read their wording from the single `glossary` map in authority.ts. Two
  pages therefore cannot drift into describing "laitance" differently, which is
  exactly the failure that makes a site look unreliable to an answer engine
  comparing its claims.

  Keys are typed as GlossaryKey, so deleting a glossary entry breaks the build
  here instead of silently rendering nothing.
*/
export const pageTerms: Partial<Record<RouteKey, readonly GlossaryKey[]>> = {
  garageCoatings: [
    'laitance',
    'concrete surface profile',
    'hot-tire pickup',
    'polyaspartic',
    'epoxy',
    'aliphatic',
    'moisture vapor transmission',
  ],
  epoxyFlooring: ['epoxy', 'aliphatic', 'polyaspartic', 'mil thickness', 'laitance', 'concrete surface profile'],
  polyaspartic: ['polyaspartic', 'aliphatic', 'epoxy', 'mil thickness', 'hot-tire pickup'],
  flake: [
    'full-broadcast',
    'refusal',
    'epoxy',
    'polyaspartic',
    'aliphatic',
    'concrete surface profile',
    'dcof',
  ],
  metallic: ['epoxy', 'polyaspartic', 'aliphatic', 'mil thickness', 'dcof', 'concrete surface profile'],
  solidColor: ['epoxy', 'polyaspartic', 'aliphatic', 'mil thickness', 'laitance', 'dcof'],
  commercial: [
    'epoxy',
    'polyaspartic',
    'concrete surface profile',
    'laitance',
    'moisture vapor transmission',
    'dcof',
  ],
  warehouse: [
    'epoxy',
    'polyaspartic',
    'concrete surface profile',
    'spall',
    'moisture vapor transmission',
    'dcof',
  ],
  patio: ['aliphatic', 'polyaspartic', 'epoxy', 'dcof', 'moisture vapor transmission', 'spall'],
  removal: ['laitance', 'concrete surface profile', 'hot-tire pickup', 'mil thickness', 'spall'],
  grinding: [
    'laitance',
    'concrete surface profile',
    'full-broadcast',
    'moisture vapor transmission',
    'mil thickness',
  ],
  repair: ['spall', 'laitance', 'concrete surface profile', 'moisture vapor transmission'],
}
