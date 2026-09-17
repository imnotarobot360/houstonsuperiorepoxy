import type { RouteKey } from '@/lib/routes'
import { pricing } from '@/lib/site'

/*
  Per-page answer-engine content, keyed by route.

  Kept in one file rather than inlined across fifteen page components for two
  reasons: the opening answers have to be checked against each other for
  contradictions (an answer engine reading two different definitions of
  "refusal" has no way to choose), and the 40-70 word target is much easier to
  hold consistently when the answers sit side by side.

  Same standing rule as the rest of the content layer: no product performance
  figures. Nothing here states a mil thickness, a cure time, an abrasion
  rating or an adhesion strength, because those belong to a manufacturer data
  sheet the owner has not supplied.
*/

export type PageAnswer = {
  /* Question-shaped H2, phrased the way a homeowner would actually ask it. */
  question: string
  /* Self-contained 40-70 word answer. Verified by the dev guard in aeo.tsx. */
  quickAnswer: string
  /* First-person expert judgment. Highest-value block for AEO. */
  recommendation?: {
    verdict: string
    chooseWhen: string
    avoidWhen: string
  }
  suitability?: {
    bestFor: readonly string[]
    notFor: readonly string[]
  }
}

export const pageAnswers: Partial<Record<RouteKey, PageAnswer>> = {
  /*
    The homepage answer, and the only one that opens with a bare entity
    statement — "Houston Superior Epoxy is a ... contractor serving ...".

    Deliberately phrased that way because this is the string an answer engine is
    most likely to lift verbatim when asked who does this work in Houston, and a
    definition it can quote is worth more here than a description it has to
    assemble. It names the service category, the metro and the division
    relationship to the parent company in one sentence, so a model that reads
    only this paragraph still attributes the work to the right entity.

    Every other page could rely on its own H1 for that context. The homepage
    ranks for the broadest, least specific queries, so it cannot.
  */
  home: {
    question: 'Who installs garage floor coatings in Houston?',
    quickAnswer:
      'Houston Superior Epoxy is a garage floor coating contractor serving the Houston metro, and the epoxy and concrete coatings division of Houston Superior Painting. We diamond grind the slab, repair cracks and spalls, then install epoxy and polyaspartic systems in garages, patios, shops and commercial buildings. Every quote follows an onsite inspection of your own concrete.',
    recommendation: {
      verdict:
        'Judge a coating company on how it talks about your slab, not on the resin it sells. Preparation is where these floors are won or lost, and it is the first thing cut when a price looks too good.',
      chooseWhen:
        'You want the floor inspected before it is quoted, the concrete mechanically ground rather than acid etched, and the number you are given in writing.',
      avoidWhen:
        'You need the cheapest possible surface change and do not mind redoing it. A rolled-on coating over unprepared concrete costs less today and comes up in sheets later.',
    },
  },

  garageCoatings: {
    question: 'What is a garage floor coating, and how is one installed?',
    quickAnswer:
      'A garage floor coating is a multi-layer resin system, not a paint. The slab is diamond ground to open the concrete, cracks and spalls are repaired, a pigmented epoxy base coat is applied, decorative flake is broadcast into it while wet, and a clear polyaspartic topcoat locks everything down and takes the wear.',
    recommendation: {
      verdict:
        'For a working residential garage in this climate, a flake system over a properly ground slab is the right default, and I recommend it more often than everything else combined.',
      chooseWhen:
        'The garage is used as a garage — vehicles, tools, foot traffic — and you want a floor that stays looking clean between cleanings and hides what concrete naturally does.',
      avoidWhen:
        'The slab has unresolved structural movement, or moisture testing shows significant vapor drive. Fix the cause first; a coating over either of those is money spent twice.',
    },
  },

  epoxyFlooring: {
    question: 'What does an epoxy flooring contractor actually do?',
    quickAnswer:
      'An epoxy flooring contractor prepares concrete and installs bonded resin systems onto it. The work is mostly preparation: grinding the slab, checking for moisture, repairing cracks and spalls, then applying base and topcoat layers in sequence. Anyone quoting a coating without describing how your concrete will be ground is quoting a different job.',
  },

  polyaspartic: {
    question: 'What is a polyaspartic coating, and why is it used as a topcoat?',
    quickAnswer:
      'Polyaspartic is an aliphatic polyurea used as the clear top layer of a floor system. Being aliphatic, it resists ultraviolet light, so it holds colour where an epoxy left on top would amber. It also cures quickly, which shortens return to service but narrows the window an installer has to work the material.',
    recommendation: {
      verdict:
        'Polyaspartic belongs on top of an epoxy base, not instead of it. A single-layer polyaspartic floor sold as an upgrade is usually a thinner floor at a higher price.',
      chooseWhen:
        'You want the wear and UV performance of a modern topcoat, or the space gets real sunlight — a sun-exposed patio, a garage that stands open all day.',
      avoidWhen:
        'Someone is offering it as a one-coat replacement for a full system. The fast cure is a workmanship demand, and in inexperienced hands it produces a worse floor than a slower product would.',
    },
  },

  flake: {
    question: 'What is a full-broadcast flake garage floor?',
    quickAnswer:
      'Vinyl chips thrown into a wet epoxy base coat until the surface will not accept more — the point of refusal — so the base coat is completely hidden. The cured flake layer is then scraped back, vacuumed, and sealed under a clear polyaspartic topcoat. A light scatter that leaves base coat showing is a cheaper, different floor.',
    recommendation: {
      verdict:
        'This is the system I specify most often for residential garages, and the single thing worth arguing about in a flake quote is whether the broadcast goes to refusal.',
      chooseWhen:
        'The garage is in daily use, the slab needed repair work you would rather not see, or you want texture underfoot instead of a slick surface.',
      avoidWhen:
        'You specifically want a seamless, mirror-flat finish. Flake is a texture; if that is not what you are after, a solid colour or metallic is the honest answer.',
    },
    suitability: {
      bestFor: [
        'Daily-use residential garages with vehicles and foot traffic',
        'Slabs that needed crack or spall repair — the blend disguises patch lines better than any other finish',
        'Households that want grip underfoot rather than a slick surface',
        'Anyone who would rather not see every footprint and tyre mark between cleanings',
      ],
      notFor: [
        'Rooms where a seamless, mirror-flat finish is the actual goal',
        'Slabs with untested or active moisture vapor transmission — that gets resolved first, whatever the finish',
        'Spaces needing a specific measured DCOF slip rating, which is specified with aggregate rather than assumed from flake texture',
      ],
    },
  },

  metallic: {
    question: 'What is a metallic epoxy floor?',
    quickAnswer:
      'A metallic epoxy floor uses reflective pigments suspended in clear resin, manipulated while wet to produce depth and movement that reads like polished stone. Every floor is unique and none can be reproduced exactly. It is a decorative finish first, and it shows dust and scuffing more readily than a flake floor does.',
    recommendation: {
      verdict:
        'Metallic is the right call when the floor is meant to be looked at rather than worked on. In a busy two-car garage it is a higher-maintenance choice than most people expect.',
      chooseWhen:
        'The room is a showroom, a display garage, a retail space or a feature area, and visual impact is the point.',
      avoidWhen:
        'The space is a working garage with tool chests, jack stands and grit tracked in. You will see every scuff, and the finish cannot be spot-repaired invisibly.',
    },
    suitability: {
      bestFor: [
        'Display and collector garages where the floor is part of the presentation',
        'Retail, showroom and office spaces wanting a seamless feature floor',
        'Anyone who wants a floor that is genuinely one of a kind',
      ],
      notFor: [
        'Working garages with heavy tool traffic, dragged equipment or tracked-in grit',
        'Owners who want a predictable, repeatable appearance — no two pours match',
        'Anyone unwilling to dust and damp mop more often than a flake floor needs',
      ],
    },
  },

  solidColor: {
    question: 'When is a solid colour epoxy floor the right choice?',
    quickAnswer:
      'A solid colour floor is a pigmented coating with no decorative broadcast — flatter, smoother and simpler than flake. It suits utility rooms, workshops and commercial spaces where a clean uniform surface matters more than disguising the slab. With no visual noise, it does show dust, tyre marks and repair lines more readily.',
    recommendation: {
      verdict:
        'Solid colour is the honest choice for utility spaces and the wrong one for a slab with visible repair history — there is nothing to hide a patch line behind.',
      chooseWhen:
        'You want a clean, uniform, easily inspected surface: a workshop, a laundry or utility room, a plant room, a commercial space needing clear line marking.',
      avoidWhen:
        'The slab has had crack or spall repair you would rather not see, or the room is a garage where dust and tyre marks will bother you.',
    },
  },

  commercial: {
    question: 'What is involved in a commercial epoxy floor installation?',
    quickAnswer:
      'Commercial work is scheduled around your operations rather than ours — often overnight or in phases so the space keeps running. The technical sequence matches residential work: grind, repair, base coat, topcoat. What differs is scale, specified tolerances, and requirements such as slip resistance and chemical exposure driving which system is used.',
  },

  warehouse: {
    question: 'What kind of coating suits a warehouse floor?',
    quickAnswer:
      'Warehouse floors are specified for traffic, not appearance. Forklift wheels, pallet drag and point loading drive the choice, along with how much downtime the operation can absorb. Joints and cracks are treated as their own step, line marking is designed in rather than added later, and slip resistance is specified by measured DCOF.',
  },

  patio: {
    question: 'Can concrete patios and pool decks be coated?',
    quickAnswer:
      'Yes, but the specification changes outdoors. Exterior slabs get full sun, standing water and bare feet, so a UV-stable topcoat is essential and slip resistance has to be built in rather than assumed. Drainage and how the slab was originally poured both matter considerably more outside than they do in a garage.',
    recommendation: {
      verdict:
        'Outdoors, slip resistance and UV stability are not upgrades — they are the specification. A garage build applied to a pool deck is the wrong floor in the wrong place.',
      chooseWhen:
        'You want a sealed, cleanable, non-slip surface on a sound exterior slab that drains properly.',
      avoidWhen:
        'The slab holds standing water, or has movement or drainage faults. Coating over a drainage problem traps it, and on a pool deck that is a safety issue rather than a cosmetic one.',
    },
  },

  removal: {
    question: 'How is a failed epoxy floor removed?',
    quickAnswer:
      'Mechanically. The old coating is ground off with diamond tooling until sound concrete is exposed, which also reveals why the previous floor failed — usually a slab that was never properly ground, or moisture that was never tested. That diagnosis matters, because a new system over the same unresolved cause fails the same way.',
    recommendation: {
      verdict:
        'The removal is straightforward; the diagnosis is the valuable part. If nobody tells you why the last floor failed, you are buying the same outcome again.',
      chooseWhen:
        'An existing coating is peeling, bubbling or delaminating, or you want a different system than what is currently down.',
      avoidWhen:
        'The existing floor is sound and only looks tired. In that case a recoat assessment is the cheaper starting point, and we will say so.',
    },
  },

  grinding: {
    question: 'Why does concrete have to be diamond ground before coating?',
    quickAnswer:
      'Because adhesion is mechanical. Resin has to lock into the open pore structure of the concrete, and a power-trowelled slab has a closed, weakly attached surface layer sitting on top of it. Grinding removes that layer and produces a consistent surface profile. Acid etching only textures the top of it, with inconsistent results.',
  },

  repair: {
    question: 'How are cracks and spalling in a garage floor repaired?',
    quickAnswer:
      'Before any coating goes down, as their own itemized step. Cracks are opened out, filled with a structural repair material and ground flush. Spalls are cut back to sound concrete and rebuilt level. Coating over damage does not fix it — the crack keeps moving with the slab and telegraphs through the finished floor.',
  },

  pricing: {
    question: 'What determines the cost of a garage floor coating?',
    /*
      NO FIGURES. This string is written to be lifted verbatim by an AI
      assistant, so an unconfirmed number here propagates off-site where we
      cannot correct it — the worst possible place for a price we are not
      standing behind. The question is deliberately "what determines the cost"
      rather than "what does it cost", and this answers that fully.

      Kept inside the 40-70 word guard in aeo.tsx.
    */
    quickAnswer:
      'Slab condition drives the cost more than floor area does. The largest factor is whether an existing coating must be ground off, followed by crack and spall repair, slab moisture, and the coating system chosen. Every quote follows an onsite inspection and is itemized in writing, with no payment due upfront.',
  },

  process: {
    question: 'How does a floor coating installation work, step by step?',
    quickAnswer:
      'An onsite inspection and moisture check first, then a written itemized quote. On install day the slab is diamond ground, cracks and spalls are repaired, the base coat goes down, flake is broadcast to refusal if specified, the floor is scraped and vacuumed, and a clear polyaspartic topcoat is applied.',
  },

  colors: {
    question: 'How do you choose a flake blend or floor colour?',
    /*
      Rewritten to stand alone. This previously opened "In the room the floor is
      going into..." — a fragment that only parses if the question is still
      attached, so quoted on its own it had no subject. It also said "We bring
      physical samples" without naming the company anywhere, leaving a lifted
      passage attributing the practice to nobody.

      Now it opens with an imperative that carries its own subject and names the
      company at the point the commitment is made.
    */
    quickAnswer:
      'Choose a flake blend in the room the floor is going into, under that room\u2019s own lighting. Blends read completely differently on a screen than under cool directional garage light, and room size changes how busy a mix looks. Houston Superior Epoxy brings physical samples to every estimate. Chip size, colour mix and broadcast density all affect material cost.',
  },
}
