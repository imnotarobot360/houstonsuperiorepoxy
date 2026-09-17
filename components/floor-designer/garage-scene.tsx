'use client'

/*
  The photoreal garage, with the coating composited onto its slab.

  HOW THIS WORKS, bottom to top:

    1  the photograph            walls, door, cabinets, step — never changes
    2  pigmented base coat       clipped to the floor polygon
    3  flake broadcast           same clip, laid back in perspective
    4  the photo's own light     greyscale, blurred, multiplied over the coating
    5  satin topcoat sheen

  LAYER 4 IS WHAT SELLS IT. Compositing an evenly-lit texture onto a photograph
  reads as a sticker every time, because real floors are never evenly lit. So
  the scene's own luminance is extracted at build time
  (scripts-side: greyscale -> heavy blur -> normalise) and multiplied back over
  whatever blend is selected. The blur is the point: it keeps the lighting — the
  bright pool in the foreground, the four soft reflections under the door, the
  falloff into both back corners — and discards the bare concrete's speckle,
  which would otherwise print itself through every blend.

  THE CLIP POLYGON IS THE OTHER HALF. Traced to the slab and nothing else, so
  coating never reaches the cabinets, the workbench, the door, the grey
  baseboards, the wall panel, or the concrete step on the right. It tucks a few
  pixels UNDER the baseboard and door on purpose: overlapping by a hair is
  invisible, whereas falling short leaves a bare grey sliver that reads as a bad
  masking job.

  If the photograph is ever replaced, these are the two things to re-derive —
  the polygon and the light map. Nothing else here is scene-specific.
*/

/*
  Floor polygon, as percentages of the frame. Verified against the photograph by
  overlay before being written down; see the note above about tucking under.
*/
const FLOOR_CLIP =
  'polygon(0% 54.5%, 15% 48.9%, 29.2% 45.2%, 70% 45%, 86% 45.8%, 89.8% 46.2%, 89.8% 56.2%, 100% 58.8%, 100% 100%, 0% 100%)'

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
    <div
      className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-border bg-[#0a0a0c]"
      style={{ perspective: '1100px' }}
    >
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

        {/* Everything below is clipped to the slab. */}
        <div className={`absolute inset-0 ${tileClass}`} style={{ clipPath: FLOOR_CLIP }}>
          {/* 2 + 3 — base coat and broadcast, laid back to match the camera. */}
          {/*
            THE PLANE MUST OVERSHOOT THE FRAME, BY A LOT.

            rotateX(70deg) about the TOP edge tips the plane away from the
            camera, so its projected height collapses to roughly a third of its
            CSS height. At bottom-[-20%] it reached only ~70% of the way down
            the panel and the foreground fell back to the bare photograph —
            which read as the coating washing out to white near the camera.
            -300% covers the frame with room to spare; the excess is clipped.
          */}
          <div
            className="absolute inset-x-[-60%] bottom-[-300%] top-[44%]"
            style={{ transform: 'rotateX(70deg)', transformOrigin: 'top center' }}
          >
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
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/designer/garage-light.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ mixBlendMode: 'soft-light' }}
          />

          {/*
            5 — satin topcoat. Low contrast on purpose: a real polyaspartic
            returns a soft sheen, and anything stronger reads as standing water
            and hides the colour this preview exists to show.
          */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(101deg, transparent 24%, rgba(255,255,255,0.055) 46%, rgba(255,255,255,0.025) 58%, transparent 74%)',
            }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}
