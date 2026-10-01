/*
  The installed system, named once.

  These four strings were already published in components/system-buildup.tsx,
  which is the cross-section graphic on the service pages. They are now needed
  in a second place — the floor designer's "your system" summary — and a
  product name that disagrees with itself across two pages is the same class of
  problem as a warranty term that does, which is why lib/content/specs.ts keeps
  its constants in one place too.

  PRODUCT NAMES ARE FACTUAL CLAIMS about what gets installed on a customer's
  slab. Do not add, rename or version one here without owner confirmation, and
  do not add performance figures beside them — dry film thickness, cure times
  and resistance ratings come from the current technical data sheet for the
  exact product, which is why this file carries names and nothing else.
*/
export const systemLayers = [
  { step: 'Preparation', name: 'Diamond-ground concrete' },
  { step: 'Base coat', name: 'Citadel SLE-100 epoxy base coat' },
  { step: 'Broadcast', name: 'Vinyl flake, broadcast to refusal' },
  { step: 'Topcoat', name: 'Polyaspartic F61 clear topcoat' },
] as const

/*
  The warranty line that accompanies the system wherever it is summarised.

  Scoped to qualifying residential garage installations on purpose: the floor
  designer only ever previews a garage, but this string is importable and the
  scope has to travel with it. See the category split in lib/content/specs.ts.
*/
export const SYSTEM_WARRANTY = 'Limited Lifetime residential workmanship warranty'
