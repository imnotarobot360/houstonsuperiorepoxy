'use client'

/*
  The photoreal garage, with the coating composited onto its slab.

  HOW THIS WORKS, bottom to top:

    1  the photograph            walls, door, cabinets, step — never changes
    2  pigmented base coat       projected in perspective
    3  flake broadcast           same projection, laid back to match the camera
    4  the photo's own light     greyscale, blurred, soft-light over the coating
    5  the clear coat's specular returns, screened back in

  Layers 2-5 sit in one container and are masked together, once.

  PROJECTION AND CLIPPING ARE TWO DIFFERENT QUESTIONS. This file used to answer
  both with a single clip-path polygon, and it could not answer either well:

    where is the coating VISIBLE   -> FLOOR_MASK, a per-pixel PNG
    how is the material PROJECTED  -> PROJECTION, a plane laid back in 3D

  A four-point polygon cannot describe this floor's boundary. It steps in and
  out around the cabinet footprint, the workbench toe kick, two runs of
  baseboard at different heights, the garage-door threshold and the concrete
  steps on the right — so a polygon either cut through those objects or left
  bare slab showing beside them. The mask is traced from the photograph itself
  at build time; see scripts/build-garage-mask.mjs for how, and why by hand for
  the steps. The projection no longer has to compromise to double as a boundary.

  If the photograph is ever replaced, these are the things to re-derive: the
  mask, the light maps, and the projection's tilt. Nothing else here is
  scene-specific.
*/

/*
  Every layer is 3:2, as is the frame, so each one fills it exactly and they
  stay in register. Do not introduce a layer of another aspect ratio: the
  cover/contain difference would slide the mask off the photograph by a few
  pixels, which along the baseboard is the whole margin there is.
*/
const FLOOR_MASK = '/images/designer/garage-floor-mask.png'

const MASK_STYLE = {
  maskImage: `url("${FLOOR_MASK}")`,
  WebkitMaskImage: `url("${FLOOR_MASK}")`,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
} as const

/*
  The material's projection: a plane tipped away from the camera so the flake
  runs finer toward the door, as it does in any real photograph of a floor.

  THE PLANE MUST OVERSHOOT THE FRAME, BY A LOT. The tilt about the TOP edge
  collapses the plane's projected height to a fraction of its CSS height. At
  bottom-[-20%] it reached only ~70% of the way down the panel and
  the foreground fell back to the bare photograph — which read as the coating
  washing out to white near the camera. -300% covers the frame with room to
  spare, and the excess costs nothing because the mask removes it.
*/
const PROJECTION = 'absolute inset-x-[-60%] bottom-[-300%] top-[44%]'
const PROJECTION_TRANSFORM = { transform: 'rotateX(74deg)', transformOrigin: 'top center' } as const

/*
  THE PERSPECTIVE HAS TO SIT ON THE PLANE'S OWN PARENT.

  It used to be declared on the outermost frame, which looks right and does
  nothing: `filter` on the dimming wrapper in between creates a containing block
  and FLATTENS the 3D context, so the plane never received it. rotateX then
  squashed the texture vertically with no foreshortening at all — the chips came
  out the same size at the door as under the camera, roughly half a pixel each,
  and averaged into the flat pale sheet that made the floor read as painted on.

  Declared here it reaches the plane, and the material recedes the way the room
  does: coarse in the foreground, fine at the door.

  600px, AND THE 74-DEGREE TILT ABOVE, ARE BOTH ABOUT THE STRENGTH OF THAT
  GRADIENT. Measured across the visible floor, the near-to-far magnification is:

    1100px / 70deg    1.7x     material reads uniformly busy, wall to wall
     600px / 74deg    2.6x
     450px / 76deg    3.6x     foreground overshoots back into gravel

  A real garage, from three feet in front of the camera to the door twenty-five
  feet away, is more like 6-8x, and 2.6 is well short of that ON PURPOSE. Two
  reasons, and the second is the binding one:

    the rest of the frame is a real photograph with fixed geometry, and pushing
    the plane harder starts to visibly disagree with it

    magnification accelerates toward the near edge, so the last quarter of the
    floor gets most of it. At 3.6x the foreground had gone back to reading as
    gravel — the exact overcorrection this was trying to escape.

  What 2.6 buys is the thing that was missing entirely: chips you can make out
  in the foreground that have clearly merged into the blend by the door.
*/
const PERSPECTIVE = { perspective: '600px' } as const

