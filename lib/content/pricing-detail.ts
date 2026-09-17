/*
  Cost factors and the eleven quoted line items for /pricing/.

  THE FIGURE POLICY FOR THIS FILE — read before adding anything
  There are no dollar amounts anywhere below, and that is deliberate rather than
  an oversight waiting to be filled in carelessly.

  Only three price figures were ever on this site (per-square-foot, 1-car and
  2-car starting prices) and all three are unconfirmed, now held as {{TOKEN}}s
  in lib/site.ts. The other eight line items here never had a figure at all.

  That left three options and only one honest one:
    - Render the tokens: publishes the literal string "{{PRICE_2_CAR_STARTING}}"
      to visitors, and into the FAQ rich result. Rejected.
    - Invent the missing eight: a fabricated price is the single most damaging
      thing this site could publish. Rejected outright.
    - Explain what drives each line instead. Chosen.

  Each entry carries a `refill` note naming exactly which figure belongs there
  once the owner confirms it, so restoring prices is a lookup rather than an
  archaeology exercise. Adding a figure to this file WITHOUT owner confirmation
  re-introduces the exact problem the last cleanup removed.
*/

export type CostDirection = 'up' | 'down' | 'varies'

export type CostFactor = {
  factor: string
  direction: CostDirection
  why: string
}

/*
  Ordered roughly by how much each factor actually moves a residential quote,
  largest first — so the two answers that matter most (existing coating, slab
  condition) are the two an engine lifting only the first rows will find.
*/
export const costFactors: readonly CostFactor[] = [
  {
    factor: 'An existing coating that has to come off',
    direction: 'up',
    why: 'Removal is a separate scope with its own labour and dust control before the new floor starts. It is usually the single largest swing in a residential quote, and what the old coating was hiding is not fully known until it is off.',
  },
  {
    factor: 'Slab condition — cracks, spalls, pitting',
    direction: 'up',
    why: 'Repairs are quoted as their own line because a coating spans nothing; it follows whatever is underneath. Skipping this is where a cheaper quote usually finds its savings, and where the next failure starts.',
  },
  {
    factor: 'Total square footage',
    direction: 'up',
    why: 'Moves the total, obviously — but mobilisation, equipment setup and dust control are largely fixed, so they spread across the area rather than scaling with it.',
  },
  {
    factor: 'Square footage, viewed per square foot',
    direction: 'down',
    why: 'The same fixed costs spread across a larger floor, so the rate per square foot falls as the area grows. This is why a per-square-foot figure taken from a small job overstates a large one.',
  },
  {
    factor: 'System specified',
    direction: 'varies',
    why: 'A full-broadcast flake floor, a metallic floor and a solid colour are different amounts of material and very different amounts of skilled labour. Comparing quotes without knowing which system each one prices is the most common way homeowners mislead themselves.',
  },
  {
    factor: 'Moisture vapour transmission through the slab',
    direction: 'up',
    why: 'A slab driving moisture upward needs that addressed before coating, or the floor can blister from underneath. Assessed during the inspection, because it changes the specification rather than just the price.',
  },
  {
    factor: 'Slab hardness and how closed the surface is',
    direction: 'up',
    why: 'Grinding time is not uniform. A hard, densely troweled slab takes longer to open to the target profile and consumes more tooling than a softer one.',
  },
  {
    factor: 'Stem walls, kerbs and perimeter detail',
    direction: 'up',
    why: 'Vertical surfaces are slow, hand-worked area with a poor ratio of coverage to labour. Quoted separately so you can decide whether to include them.',
  },
  {
    factor: 'Anti-slip aggregate in the topcoat',
    direction: 'up',
    why: 'Adds material and a slower, more careful topcoat application. A genuine tradeoff rather than an upsell: more texture is more secure underfoot and harder to mop.',
  },
  {
    factor: 'Number of clear coats',
    direction: 'up',
    why: 'Each additional clear coat is another material and labour cycle with cure time in between, and it also extends the installation schedule.',
  },
  {
    factor: 'Access, obstructions and whether the space is cleared',
    direction: 'up',
    why: 'A garage that still has to be emptied, or a commercial floor reachable only through occupied space, adds labour before any coating work begins.',
  },
  {
    factor: 'Phasing and out-of-hours working',
    direction: 'up',
    why: 'Commercial floors often have to be done in sections, at night or over a weekend, to keep the facility operating. That is a scheduling cost rather than a materials one.',
  },
]

