'use client'

import { useEffect } from 'react'
import {
  INSTALLED_PREVIEW_SIZE,
  type InstalledLighting,
  type InstalledPhoto,
  previewSrc,
  previewSrcSet,
} from '@/lib/content/blend-visuals'

/*
  The garage preview. One finished image, displayed.

  THIS COMPONENT DOES NOT MAKE A FLOOR. It does not composite, tile, mask,
  project, light, tint or filter anything. The coating was applied offline by
  scripts/build-installed-previews.mjs onto one locked master photograph, and
  what arrives here is a complete picture of a finished garage. Selecting a
  colour swaps which file the `src` points at. That is the whole mechanism.

  WHAT WAS HERE BEFORE, AND WHY NONE OF IT IS:

    a tiled flake texture on a CSS 3D plane      -> baked into the image
    a runtime mask clipping it to the slab       -> baked into the image
    a soft-light lighting layer                  -> baked into the image
    a screen-blended specular layer              -> deleted outright
    a brightness() filter for the dim state      -> deleted outright
    two <img> layers crossfading                 -> collapsed to one

  The crossfade was the last thing to go and the least harmful — it faded
  between two complete pictures rather than assembling either — but it meant two
  garage images stacked in the DOM, and "there is exactly one image here" is
  worth more than a 240ms fade. Neighbouring colours are prefetched below, so
  the swap is a cache hit and lands in a single frame anyway.

  There is no CSS here that alters the picture: no filter, no mix-blend-mode, no
  transform, no opacity, no overlay. Anything of that kind appearing in this
  file again should be treated as a bug.

  WHAT THE IMAGE MAY BE MADE OF. As of 18 Sep 2026 these previews are PERMITTED
  to be AI-generated (owner decision; CONTENT-POLICY.md), but none is — every
  one is composited onto the locked master by
  scripts/build-installed-previews.mjs. What does not change either way is what
  this component claims about them: the badge reads "Installed floor preview",
  the caption says colour varies and is confirmed against physical samples, and
  a real photograph of a real job outranks the render whenever one exists — see
  `realPhoto` below, which flips the badge to "Real Houston installation".

  Those three things are why showing a hypothetical floor here is honest. If a
  future change drops the badge, softens the caption, or lets a render outrank a
  photograph, it has quietly turned a visualization into a claim about work we
  have done, which is a different thing and is not permitted.
*/

type Neighbours = { prev?: string; next?: string }

export function InstalledPreview({
  slug,
  name,
  lighting,
  neighbours,
  realPhoto,
  showReal,
  onToggleReal,
}: {
  slug: string
  name: string
  lighting: InstalledLighting
  neighbours: Neighbours
  /** A photograph of a floor we actually installed in this blend, when one exists. */
  realPhoto?: InstalledPhoto
  showReal: boolean
  onToggleReal: (next: boolean) => void
}) {
  const real = Boolean(realPhoto && showReal)
  const src = real ? realPhoto!.src : previewSrc(slug, lighting)
  const srcSet = real ? undefined : previewSrcSet(slug, lighting)
  const alt = real
    ? realPhoto!.alt
    : `A two-car garage with its floor finished in the ${name} flake blend, viewed from the back wall toward the closed door.`

  /*
    Warm the colours either side in the rail. No DOM, no layers — just asking
    the browser to have the next likely file in cache. Through srcset and sizes,
    so a phone warms the phone-sized rendition rather than the desktop one.
  */
  useEffect(() => {
    const targets = [neighbours.prev, neighbours.next]
      .filter((s): s is string => Boolean(s))
      .map((s) => ({ src: previewSrc(s, lighting), srcSet: previewSrcSet(s, lighting) }))
      .filter((t): t is { src: string; srcSet: string | undefined } => Boolean(t.src))
    const timer = window.setTimeout(() => {
      for (const t of targets) {
        const img = new Image()
        if (t.srcSet) img.srcset = t.srcSet
        img.sizes = '(min-width: 1024px) 62vw, 100vw'
        img.src = t.src
      }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [neighbours.prev, neighbours.next, lighting])

  if (!src) return null

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {/*
          width/height are the master's own, so the browser reserves the right
          box from the markup and the page never jumps as the image decodes.
          h-auto keeps the natural aspect ratio at every width — the floor is
          never cropped.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          srcSet={srcSet}
          sizes="(min-width: 1024px) 62vw, 100vw"
          alt={alt}
          width={INSTALLED_PREVIEW_SIZE.width}
          height={INSTALLED_PREVIEW_SIZE.height}
          decoding="async"
          className="block h-auto w-full"
        />

        {/* Label only. It sits beside the picture, never over the floor. */}
        <p className="absolute bottom-3 left-3 rounded-md bg-background/85 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur-sm">
          {real ? 'Real Houston installation' : 'Installed floor preview'}
        </p>

        {/*
          Only offered when there is a real photograph to offer. A toggle with
          one option is noise, and most blends have no photograph yet.
        */}
        {realPhoto && (
          <div className="absolute right-3 top-3 flex gap-1 rounded-lg border border-border bg-background/85 p-1 backdrop-blur-sm">
            {[
              { v: true, label: 'Real install' },
              { v: false, label: 'Demo garage' },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={showReal === o.v}
                onClick={() => onToggleReal(o.v)}
                className={`rounded-md px-2.5 py-1 text-[0.7rem] font-medium transition-colors ${
                  showReal === o.v
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <figcaption className="text-xs leading-relaxed text-muted-foreground text-pretty">
        Preview is for visualization only. Actual color may vary with lighting, concrete conditions,
        application, and screen settings. Final color is confirmed using physical samples.
      </figcaption>
    </figure>
  )
}
