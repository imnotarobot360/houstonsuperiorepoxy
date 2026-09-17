import { activeBlends, type FlakeBlend } from '@/lib/content/flake-blends'
import {
  hasInstalledPreview,
  installedPreview,
  installedPreviewSrcSet,
  INSTALLED_PREVIEW_SIZE,
  type InstalledLighting,
} from '@/lib/content/installed-previews.generated'

/*
  Every image a blend has, in one place.

  THE INSTALLED FLOOR IS NO LONGER ASSEMBLED AT RUNTIME. It is a flat image
  rendered offline by scripts/build-installed-previews.mjs, composited onto one
  locked master photograph so that nothing but the coating differs between
  colours. The browser's whole job is to swap an `<img>`.

  That is why this file is now mostly lookups. The interesting decisions — the
  perspective, the filtering, the lighting, the colour fidelity gate — all
  happen at build time where they can be verified once and then trusted.

  THE THREE SOURCES a blend draws on, maintained differently:

    sample photograph   hand-authored   lib/content/flake-blends.ts
    real installation   hand-authored, or derived from a published project
    installed preview   GENERATED       scripts/build-installed-previews.mjs

  A REAL PHOTOGRAPH ALWAYS WINS. A rendered preview is a sales aid; a photograph
  of a floor this company actually installed is evidence. When a blend has one,
  it leads and the render becomes the secondary view.
*/

export type { InstalledLighting }

export type InstalledPhoto = NonNullable<FlakeBlend['installedPhoto']>

export type BlendVisuals = {
  id: string
  slug: string
  name: string
  family: FlakeBlend['family']
  tone: FlakeBlend['tone']
  description: string

  /** Manufacturer photograph of LOOSE FLAKE. The colour reference, never a floor. */
  sampleImage: string
  sampleAlt: string

  /** Pre-rendered installed floor. Null only if a texture was added without a rerun. */
  installedPreview: string | null

  featured: boolean
  active: boolean
  sortOrder: number
}

/*
  Position in the curated order of lib/content/flake-blends.ts, which is grouped
  light -> mid -> dark. Derived rather than stored as a field on each blend: a
  hand-kept sortOrder is a second copy of information the array already carries,
  and the two drift the first time someone reorders the list.
*/
const order = new Map(activeBlends.map((b, i) => [b.slug, i]))

export function blendVisuals(blend: FlakeBlend): BlendVisuals {
  const rendered = hasInstalledPreview(blend.slug)
  return {
    id: blend.slug,
    slug: blend.slug,
    name: blend.name,
    family: blend.family,
    tone: blend.tone,
    description: blend.blurb,
    sampleImage: blend.image,
    sampleAlt: blend.alt,
    installedPreview: rendered ? installedPreview(blend.slug, 'bright') : null,
    featured: blend.featured === true,
    /* Omitted means stocked — see the field note in flake-blends.ts. */
    active: blend.active !== false,
    sortOrder: order.get(blend.slug) ?? Number.MAX_SAFE_INTEGER,
  }
}

/** Largest rendition, for `src`. */
export function previewSrc(slug: string, lighting: InstalledLighting) {
  return hasInstalledPreview(slug) ? installedPreview(slug, lighting) : null
}

/** Responsive set, so a phone never downloads the desktop rendition. */
export function previewSrcSet(slug: string, lighting: InstalledLighting) {
  return hasInstalledPreview(slug) ? installedPreviewSrcSet(slug, lighting) : undefined
}

export { INSTALLED_PREVIEW_SIZE, hasInstalledPreview }
