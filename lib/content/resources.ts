/*
  Technical guides. These are our own explanatory content, so they are safe to
  write — but the same rule applies: no manufacturer performance figures, no
  mil thicknesses, no cure times, and no claims about jobs we have done.
*/

import type { GlossaryKey } from '@/lib/content/authority'

export type Article = {
  slug: string
  title: string
  h1: string
  description: string
  /* Reading context shown under the H1. */
  kicker: string
  /*
    The question this article exists to answer, phrased as a user would ask
    it. Rendered as the H2 above the quick answer.
  */
  question: string
  /*
    Self-contained 40-70 word answer. Must be liftable: accurate and complete
    on its own, with no dependency on surrounding copy. This is the paragraph
    an answer engine is most likely to quote.
  */
  quickAnswer: string
  /*
    Scannable conclusions, rendered as a list directly under the quick answer.

    Separate from `quickAnswer` because they do a different job: the quick
    answer is one liftable paragraph, these are the discrete claims a reader
    skims before deciding to read on. An answer engine assembling a bulleted
    response draws from here.
  */
  takeaways?: string[]
  /*
    An optional comparison table.

    Only for articles whose question is genuinely "X vs Y" — a table forced onto
    a single-subject article is noise. `rows` is [dimension, optionA, optionB],
    so the reader compares across a row rather than down a column, which is the
    axis that actually answers "which should I pick".
  */
  comparison?: {
    caption: string
    columns: [string, string, string]
    rows: [string, string, string][]
  }
  sections: { heading: string; paras: string[] }[]
  /* Glossary terms defined inline on this article. */
  terms?: GlossaryKey[]
  /*
    Required by the content brief: every article links to at least one service
    page. Kept separate from `related` so the link is guaranteed present
    rather than dependent on how `related` was filled in.
  */
  serviceLink: { label: string; href: string }
  /* Whether to render the standards/references block. */
  showReferences?: boolean
  /*
    Editorial dates, ISO-8601 (YYYY-MM-DD).

    Optional: both fall back to the batch defaults in lib/content/authority.ts,
    which is truthful for content that was published as one set. Set them here
    the moment an article diverges from that — in particular bump `reviewed`
    whenever the guidance is materially revised, because `dateModified` is the
    signal that tells an answer engine this page is maintained rather than
    abandoned.

    Do not advance `reviewed` for a typo fix. That date asserts somebody
    re-checked the technical content, and the assertion should be true.
  */
  published?: string
  reviewed?: string
  /* Related route keys rendered as internal links at the foot of the article. */
  related: { label: string; href: string }[]
}