export function GarageScene({
  baseColor,
  texture,
  dim,
  tileClass,
}: {
  baseColor: string
  texture: string
  dim: boolean
  /* Responsive tile size, supplied as a CSS variable — see FloorPreview. */
  tileClass: string
}) {
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-border bg-[#0a0a0c]">
      <div
        className="absolute inset-0 transition-[filter] duration-500 ease-out"
        style={{ filter: dim ? 'brightness(0.46) saturate(0.92) contrast(1.04)' : 'brightness(1)' }}
      >
        {/* 1 — the photograph. Fixed; only the floor below it ever changes. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/designer/garage-scene-1152.webp"
          srcSet="/images/designer/garage-scene-768.webp 768w, /images/designer/garage-scene-1152.webp 1152w, /images/designer/garage-scene-1536.webp 1536w"
          sizes="(min-width: 1024px) 52vw, 100vw"
          alt="A clean, empty two-car garage with bare concrete, photographed from the back wall toward the closed door."
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/*
          Everything below is masked to the slab, once, as a group.

          MASKED HERE AND NOWHERE ELSE. Masking each layer separately would
          composite four feathered edges on top of each other, and the boundary
          would darken into a visible outline where they overlapped.
        */}
        <div className={`absolute inset-0 ${tileClass}`} style={{ ...MASK_STYLE, ...PERSPECTIVE }}>
          {/* 2 + 3 — base coat and broadcast, on the projected plane. */}
          <div className={PROJECTION} style={PROJECTION_TRANSFORM}>
            <div
              className="absolute inset-0 transition-colors duration-300 ease-out"
              style={{ backgroundColor: baseColor }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("${texture}")`,
                backgroundSize: 'var(--tile) var(--tile)',
                backgroundRepeat: 'repeat',
              }}
            />
          </div>

          {/*
            4 — the scene's own light, blended back over the coating. Without
            this the floor is a flat sticker; with it the blend picks up the
            garage's highlights, reflections and falloff for free.

            SOFT-LIGHT, NOT MULTIPLY. Multiply can only darken, so it flattened
            the floor into an evenly dim sheet and threw away the very thing
            worth keeping — the bright pool near the camera and the four soft
            reflections under the door. Soft-light treats mid-grey as neutral
            and pushes from there, so the map darkens the corners AND lifts the
            highlights, which is what the original photograph actually does.

            HELD AT 30%. At full strength this did not light the material, it
            erased it: the bright middle of the slab flattened the flake into
            white and the blend became unreadable in exactly the part of the
            floor the eye goes to first. The lighting should influence the
            material and be felt rather than seen.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/designer/garage-light.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
            style={{ mixBlendMode: 'soft-light' }}
          />

          {/*
            5 — the clear coat's specular return, added rather than blended.

            This is the "+ clearCoatHighlights" half of the model: the light map
            above shades the floor, and this puts back the bright pool near the
            camera and the four soft reflections the door throws down the slab.
            Screen adds light and leaves everything below the map's threshold
            untouched, so it lifts the highlights without washing the colour.

            Kept at 15%, down from 55%. A real polyaspartic returns a soft
            sheen; at 55% this read as standing water, and combined with an
            over-gained map it put a white blob in the middle of the floor and
            hid the blend underneath — the one thing this preview exists to
            show. Low specular, medium roughness, which is what the product
            actually looks like.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/designer/garage-highlight.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-15"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
      </div>
    </div>
  )
}
