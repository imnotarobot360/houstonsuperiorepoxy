'use client'

import type { FlakeBlend } from '@/lib/content/flake-blends'
import { blendVisuals } from '@/lib/content/blend-visuals'

/** A real installed floor, when one exists for this blend. */
export type InstalledPhoto = { src: string; alt: string; neighborhood: string }

/*
  The four tiles under the garage preview.

  WHAT EACH TILE IS, AND WHY THE LABELS MATTER
  Tile one is the manufacturer's photograph of LOOSE FLAKE. The other three are
  renderings built from the synthesised texture. They are different KINDS of
  image and the page says so on every tile, because a strip of four
  similar-looking squares where one is a photograph and three are renderings is
  exactly how a visitor ends up believing all four are photographs.

    1  Flake sample          real manufacturer photo of loose chips
    2  Installed / Close up  a real job photo when we have one, else a render
    3  Bright light          render, chips as they read in a well-lit bay
    4  One bulb              render, the same floor under a single fixture

  TILES 3 AND 4 ARE THE POINT OF THE STRIP. /colors/ states that the single most
  common colour regret is a dark blend chosen in good light and installed in a
  garage with one bulb. Putting those two side by side makes that comparison
  free and immediate, which is the whole argument for having a visualiser.

  Tile 2 prefers a REAL photograph. Stone Wash has one from the Cinco Ranch job;
  the other blends fall back to a render and are labelled as such. As real
  installed photos accumulate, this strip gets truer without any code change.
*/
export function FloorDetailStrip({
  blend,
  installed,
}: {
  blend: FlakeBlend
  installed?: InstalledPhoto
}) {
  const { baseColor: base, seamlessTexture: texture, sampleImage, sampleAlt } = blendVisuals(blend)

  /* Shared render styling — the coating system, flattened to a top-down view. */
  const render = (tilePx: number, filter?: string) => ({
    backgroundColor: base,
    backgroundImage: `url("${texture}")`,
    backgroundSize: `${tilePx}px ${tilePx}px`,
    backgroundRepeat: 'repeat' as const,
    filter,
  })

  const tiles: {
    key: string
    label: string
    kind: 'photo' | 'render'
    style: React.CSSProperties
    img?: { src: string; alt: string }
  }[] = [
    {
      key: 'sample',
      label: 'Flake sample',
      kind: 'photo',
      style: {},
      img: { src: sampleImage, alt: sampleAlt },
    },
    installed
      ? {
          key: 'installed',
          label: `Installed — ${installed.neighborhood}`,
          kind: 'photo',
          style: {},
          img: { src: installed.src, alt: installed.alt },
        }
      : {
          key: 'closeup',
          label: 'Close up',
          kind: 'render',
          /* Roughly standing over it, so chips read individually. */
          style: render(420),
        },
    {
      /*
        Wording matches the lighting toggle above the preview exactly ("Bright",
        "One bulb") so the pair is legible as the same choice, and so neither
        label wraps to a third line in a 78px tile on a phone.
      */
      key: 'bright',
      label: 'Bright',
      kind: 'render',
      style: render(150),
    },
    {
      key: 'dim',
      label: 'One bulb',
      kind: 'render',
      /* Matches the dim filter on the main preview so the pair is comparable. */
      style: render(150, 'brightness(0.44) saturate(0.9) contrast(1.03)'),
    },
  ]

  return (
    <ul className="grid grid-cols-4 gap-2 sm:gap-3">
      {tiles.map((t) => (
        <li key={t.key} className="flex flex-col gap-1.5">
          <div
            className="relative aspect-square overflow-hidden rounded-lg border border-border bg-card"
            style={t.img ? undefined : t.style}
          >
            {t.img ? (
              /*
                Plain <img>, not next/image: these are small, they swap on every
                colour change, and routing four of them through the optimizer on
                each click costs more than it saves at this size.
              */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={t.img.src}
                alt={t.img.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>
          {/*
            Name and qualifier on separate lines. Inline, "· preview" pushed the
            longer labels onto a third line at phone width and the four tiles
            went ragged; stacked, every tile is the same height.
          */}
          <span className="flex flex-col text-[0.6rem] uppercase leading-[1.35] tracking-[0.12em] text-muted-foreground">
            <span>{t.label}</span>
            {/*
              The one word that keeps the strip honest. A render sitting beside a
              photograph has to say which it is.
            */}
            {t.kind === 'render' ? <span className="opacity-60">preview</span> : null}
          </span>
        </li>
      ))}
    </ul>
  )
}
