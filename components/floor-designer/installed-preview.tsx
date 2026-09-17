'use client'

import { useEffect, useRef, useState } from 'react'
import {
  INSTALLED_PREVIEW_SIZE,
  type InstalledLighting,
  type InstalledPhoto,
  previewSrc,
  previewSrcSet,
} from '@/lib/content/blend-visuals'

/*
  The garage preview: one flat, pre-rendered image per blend and lighting state.

  THERE IS NO FLOOR BEING BUILT HERE ANY MORE. The previous version composited
  the coating live — a tiled texture on a CSS 3D plane, masked, with two
  blend-mode layers over it — and the result was at the mercy of how a given
  browser chose to filter a minified background image. It aliased into static.

  Now the whole component is a crossfade between two <img> elements. Everything
  that decides what the floor looks like happened at build time, in
  scripts/build-installed-previews.mjs, where the filtering is a real mipmap
  pyramid and the result can be checked once and then relied on.

  WHY TWO IMAGES AND NOT ONE WITH A CHANGING src. Swapping the src of a single
  <img> shows the previous frame until the new file decodes, then snaps. With a
  pair, the incoming image is decoded off-screen at opacity 0 and only fades up
  once it is ready, so switching colours never flashes the old floor, a
  half-painted one, or empty space.
*/

const FADE_MS = 240

/*
  Neighbours in the carousel, fetched quietly as soon as the current one is up.
  Only these two: 27 blends x 2 lighting states at full resolution is far more
  than a phone should be asked to pull on page load, and the overwhelmingly
  common next action is a step to an adjacent colour.
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
  const src = realPhoto && showReal ? realPhoto.src : previewSrc(slug, lighting)
  const srcSet = realPhoto && showReal ? undefined : previewSrcSet(slug, lighting)

  const alt =
    realPhoto && showReal
      ? realPhoto.alt
      : `A two-car garage with its floor finished in the ${name} flake blend, viewed from the back wall toward the closed door.`

  /*
    Ping-pong layers. `front` is whichever layer is currently visible; a change
    loads into the other one and they swap when it has decoded.

    EACH LAYER CARRIES ITS OWN srcSet, not just its src. Handing the srcSet only
    to the current layer looks like a saving and is the opposite: the outgoing
    layer then has nothing but the plain `src`, which is the largest rendition,
    so it re-resolves and downloads the 1536 copy of an image it is about to
    stop showing. On a phone that is a megabyte of pure waste per colour change.
  */
  type Layer = { src: string; srcSet?: string }
  const [layers, setLayers] = useState<[Layer | null, Layer | null]>([
    src ? { src, srcSet } : null,
    null,
  ])
  const [front, setFront] = useState(0)
  const [ready, setReady] = useState(true)
  const current = useRef(src)

  useEffect(() => {
    if (src === current.current) return
    current.current = src
    if (!src) return

    const back = front === 0 ? 1 : 0
    const img = new Image()
    /* Let the browser pick the same rendition it would for the real element. */
    if (srcSet) img.srcset = srcSet
    img.sizes = '(min-width: 1024px) 62vw, 100vw'
    img.src = src

    let cancelled = false
    const show = () => {
      if (cancelled) return
      setLayers((l) => {
        const next: [Layer | null, Layer | null] = [...l]
        next[back] = { src, srcSet }
        return next
      })
      setFront(back)
      setReady(true)
    }

    setReady(false)
    if (img.decode) img.decode().then(show).catch(show)
    else if (img.complete) show()
    else {
      img.onload = show
      img.onerror = show
    }
    return () => {
      cancelled = true
    }
  }, [src, srcSet, front])

  /*
    Quietly warm the adjacent colours once the current one is settled.

    THE PRELOAD GOES THROUGH srcset TOO. Setting `src` alone fetches the 1536
    rendition, because that is what the plain URL points at — so a phone
    speculatively pulled two desktop-sized images it would never display, which
    is worse than not preloading at all. Giving the throwaway Image the same
    srcset and sizes as the real element makes the browser resolve it exactly as
    it will when the colour is actually chosen, so the warmed file is the one
    that gets used.
  */
  useEffect(() => {
    if (!ready) return
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
  }, [ready, neighbours.prev, neighbours.next, lighting])

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[#0a0a0c]">
        {/*
          The box is reserved from the master's own dimensions, so the page does
          not shift while the first image decodes.
        */}
        <div
          style={{ aspectRatio: `${INSTALLED_PREVIEW_SIZE.width} / ${INSTALLED_PREVIEW_SIZE.height}` }}
        >
          {layers.map((layer, i) =>
            layer ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={i}
                src={layer.src}
                srcSet={layer.srcSet}
                sizes="(min-width: 1024px) 62vw, 100vw"
                alt={i === front ? alt : ''}
                aria-hidden={i === front ? undefined : true}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-opacity ease-out"
                /*
                  CORRECTNESS IS THE z-INDEX, NOT THE FADE. The front layer is
                  always stacked above the outgoing one, so the right image is
                  on top the instant they swap. The opacity transition is
                  polish: if a browser throttles or skips it — which happens on
                  a backgrounded tab, and under reduced-motion — the worst case
                  is a hard cut rather than the previous colour sitting on top
                  of the new one, which is what a fade-only version did.
                */
                style={{
                  opacity: i === front ? 1 : 0,
                  zIndex: i === front ? 2 : 1,
                  transitionDuration: `${FADE_MS}ms`,
                }}
              />
            ) : null,
          )}
        </div>

        {/*
          Badge — says what this is without writing across the picture.

          z-10 because the image layers above carry explicit z-indexes to fix
          their own stacking order, and a positioned sibling with `auto` would
          otherwise paint underneath them.
        */}
        <p className="absolute bottom-3 left-3 z-10 rounded-md bg-background/85 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-foreground backdrop-blur-sm">
          {realPhoto && showReal ? 'Real Houston installation' : 'Installed floor preview'}
        </p>

        {/*
          Only offered when there is a real photograph to offer. A toggle with
          one option is noise, and on most blends there is no photograph yet.
        */}
        {realPhoto && (
          <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-lg border border-border bg-background/85 p-1 backdrop-blur-sm">
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

      {/*
        One line, not a panel. The previous boxed version was the second-largest
        thing on the page and read as a warning about the product rather than a
        note about the picture.
      */}
      <figcaption className="text-xs leading-relaxed text-muted-foreground text-pretty">
        Preview is for visualization only. Actual color may vary with lighting, concrete conditions,
        application, and screen settings. Final color is confirmed using physical samples.
      </figcaption>
    </figure>
  )
}
