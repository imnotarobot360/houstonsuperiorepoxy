'use client'

import { Info } from 'lucide-react'
import type { FlakeBlend } from '@/lib/content/flake-blends'
import { blendVisuals } from '@/lib/content/blend-visuals'
import { FloorDetailStrip, type InstalledPhoto } from './floor-detail-strip'
import { GarageScene } from './garage-scene'

/*
  Garage floor preview.

  WHAT WAS WRONG, because it explains every decision below.

  The floor used to be a 1429x306 plane tiling the 1200px LOOSE-FLAKE MACRO
  PHOTO at 150px — roughly twenty repeats. Three problems compounded:

    1. The source is the wrong subject. Those images are loose chips on a
       backlit screen, not a floor.
    2. The source is the wrong scale. A macro shot squeezed to 150px reads as
       fist-sized stone, so the floor looked like terrazzo.
    3. Twenty repeats of a high-contrast photo produce findable clusters, and
       perspective made it worse by compressing the seams into bands toward the
       back wall — which is what read as vertical panels.

  WHAT REPLACED IT
  scripts/build-flake-textures.mjs QUILTS a floor out of the manufacturer
  photograph itself — many small pieces of the real sample, mirrored and turned,
  joined along minimum-error cuts so the boundaries wander around chips instead
  of across them. Seamless by construction, and flake scale is a number we chose
  rather than an accident of the photo's magnification.

  An intermediate version synthesised chips from the sample's colour histogram
  instead, and it is worth knowing why that failed: the colours were right and
  the material was gone. A blend's character is in its chip shapes and size
  distribution, and a histogram keeps none of it, so every blend rendered as the
  same grey static in a different tint. Nothing here invents pixels any more.

  So the layer stack here is the coating system, bottom up:

    pigmented base coat  ->  flake broadcast  ->  light/shadow  ->  topcoat

  STILL A STYLIZED ROOM, DELIBERATELY, FOR NOW. The walls and door are abstract
  because the honest photoreal alternative — compositing onto a real garage —
  needs a photograph of BARE CONCRETE that does not exist yet. Stock and
  generated imagery are both out under this site's content rules. When that
  photo arrives, the floor stack below drops onto it unchanged: only the scene
  and the floor's clip polygon change.

  The lighting toggle is load-bearing, not decoration: /colors/ states the single
  most common colour regret is a dark blend in a poorly lit garage. Letting the
  visitor dim the room surfaces that decision here, where it is free to change.
*/

/*
  TEXTURE SCALE ON SCREEN — half of the scale decision, and the half that lives
  here. The other half is CHIP_PX in scripts/build-flake-textures.mjs, which
  fixes how many chips a tile holds (~82). This says how much screen that tile
  occupies, so together they set apparent flake size.

  Set as a CSS variable rather than an inline style because it has to cross a
  breakpoint, and it has to cross one: the plane is sized as a PERCENTAGE of the
  preview box, so a fixed pixel tile would stand in for a different amount of
  real slab at every screen width, and a blend would read coarser on a phone
  than on a desktop. The two values keep the apparent floor the same.

  WHY THESE ARE LARGER THAN PHYSICALLY CORRECT, which they unambiguously are.
  One tile is about 1.7ft of slab. Laid strictly to scale across a 20ft bay it
  would come out near 120px, and a quarter-inch chip would land at 1.4px — which
  is what the previous 140px value did, and why the floor arrived as grey static.
  Accurate, and useless for choosing a colour.

  150px is the working value, and it has to be read together with the 3.6x
  near-to-far magnification the perspective now supplies (see PERSPECTIVE in
  garage-scene.tsx). That lands chips at roughly:

    at the door      1.8px    merged into the blend, as they should be
    in the foreground  6px    unmistakably decorative flake

  A single number cannot do that; a number plus a real perspective gradient can,
  which is why fixing the flat projection mattered more than any tile value.

  Worth noting 150 is close to the 140 this had before, and that the material
  changed rather than the number: a tile now holds 82 real chips instead of 193
  synthesised ones, so a chip is more than twice the size at the same tile.

  Never "fix" the back of the floor by adding bands. The gradient is the
  projection's job.
*/
const TILE_VAR = '[--tile:95px] sm:[--tile:150px]'

export function FloorPreview({
  blend,
  lighting,
  installed,
  heading,
}: {
  blend: FlakeBlend
  lighting: 'bright' | 'dim'
  /* A real installed floor for this blend, when one has been published. */
  installed?: InstalledPhoto
  /*
    Rendered BETWEEN the garage panel and the detail strip.
    
    A slot rather than baked-in markup because the order is the point: panel,
    then what you are looking at, then the samples, then the caveat. The blend
    name belongs directly under the thing it names, and the lighting toggle
    belongs beside it — but both are the designer's state, so the designer
    supplies them and this component just guarantees the position.
  */
  heading?: React.ReactNode
}) {
  const dim = lighting === 'dim'

  /* One accessor for the blend's whole visual set — see lib/content/blend-visuals. */
  const { baseColor: base, seamlessTexture: texture } = blendVisuals(blend)

  return (
    <figure className="flex flex-col gap-3">
      <GarageScene
        baseColor={base}
        texture={texture}
        dim={dim}
        tileClass={TILE_VAR}
      />

      {/*
        Blend name, tone and the lighting toggle — supplied by the designer so
        this component does not own its state. The "Installed floor preview"
        label that satisfies req 13 lives in there as the eyebrow, directly
        above the name, which is where someone reads it.
      */}
      {heading}

      {/* Sample, a real installed floor where we have one, and the lighting pair. */}
      <FloorDetailStrip blend={blend} installed={installed} />

      {/*
        Disclaimer, kept but demoted into its own quiet panel. It has to stay — a
        preview that implies a colour promise the medium cannot keep is the
        failure mode this whole component exists to avoid — but as running text
        it competed with the thing it annotates. Boxed and set at a smaller size,
        it reads as a footnote, which is what it is.
      */}
      <figcaption className="flex gap-3 rounded-lg border border-border bg-card/40 p-4">
        <Info size={15} aria-hidden className="mt-px shrink-0 text-primary" />
        <span className="text-xs leading-relaxed text-muted-foreground text-pretty">
          <span className="font-medium text-foreground">
            Preview shown for visualization to help you narrow down your color.
          </span>{' '}
          This is not a rendering of your finished floor. Actual appearance can vary based on
          lighting, concrete conditions, base-coat color, flake distribution, topcoat, and screen
          settings. Final color should be selected using physical sample boards on your own slab.
        </span>
      </figcaption>
    </figure>
  )
}
