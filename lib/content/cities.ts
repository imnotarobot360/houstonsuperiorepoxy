/*
  Six city pages, hand-written.

  RULE: do NOT extend this file by swapping a city name into a template. Each
  entry has to earn its URL with content that is only true of that city. If a
  new city cannot get a genuinely distinct `slab`, `local` and `faqs`, it does
  not get a page — it stays in the coverage list on /service-areas/.

  What is safe to write here:
    - regional geology and construction-era characteristics (public knowledge)
    - how those conditions change our preparation approach
  What is NOT safe to write here:
    - completed projects, job counts, customer names, or local landmarks we
      have supposedly worked at. Real projects live in lib/content/projects.ts
      and surface on a city page via `projectsFor(citySlug)`; if that returns
      nothing, the city page renders no project section at all.
*/

export type City = {
  slug: string
  name: string
  county: string
  /* One-line positioning used in the hero. */
  intro: string
  /* Slab & soil conditions specific to this area. */
  slab: { heading: string; body: string }[]
  /* Why installs here differ — construction era, lot type, housing stock. */
  local: string
  /* Distinct questions we actually get from this area. */
  faqs: { q: string; a: string }[]
  /* Neighboring city slugs, for lateral internal linking. */
  neighbors: string[]
  /*
    Coverage-area names (as they appear in `site.serviceAreas`) that THIS page
    now represents. Optional; defaults to `[name]`.

    Only needed when a page covers a named area whose label is not its own
    `name` — e.g. this page is "Memorial & River Oaks" but stands in for the
    `Memorial` and `River Oaks` entries in the owner's coverage list. It does
    two jobs, both keyed off this list so they cannot drift:
      1. /service-areas/ drops these names from the "also served" chips, so an
         area never appears both as a page and as an unlinked chip.
      2. lib/schema.ts emits these as the `areaServed` Place names instead of
         the compound page name, keeping structured coverage to real places.
  */
  covers?: string[]
}