export const articles: Article[] = [
  /*
    ---------------------------------------------------------------
    COST ARTICLES
    ---------------------------------------------------------------
    Both of these answer a price query without printing a price.

    That is deliberate and it matches how /pricing/ was built: there is no
    confirmed figure for either garage size yet, and inventing one is worse
    than omitting it. A wrong number quoted back by an answer engine becomes a
    price the owner has to argue with a homeowner about.

    What these pages do instead is answer the question underneath the question —
    what drives the number, what a real quote itemises, and why two bids on the
    same garage differ. That is genuinely useful, and it is honest.

    REFILL POINT: when the owner supplies verified pricing, add it to
    lib/content/pricing-detail.ts and reference it from `takeaways` here.
    Do not hardcode figures into these article bodies.
  */
  {
    slug: 'how-much-does-2-car-garage-epoxy-cost-houston',
    title: 'What Does a 2-Car Garage Epoxy Floor Cost in Houston? | Houston Superior Epoxy',
    h1: 'What a 2-car garage epoxy floor costs in Houston',
    description:
      'What actually drives the number on a two-car garage, what a real quote itemizes, and why two bids on the same slab can differ by thousands.',
    kicker: 'For homeowners budgeting a two-car garage',
    question: 'How much does it cost to epoxy a 2-car garage in Houston?',
    quickAnswer:
      'Cost is driven by slab condition far more than by square footage. A two-car garage with sound concrete needs grinding, a base coat, a broadcast layer and a topcoat. Cracks, spalls, oil saturation, moisture remediation and removing a failed previous coating are each separate line items. Houston Superior Epoxy quotes only after inspecting and moisture testing the slab.',
    takeaways: [
      'Square footage sets the floor on price; slab condition sets the ceiling.',
      'A two-car garage is commonly around 400 to 500 square feet, but the condition of that area matters more than its size.',
      'Removing a failed existing coating is its own scope of work and can rival the cost of the new floor.',
      'Moisture remediation changes the specification, which is why testing happens before quoting rather than after.',
      'Any quote given over the phone without seeing the slab is an estimate of a floor nobody has looked at.',
    ],
    terms: ['spall', 'moisture vapor transmission', 'full-broadcast'],
    serviceLink: {
      label: 'Garage floor coatings in Houston',
      href: '/garage-floor-coatings-houston/',
    },
    sections: [
      {
        heading: 'Why square footage is the least interesting variable',
        paras: [
          'A two-car garage is a fairly predictable area, so if area were the main driver every quote would land in the same place. They do not, and the reason is that the work required to make a slab ready for coating varies enormously between two houses on the same street.',
          'One slab needs grinding and coating. The next needs grinding, twenty feet of crack repair, three spall patches, degreasing of a saturated parking strip, and a moisture mitigation strategy. Those are different jobs that happen to share a floor plan.',
        ],
      },
      {
        heading: 'The line items that actually move the number',
        paras: [
          'Mechanical preparation is the baseline and should never be absent. Beyond it: crack and spall repair, treatment of oil-contaminated areas, removal of any existing coating, and moisture mitigation where testing shows vapor drive.',
          'On the finish side, a full-broadcast flake floor uses substantially more chip material than a light scatter, and a metallic system is a different labour proposition entirely. Both are choices you make with full knowledge, not surprises.',
        ],
      },
      {
        heading: 'Why we do not publish a figure on this page',
        paras: [
          'We will not print a number here that we cannot stand behind for your specific slab. A published price range gets quoted back as a promise, and the homeowners it hurts most are the ones whose floor genuinely needed more work than the range assumed.',
          'What we will commit to is process: an onsite inspection, a moisture test, and an itemized written quote you can compare line by line against anyone else\u2019s. The visit is free, and the itemization is the part that lets you tell two bids apart.',
        ],
      },
      {
        heading: 'How to compare the bids you already have',
        paras: [
          'Put the totals aside and read the preparation line on each one. If one quote names diamond grinding and the other says "surface prep," you are not looking at competing prices for the same work — you are looking at two different scopes.',
          'Then check whether repair is itemized, whether moisture was tested, and whether the actual products are named. Our guide to reading a coating quote walks through this line by line.',
        ],
      },
    ],
    related: [
      { label: 'What a floor coating costs in Houston', href: '/pricing/' },
      {
        label: 'How to read a coating quote',
        href: '/resources/how-to-read-a-garage-floor-quote/',
      },
      { label: 'Garage floor crack & spall repair', href: '/garage-floor-repair/' },
    ],
  },

  {
    slug: 'how-much-does-3-car-garage-coating-cost-houston',
    title: 'What Does a 3-Car Garage Coating Cost in Houston? | Houston Superior Epoxy',
    h1: 'What a 3-car garage coating costs in Houston',
    description:
      'A three-car garage is not simply one and a half times a two-car garage. Here is what changes as the floor gets bigger, and what does not.',
    kicker: 'For homeowners budgeting a three-car garage',
    question: 'How much does it cost to coat a 3-car garage in Houston?',
    quickAnswer:
      'A three-car garage costs more than a two-car garage but rarely in direct proportion to its area. Mobilisation, setup and containment are largely fixed, so per-square-foot cost often falls slightly as the floor grows. What raises it instead is the amount of repair the larger slab needs, plus any moisture or contamination found during inspection.',
    takeaways: [
      'Per-square-foot cost often drops slightly on larger floors, because setup and containment are largely fixed costs.',
      'A bigger slab statistically carries more cracking, more spalling and more contaminated area, which is where the cost returns.',
      'Three-car garages more often include a workshop or storage bay, which can justify a different finish in that section.',
      'Larger floors take longer to coat, and Houston heat narrows the window for fast-cure topcoats, affecting scheduling.',
      'Quotes are given after inspection and moisture testing, not from a square-foot multiplier.',
    ],
    terms: ['spall', 'full-broadcast', 'polyaspartic'],
    serviceLink: {
      label: 'Garage floor coatings in Houston',
      href: '/garage-floor-coatings-houston/',
    },
    sections: [
      {
        heading: 'Bigger is not proportionally more expensive',
        paras: [
          'Some costs do not scale with area. Getting equipment to the site, setting up dust containment, masking, and mobilising a crew cost roughly the same whether the floor is two bays or three. Spread across more square footage, those fixed costs dilute.',
          'So the per-square-foot figure on a three-car garage is often slightly lower than on a two-car garage. The total is higher; the rate is not.',
        ],
      },
      {
        heading: 'Where the extra cost genuinely comes from',
        paras: [
          'A larger slab has more joints, more perimeter, and statistically more of everything that needs repair — cracks, spalls, and areas where vehicles have been parked long enough to saturate the concrete.',
          'Three-bay garages also more often contain a workshop area or a bay used for storage rather than parking. Those areas sometimes warrant a different specification, and that is a decision worth making deliberately rather than defaulting the whole floor to one finish.',
        ],
      },
      {
        heading: 'Time on site and Houston conditions',
        paras: [
          'A larger floor takes longer to coat, and that interacts with the weather here. Fast-cure topcoats have a limited working window that heat shortens further, so a big floor in August is scheduled around conditions rather than squeezed into a convenient day.',
          'This is a workmanship constraint, not an upsell. Rushing a large floor with a fast-cure product is how lap marks and inconsistent finishes happen.',
        ],
      },
      {
        heading: 'What you will get from us instead of a number',
        paras: [
          'We inspect the slab, moisture test it, and give you an itemized written quote covering preparation, repair, the coating system and the finish you chose. The visit is free.',
          'If you are weighing a partial scope — coating two bays now and the third later — say so during the visit. It is a reasonable way to phase the work and it is easier to plan before the first bay is done.',
        ],
      },
    ],
    related: [
      { label: 'What a floor coating costs in Houston', href: '/pricing/' },
      {
        label: 'What a 2-car garage costs',
        href: '/resources/how-much-does-2-car-garage-epoxy-cost-houston/',
      },
      { label: 'Commercial epoxy flooring', href: '/commercial-epoxy-flooring-houston/' },
    ],
  },

  {
    slug: 'how-to-read-a-garage-floor-quote',
    title: 'How to Read a Garage Floor Coating Quote | Houston Superior Epoxy',
    h1: 'How to read a garage floor coating quote',
    description:
      'Two quotes on the same garage can describe completely different work. Here is what to look for line by line before you compare prices.',
    kicker: 'For homeowners comparing more than one estimate',
    question: 'How do you compare two garage floor coating quotes?',
    quickAnswer:
      'Compare the preparation method first, not the total. A quote should name mechanical diamond grinding, itemize crack and spall repair as its own line, and name the actual products in the coating system. Two quotes describing the same garage can cover completely different work, so the cheaper number is often the smaller job.',
    takeaways: [
      'Read the preparation line before the price — it is the item most often left deliberately vague.',
      '"Clean and prep", an acid wash or a pressure wash is not mechanical preparation.',
      'Crack and spall repair should appear as its own line item, because it is its own step.',
      'The quote should name the actual products in the system, otherwise you cannot verify what you are buying.',
      'Ask for certificates of general liability and workers compensation. A legitimate contractor sends them without hesitation.',
      'Check whether the warranty covers workmanship or only the product, and get the term in writing.',
    ],
    terms: ['laitance', 'concrete surface profile', 'spall'],
    serviceLink: {
      label: 'Concrete grinding & surface preparation',
      href: '/concrete-grinding-preparation/',
    },
    showReferences: true,
    sections: [
      {
        heading: 'Start with the preparation line',
        paras: [
          'This is the single most important item on the page, and it is the one most often left vague. A quote should state how the concrete will be mechanically prepared. If it says "clean and prep," "surface preparation" with no method, or describes an acid wash or pressure wash, you are not comparing the same job.',
          'Mechanical diamond grinding physically removes the closed surface layer of the slab and opens a profile the coating can key into. Nothing applied over an unground, power-troweled surface is bonded to the concrete — it is bonded to a skin that will eventually release.',
        ],
      },
      {
        heading: 'Check whether repair is its own line item',
        paras: [
          'Cracks, spalls and pitting take time and material to fix properly, and that work happens before any coating goes down. If repair is not itemized, either the quote assumes your slab needs none, or the intention is to coat straight over the damage.',
          'Ask directly: what happens to the cracks? A straight answer will describe them being opened, filled and re-ground flush as a separate step.',
        ],
      },
      {
        heading: 'Look for what the topcoat actually is',
        paras: [
          'A decorative flake floor is a system, not a product — a base coat, a broadcast layer, and a clear topcoat over the top. A single-coat consumer kit is not the same thing regardless of what the label says.',
          'The quote should name the products going on your floor. If it does not, you cannot verify what you are buying.',
        ],
      },
      {
        heading: 'Then read the terms, not the total',
        paras: [
          'Confirm the contractor carries general liability and workers compensation, and ask for certificates — a legitimate contractor will send them without hesitation. Confirm whether the warranty covers workmanship or only the product, and get the length in writing.',
          'Also check when payment is due. A deposit before any work happens is common in the trade but it is not universal, and it is worth knowing which you are agreeing to.',
        ],
      },
    ],
    related: [
      { label: 'Concrete grinding & surface preparation', href: '/concrete-grinding-preparation/' },
      { label: 'What a floor coating costs in Houston', href: '/pricing/' },
      { label: 'Our workmanship warranty', href: '/warranty/' },
    ],
  },

  /*
    Companion to how-long-does-epoxy-garage-floor-take, deliberately a separate
    page rather than a section of it. The timeline article answers "how long"
    (crew days vs return-to-service). This one answers a different question the
    "one-day floor" marketing provokes — "can MY slab actually be done in a
    day, and what rules it out" — which is an eligibility question, not a
    duration one. They cross-link instead of overlapping.

    Same house rule as every article here: the capability is described
    honestly, but no cure times, mil thicknesses or product performance figures
    — those live on the manufacturer data sheet for the system actually
    installed, not on the site.
  */
  {
    slug: 'one-day-garage-floor-coating-houston',
    title: 'Can a Garage Floor Really Be Coated in One Day? | Houston Superior Epoxy',
    h1: 'When a one-day garage floor is realistic — and when it is not',
    description:
      'The one-day floor is real, but only for a slab that qualifies for it. What makes a slab eligible for a single-day install, and what quietly rules it out.',
    kicker: 'Before you book a one-day install',
    question: 'Can a garage floor really be installed in one day?',
    quickAnswer:
      'On a sound slab that needs no significant repair or moisture remediation, a fast-cure polyaspartic system can be ground, base-coated, flaked and topcoated in a single working day. What rules a one-day install out is almost always the slab, not the coating: active cracks, spalling, oil saturation, a failed previous coating, or measurable vapor drive each require work that has to happen and cure first. Eligibility is decided at the inspection, not over the phone.',
    takeaways: [
      'The one-day floor is a real capability of fast-cure polyaspartic systems, not a gimmick — on the right slab.',
      'Eligibility is a property of the slab, not the coating you choose.',
      'Anything that needs to cure before the next step — crack repair, spall patching, moisture mitigation — moves the job past one day by definition.',
      'Removing a failed existing coating is its own scope and, on its own, usually ends the one-day option.',
      'A freshly poured slab has to cure before it can be coated at all, so new construction is rarely a one-day job on the day you ask.',
      'A same-day promise made before anyone has seen the slab is a scheduling claim about a floor nobody inspected.',
    ],
    terms: ['polyaspartic', 'moisture vapor transmission', 'laitance'],
    serviceLink: {
      label: 'Polyaspartic floor coatings',
      href: '/polyaspartic-floor-coatings-houston/',
    },
    sections: [
      {
        heading: 'What the one-day floor actually is',
        paras: [
          'The single-day install is built on polyaspartic chemistry. A fast-cure polyaspartic returns to a workable state quickly enough that grinding, the base coat, the flake broadcast and the clear topcoat can be staged across one working day rather than spread over several with overnight waits between coats.',
          'That is a genuine capability, not marketing. But it is a capability of the system, and it only translates into a one-day job when the slab underneath is ready to accept all of those steps in sequence without stopping for something that has to cure first.',
        ],
      },
      {
        heading: 'The slab decides, not the calendar',
        paras: [
          'A slab qualifies for a one-day install when it is structurally sound, shows no active movement, needs no significant crack or spall repair, carries no failed coating that has to come off, and tests within tolerance for moisture. On a slab like that, preparation and coating are one continuous sequence.',
          'That description fits a lot of garages — particularly newer ones in good condition — which is why the one-day floor is a real option often enough to be worth offering. It just is not something that can be confirmed from a photo or a square-foot count.',
        ],
      },
      {
        heading: 'What quietly rules a one-day install out',
        paras: [
          'Active cracks and spalling have to be repaired as their own step, and a repair has to cure before a coating goes over it — that alone moves the job past a single day. Oil saturation has to be drawn out and degreased, not coated over. A failed previous coating has to be mechanically removed, which is frequently as much work as the new floor.',
          'Moisture is the one that surprises people. Where testing shows vapor moving up through the slab, a mitigation step comes first, because a coating sealed over an unaddressed moisture drive is the classic osmotic-blister failure. And a freshly poured slab simply has to cure before it can take a coating at all, so new construction is rarely a one-day job the day you ask about it.',
        ],
      },
      {
        heading: 'Why we will not promise one day before seeing the slab',
        paras: [
          'We are glad to do a one-day floor when the slab supports it, and we will tell you at the inspection whether yours does. What we will not do is promise a single-day install sight-unseen, because that promise is really a promise about slab condition nobody has verified yet.',
          'The failures we get called to remove are disproportionately floors that were rushed onto a slab that was not ready — coated over laitance, over an active crack, or over moisture — to hit a schedule. The inspection is what tells us honestly whether one day is realistic for your floor or whether it needs a step first.',
        ],
      },
    ],
    related: [
      { label: 'How long an epoxy garage floor takes', href: '/resources/how-long-does-epoxy-garage-floor-take/' },
      { label: 'Polyaspartic floor coatings', href: '/polyaspartic-floor-coatings-houston/' },
      { label: 'How we install a floor', href: '/our-process/' },
      { label: 'Book an estimate', href: '/schedule/' },
    ],
  },

  {
    slug: 'how-long-does-epoxy-garage-floor-take',
    title: 'How Long Does an Epoxy Garage Floor Take? | Houston Superior Epoxy',
    h1: 'How long an epoxy garage floor takes, start to finish',
    description:
      'Install time and return-to-service time are two different questions, and the second one is what actually affects your week.',
    kicker: 'Planning around the work',
    question: 'How long does it take to install an epoxy garage floor?',
    quickAnswer:
      'Most residential garage floors are installed over one to two working days, but the floor is not usable immediately after the last coat. Foot traffic and vehicle traffic become available at different points, and the gap between them is set by the coating system and the conditions. Slab repairs or coating removal add time before installation begins.',
    takeaways: [
      'Installation and return to service are separate timelines — ask about both.',
      'Foot traffic is typically available well before vehicle traffic.',
      'Crack and spall repair, and removal of a failed coating, happen before installation and add days.',
      'Fast-cure polyaspartic topcoats shorten return to service but narrow the installer\u2019s working window.',
      'Humidity and slab temperature affect cure, so a Houston summer schedule is not the same as a January one.',
      'Exact cure and return-to-service times come from the data sheet for the specific system going on your slab.',
    ],
    terms: ['polyaspartic', 'spall'],
    serviceLink: { label: 'How we install a floor', href: '/our-process/' },
    sections: [
      {
        heading: 'The two timelines people conflate',
        paras: [
          'When someone asks how long a floor takes, they usually mean one of two things: how many days will there be a crew in my garage, and when can I put my car back. Those have different answers and it is worth separating them before you plan.',
          'The crew time on a straightforward residential garage is commonly one to two working days. The return-to-service time runs past that, and it is staged — the floor takes foot traffic before it takes a vehicle.',
        ],
      },
      {
        heading: 'What happens before day one',
        paras: [
          'If the slab needs crack repair, spall patching or degreasing, that work happens first and it is not instant. If there is a failed coating to remove, that is its own scope and can take as long as the new installation.',
          'This is why the inspection matters for scheduling as much as for pricing. Finding a moisture problem or a saturated parking strip on the morning of the install is how timelines slip.',
        ],
      },
      {
        heading: 'Why Houston weather is part of the schedule',
        paras: [
          'Resin coatings cure by chemical reaction, and the rate depends on temperature and humidity. Heat accelerates a fast-cure topcoat, which sounds convenient but means less time to work the material evenly across a large floor.',
          'We schedule around conditions rather than purely around the calendar. A floor rushed through the hottest part of an August afternoon is a floor with a higher chance of visible lap marks.',
        ],
      },
      {
        heading: 'What we will not put a number on',
        paras: [
          'We do not publish cure schedules on this site. Those figures are specific to a product and are stated on its current technical data sheet — quoting them generically is how misinformation about coatings spreads.',
          'You will get the actual return-to-service times for your system in writing, and we will walk you through them at the final walkthrough.',
        ],
      },
    ],
    related: [
      { label: 'When a one-day install is realistic', href: '/resources/one-day-garage-floor-coating-houston/' },
      { label: 'How we install a floor', href: '/our-process/' },
      { label: 'Epoxy coating removal & resurfacing', href: '/epoxy-coating-removal/' },
      { label: 'Book an estimate', href: '/schedule/' },
    ],
  },

  {
    slug: 'diy-epoxy-kit-vs-professional-installation',
    title: 'DIY Epoxy Kit vs Professional Installation | Houston Superior Epoxy',
    h1: 'DIY epoxy kit vs professional installation',
    description:
      'Consumer kits are not a cheaper version of a professional floor. They are a different product doing a different job, and the difference is mostly preparation.',
    kicker: 'For anyone weighing a weekend project',
    question: 'Are DIY epoxy garage floor kits worth it?',
    quickAnswer:
      'A consumer kit can produce a reasonable short-term finish on sound concrete, but the gap is preparation rather than resin. Kits rely on acid etching instead of mechanical grinding, so the coating bonds to the slab\u2019s weak surface layer. That is the leading cause of peeling, and it is not something a better application technique compensates for.',
    takeaways: [
      'The real difference is preparation, not the resin in the bucket.',
      'Kits specify acid etching, which textures the weak surface layer instead of removing it.',
      'Most kits are a single thin layer with no separate build coat and no sacrificial wear layer.',
      'Grinding equipment and HEPA dust extraction are the capital cost a kit avoids by skipping the step.',
      'A failed DIY coating must be removed before a professional floor goes down, so the attempt can add cost rather than save it.',
    ],
    comparison: {
      caption: 'Consumer kit compared with a professionally installed system',
      columns: ['Dimension', 'DIY consumer kit', 'Professional system'],
      rows: [
        [
          'Surface preparation',
          'Acid etch, occasionally a light hand-sand. The weak surface layer stays.',
          'Mechanical diamond grinding with dust extraction. The weak layer is removed.',
        ],
        [
          'Number of layers',
          'Usually one thin coat, sometimes with a light chip scatter.',
          'Bonded base coat, broadcast layer, and a separate clear wear layer.',
        ],
        [
          'Moisture assessment',
          'None. Nothing in a kit tests the slab.',
          'Tested before quoting under ASTM F1869 or F2170, and the spec changes if vapor is present.',
        ],
        [
          'Crack and spall repair',
          'Left to the homeowner, generally with a filler that is not ground flush.',
          'Opened, filled and re-ground flush as its own step before coating.',
        ],
        [
          'Realistic outcome on a sound slab',
          'A presentable floor that may last a while, with peeling risk concentrated at tire contact.',
          'A bonded system whose wear happens in the sacrificial topcoat rather than at the slab interface.',
        ],
        [
          'What failure costs you',
          'The coating must be mechanically removed before anything else can be installed.',
          'Covered by a workmanship warranty rather than by starting over.',
        ],
      ],
    },
    terms: ['laitance', 'hot-tire pickup', 'concrete surface profile'],
    serviceLink: {
      label: 'Concrete grinding & surface preparation',
      href: '/concrete-grinding-preparation/',
    },
    showReferences: true,
    sections: [
      {
        heading: 'The honest case for a kit',
        paras: [
          'If your slab is genuinely sound, you have realistic expectations, and the goal is to make a garage look better for a few years at low cost, a consumer kit is not a scam. Plenty of people are satisfied with one.',
          'What a kit cannot do is change what it is bonded to. That is the whole argument, and it is worth understanding before you spend a weekend on it.',
        ],
      },
      {
        heading: 'Why acid etching is the weak point',
        paras: [
          'Kits specify acid etching because grinding requires a planetary grinder and dust extraction that no homeowner owns. Etching chemically roughens the top of the slab\u2019s closed surface layer without removing it.',
          'A coating bonded to that layer inherits its weakness. When it fails it tends to lift in sheets with clean concrete underneath — the signature of a bond failure rather than a worn-out coating.',
        ],
      },
      {
        heading: 'The cost that is easy to miss',
        paras: [
          'A failed DIY coating does not simply wear away. It has to be mechanically removed before a professional system can be installed, and removal is its own line item.',
          'So the comparison is not always kit price against professional price. Sometimes it is kit price plus removal plus professional price, against professional price alone.',
        ],
      },
    ],
    related: [
      {
        label: 'Acid etching vs diamond grinding',
        href: '/resources/acid-etching-vs-diamond-grinding/',
      },
      { label: 'Epoxy coating removal & resurfacing', href: '/epoxy-coating-removal/' },
      { label: 'Why epoxy garage floors peel', href: '/resources/why-do-epoxy-garage-floors-peel/' },
    ],
  },

  {
    /*
      Was `why-diamond-grinding-matters`. Retitled to the comparison the
      searcher actually types — "acid etching vs diamond grinding" is a real
      query with commercial intent, where "why diamond grinding matters"
      presupposes the answer. Old slug 308s here from next.config.mjs.
    */
    slug: 'acid-etching-vs-diamond-grinding',
    title: 'Acid Etching vs Diamond Grinding for Concrete | Houston Superior Epoxy',
    h1: 'Acid etching vs diamond grinding: which prepares concrete properly',
    description:
      'Both are sold as surface preparation. Only one removes the layer that makes coatings fail. Here is the difference, and how to tell which a quote is describing.',
    kicker: 'The step that determines whether a floor lasts',
    question: 'Is acid etching or diamond grinding better before epoxy?',
    quickAnswer:
      'Diamond grinding, in nearly every case. Coating adhesion is mechanical, so it depends on removing the closed surface layer of the slab and opening a profile the resin can key into. Grinding removes that layer; acid etching only textures the top of it and leaves contamination behind. That difference is why ground floors last and etched ones lift in sheets.',
    takeaways: [
      'Adhesion is mechanical, not chemical — the coating grips a profile, it does not glue itself to smooth concrete.',
      'Acid etching textures the weak surface layer. Diamond grinding removes it.',
      'Etching results vary with dilution, dwell time and rinsing. Grinding is repeatable across a whole slab.',
      'Grinding exposes cracks, soft patches and oil saturation before coating, so they can be fixed as their own step.',
      'A quote that says "clean and prep" or describes an acid wash is not describing mechanical preparation.',
    ],
    comparison: {
      caption: 'Acid etching compared with diamond grinding',
      columns: ['Dimension', 'Acid etching', 'Diamond grinding'],
      rows: [
        [
          'What it does to the weak surface layer',
          'Chemically roughens the top of it. The layer stays on the slab.',
          'Mechanically removes it, so the coating bonds to sound concrete underneath.',
        ],
        [
          'Consistency across a slab',
          'Varies with dilution, dwell time, temperature and how thoroughly it was rinsed.',
          'Repeatable. The same profile is cut across the whole floor.',
        ],
        [
          'Effect on embedded contamination',
          'Little. Oil and fluids that have soaked in stay in the concrete.',
          'Removes surface-bound contamination and reveals saturated areas needing separate treatment.',
        ],
        [
          'What it reveals before coating',
          'Very little. Defects stay hidden until they telegraph through the finish.',
          'Cracks, spalls, soft patches and previous repairs all become visible while they can still be fixed.',
        ],
        [
          'Residue left behind',
          'Acid reaction products and rinse water that must be fully neutralised and removed.',
          'Dust, captured at source by the grinder\u2019s extraction rather than rinsed into the slab.',
        ],
        [
          'Equipment and containment',
          'Minimal. Part of why it persists as a shortcut on price-led bids.',
          'Planetary grinders and HEPA dust extraction, which is a real cost line in a quote.',
        ],
      ],
    },
    terms: ['laitance', 'concrete surface profile'],
    serviceLink: {
      label: 'Concrete grinding & surface preparation',
      href: '/concrete-grinding-preparation/',
    },
    showReferences: true,
    sections: [
      {
        heading: 'What is actually on top of your slab',
        paras: [
          'When a concrete garage slab is finished with a power trowel, the process pushes fine cement paste to the surface and closes it off. The result is a hard, dense, almost glassy layer sitting on top of the structural concrete.',
          'That layer is weakly attached to what is underneath it. Anything bonded to it inherits that weakness, which is why a coating can look flawless for a year and then begin lifting in sheets rather than flaking away gradually.',
        ],
      },
      {
        heading: 'Why acid etching is not equivalent',
        paras: [
          'Acid etching chemically roughens the very top of the surface. It does not remove the closed layer, it does not deal with contamination that has soaked into the slab, and its results vary with how the acid was applied, diluted and rinsed.',
          'Diamond grinding is a mechanical process. It removes material, so the closed layer is gone rather than textured, and it produces a consistent profile across the whole floor. It also generates a large amount of dust, which is why dust-control equipment is part of doing it indoors.',
        ],
      },
      {
        heading: 'What grinding also reveals',
        paras: [
          'Grinding exposes the true condition of the concrete. Cracks that were filled with dirt become visible, soft or previously patched areas show themselves, and oil contamination that had soaked in becomes apparent.',
          'This is a feature, not an inconvenience. Finding those conditions before the coating goes on is what allows them to be repaired as their own step instead of becoming a defect under a finished floor.',
        ],
      },
    ],
    related: [
      { label: 'Concrete grinding & surface preparation', href: '/concrete-grinding-preparation/' },
      { label: 'Garage floor crack & spall repair', href: '/garage-floor-repair/' },
      { label: 'How we install a floor', href: '/our-process/' },
    ],
  },

  {
    /* Was `epoxy-vs-polyaspartic`. Houston-qualified; old slug 308s here. */
    slug: 'epoxy-vs-polyaspartic-houston',
    title: 'Epoxy vs Polyaspartic in Houston: The Real Difference | Houston Superior Epoxy',
    h1: 'Epoxy vs polyaspartic in Houston: what the difference actually is',
    description:
      'They are different chemistries doing different jobs in the same floor — and Houston heat changes how one of them behaves. Understanding which does what makes a quote much easier to evaluate.',
    kicker: 'For buyers comparing coating chemistries',
    question: 'Is epoxy or polyaspartic better for a garage floor in Houston?',
    quickAnswer:
      'They are usually not alternatives. A well-built floor uses both: epoxy as the base coat, because it bonds and builds thickness well, and polyaspartic as the clear topcoat, because it is UV stable where epoxy ambers in sunlight. When someone presents them as competing options, they are normally describing a single-layer floor rather than a full system.',
    takeaways: [
      'In a full system these are layers, not rivals — epoxy below, polyaspartic on top.',
      'Epoxy bonds well and builds thickness, but ambers under sunlight, so it is a poor top layer on a sun-exposed floor.',
      'Polyaspartic is markedly more UV stable and cures faster, which shortens return to service.',
      'That fast cure is a workmanship demand, not a convenience: Houston heat shortens the working window further.',
      'If a quote offers one "or" the other, ask whether you are being sold a single-layer floor.',
    ],
    comparison: {
      caption: 'Epoxy compared with polyaspartic, by the job each does in a floor',
      columns: ['Dimension', 'Epoxy', 'Polyaspartic'],
      rows: [
        [
          'Usual role in the system',
          'Base coat, bonded into freshly ground concrete. Carries pigment or holds the flake broadcast.',
          'Clear topcoat. Takes the wear, the sunlight and the cleaning.',
        ],
        [
          'Adhesion to prepared concrete',
          'Strong. This is its main strength and why it goes down first.',
          'Good, but its value is at the top of the stack rather than against the slab.',
        ],
        [
          'Behaviour under sunlight',
          'Ambers over time with UV exposure — visible on floors that get direct sun.',
          'Markedly more UV stable, which is exactly why it belongs on top.',
        ],
        [
          'Cure speed',
          'Slower, giving a longer working window during application.',
          'Fast, which shortens return to service but leaves far less time to work the material.',
        ],
        [
          'How Houston conditions affect it',
          'Sensitive to slab and ambient temperature like any resin.',
          'Heat accelerates an already fast cure, so summer installs need scheduling around conditions.',
        ],
        [
          'Where it is the wrong choice',
          'As the exposed top layer of a sun-lit garage, patio or pool deck.',
          'As a thin single-coat "system" with no build coat beneath it.',
        ],
      ],
    },
    terms: ['epoxy', 'polyaspartic', 'aliphatic'],
    serviceLink: {
      label: 'Polyaspartic floor coatings in Houston',
      href: '/polyaspartic-floor-coatings-houston/',
    },
    sections: [
      {
        heading: 'They are usually not alternatives',
        paras: [
          'The framing of "epoxy or polyaspartic" is misleading, because a well-built decorative floor commonly uses both. Epoxy serves as the base coat, bonding into the freshly ground concrete and carrying the pigment or holding the broadcast layer. Polyaspartic serves as the clear topcoat that takes the wear, the UV exposure and the cleaning.',
          'When someone presents them as competing options, they are usually describing a single-layer floor rather than a system.',
        ],
      },
      {
        heading: 'Where each one is stronger',
        paras: [
          'Epoxy is a strong adhesive and builds thickness well, which is what you want against the substrate. Its weakness is ultraviolet light: epoxies generally amber over time when exposed to sunlight, which is why an epoxy left as the top layer of a sun-exposed floor tends to yellow.',
          'Polyaspartics are markedly more UV stable, which is why they belong on top. They also cure faster, which shortens the return-to-service window but leaves a much smaller working window during application — that speed is a workmanship demand, not a consumer convenience.',
        ],
      },
      {
        heading: 'Why temperature matters in Houston',
        paras: [
          'Both chemistries are sensitive to ambient and slab temperature, and polyaspartics in particular react to heat by curing faster still. In a Houston summer that can mean a very short window to work the material before it sets.',
          'This is one of the practical reasons installation is scheduled around conditions rather than purely around convenience, and one of the reasons a fast-cure product in inexperienced hands produces a worse floor than a slower one.',
        ],
      },
      {
        heading: 'What we do not publish',
        paras: [
          'We deliberately do not put manufacturer performance numbers — thickness, abrasion ratings, chemical resistance tables, cure schedules — on this site. Those figures belong to the current technical data sheet for the specific product, and quoting them from memory or from a competitor is how misinformation spreads.',
          'If you want the data sheet for the products going on your floor, ask and we will provide it.',
        ],
      },
    ],
    related: [
      { label: 'Polyaspartic floor coatings in Houston', href: '/polyaspartic-floor-coatings-houston/' },
      { label: 'Epoxy flooring contractors in Houston', href: '/epoxy-flooring-houston/' },
      { label: 'Full-broadcast flake garage floors', href: '/flake-epoxy-garage-floors/' },
    ],
  },

  {
    /*
      Was `slab-moisture-in-houston`. Retitled around the testing step, because
      that is the decision a buyer can act on and the phrase they search before
      signing. Old slug 308s here.
    */
    slug: 'concrete-moisture-testing-before-epoxy-houston',
    title: 'Concrete Moisture Testing Before Epoxy in Houston | Houston Superior Epoxy',
    h1: 'Concrete moisture testing before epoxy: why it decides the outcome',
    description:
      'Moisture moving upward through a Houston slab is one of the few things that will defeat an otherwise perfect installation. It is testable before anyone quotes.',
    kicker: 'A Houston-specific problem worth understanding',
    question: 'Does a concrete slab need moisture testing before epoxy?',
    quickAnswer:
      'Yes, and on a Houston slab it is not optional. Concrete is porous, so where the soil beneath is wetter than the air above, water vapor travels upward. Sealing that surface traps the vapor until pressure lifts the coating in bubbles or patches. Standardised tests under ASTM F1869 and F2170 measure it before quoting, which is why it should never be a surprise.',
    takeaways: [
      'Bubbling and blistering months after a flawless install is usually vapor drive, not a bad batch of product.',
      'Two standardised methods exist: ASTM F1869 (calcium chloride) and ASTM F2170 (in-situ relative humidity).',
      'Greater Houston stacks the odds — expansive clay, heavy rainfall, and a high water table south and east of the city.',
      'Drainage is part of the diagnosis: a downspout or flower bed beside the apron can keep one corner of a slab wet.',
      'The result changes the specification, so it belongs in the conversation before you sign, not after a failure.',
    ],
    terms: ['moisture vapor transmission'],
    serviceLink: {
      label: 'Epoxy coating removal & resurfacing',
      href: '/epoxy-coating-removal/',
    },
    showReferences: true,
    sections: [
      {
        heading: 'What vapor drive is',
        paras: [
          'Concrete is porous. Where the ground beneath a slab is wetter than the air above it, water vapor moves upward through the concrete and reaches the surface. If that surface is sealed with a coating, the vapor has nowhere to go and pressure builds under the film.',
          'The visible result is bubbling, blistering or patchy delamination, often months after an install that looked perfect on day one.',
        ],
      },
      {
        heading: 'Why it comes up so often here',
        paras: [
          'Greater Houston combines expansive clay soils, heavy rainfall, and in the southern and eastern parts of the metro a comparatively high water table. Slabs in low-lying areas such as Pearland are more likely to show meaningful vapor movement than slabs in the northern and western suburbs.',
          'Irrigation and drainage matter too. A flower bed that sheds water toward the garage, or a downspout discharging next to the apron, can keep the soil under one corner of a slab persistently wet.',
        ],
      },
      {
        heading: 'How it should be handled',
        paras: [
          'It should be checked before quoting, not diagnosed afterward. Moisture is one of the specific conditions we assess during the onsite inspection, alongside cracks, contamination and the condition of any existing coating.',
          'Where a slab is pushing vapor, the specification changes. What does not change is that the finding belongs in the conversation before you sign anything — a contractor who never mentions moisture on a Houston slab has not looked for it.',
        ],
      },
    ],
    related: [
      { label: 'Epoxy coating removal & resurfacing', href: '/epoxy-coating-removal/' },
      { label: 'Patio & pool deck concrete coatings', href: '/patio-concrete-coatings-houston/' },
      { label: 'Pearland service area', href: '/service-areas/pearland/' },
    ],
  },

  {
    /*
      Was `why-garage-floor-coatings-fail`. "Peel" is the word owners actually
      use when they search, and it is the symptom they are looking at.
      Old slug 308s here.
    */
    slug: 'why-do-epoxy-garage-floors-peel',
    title: 'Why Do Epoxy Garage Floors Peel? | Houston Superior Epoxy',
    h1: 'Why epoxy garage floors peel: the five causes',
    description:
      'Peeling is rarely mysterious. Almost every case traces back to one of five decisions made before or during installation — and four happen before the first coat is opened.',
    kicker: 'Diagnosing a floor that did not last',
    question: 'Why do epoxy garage floors peel?',
    quickAnswer:
      'Almost every failure traces to one of five causes: the slab was never mechanically ground, moisture was never tested, existing cracks or spalls were coated over, oil contamination was left in the concrete, or a one-coat product was sold as a system. Four of the five are decisions made before the first coat is opened.',
    takeaways: [
      'Peeling in large continuous sheets with clean concrete underneath points to missing mechanical preparation.',
      'Bubbles and blisters in recurring patches point to untested slab moisture instead.',
      'A crack coated over is still a crack — it telegraphs through the finish, then reopens.',
      'Oil-saturated areas need identifying and treating specifically; grinding alone may not reach them.',
      'A single thin layer has neither a bonded build coat nor a sacrificial wear layer, whatever the label calls it.',
    ],
    terms: ['laitance', 'hot-tire pickup', 'spall'],
    serviceLink: {
      label: 'Epoxy coating removal & resurfacing',
      href: '/epoxy-coating-removal/',
    },
    sections: [
      {
        heading: '1. The slab was never mechanically prepared',
        paras: [
          'This is the leading cause by a wide margin. A coating over a closed, troweled surface is bonded to a weak layer, and it will eventually release in sheets. Peeling that lifts in large continuous pieces, with clean concrete underneath, is the signature.',
        ],
      },
      {
        heading: '2. Moisture was never tested',
        paras: [
          'Bubbles and blisters that appear in patches, often in the same areas each time, point to vapor moving up through the slab. No amount of surface preparation overcomes an untested moisture condition.',
        ],
      },
      {
        heading: '3. Damage was coated over',
        paras: [
          'A crack under a coating is still a crack, and it keeps moving with the slab. It telegraphs through the finished floor as a visible line, then opens. Repair has to happen before coating, as its own step.',
        ],
      },
      {
        heading: '4. Contamination was left in the concrete',
        paras: [
          'Years of oil, transmission fluid and tire dressing soak into a garage slab. Grinding removes much of it, but heavily saturated areas need to be identified and addressed specifically or the coating will not bond in those spots.',
        ],
      },
      {
        heading: '5. It was a one-coat product sold as a system',
        paras: [
          'A single thin layer, whatever it is called, does not have a base coat bonding into profiled concrete or a wear layer taking the abuse on top. It is a cosmetic treatment with a short life, and it is often what a homeowner is comparing against a real system on price alone.',
        ],
      },
    ],
    related: [
      { label: 'Epoxy coating removal & resurfacing', href: '/epoxy-coating-removal/' },
      {
        label: 'Acid etching vs diamond grinding',
        href: '/resources/acid-etching-vs-diamond-grinding/',
      },
      { label: 'How to read a coating quote', href: '/resources/how-to-read-a-garage-floor-quote/' },
    ],
  },

  {
    slug: 'flake-vs-metallic-epoxy-floors',
    title: 'Flake vs Metallic Epoxy Floors: Which to Choose | Houston Superior Epoxy',
    h1: 'Flake vs metallic epoxy floors: which one belongs in your space',
    description:
      'One hides everything and asks nothing of you. The other is a feature floor with real upkeep. The choice is about the room, not about which is better.',
    kicker: 'Choosing a finish',
    question: 'Should I choose a flake or metallic epoxy floor?',
    quickAnswer:
      'Choose flake for a working garage and metallic for a space you want people to notice. Flake hides dust, tire marks and minor wear, and its texture adds slip resistance. Metallic produces a seamless reflective surface with far more visual impact, but shows scuffing and settled dust, and every square foot is hand-worked so no two floors match.',
    takeaways: [
      'Flake is the default for a working garage: it hides dust and wear and adds slip resistance through texture.',
      'Metallic is a feature floor — dramatic, seamless, and more demanding to keep looking its best.',
      'Metallic is hand-worked, so the pattern is unrepeatable and a patch repair will not blend invisibly.',
      'A high-gloss metallic surface is smooth, so slip resistance has to be addressed deliberately if the floor gets wet.',
      'Flake blends should be chosen from physical samples in the actual room, under that room\u2019s lighting.',
    ],
    comparison: {
      caption: 'Full-broadcast flake compared with a metallic system',
      columns: ['Dimension', 'Flake', 'Metallic'],
      rows: [
        [
          'Visual character',
          'Consistent, speckled, forgiving. Reads as a finished surface rather than a feature.',
          'Seamless, reflective, with depth and movement. A focal point.',
        ],
        [
          'Hiding dust and wear',
          'Excellent. The chip pattern breaks up dust, tire marks and light scuffing.',
          'Poor by comparison. A gloss surface shows settled dust and scuffs readily.',
        ],
        [
          'Slip resistance',
          'Texture from the chip profile helps. Aggregate can be added to the topcoat.',
          'Smooth and glossy, so slip resistance must be addressed deliberately.',
        ],
        [
          'Repeatability and repair',
          'A blend can be matched again, so a repair can be blended in.',
          'Hand-worked and unrepeatable. A patch will not match the surrounding pattern.',
        ],
        [
          'Typical setting',
          'Residential garages, workshops, warehouse and commercial floors.',
          'Showrooms, retail, home gyms, display garages, feature entryways.',
        ],
        [
          'Upkeep expectation',
          'Dust mop and damp mop. Very tolerant of neglect.',
          'Same routine, but performed more often to keep the reflection clean.',
        ],
      ],
    },
    terms: ['full-broadcast', 'refusal', 'dcof'],
    serviceLink: {
      label: 'Full-broadcast flake garage floors',
      href: '/flake-epoxy-garage-floors/',
    },
    sections: [
      {
        heading: 'What flake is actually good at',
        paras: [
          'A full-broadcast flake floor is chips thrown into the wet base coat until it will not accept any more, then sealed under a clear topcoat. The result is a consistent speckled surface with a slight texture.',
          'That texture is the point. It disguises dust, tire marks and the small scuffs a working garage accumulates, and it contributes some slip resistance. It is the reason flake dominates residential garages.',
        ],
      },
      {
        heading: 'What metallic gives you and what it asks',
        paras: [
          'A metallic system uses reflective pigments moved through a clear resin to produce depth and movement. It is genuinely striking, and it is the finish people photograph.',
          'It is also smooth, glossy and hand-worked. Gloss shows settled dust and scuffing more readily than a chip pattern does, and because the pattern is created by hand it cannot be reproduced exactly — which matters if a section ever needs repair.',
        ],
      },
      {
        heading: 'The question to actually ask yourself',
        paras: [
          'It is not which floor is better. It is whether the room is a place where things happen or a place people look at. A garage where a truck parks, a mower lives and a workbench gets used is a flake room. A home gym, a showroom or a display bay is a metallic room.',
          'If you want the drama in part of a space and the practicality elsewhere, that is a legitimate specification — say so at the estimate and it can be designed in.',
        ],
      },
    ],
    related: [
      { label: 'Full-broadcast flake garage floors', href: '/flake-epoxy-garage-floors/' },
      { label: 'Metallic epoxy floors', href: '/metallic-epoxy-floors/' },
      { label: 'Flake blends & color options', href: '/colors/' },
    ],
  },

  {
    slug: 'what-causes-hot-tire-pickup',
    title: 'What Causes Hot Tire Pickup? | Houston Superior Epoxy',
    h1: 'What causes hot tire pickup, and how it is prevented',
    description:
      'Coating lifting where a warm tire sits looks like a product weakness. It is almost always a bond problem, which means it was decided before the coating was opened.',
    kicker: 'A specific failure mode explained',
    question: 'What causes hot tire pickup on a garage floor?',
    quickAnswer:
      'A warm tire softens the coating film slightly and grips it as the rubber cools, pulling the coating off the slab. The tire is only the trigger. The underlying cause is almost always inadequate bond to the concrete or a floor driven on before it fully cured, not a coating that was insufficiently hard.',
    takeaways: [
      'The tire is the trigger, not the cause. Adequate bond resists it.',
      'Two root causes dominate: preparation that never removed the weak surface layer, and traffic before full cure.',
      'It shows up as patches lifting exactly where tires sit, often in the shape of the contact patch.',
      'Houston heat raises tire temperatures, so the trigger is more energetic here than in cooler climates.',
      'Letting tires cool before parking is sensible in the first period after installation, but it is not a fix for a poorly bonded floor.',
    ],
    terms: ['hot-tire pickup', 'laitance', 'concrete surface profile'],
    serviceLink: {
      label: 'Concrete grinding & surface preparation',
      href: '/concrete-grinding-preparation/',
    },
    showReferences: true,
    sections: [
      {
        heading: 'The mechanism',
        paras: [
          'A tire that has been driven on gets hot. Parked on a coated floor, it transfers that heat into the coating film and softens it slightly. As the rubber cools it contracts and grips, and if the bond between coating and concrete is weaker than that grip, the coating comes up with the tire.',
          'The visible result is a patch of missing coating shaped roughly like a tire contact patch, usually in the same two or four places every time.',
        ],
      },
      {
        heading: 'Why it is a bond problem, not a hardness problem',
        paras: [
          'The intuitive reading is that the coating was too soft. But a properly ground and topcoated floor experiences the same tire heat and does not lift, which tells you the variable that matters is what the coating is attached to.',
          'On a slab that was etched rather than ground, the coating is bonded to a weak surface layer. Tire grip is simply the load that finds that weakness first, because it is the most concentrated stress a garage floor receives.',
        ],
      },
      {
        heading: 'The other cause: driving on it too early',
        paras: [
          'A coating that has not reached full cure has not developed full bond strength either. Parking on it early applies the exact load it is least ready for.',
          'This is why return-to-service times are staged and why they are worth respecting even when the floor looks and feels dry. Foot traffic and vehicle traffic are genuinely different thresholds.',
        ],
      },
      {
        heading: 'What actually prevents it',
        paras: [
          'Mechanical diamond grinding, so the coating is bonded to sound concrete rather than to laitance. A real topcoat rather than a single thin layer. And respecting the cure schedule for the specific system before a vehicle goes back in.',
          'None of those are things a homeowner can retrofit onto a floor that was installed without them, which is why this failure mode is best addressed at the quote stage.',
        ],
      },
    ],
    related: [
      { label: 'Why epoxy garage floors peel', href: '/resources/why-do-epoxy-garage-floors-peel/' },
      { label: 'Concrete grinding & surface preparation', href: '/concrete-grinding-preparation/' },
      { label: 'Our workmanship warranty', href: '/warranty/' },
    ],
  },

  {
    slug: 'epoxy-flooring-houston-humidity',
    title: 'Epoxy Flooring and Houston Humidity | Houston Superior Epoxy',
    h1: 'How Houston humidity affects an epoxy floor installation',
    description:
      'Humidity is not a detail of scheduling here. It affects cure, it affects finish quality, and on a bad day it decides whether coating happens at all.',
    kicker: 'Why local conditions change the work',
    question: 'Does humidity affect epoxy floor installation?',
    quickAnswer:
      'Yes, substantially. Resin coatings cure by chemical reaction, and both humidity and slab temperature change how that reaction runs. High humidity can affect surface appearance and cure, and coating a slab whose temperature is near the dew point risks moisture condensing on the surface exactly as the coating goes down.',
    takeaways: [
      'Humidity and slab temperature both affect how a resin coating cures.',
      'The dew point matters: if the slab is at or below it, moisture can condense on the surface during application.',
      'Heat accelerates fast-cure topcoats, shortening the window an installer has to work the material evenly.',
      'Conditions are measured on site rather than assumed from the forecast.',
      'A contractor willing to coat in any conditions is not accounting for the ones that produce a bad finish.',
    ],
    terms: ['polyaspartic', 'moisture vapor transmission'],
    serviceLink: {
      label: 'Epoxy flooring contractors in Houston',
      href: '/epoxy-flooring-houston/',
    },
    sections: [
      {
        heading: 'Cure is a chemical reaction, not drying',
        paras: [
          'A resin coating does not dry the way paint does. Two components react and cross-link into a solid, and the rate of that reaction depends on temperature. Ambient humidity interacts with it as well, differently for different chemistries.',
          'This is why "it was a nice day" is not the same as "conditions were right." The relevant measurements are slab temperature, air temperature, relative humidity and the resulting dew point.',
        ],
      },
      {
        heading: 'The dew point problem',
        paras: [
          'If the slab surface is at or below the dew point, moisture condenses on it. Coating over that puts a film of water between the resin and the concrete, at the exact interface where bond is supposed to happen.',
          'A concrete slab holds temperature and lags behind the air, so a slab can sit below the dew point on a morning that feels perfectly pleasant. Measuring it is the only way to know.',
        ],
      },
      {
        heading: 'Heat and the working window',
        paras: [
          'Houston summers cut the other way as well. Fast-cure polyaspartic topcoats react faster as temperature rises, so the time available to spread and work the material evenly shrinks.',
          'On a large floor that is a real risk of visible lap marks and inconsistency. It is managed by scheduling, crew size and product selection rather than by working faster.',
        ],
      },
      {
        heading: 'What this means for your install date',
        paras: [
          'We schedule around conditions, and occasionally that means moving a day. It is not a delay tactic — it is the difference between a floor that looks right in three years and one that does not.',
          'If you are comparing contractors, ask what conditions they measure before coating. The specific answer tells you a lot.',
        ],
      },
    ],
    related: [
      {
        label: 'Concrete moisture testing before epoxy',
        href: '/resources/concrete-moisture-testing-before-epoxy-houston/',
      },
      { label: 'How we install a floor', href: '/our-process/' },
      { label: 'Epoxy vs polyaspartic in Houston', href: '/resources/epoxy-vs-polyaspartic-houston/' },
    ],
  },

  {
    /* Was `caring-for-a-coated-floor`. Matches the actual query. Old slug 308s here. */
    slug: 'how-to-clean-epoxy-garage-floor',
    title: 'How to Clean an Epoxy Garage Floor | Houston Superior Epoxy',
    h1: 'How to clean an epoxy garage floor',
    description:
      'A finished floor needs very little maintenance, but a few habits meaningfully extend how good it looks — and two common household cleaners are worse for it than people expect.',
    kicker: 'After your floor is installed',
    question: 'How do you clean an epoxy garage floor?',
    quickAnswer:
      'Dust mop or vacuum, then damp mop with warm water and a pH-neutral cleaner. Avoid strongly acidic or alkaline products, including citrus and vinegar solutions, which are harsher on a clear topcoat than people expect. Wipe automotive fluids rather than letting them sit, and avoid dragging jack stands or toolboxes across the surface.',
    takeaways: [
      'Routine care is dust mop or vacuum, then damp mop with warm water and a pH-neutral cleaner.',
      'Skip citrus and vinegar solutions — both are more aggressive on a clear topcoat than their reputation suggests.',
      'Wipe automotive fluids rather than letting them sit; heat and time work against any finish.',
      'Point loads and dragged steel are the real risk to a garage floor, not foot traffic.',
      'Flake hides dust and light wear well. High-gloss metallic shows both more readily.',
    ],
    terms: ['hot-tire pickup'],
    serviceLink: {
      label: 'Garage floor coatings in Houston',
      href: '/garage-floor-coatings-houston/',
    },
    sections: [
      {
        heading: 'Cleaning',
        paras: [
          'For routine cleaning, dust mop or vacuum, then damp mop with warm water and a pH-neutral cleaner. Avoid harsh acidic or highly alkaline products, and avoid citrus-based and vinegar solutions, which are more aggressive on a clear topcoat than people expect.',
          'Spills of automotive fluids should be wiped up rather than left to sit. A good topcoat will tolerate them, but time and heat work against any finish.',
        ],
      },
      {
        heading: 'Tires and heat',
        paras: [
          'Hot tire pickup — where a warm tire pulls at the coating as the vehicle sits — is a bond problem, not a product problem, and a properly ground and topcoated floor resists it. Even so, letting tires cool before parking on a brand-new floor is a reasonable habit during the initial period after installation.',
          'Avoid dragging jack stands, toolboxes and trailer jacks across the surface. Point loads and sharp steel are the realistic risk to a garage floor, not foot traffic.',
        ],
      },
      {
        heading: 'What to expect over time',
        paras: [
          'A flake floor hides dust and minor wear well, which is part of why it dominates residential garages. A high-gloss metallic shows scuffing and settled dust more readily — it is a more dramatic floor with slightly more upkeep.',
          'You will receive care instructions specific to your system at the final walkthrough, which is the last step of our installation process.',
        ],
      },
    ],
    related: [
      { label: 'How we install a floor', href: '/our-process/' },
      { label: 'Our workmanship warranty', href: '/warranty/' },
      { label: 'Flake blends & color options', href: '/colors/' },
    ],
  },
  {
    slug: 'can-you-epoxy-over-existing-epoxy',
    title: 'Can You Epoxy Over Existing Epoxy? | Houston Superior Epoxy',
    h1: 'Can you put epoxy over an existing epoxy floor?',
    description:
      'Sometimes, and the deciding factor is not the age of the old coating. It is whether the old coating is still bonded to the concrete.',
    kicker: 'Recoating an existing floor',
    question: 'Can you apply epoxy over an existing epoxy floor?',
    quickAnswer:
      'Only if the existing coating is still soundly bonded to the slab. A new coating is no stronger than what sits beneath it, so recoating over a film that is already releasing simply buries the failure. Where the old coating is intact it can be abraded and recoated; where it is peeling, blistering or contaminated it has to come off first.',
    takeaways: [
      'The question is bond, not age. A ten-year-old floor that is still stuck down is a better candidate than a two-year-old one that is lifting.',
      'A new coat inherits the adhesion of whatever it is applied over.',
      'Sound existing coatings are mechanically abraded to give the new layer a profile to key into.',
      'Blistering usually indicates slab moisture, which recoating will not solve and will likely repeat.',
      'Compatibility between the old and new chemistry has to be confirmed, not assumed.',
    ],
    terms: ['moisture vapor transmission', 'concrete surface profile'],
    serviceLink: {
      label: 'Epoxy coating removal & resurfacing',
      href: '/epoxy-coating-removal/',
    },
    sections: [
      {
        heading: 'The only question that matters',
        paras: [
          'Is the existing coating still bonded? Everything else follows from the answer. A coating that is genuinely stuck down across the whole floor is a surface that can be prepared and built on. A coating that is releasing is a layer of separation between your new floor and the concrete.',
          'A simple check: tap and scrape a few areas, especially where tires sit and near the door. If it flakes away or sounds hollow, it is on its way off.',
        ],
      },
      {
        heading: 'What blistering tells you',
        paras: [
          'Bubbles and blisters generally point to moisture moving up through the slab rather than to a defective coating. Recoating over that condition does not address it — the vapor is still there and the new film will blister in the same places.',
          'That is a moisture testing question first. The specification changes depending on what the test finds, which is why testing precedes quoting.',
        ],
      },
      {
        heading: 'When recoating is the right call',
        paras: [
          'Where the existing system is sound and simply worn or dated, abrading and recoating is legitimate and it is less invasive than full removal. The surface still has to be mechanically prepared so the new layer has a profile to grip.',
          'Chemistry compatibility also has to be checked. Not every topcoat bonds reliably to every existing film, and that gets confirmed against the product data rather than assumed.',
        ],
      },
      {
        heading: 'When it has to come off',
        paras: [
          'Peeling, widespread blistering, heavy contamination, or a thin consumer coating with no real bond all mean removal. It is more work and it costs more, and it is the only honest recommendation in those cases.',
          'We will tell you which situation you are in after looking at the floor, and we will show you why.',
        ],
      },
    ],
    related: [
      { label: 'Epoxy coating removal & resurfacing', href: '/epoxy-coating-removal/' },
      {
        label: 'Concrete moisture testing before epoxy',
        href: '/resources/concrete-moisture-testing-before-epoxy-houston/',
      },
      { label: 'Why epoxy garage floors peel', href: '/resources/why-do-epoxy-garage-floors-peel/' },
    ],
  },

  {
    slug: 'polyaspartic-vs-polyurea-coatings',
    title: 'Polyaspartic vs Polyurea Coatings | Houston Superior Epoxy',
    h1: 'Polyaspartic vs polyurea: how the terms actually relate',
    description:
      'These are not two competing products. One is a subcategory of the other, and the marketing use of both terms has made that harder to see than it should be.',
    kicker: 'Clearing up the terminology',
    question: 'What is the difference between polyaspartic and polyurea?',
    quickAnswer:
      'Polyaspartic is a type of polyurea, not a competitor to it. Polyurea describes a broad family of chemistries; polyaspartics are the aliphatic branch of that family, which is what makes them UV stable and suitable as a clear topcoat. Marketing that presents them as rival products is describing a distinction that does not exist chemically.',
    takeaways: [
      'Polyaspartic is a subcategory of polyurea, so "polyaspartic vs polyurea" is a category error.',
      'The meaningful split is aliphatic versus aromatic: aliphatic chemistries hold colour in sunlight, aromatic ones do not.',
      'Polyaspartics are aliphatic, which is why they belong on top of a floor rather than underneath.',
      'Fast cure is the shared trait, and it narrows the installer\u2019s working window regardless of the label.',
      'Ask which specific product is going on your floor and request its data sheet, rather than comparing category names.',
    ],
    comparison: {
      caption: 'How the terms relate',
      columns: ['Dimension', 'Polyurea (the family)', 'Polyaspartic (a branch of it)'],
      rows: [
        [
          'Scope of the term',
          'A broad chemistry family covering many formulations.',
          'Specifically the aliphatic members of that family.',
        ],
        [
          'UV stability',
          'Depends entirely on the formulation. Aromatic versions are not UV stable.',
          'UV stable, because aliphatic chemistries resist ultraviolet degradation.',
        ],
        [
          'Typical role in a floor',
          'Varies. Aromatic formulations are used where sunlight is not a factor.',
          'Clear topcoat, where colour retention in light matters most.',
        ],
        [
          'Cure behaviour',
          'Generally fast across the family.',
          'Fast, with a short working window that heat shortens further.',
        ],
        [
          'How it is marketed',
          'Sometimes used as a premium-sounding umbrella term with no specifics attached.',
          'Sometimes framed as a rival to polyurea, which is not chemically coherent.',
        ],
      ],
    },
    terms: ['polyaspartic', 'aliphatic', 'epoxy'],
    serviceLink: {
      label: 'Polyaspartic floor coatings in Houston',
      href: '/polyaspartic-floor-coatings-houston/',
    },
    showReferences: true,
    sections: [
      {
        heading: 'Why the comparison is framed wrong',
        paras: [
          'Asking whether polyaspartic is better than polyurea is a little like asking whether a sedan is better than a car. Polyurea is the family; polyaspartics sit inside it.',
          'The framing persists because both words appear in marketing, often without specifics. A quote that simply says "polyurea topcoat" has told you less than it appears to.',
        ],
      },
      {
        heading: 'The distinction that does matter',
        paras: [
          'Aliphatic versus aromatic is the useful axis. Aliphatic chemistries resist ultraviolet degradation and hold their colour in sunlight. Aromatic chemistries, including standard epoxy, amber and chalk under sustained light.',
          'Polyaspartics are aliphatic. That single property is why they are used as the exposed top layer, and why an epoxy left exposed on a sun-lit floor yellows.',
        ],
      },
      {
        heading: 'What to ask instead',
        paras: [
          'Ask which specific product is going on your floor, and ask for its current technical data sheet. That document contains the actual properties, the actual cure schedule and the actual recommended use.',
          'We do not republish those figures here, because they belong to the product and they change between formulations. We will hand you the sheet for the system we are proposing.',
        ],
      },
    ],
    related: [
      { label: 'Polyaspartic floor coatings in Houston', href: '/polyaspartic-floor-coatings-houston/' },
      {
        label: 'Epoxy vs polyaspartic in Houston',
        href: '/resources/epoxy-vs-polyaspartic-houston/',
      },
      { label: 'Metallic epoxy floors', href: '/metallic-epoxy-floors/' },
    ],
  },

  {
    slug: 'best-garage-floor-coating-for-houston-heat',
    title: 'The Best Garage Floor Coating for Houston Heat | Houston Superior Epoxy',
    h1: 'What garage floor coating actually holds up to Houston heat',
    description:
      'Heat, sunlight through an open door, and hot tires are three different stresses. A system that handles all three has a specific shape.',
    kicker: 'Specifying for the local climate',
    question: 'What is the best garage floor coating for Houston heat?',
    quickAnswer:
      'A layered system with a UV-stable aliphatic topcoat over a bonded epoxy base handles local conditions best. Sunlight through an open garage door ambers an exposed epoxy, and hot tires attack the coating-to-slab bond rather than the film itself. Diamond grinding addresses the second problem; the aliphatic topcoat addresses the first.',
    takeaways: [
      'Three separate stresses matter here: ambient heat, direct sunlight through the door, and hot tire contact.',
      'An exposed epoxy top layer ambers in sunlight, so the top layer should be aliphatic.',
      'Hot tire pickup is a bond failure, so preparation matters more than topcoat hardness.',
      'Fast-cure topcoats need scheduling around heat, because the working window shrinks as temperature rises.',
      'Slab moisture is a separate Houston problem and needs testing regardless of which coating is chosen.',
    ],
    terms: ['aliphatic', 'polyaspartic', 'hot-tire pickup', 'epoxy'],
    serviceLink: {
      label: 'Garage floor coatings in Houston',
      href: '/garage-floor-coatings-houston/',
    },
    showReferences: true,
    sections: [
      {
        heading: 'Sunlight is the stress people forget',
        paras: [
          'A garage door spends a good part of the day open in a lot of Houston homes, and the first several feet of floor inside it get direct sun. Aromatic chemistries, including standard epoxy, amber and chalk under that exposure.',
          'The fix is not a different base coat. It is putting a UV-stable aliphatic layer on top, so the epoxy does the bonding it is good at and never sees the light.',
        ],
      },
      {
        heading: 'Heat attacks the bond, not the film',
        paras: [
          'Hot tires are the most concentrated stress a garage floor receives, and what they test is adhesion. A hard topcoat over a poorly prepared slab still lifts, because the weak link is at the concrete.',
          'So the honest answer to "which coating handles Houston heat" starts with preparation rather than with a product name. Diamond grinding is the part that makes heat survivable.',
        ],
      },
      {
        heading: 'The scheduling consequence',
        paras: [
          'Fast-cure topcoats get faster as it gets hotter. That shortens the window to work material evenly, which on a large floor is a real quality risk rather than a theoretical one.',
          'Installing in Houston summer means planning around slab temperature and dew point, and sometimes moving a date. That is part of specifying for the climate too.',
        ],
      },
      {
        heading: 'And the problem underneath all of it',
        paras: [
          'Heat is not the only local factor. Expansive clay soils, heavy rain and a high water table in parts of the metro mean slab moisture has to be tested before any system is chosen.',
          'No topcoat compensates for untested vapor drive. It is the one condition that will defeat an otherwise correct specification.',
        ],
      },
    ],
    related: [
      {
        label: 'Epoxy flooring and Houston humidity',
        href: '/resources/epoxy-flooring-houston-humidity/',
      },
      { label: 'What causes hot tire pickup', href: '/resources/what-causes-hot-tire-pickup/' },
      { label: 'Polyaspartic floor coatings in Houston', href: '/polyaspartic-floor-coatings-houston/' },
    ],
  },

  /*
    REMOVED — 'how-to-choose-a-garage-floor-coating-contractor'.

    This article and /how-to-choose-epoxy-contractor-houston/ answered the same
    question, both returning 200 and both self-canonical, which put two of our
    own URLs in competition for one query and gave an answer engine two
    near-identical sources with no reason to prefer either.

    The standalone page was kept: it carries the Houston qualifier in its H1 and
    title, its URL matches the query, and it is the more complete document (14
    criteria with warning signs, a read-aloud question list, and a labelled
    disclosure section). This article was close to a strict subset of it.

    Merged into the kept page rather than discarded: its two glossary terms
    (concrete surface profile, moisture vapour transmission) and its two unique
    internal links (/our-process/, the quote-reading guide) now render there.
    Everything else it said was already present.

    Removing the entry from this array is the whole retirement — the /resources/
    hub, the sitemap and generateStaticParams are all derived from it, so the
    URL stops being generated and stops being advertised in one edit. The 301 to
    the kept page lives in next.config.mjs.
  */

  {
    slug: 'garage-floor-crack-repair-before-coating',
    title: 'Garage Floor Crack Repair Before Coating | Houston Superior Epoxy',
    h1: 'Why cracks are repaired before coating, not covered by it',
    description:
      'A coating is a few thousandths of an inch of resin. It does not bridge a moving crack, and treating it as though it will produces a visible line within a year.',
    kicker: 'Preparation done properly',
    question: 'Do cracks need to be repaired before epoxy coating?',
    quickAnswer:
      'Yes, as their own step before any coating goes down. A coating film is far too thin to bridge a crack that moves with the slab, so an uncoated crack telegraphs through the finish as a visible line and then reopens. Repair means opening the crack, filling it, and grinding it flush before coating.',
    takeaways: [
      'A coating is thousandths of an inch thick. It cannot span a moving crack.',
      'Repair is a separate step with its own line item, performed before coating begins.',
      'Proper repair opens the crack out, fills it, and grinds the fill flush with the slab.',
      'Houston clay soils drive slab movement, so cracks here are frequently active rather than dormant.',
      'Control joints are designed to move and are treated differently from cracks — they are not simply filled and forgotten.',
    ],
    terms: ['spall', 'concrete surface profile'],
    serviceLink: { label: 'Garage floor crack & spall repair', href: '/garage-floor-repair/' },
    sections: [
      {
        heading: 'Why a coating cannot cover a crack',
        paras: [
          'Coating thickness is measured in thousandths of an inch. A crack in a concrete slab is a structural discontinuity that opens and closes as the slab moves with moisture and temperature. There is no version of a thin resin film that spans that reliably.',
          'What happens instead is predictable: the crack telegraphs through as a visible line, then the film splits along it. The coating did not fail — it was asked to do something no coating does.',
        ],
      },
      {
        heading: 'What proper repair involves',
        paras: [
          'The crack is opened out to give the repair material a real cross-section to hold, cleaned of debris, filled with an appropriate material, and then ground flush so the surface is continuous.',
          'That last step is the one most often skipped. A fill left proud of the slab shows as a ridge under the finished floor just as clearly as an unrepaired crack shows as a line.',
        ],
      },
      {
        heading: 'Spalls and pitting are the same argument',
        paras: [
          'A spall is a shallow crater where the surface has broken away. Coating over it produces a coated crater. It gets patched and levelled first, for the same reason.',
          'Grinding often reveals spalls and soft patches that were not obvious beforehand, which is one of the practical arguments for grinding early enough in the process to react to what it finds.',
        ],
      },
      {
        heading: 'Why this comes up so often in Houston',
        paras: [
          'The expansive clay soils across much of the metro move significantly with moisture, and slabs move with them. That makes cracking common and often active rather than settled.',
          'It also means control joints matter. Joints exist to accommodate movement, and they are handled deliberately rather than simply filled level with everything else.',
        ],
      },
    ],
    related: [
      { label: 'Garage floor crack & spall repair', href: '/garage-floor-repair/' },
      { label: 'Concrete grinding & surface preparation', href: '/concrete-grinding-preparation/' },
      {
        label: 'How to read a coating quote',
        href: '/resources/how-to-read-a-garage-floor-quote/',
      },
    ],
  },

  {
    slug: 'is-epoxy-flooring-slippery-when-wet',
    title: 'Is Epoxy Flooring Slippery When Wet? | Houston Superior Epoxy',
    h1: 'Is an epoxy floor slippery when it is wet?',
    description:
      'A glossy resin floor can be slick with water on it. That is a specification decision, not an inherent property, and it is measurable.',
    kicker: 'Safety and finish selection',
    question: 'Is epoxy flooring slippery when wet?',
    quickAnswer:
      'A smooth high-gloss resin surface can be slippery with water on it, but slip resistance is something you specify rather than something you accept. Texture from a flake broadcast helps, and aggregate can be added to the topcoat where a floor will get wet. Slip resistance is measurable as DCOF under ANSI A326.3.',
    takeaways: [
      'Slip resistance is a specification, not a fixed property of resin flooring.',
      'A flake broadcast leaves texture that helps; a high-gloss metallic is smooth by design.',
      'Aggregate can be added to a topcoat where water is expected, at some cost to cleanability and feel.',
      'DCOF under ANSI A326.3 is the measured standard, which is why adjectives are a poor substitute.',
      'Where the floor gets wet matters: an entry, a patio, a pool deck and a dry garage bay are different problems.',
    ],
    terms: ['dcof', 'full-broadcast'],
    serviceLink: {
      label: 'Patio & pool deck concrete coatings',
      href: '/patio-concrete-coatings-houston/',
    },
    showReferences: true,
    sections: [
      {
        heading: 'Where the concern is legitimate',
        paras: [
          'Any smooth, hard, glossy surface with a film of water on it can be slick. A high-gloss metallic floor is smooth by design, and if it is somewhere that gets wet — an entry where rain comes in, a patio, a pool surround — that deserves attention at specification time.',
          'A dry interior garage bay is a different risk profile from a pool deck, and treating them identically over-engineers one and under-engineers the other.',
        ],
      },
      {
        heading: 'What actually changes it',
        paras: [
          'A full-broadcast flake floor has texture from the chip profile itself, which helps. Beyond that, aggregate can be broadcast into the topcoat to raise slip resistance deliberately.',
          'There is a tradeoff: more texture means more grip and also a slightly less smooth surface to clean and walk on barefoot. That is a decision to make knowingly based on the room.',
        ],
      },
      {
        heading: 'Why we talk about it in terms of a test',
        paras: [
          'Slip resistance has a measured standard — dynamic coefficient of friction, tested under ANSI A326.3. It is a number produced by a defined procedure.',
          'We describe what aggregate is being added and reference the standard rather than calling a floor "non-slip," because that phrase is an adjective standing in for a measurement. If slip resistance is a priority in your space, say so and it gets specified.',
        ],
      },
    ],
    related: [
      { label: 'Patio & pool deck concrete coatings', href: '/patio-concrete-coatings-houston/' },
      { label: 'Metallic epoxy floors', href: '/metallic-epoxy-floors/' },
      { label: 'Commercial epoxy flooring', href: '/commercial-epoxy-flooring-houston/' },
    ],
  },

  {
    slug: 'how-long-does-epoxy-garage-floor-last',
    title: 'How Long Does an Epoxy Garage Floor Last? | Houston Superior Epoxy',
    h1: 'How long does an epoxy garage floor actually last?',
    description:
      'Lifespan is decided by preparation and by what the top layer is, far more than by the brand on the bucket.',
    kicker: 'Setting expectations honestly',
    question: 'How long does an epoxy garage floor last?',
    quickAnswer:
      'Lifespan depends overwhelmingly on preparation. A properly ground, moisture-tested, multi-layer system lasts dramatically longer than a single-coat product applied over an etched slab, and the failure modes are different — the former wears at the surface, the latter releases from the concrete. Brand matters far less than what was done before the coating opened.',
    takeaways: [
      'Preparation is the dominant variable. Bond failure ends a floor long before wear does.',
      'A layered system wears in its sacrificial topcoat, which is the layer designed to take it.',
      'A single-coat product has no sacrificial layer, so wear reaches the slab interface quickly.',
      'Untested slab moisture can defeat a well-installed floor regardless of product quality.',
      'A topcoat can often be refreshed later if the base system is still bonded — that is a design advantage of a layered floor.',
      'We do not publish a year figure, because it would be a guess about your slab.',
    ],
    terms: ['laitance', 'moisture vapor transmission', 'hot-tire pickup'],
    serviceLink: {
      label: 'Garage floor coatings in Houston',
      href: '/garage-floor-coatings-houston/',
    },
    sections: [
      {
        heading: 'Two completely different end-of-life stories',
        paras: [
          'A properly built floor ends its life by wearing. The clear topcoat gradually loses gloss and picks up scratches in traffic paths, and at some point it is worth refreshing. The bond to the slab is still intact.',
          'A poorly prepared floor ends its life by letting go. It lifts in sheets, often with clean concrete underneath, and no amount of maintenance changes that trajectory. These are not the same product lasting different amounts of time.',
        ],
      },
      {
        heading: 'Why the sacrificial layer matters',
        paras: [
          'In a layered system the clear topcoat is meant to take the abuse. It is the part that sees tires, dropped tools and cleaning, and it is the part that can be renewed while the base system stays where it is.',
          'A single thin coat has no such layer. Wear goes straight through it to the interface, which is exactly where you least want stress.',
        ],
      },
      {
        heading: 'The Houston-specific caveat',
        paras: [
          'Untested slab moisture can shorten the life of an otherwise correct installation, and it does not announce itself until the coating blisters. That is why testing precedes quoting rather than following a complaint.',
          'Heat and sunlight play in as well: an exposed epoxy ambers, so a floor that gets sun needs a UV-stable top layer if it is going to still look right in a few years.',
        ],
      },
      {
        heading: 'Why there is no number on this page',
        paras: [
          'A published lifespan figure would be a claim about your slab, your usage and your exposure, none of which we have seen. Manufacturer expectations belong to specific products and appear on their data sheets.',
          'What we will tell you is what your floor is made of, what the warranty covers, and what to expect as it ages. Ask for the data sheet for the proposed system and we will provide it.',
        ],
      },
    ],
    related: [
      { label: 'Our workmanship warranty', href: '/warranty/' },
      {
        label: 'How to clean an epoxy garage floor',
        href: '/resources/how-to-clean-epoxy-garage-floor/',
      },
      { label: 'Why epoxy garage floors peel', href: '/resources/why-do-epoxy-garage-floors-peel/' },
    ],
  },
]

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug)
