'use client'

import type { FlakeBlend } from '@/lib/content/flake-blends'
import { flakeBaseColors, flakeTexture, hasTexture } from '@/lib/content/flake-textures.generated'

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
  scripts/build-flake-textures.mjs samples each manufacturer photograph for its
  real chip colours, then SYNTHESISES a broadcast floor from them: thousands of
  irregular chips scattered over a pigmented base, drawn to wrap at the tile
  edges. Seamless by construction, and flake scale is a number we chose (a
  quarter-inch chip at ~2.7px) rather than an accident of the photo's
  magnification. Verified: the wrap join measures SMOOTHER than two random
  interior columns of the same texture.

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
  Texture scale on screen.

  The tile is 512px standing in for 4ft of slab, so this is what sets apparent
  flake size at the FRONT of the floor. Perspective does the rest: the same tile
  compresses toward the back wall on its own, which is the gradient a real
  camera produces. Do not "fix" the back of the floor by adding bands — that was
  the old bug.
*/
/*
  512 is the tile's NATIVE size, deliberately, on two counts: the chips render
  at the 2.7px they were drawn at instead of being resampled soft, and the plane
  ends up standing in for roughly a single bay's width rather than an
  implausibly wide room. An earlier 300px value quietly stretched the plane to
  represent a 37-foot-wide garage, which is why the flake shrank to noise.

  This is a LEGIBILITY choice as much as a physical one, and worth being straight
  about: at the size this box actually renders, a strictly scaled quarter-inch
  chip would be under a pixel — accurate, and useless for choosing a colour. The
  caption says plainly that this is not a rendering of the finished floor.
*/
const TILE_PX = 512

export function FloorPreview({
  blend,
  lighting,
}: {
  blend: FlakeBlend
  lighting: 'bright' | 'dim'
}) {
  const dim = lighting === 'dim'

  /* Falls back to a neutral ground if a blend ships before its texture is built. */
  const base = hasTexture(blend.slug) ? flakeBaseColors[blend.slug] : '#4a4a4e'
  const texture = flakeTexture(blend.slug)

  return (
    <figure className="flex flex-col gap-3">
      <div
        className="relative aspect-[5/4] w-full overflow-hidden rounded-xl border border-border bg-[#0a0a0c]"
        style={{ perspective: '1150px' }}
      >
        <div
          className="absolute inset-0 transition-[filter] duration-500 ease-out"
          style={{ filter: dim ? 'brightness(0.42) saturate(0.9) contrast(1.03)' : 'brightness(1)' }}
        >
          {/* Back wall */}
          <div
            className="absolute inset-x-0 top-0 h-[44%]"
            style={{ background: 'linear-gradient(180deg,#27272c 0%,#1b1b20 100%)' }}
          />

          {/* Roll-up garage door on the back wall */}
          <div
            className="absolute left-1/2 top-[8%] h-[28%] w-[46%] -translate-x-1/2 rounded-t border border-black/40"
            style={{
              background:
                'repeating-linear-gradient(180deg,#34343b 0px,#34343b 9px,#292930 9px,#292930 18px)',
            }}
            aria-hidden
          />

          {/* Baseboard shadow where wall meets floor */}
          <div className="absolute inset-x-0 top-[43.4%] h-[1.6%] bg-black/55" aria-hidden />

          {/*
            THE FLOOR. Everything inside this box is clipped to it, which is what
            keeps coating off the walls, the door and the baseboard. When the
            real garage photograph lands, this box becomes a clip-path polygon
            traced to the slab and nothing else in the stack has to change.
          */}
          <div className="absolute inset-x-0 bottom-0 top-[44%] overflow-hidden">
            <div
              className="absolute left-1/2 top-0 h-[240%] w-[220%] -translate-x-1/2"
              style={{ transform: 'rotateX(64deg)', transformOrigin: 'top center' }}
            >
              {/* 1 — pigmented base coat, the ground the chips sit in */}
              <div
                className="absolute inset-0 transition-colors duration-300 ease-out"
                style={{ backgroundColor: base }}
              />

              {/*
                2 — the flake broadcast. ONE seamless layer is enough: the
                repetition problem was solved in the texture, not by stacking
                randomised copies here. Fewer layers also means switching colour
                costs one image swap on mobile.
              */}
              <div
                className="absolute inset-0 transition-opacity duration-300 ease-out"
                style={{
                  backgroundImage: `url("${texture}")`,
                  backgroundSize: `${TILE_PX}px ${TILE_PX}px`,
                  backgroundRepeat: 'repeat',
                }}
              />

              {/*
                3 — light falloff across the slab. Real garage light comes from
                the door and dies toward the back corners, so the floor is never
                evenly lit. Multiply keeps the chips visible through it rather
                than greying them out.
              */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(130% 80% at 50% 95%, rgba(255,255,255,0.16), transparent 55%),' +
                    'linear-gradient(0deg, rgba(6,6,8,0.05) 0%, rgba(6,6,8,0.55) 100%)',
                  mixBlendMode: 'multiply',
                }}
                aria-hidden
              />
            </div>
          </div>

          {/*
            4 — polyaspartic topcoat. A broad, very low-contrast sweep plus a
            slight deepening. Deliberately NOT a mirror and NOT wet-looking: a
            real satin topcoat returns a soft sheen, and anything stronger reads
            as water and hides the colour underneath, which is the one thing
            this preview exists to show.
          */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-[44%]"
            style={{
              background:
                'linear-gradient(101deg, transparent 26%, rgba(255,255,255,0.07) 46%, rgba(255,255,255,0.03) 56%, transparent 72%)',
            }}
            aria-hidden
          />

          {/* A single warm pool of light — reads as the "one bulb" garage when dimmed */}
          {dim && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 68% at 50% 26%, rgba(255,240,214,0.20), transparent 58%)',
              }}
              aria-hidden
            />
          )}
        </div>
      </div>

      {/*
        Disclaimer, kept but demoted. It has to stay — a preview that implies a
        colour promise the medium cannot keep is the failure mode this whole
        component is built to avoid — but it was competing with the thing it
        annotates. One emphasised line, the detail underneath at half attention.
      */}
      <figcaption className="text-xs leading-relaxed text-muted-foreground text-pretty">
        <span className="text-foreground">
          Preview shown for visualization to help you narrow down your color — not a rendering of
          your finished floor.
        </span>{' '}
        <span className="opacity-70">
          Actual appearance can vary based on lighting, concrete conditions, base-coat color, flake
          distribution, topcoat, and screen settings. Final color should be selected using physical
          sample boards.
        </span>
      </figcaption>
    </figure>
  )
}
