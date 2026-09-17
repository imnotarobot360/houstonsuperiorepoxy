'use client'

import type { FlakeBlend } from '@/lib/content/flake-blends'

/*
  Stylized garage-floor preview.

  This is DELIBERATELY not photorealistic, and that is the honest choice, not a
  shortcut. The flake images are real manufacturer photos of LOOSE flake on a
  backlit screen (see lib/content/flake-blends.ts). A finished floor reads
  differently: the chips sit in a pigmented base coat under a clear topcoat, so
  the surface is slightly darker and calmer, and from standing height the chips
  look smaller. Rendering a photo-real "your floor" would imply a colour promise
  the medium cannot keep — so we render an obviously abstract room instead and
  tint the floor to approximate the base-plus-topcoat darkening.

  The lighting toggle is load-bearing, not decoration: /colors/ states the single
  most common colour regret is a dark blend in a poorly lit garage. Letting the
  visitor dim the room to "one bulb" surfaces that decision here, where it is
  free to change, instead of after installation.
*/
export function FloorPreview({
  blend,
  lighting,
}: {
  blend: FlakeBlend
  lighting: 'bright' | 'dim'
}) {
  const dim = lighting === 'dim'

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

          {/* Floor plane, laid back in perspective and tinted to read like a finished surface */}
          <div className="absolute inset-x-0 bottom-0 top-[44%] overflow-hidden">
            <div
              className="absolute left-1/2 top-0 h-[240%] w-[220%] -translate-x-1/2 transition-[background-image] duration-300"
              style={{
                transform: 'rotateX(64deg)',
                transformOrigin: 'top center',
                backgroundImage: `linear-gradient(rgba(8,8,10,0.42),rgba(8,8,10,0.42)), url("${blend.image}")`,
                backgroundSize: 'cover, 150px 150px',
                backgroundRepeat: 'no-repeat, repeat',
                backgroundPosition: 'center, center',
              }}
            />
          </div>

          {/* Topcoat gloss sweep */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 top-[44%]"
            style={{
              background:
                'linear-gradient(105deg, transparent 32%, rgba(255,255,255,0.10) 47%, transparent 63%)',
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

      <figcaption className="text-xs leading-relaxed text-muted-foreground text-pretty">
        Stylized preview to help you narrow down —{' '}
        <strong className="font-medium text-foreground">not a rendering of your finished floor</strong>.
        On a real floor the chips sit in a pigmented base under a clear topcoat, so the surface reads
        slightly darker and calmer than loose flake. Final color is chosen from physical sample boards
        on your own slab, under your own light.
      </figcaption>
    </figure>
  )
}