export type LineItem = {
  /* Used as the anchor id, so it is also the deep link an engine can cite. */
  id: string
  heading: string
  what: string
  drivers: readonly string[]
  onQuote: string
  /*
    The figure to restore here once the owner confirms it. Named explicitly
    rather than left as "add price" so nobody has to guess which number this
    section wanted.
  */
  refill: string
}

export const lineItems: readonly LineItem[] = [
  {
    id: 'per-square-foot',
    heading: 'Per square foot',
    what: 'The rate most people ask for first, and the one that travels worst between jobs. A per-square-foot figure only means something once the system, the preparation and the slab condition behind it are fixed — which is why two quotes with the same rate can describe very different floors.',
    drivers: [
      'Total area, since fixed mobilisation costs spread further on a larger floor',
      'Which system the rate is quoting — flake, metallic or solid colour',
      'Whether preparation and repair are inside the rate or added separately',
    ],
    onQuote:
      'Your quote states the rate and, separately, what that rate does and does not include, so it can be compared against another contractor line by line rather than headline to headline.',
    refill: 'PRICE_PER_SQFT_RANGE from lib/site.ts, once re-confirmed.',
  },
  {
    id: 'one-car-garage',
    heading: 'One-car garage',
    what: 'The smallest common residential job, and the one where fixed costs are most visible: bringing grinders, dust control and crew to site costs much the same whether the floor is small or large, so the per-square-foot rate on a one-car garage is the highest of any residential size.',
    drivers: [
      'Fixed mobilisation spread across the smallest area',
      'Slab condition and any existing coating, which do not shrink with the floor',
      'Whether stem walls and the apron are included',
    ],
    onQuote:
      'Quoted as a single itemized figure covering grinding, base coat, broadcast and topcoat, with repair and removal broken out as their own lines if the slab needs them.',
    refill: 'PRICE_1_CAR_STARTING from lib/site.ts, once re-confirmed.',
  },
  {
    id: 'two-car-garage',
    heading: 'Two-car garage',
    what: 'The most common residential installation in Houston, and the size most published starting prices are quietly based on. It is also the size where slab condition, rather than area, most often decides the final number.',
    drivers: [
      'Slab condition — a two-car slab with hot-tire damage from a previous coating is a different job from bare, sound concrete',
      'Whether an existing coating requires removal first',
      'System specified and the number of clear coats',
    ],
    onQuote:
      'One itemized figure for the coating system, with preparation, repair and any removal shown as separate lines so you can see the split.',
    refill: 'PRICE_2_CAR_STARTING from lib/site.ts, once re-confirmed.',
  },
  {
    id: 'three-car-garage',
    heading: 'Three-car garage',
    what: 'Large enough that the per-square-foot rate starts working in your favour, since the fixed costs of setup and dust control are spread across more floor. The trade-off is a longer installation, because a bigger pour still has to be ground, coated and cured in sequence.',
    drivers: [
      'Area, at a lower effective rate per square foot than a one or two-car floor',
      'Slab condition across a larger pour, including joints and any settlement',
      'Whether the space can be fully cleared for the crew',
    ],
    onQuote:
      'Itemized the same way as any residential floor, with the effective per-square-foot rate visible so you can see the scale effect rather than take it on trust.',
    refill: 'No confirmed figure has ever existed for this size. Needs owner input.',
  },
  {
    id: 'four-car-garage',
    heading: 'Four-car garage and larger',
    what: 'At this size a residential floor starts behaving like a small commercial job: scheduling, moisture assessment across a large slab, and joint detail all matter more, and the installation is planned in stages.',
    drivers: [
      'Area, with the lowest effective per-square-foot rate of the residential sizes',
      'Moisture vapour transmission, which is more consequential on a large pour',
      'Joints and control-joint detail across the slab',
      'Staging, if the whole area cannot be released at once',
    ],
    onQuote:
      'Quoted with the sequence stated, so you know which bays are out of service when rather than discovering the schedule on the first morning.',
    refill: 'No confirmed figure has ever existed for this size. Needs owner input.',
  },
  {
    id: 'coating-removal',
    heading: 'Coating removal',
    what: 'Stripping a failed or incompatible existing coating before the new floor goes down. This is the largest genuine unknown in any quote, because how well the old coating is bonded — and what it has been hiding — is only fully established once it starts coming off.',
    drivers: [
      'Number of layers and how tenaciously each is bonded; a well-adhered old floor is harder to remove than a peeling one',
      'Coating type, since some chemistries soften and load the tooling',
      'Slab damage revealed underneath, which cannot be known in advance',
      'Dust control requirements, higher in occupied or attached spaces',
    ],
    onQuote:
      'Always its own line, never folded into the coating price. If removal exposes something that changes the scope, work stops and you get a revised number in writing before it continues.',
    refill: 'No confirmed figure has ever existed for removal. Needs owner input.',
  },
  {
    id: 'crack-repair',
    heading: 'Crack and spall repair',
    what: 'Filling and levelling non-structural cracks, spalled edges and pop-outs before coating. A coating spans nothing — it follows the surface it is given — so repair is a prerequisite rather than an upgrade.',
    drivers: [
      'Linear feet of cracking and total spalled area',
      'Depth of damage, and whether edges have to be rebuilt rather than filled',
      'Whether any crack shows signs of active movement, which changes the approach',
    ],
    onQuote:
      'Quoted as its own line with the extent stated. Structural cracking or slab settlement is flagged as a separate issue needing assessment, not filled and coated over.',
    refill: 'No confirmed figure has ever existed for repair. Needs owner input.',
  },
  {
    id: 'stem-walls',
    heading: 'Stem walls and perimeter detail',
    what: 'Coating the short vertical concrete at the garage perimeter. Optional, and worth deciding deliberately: done, the floor reads as a finished room; skipped, there is a visible line where the coating stops.',
    drivers: [
      'Total height and linear length of wall included',
      'Hand-work ratio — vertical surfaces are slow relative to their area',
      'Condition of the wall concrete, which is often rougher than the slab',
    ],
    onQuote:
      'A separate optional line, so you can price the floor with and without it and choose.',
    refill: 'No confirmed figure has ever existed for stem walls. Needs owner input.',
  },
  {
    id: 'anti-slip-additives',
    heading: 'Anti-slip additives',
    what: 'Aluminium oxide or polymer grit suspended in the topcoat to increase texture. A full-broadcast flake floor already has meaningful grip from the flake edges; this is for surfaces that need more, particularly wet ones.',
    drivers: [
      'Area receiving the additive, which is sometimes only part of the floor',
      'Aggregate type and how aggressive a texture is specified',
      'The slower, more deliberate topcoat application it requires',
    ],
    onQuote:
      'A separate line with the area stated. Worth deciding before install rather than after: more texture is more secure underfoot and harder to mop clean, and slip resistance is properly measured as DCOF under ANSI A326.3 rather than described with adjectives.',
    refill: 'No confirmed figure has ever existed for additives. Needs owner input.',
  },
  {
    id: 'metallic-floors',
    heading: 'Metallic floors',
    what: 'A decorative finish quoted differently from a flake or solid-colour floor because the cost is dominated by skilled labour rather than materials. No two metallic pours are identical, which is the appeal and also the reason it cannot be quoted from a photograph.',
    drivers: [
      'Complexity of the effect and how many pigments are involved',
      'Installer time, which is the dominant factor rather than material cost',
      'Area, slab condition and clear coat specification',
    ],
    onQuote:
      'Itemized with the effect and pigment count stated, so the quote describes the floor you discussed rather than "metallic" generically.',
    refill: 'No confirmed figure has ever existed for metallic. Needs owner input.',
  },
  {
    id: 'commercial-floors',
    heading: 'Commercial and warehouse floors',
    what: 'Scoped around downtime as much as area. The coating decision is usually straightforward; the hard part is releasing floor space in a working facility, which is why commercial quotes describe a sequence rather than a single price.',
    drivers: [
      'Total area and the number of phases operations require',
      'Out-of-hours or weekend working to protect trading',
      'Joint treatment and crack repair, often the largest line on a warehouse slab',
      'Different systems for forklift aisles versus pedestrian zones',
      'Line marking and zone demarcation',
    ],
    onQuote:
      'Quoted per project with the phasing, released areas and system for each zone stated in writing before work starts.',
    refill: 'Commercial work is quoted per project; a published figure may never be appropriate here.',
  },
]