export const cities: City[] = [
  {
    slug: 'richmond',
    name: 'Richmond',
    county: 'Fort Bend County',
    intro:
      'Richmond mixes century-old housing stock near the historic downtown with brand-new subdivisions out toward the Grand Parkway. Those two extremes need almost opposite preparation work, which is why we inspect before quoting.',
    slab: [
      {
        heading: 'Brazos River floodplain clay',
        body: 'Richmond sits along the Brazos, and much of the area is Beaumont Formation clay — highly expansive soil that swells when it takes on water and shrinks when it dries out. That seasonal movement is the reason garage slabs here crack in predictable patterns rather than at random.',
      },
      {
        heading: 'Two very different slab ages',
        body: 'Older Richmond garages frequently show spalling at the apron and along control joints, plus decades of oil saturation. Newer builds toward the Grand Parkway have the opposite problem: a hard, power-troweled surface that a coating cannot bite into without mechanical grinding.',
      },
      {
        heading: 'River-adjacent moisture',
        body: 'Proximity to the river and a relatively high water table in parts of the area make vapor drive a real consideration. We check for moisture during the inspection rather than discovering it after a coating has already been applied.',
      },
    ],
    local:
      'Because Richmond housing stock spans roughly a hundred years, we do not price it as one market. An older slab near downtown often needs its crack and spall repair scoped as a significant line item, while a five-year-old slab in a newer section may need almost none. Both still get the same diamond grinding and the same written warranty.',
    faqs: [
      {
        q: 'My Richmond garage slab already has cracks. Can it still be coated?',
        a: 'Usually, yes. Cracks and spalls are repaired as their own step before any coating goes down — we do not coat over them. What we determine during the inspection is how much repair the slab needs and whether any movement is still active, because that changes the specification.',
      },
      {
        q: 'Does being close to the Brazos affect my floor?',
        a: 'It can. A higher water table means more potential for vapor moving up through the slab, and moisture is one of the specific things we test for before quoting. Where it shows up, the system we specify changes accordingly.',
      },
      {
        q: 'Do you work in both older Richmond homes and the newer subdivisions?',
        a: 'Yes, and they are quoted differently. An older slab typically carries more repair scope; a newly built slab typically needs more attention to grinding off the troweled surface. The onsite inspection is what separates the two.',
      },
    ],
    neighbors: ['sugar-land', 'fulshear', 'katy'],
  },

  {
    slug: 'katy',
    name: 'Katy',
    county: 'Harris, Fort Bend & Waller Counties',
    intro:
      'Katy is built on former rice prairie — extremely flat, heavy clay, and drainage that gives coatings a hard time at the garage apron. It is also three-car-garage country, which changes both the scope and the layout of most jobs.',
    slab: [
      {
        heading: 'Katy Prairie rice-farm clay',
        body: 'The Katy Prairie was farmed for rice precisely because the clay holds water. That same property makes it some of the most expansive soil in the region, and it drives the slab movement we see in garages across Cinco Ranch, Cross Creek and the older Katy subdivisions.',
      },
      {
        heading: 'Flat lots, slow drainage',
        body: 'There is very little natural grade in Katy. Water sits at driveway aprons and along the garage threshold instead of running off, so the apron edge is often the first place an older coating fails. We treat that transition as its own detail.',
      },
      {
        heading: 'Three-car slabs',
        body: 'A large share of Katy garages are three-car or oversized tandem. More square footage means more material and a longer broadcast sequence, and it also means more control joints crossing the floor that have to be detailed rather than ignored.',
      },
    ],
    local:
      'Katy subdivisions built through the 1990s and 2000s are now at the age where the original builder-grade sealer, if there ever was one, has given up. A large part of what we do here is removing a failed or peeling previous coating before anything new is installed — which is usually the single biggest variable in the quote.',
    faqs: [
      {
        q: 'Why does my Katy garage floor coating keep peeling at the door?',
        a: 'That is the most common failure point in this area. Flat lots and slow drainage mean water sits at the apron and threshold, and if the original coating was applied over an unprepared or acid-etched surface it loses its bond there first. Mechanical grinding and detailing that transition properly is the fix.',
      },
      {
        q: 'I have a three-car garage. Does that change the price per square foot?',
        a: 'Total square footage sets the material and labor baseline, so a larger garage costs more overall. Layout matters too — open three-car slabs are more efficient per foot than cut-up or tandem spaces. Your itemized quote reflects the actual measured area after the onsite inspection.',
      },
      {
        q: 'Do you remove the old coating my builder put down?',
        a: 'If it is failing or no longer bonded, it comes off mechanically before new work starts. We check bond during the inspection. Going over a bad bond is not something we will quote, because the new floor would fail with the old one.',
      },
    ],
    neighbors: ['fulshear', 'cypress', 'richmond'],
  },

  {
    slug: 'sugar-land',
    name: 'Sugar Land',
    county: 'Fort Bend County',
    intro:
      'Sugar Land is almost entirely master-planned, which means predictable slab construction but also mature landscaping — and mature trees next to a garage slab are one of the more underrated causes of floor movement.',
    slab: [
      {
        heading: 'Former plantation land and fill',
        body: 'Much of Sugar Land was agricultural land before development, and parts of it were built up with fill. Expansive Beaumont clay is still the underlying condition, so seasonal swell and shrink remains the dominant force acting on a garage slab here.',
      },
      {
        heading: 'Mature trees and root-driven movement',
        body: 'First Colony and the older Sugar Land neighborhoods now have forty-year-old canopy. Large trees pull enormous amounts of moisture out of clay soil during a dry spell, which shrinks the soil unevenly next to the slab. That shows up as directional cracking rather than uniform hairlines.',
      },
      {
        heading: 'Newer master-planned sections',
        body: 'Telfair, Riverstone and the newer sections have younger slabs with tighter finish tolerances. Those floors need less repair but more grinding, because a hard troweled surface has to be opened up before it will accept a coating.',
      },
    ],
    local:
      'Sugar Land homeowners tend to be comparing finished appearance closely — this is a market where metallic and custom flake blends get chosen more often than a plain solid color. We bring physical samples to the estimate so blends are picked under your own garage lighting rather than from a screen.',
    faqs: [
      {
        q: 'The cracks in my Sugar Land garage run in one direction. Why?',
        a: 'Directional cracking usually points to uneven moisture in the soil under the slab, and large mature trees are a frequent cause — they draw water out of expansive clay on one side. We look at the pattern during the inspection because it tells us whether movement is still active.',
      },
      {
        q: 'Can I get a metallic floor in a garage, not just an interior room?',
        a: 'Yes. Metallic is a finish choice rather than a location choice, though we will talk through how it wears in a working garage versus a showroom-style space. Every metallic floor is hand-worked while the resin is open, so the pattern is unique to your floor.',
      },
      {
        q: 'How do I choose a flake blend?',
        a: 'From physical samples, at your property, under your actual lighting. Garage lighting changes how a blend reads considerably, and screens are not reliable for this. Blend and coverage choices do affect material cost, so we cover that as part of the itemized quote.',
      },
    ],
    neighbors: ['richmond', 'pearland', 'katy'],
  },

  {
    slug: 'cypress',
    name: 'Cypress',
    county: 'Harris County',
    intro:
      'Cypress has some of the newest housing stock we work in. That sounds like an easy floor, but new construction brings its own specific problem: slabs that are not finished curing and a troweled surface no coating will grip.',
    slab: [
      {
        heading: 'Green concrete in new construction',
        body: 'Bridgeland, Towne Lake and the newer Cypress sections are still actively building. A concrete slab needs time to cure before it is coated, and a slab that is still releasing moisture is a genuine bond risk. We confirm the slab is ready rather than assuming it.',
      },
      {
        heading: 'Power-troweled laitance',
        body: 'Production builders finish garage slabs fast, which leaves a hard, closed, glass-like surface layer. A coating applied to that layer is bonded to the laitance, not to the concrete. Diamond grinding removes it and opens the profile — this is not an optional step.',
      },
      {
        heading: 'Cypress Creek watershed clay',
        body: 'The area sits in the Cypress Creek watershed on the eastern edge of the Katy Prairie, so the underlying expansive clay behaves much like it does in Katy. Drainage is better in the newer master-planned sections, but the soil movement is the same.',
      },
    ],
    local:
      'Because so much of Cypress is recent construction, the most common conversation we have here is about builder-installed floors and warranty coverage. A newer slab usually needs very little crack repair, so the quote is weighted toward preparation and the coating system itself.',
    faqs: [
      {
        q: 'My Cypress home is brand new. Can I coat the garage right away?',
        a: 'Not always immediately. New concrete has to cure before it will hold a coating reliably, and moisture still moving through a green slab is a bond risk. We check the slab condition during the inspection and will tell you if waiting is the right call.',
      },
      {
        q: 'The builder said the garage floor is already sealed. Is that the same thing?',
        a: 'No. A builder-applied sealer is not a coating system — it is typically a thin topical product with no mechanical preparation underneath. It also has to be ground off before a real system goes down, which we scope during the inspection.',
      },
      {
        q: 'Why does a new slab still need grinding?',
        a: 'Because production finishing leaves a hard, closed surface layer. Anything applied on top bonds to that layer rather than to the concrete underneath. Grinding removes it and creates the profile the coating actually needs.',
      },
    ],
    /*
      'magnolia' added so the Montgomery County pages are reachable laterally
      from an existing page. Without a reciprocal link the two new cities would
      only be linked FROM each other and the index, which is a weak internal
      path for pages that are meant to rank locally.
    */
    neighbors: ['katy', 'fulshear', 'pearland', 'magnolia'],
  },

  {
    slug: 'fulshear',
    name: 'Fulshear',
    county: 'Fort Bend County',
    intro:
      'Fulshear has been one of the fastest-growing communities in Texas, which means a very high proportion of slabs under five years old — and a very high proportion of homeowners being sold a builder upgrade that is not a coating system.',
    slab: [
      {
        heading: 'Brazos valley soils',
        body: 'Fulshear sits in the Brazos River valley, and the soils range from expansive clay to sandier river-influenced deposits depending on where in the area you are. That variability is why we do not assume a specification here before looking at the slab.',
      },
      {
        heading: 'Very new slabs',
        body: 'Cross Creek Ranch, Fulbrook and the surrounding developments are largely recent construction. Cure age matters — a slab that has not finished releasing moisture is not ready for a coating, and we would rather tell you that than warranty a floor installed too early.',
      },
      {
        heading: 'Builder-grade finish',
        body: 'Fast production finishing leaves a closed, troweled surface. Without mechanical grinding a coating sits on that skin instead of keying into the concrete, which is the most common reason a two-year-old garage floor starts lifting in sheets.',
      },
    ],
    local:
      'Almost every Fulshear estimate we run involves explaining the difference between a one-day builder upgrade and a diamond-ground, fully broadcast, polyaspartic-topped system. The slab is usually in good condition here, so the value of the job is concentrated almost entirely in preparation and materials.',
    faqs: [
      {
        q: 'How new is too new for a garage floor coating in Fulshear?',
        a: 'It depends on the slab, the weather it cured in, and how much moisture it is still releasing. We assess that during the inspection. If your slab needs more time, we will say so — installing early is how a floor ends up delaminating.',
      },
      {
        q: 'Is the coating my builder offered the same as what you install?',
        a: 'Generally not. Builder upgrades are usually thin, single-coat products applied with minimal surface preparation. Our systems start with diamond grinding, include repair as a separate step, and are finished with a polyaspartic topcoat where appropriate for the system.',
      },
      {
        q: 'Do soil conditions really vary that much across Fulshear?',
        a: 'Enough that we do not pre-specify. The Brazos valley produces a mix of expansive clay and sandier deposits, and the behavior of the slab above them differs. This is one of the reasons every quote follows an onsite inspection rather than a phone call.',
      },
    ],
    neighbors: ['katy', 'richmond', 'sugar-land'],
  },

  {
    slug: 'pearland',
    name: 'Pearland',
    county: 'Brazoria & Harris Counties',
    intro:
      'Pearland is the flattest and lowest-lying area we regularly work in, and it is the one where moisture coming up through the slab is most often the deciding factor in what system a floor can take.',
    slab: [
      {
        heading: 'Near-coastal water table',
        body: 'Pearland sits on the coastal plain, and the water table is comparatively high. Vapor drive — moisture moving upward through the concrete — is a more frequent finding here than in the northern and western suburbs, and it directly affects what will bond to the slab.',
      },
      {
        heading: 'Built on former prairie and wetland',
        body: 'Large developments such as Shadow Creek Ranch were built on former prairie and wetland, with substantial engineered fill. Fill settles at a different rate than native soil, and that differential shows up in garage slabs as cracking and occasional unevenness.',
      },
      {
        heading: 'Almost no natural grade',
        body: 'With very little slope anywhere in the area, water lingers around aprons and thresholds after storms. That standing water is what attacks the weakest point of a poorly prepared coating first.',
      },
    ],
    local:
      'Moisture testing carries more weight in Pearland than almost anywhere else we serve. A slab pushing vapor gets handled differently from a dry slab, and we would rather find that during the inspection than have a homeowner discover it as bubbles six months after the install.',
    faqs: [
      {
        q: 'How do I know if my Pearland slab has a moisture problem?',
        a: 'Often you cannot tell by looking, which is why moisture is something we specifically check for before quoting. Signs like persistent dark patches, previous coatings bubbling, or efflorescence are worth mentioning when you call, but the inspection is what confirms it.',
      },
      {
        q: 'My garage is in Shadow Creek Ranch and the floor is uneven. Is that fixable?',
        a: 'Surface imperfections, spalls and pitting are repaired as part of the process. Genuine structural or foundation movement is a different problem and outside what a coating addresses — if we see signs of it during the inspection we will tell you straight rather than coat over it.',
      },
      {
        q: 'Does standing water after a storm damage an epoxy floor?',
        a: 'A properly prepared and topcoated floor handles water well. What water exposes is bad preparation — where a coating was never mechanically bonded, the apron and threshold edges are the first to lift. That transition detail is part of how we install.',
      },
    ],
    neighbors: ['sugar-land', 'cypress', 'richmond'],
  },

  /*
    The two Montgomery County entries below earn their pages on geology, which
    is the test at the top of this file.

    Every city above sits on Beaumont Formation clay or the coastal plain, so
    each of those pages tells a version of the same story: expansive soil swells
    and shrinks, and the slab moves with it. The Woodlands and Magnolia sit on
    sandy loam over the Willis and Lissie formations, which DRAINS instead of
    swelling — so the clay-movement narrative does not apply and the dominant
    problems are genuinely different ones. That inversion is the content, not a
    find-and-replace of the city name.
  */
  {
    slug: 'the-woodlands',
    name: 'The Woodlands',
    county: 'Montgomery County',
    intro:
      'The Woodlands is the one area we serve where expansive clay is not the main story. It sits on sandy loam that drains, so slabs move less — and the problems that replace movement are shade, damp, and fifty-year-old original-village concrete.',
    slab: [
      {
        heading: 'Sandy loam, not Beaumont clay',
        body: 'The soils here are sandier deposits over the Willis and Lissie formations rather than the expansive clay under Katy or Sugar Land. Water drains through instead of swelling the soil, so we see far less of the seasonal directional cracking that dominates slabs south and west of Houston.',
      },
      {
        heading: 'Mature pine canopy and slabs that never dry',
        body: 'The tree cover the community was designed around keeps garage aprons in near-permanent shade. A slab that never gets direct sun stays damp longer after rain, and that persistent surface moisture is what we test for here — along with the organic staining, pollen and needle tannin that come with the canopy.',
      },
      {
        heading: 'Original village slabs at fifty years',
        body: 'Grogan\u2019s Mill, Panther Creek and the other early villages date to the 1970s and 80s. Those garages have had decades of oil saturation and whatever sealer was applied at the time has long since failed, so removal and degreasing are usually real line items rather than afterthoughts.',
      },
    ],
    local:
      'Two things drive Woodlands quotes more than square footage. The first is what is already on the floor — an original-village slab often carries a failed coating and deep oil contamination that has to come off before anything new bonds. The second is shade: we schedule around damp slabs rather than coating one that has not dried, because a bond made over surface moisture is a bond that fails.',
    faqs: [
      {
        q: 'Everyone talks about clay soil in Houston. Does that apply in The Woodlands?',
        a: 'Much less than it does south and west of the city. The Woodlands sits on sandier loam that drains rather than the expansive Beaumont clay under Katy or Sugar Land, so we see noticeably less seasonal slab movement. It does not remove the need for grinding or moisture testing, but the cracking pattern is usually a different and milder story.',
      },
      {
        q: 'My garage is always in shade and the floor feels damp. Is that a problem?',
        a: 'It is worth telling us about. A slab under heavy canopy takes much longer to dry after rain, and coating over surface moisture is a bond risk. We check the slab before installing and will move a start date rather than lay a system onto concrete that is not ready.',
      },
      {
        q: 'My home is in one of the original villages. Is a fifty-year-old slab still coatable?',
        a: 'Usually, yes, but it needs more preparation. Decades of oil have to be degreased and drawn out, old failed sealer has to be ground off, and spalling gets repaired as its own step. The inspection is where we scope that, because on a slab this age the preparation is most of the job.',
      },
    ],
    neighbors: ['magnolia', 'cypress'],
  },

  {
    slug: 'magnolia',
    name: 'Magnolia',
    county: 'Montgomery County',
    intro:
      'Magnolia work looks different from suburban work: more detached shops and outbuildings than attached garages, larger unconditioned slabs, and older pours that were never built with a vapor barrier underneath.',
    slab: [
      {
        heading: 'Detached shops and outbuildings',
        body: 'Most of what we coat in Magnolia is not an attached two-car garage. It is a workshop, a barn bay or an equipment building on acreage — bigger open slabs, heavier point loads from equipment and jack stands, and doors wide enough that weather reaches well inside the floor.',
      },
      {
        heading: 'Older pours with no vapor barrier',
        body: 'Rural slabs poured before vapor barriers were standard practice sit directly on soil, so ground moisture has an uninterrupted path upward through the concrete. Testing for that is not optional here. It is the single finding most likely to change which system a floor can actually take.',
      },
      {
        heading: 'Unconditioned space and wider temperature swings',
        body: 'An unheated, uncooled shop tracks outdoor temperature, and slab temperature governs how coatings flow and set. That narrows the usable window on a hot afternoon or a cold morning, so scheduling here is driven by slab conditions rather than convenience.',
      },
    ],
    local:
      'Two things come up on Magnolia estimates that rarely appear in town. Well water leaves iron staining that has to be identified before it is coated over, and a large unconditioned slab has to be inspected for vapor drive from below rather than assumed sound. Both are reasons we quote these buildings after seeing them, not from a square-foot count over the phone.',
    faqs: [
      {
        q: 'Can you coat a detached shop or barn slab, not just a garage?',
        a: 'Yes, and it is most of what we do in Magnolia. The considerations differ from an attached garage: larger open areas, heavier equipment loads, more weather reaching the floor through wide doors, and often no vapor barrier under an older pour. All of that gets scoped during the inspection.',
      },
      {
        q: 'My shop slab has no vapor barrier under it. Does that rule out a coating?',
        a: 'Not automatically, but it has to be established first. Without a barrier, ground moisture moves up through the slab, and that changes what will bond reliably. We test rather than assume — this is the most common reason a shop floor coated by someone else has started bubbling.',
      },
      {
        q: 'Does an unheated shop change when you can install?',
        a: 'It affects scheduling, yes. Slab temperature influences how the material flows and sets, and an unconditioned building follows the outside air. We work to the slab\u2019s condition rather than the calendar, which sometimes means an earlier start or a different day.',
      },
    ],
    neighbors: ['the-woodlands', 'cypress'],
  },

  /*
    Memorial & River Oaks — the inner-loop premium page.

    Promoted from a coverage chip: `Memorial` was already an owner-confirmed
    area in `site.serviceAreas` with no page, and the content plan adds River
    Oaks alongside it, so `River Oaks` is added there too. `covers` lists both
    so /service-areas/ drops them from the "also served" chips and the schema
    emits two clean Place names rather than the compound page title.

    It earns its own URL the same way every other city here does — with a slab
    story that is only true of this area. It is NOT the suburban expansive-clay
    narrative. Two things invert it: a market split between decades-old estate
    slabs and brand-new tear-down rebuilds, and a Buffalo Bayou corridor of
    slope, fill and heritage oaks rather than flat prairie. The finish
    expectation (decorative, not utility gray) and the detached carriage house
    are genuine to this market, not a city name swapped into a template.
  */
  {
    slug: 'memorial-river-oaks',
    name: 'Memorial & River Oaks',
    county: 'Harris County',
    intro:
      'Inside the Loop, the slab is rarely the standard suburban story. Memorial and River Oaks sit along Buffalo Bayou on some of the oldest — and some of the newest — concrete in Houston, and the finish expectation here is a decorative floor rather than a utility gray one.',
    slab: [
      {
        heading: 'Estate slabs and tear-down rebuilds side by side',
        body: 'River Oaks dates to the 1920s and 30s and the Memorial villages largely to the mid-century, so many garages sit on original slabs decades old. At the same time this is the most active tear-down-and-rebuild market in the city, which means the house next door may have a brand-new slab. We quote the two almost oppositely, and both are common on the same street.',
      },
      {
        heading: 'Buffalo Bayou slope, fill and heritage oaks',
        body: 'The bayou corridor is not the flat prairie clay of the western suburbs. Lots drop toward ravines and the bayou, older sites were often cut and filled to build, and protected heritage live oaks sit close to the structure. Differential settlement and root-driven movement show up here in patterns you do not see on a flat Katy pad, and they change where a slab is likely to have cracked.',
      },
      {
        heading: 'Detached carriage houses and finished garage space',
        body: 'A large share of these garages are detached carriage houses, motor-court structures, or bays with finished or conditioned rooms above. That changes the moisture picture — a slab under living space, or one older than modern vapor-barrier practice, has to be tested for drive from below before a decorative system goes down over it.',
      },
    ],
    local:
      'Two things swing a quote here more than square footage. The first is age: restoring a seventy-year-old original slab — degreasing decades of oil, repairing spall, grinding off a long-failed sealer — is a different job from grinding the hard, power-troweled surface of a two-year-old rebuild. The second is the finish. Homeowners in these neighborhoods usually want a metallic or designer flake floor rather than a utility gray, and a decorative system is less forgiving of a slab that was not properly prepared, which is exactly why the preparation is where the money goes.',
    faqs: [
      {
        q: 'My River Oaks home is original and the garage slab is old. Can it still take a decorative floor?',
        a: 'Usually, yes, but the preparation is most of the job on a slab this age. Decades of oil have to be degreased and drawn out, any failed sealer ground off, and spalling repaired as its own step. A metallic or high-flake finish actually depends on that prep being right, because a decorative system shows a bad substrate rather than hiding it. The inspection is where we scope it.',
      },
      {
        q: 'We just did a tear-down rebuild. Why does a brand-new slab still need grinding?',
        a: 'A new slab is the opposite problem from an old one. It is hard and power-troweled, and that dense, closed surface is precisely what a coating cannot bite into without mechanical diamond grinding to open a profile. New concrete also has to have cured before it can be coated at all, so a rebuild slab is rarely ready the day you ask — we check where it is in that process.',
      },
      {
        q: 'The garage is a detached carriage house with a room above, close to the bayou. Does that matter?',
        a: 'It does, and it is worth telling us. A slab under conditioned living space, or an older pour near the bayou with a higher water table, can carry vapor drive from below that will lift a coating if it is sealed over unaddressed. We test for moisture before quoting rather than discovering it after a decorative floor is already down.',
      },
    ],
    neighbors: ['katy', 'sugar-land'],
    covers: ['Memorial', 'River Oaks'],
  },
]

export const cityBySlug = (slug: string) => cities.find((c) => c.slug === slug)

/*
  REMOVED — `projectsPlaceholder`.

  This rendered a dashed "Awaiting real data" card headed "Recent projects in
  this area" on all nine city pages. Deleted rather than reworded: a labelled
  empty box where local proof belongs advertises the absence, and nine copies
  of one paragraph is thin, duplicated content across exactly the set of URLs
  where that does the most damage.

  Do not reintroduce a placeholder here. The correct fill is a real project —
  `projectsFor(citySlug)` in lib/content/projects.ts returns the projects
  attached to a city, and the city page should render a "Recent <city> project"
  summary when that list is non-empty. Until a real project exists the section
  is absent, which is the intended state and not a gap to paper over with copy.
*/
