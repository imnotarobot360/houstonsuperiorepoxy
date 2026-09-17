import type { FlakeBlend } from '@/lib/content/flake-blends'
import { flakeBaseColors, flakeTexture, hasTexture } from '@/lib/content/flake-textures.generated'

/*
  Every image and colour a blend has, in one place.

  WHY THIS EXISTS RATHER THAN MORE FIELDS ON FlakeBlend
  The schema a blend needs spans three sources that are maintained differently,
  and collapsing them into one hand-edited record would mean copying generated
  values by hand:

    sample image      hand-authored   lib/content/flake-blends.ts
    installed photo   hand-authored, OR derived from a published project
    seamless texture  GENERATED       scripts/build-flake-textures.mjs
    base coat colour  GENERATED       sampled from the manufacturer photograph

  A hex code pasted into flake-blends.ts would silently drift the moment the
  generator's sampling changes, and nothing would catch it. So the generated
  half stays generated and this function is the single place that assembles the
  full set — one import for any component that needs a blend's visuals.

  THE INSTALLED PHOTO IS NOT RESOLVED HERE, deliberately. It can come from a
  published project, and lib/content/projects reads from disk — importing it
  here would drag `node:fs` into every client component that wants a texture.
  Server pages resolve it and pass it down; see app/floor-designer/page.tsx.
*/

export type BlendVisuals = {
  name: string
  slug: string
  /** Manufacturer photograph of LOOSE FLAKE. A colour reference, never a floor. */
  sampleImage: string
  sampleAlt: string
  /** Seamless synthesised floor texture. 512px tile ≈ 4ft of slab. */
  seamlessTexture: string
  /** Pigmented base coat sampled from the blend, shown between the chips. */
  baseColor: string
  colorFamily: FlakeBlend['family']
  tone: FlakeBlend['tone']
  featured: boolean
  active: boolean
  /**
   * A real photograph of one of our floors in this blend, when the blend
   * itself carries one. Projects contribute this too, but only server-side —
   * see the note above.
   */
  installedPhoto?: FlakeBlend['installedPhoto']
}

/* Neutral ground for a blend added before its texture has been generated. */
const FALLBACK_BASE = '#4a4a4e'

export function blendVisuals(blend: FlakeBlend): BlendVisuals {
  return {
    name: blend.name,
    slug: blend.slug,
    sampleImage: blend.image,
    sampleAlt: blend.alt,
    seamlessTexture: flakeTexture(blend.slug),
    baseColor: hasTexture(blend.slug) ? flakeBaseColors[blend.slug] : FALLBACK_BASE,
    colorFamily: blend.family,
    tone: blend.tone,
    featured: blend.featured === true,
    /* Omitted means stocked — see the field note in flake-blends.ts. */
    active: blend.active !== false,
    installedPhoto: blend.installedPhoto,
  }
}
