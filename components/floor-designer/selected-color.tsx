'use client'

import { Heart } from 'lucide-react'
import type { FlakeBlend } from '@/lib/content/flake-blends'
import type { InstalledLighting } from '@/lib/content/blend-visuals'
import { useShortlist } from '@/components/shortlist/use-shortlist'

/*
  The column beside the garage: what has been chosen, and the physical thing it
  refers to.

  THE SAMPLE IS THE LARGEST ELEMENT HERE ON PURPOSE. The garage preview sells
  the floor; the sample is what the customer is actually buying and what the
  crew will bring to the door on a board. It used to be one of four small tiles
  in a strip below the preview, alongside three renders of the same blend at
  different scales and brightnesses — which meant the one photograph on the page
  competed with three pictures of itself. The strip is gone.
*/

export function SelectedColor({
  blend,
  lighting,
  onLighting,
}: {
  blend: FlakeBlend
  lighting: InstalledLighting
  onLighting: (l: InstalledLighting) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Your selection
        </p>
        <h2 className="mt-1.5 font-serif text-3xl leading-none tracking-tight text-foreground">
          {blend.name}
        </h2>
        <p className="mt-1.5 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-primary">
          {blend.family} · {blend.tone}-tone
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Flake sample
        </p>
        {/*
          The manufacturer's photograph of the loose flake, shown large. Not
          cropped to a swatch: the chip mix IS the product, and squeezing it
          below about 180px starts hiding the small accent chips that make one
          blend different from its neighbour.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={blend.image}
          alt={blend.alt}
          width={240}
          height={240}
          className="w-full max-w-[15rem] rounded-xl border border-border object-cover"
        />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{blend.blurb}</p>

      <LightingToggle lighting={lighting} onLighting={onLighting} />

      <SaveFavourite slug={blend.slug} name={blend.name} />
    </div>
  )
}

/*
  The lighting control.

  LOAD-BEARING, NOT DECORATION. /colors/ states that the single most common
  colour regret is a dark blend in a badly lit garage, so letting the visitor
  drop the lights surfaces that decision here, where changing your mind is free.
  A dark blend SHOULD look bad under one bulb — that is the information.

  Each state is its own pre-rendered image, never a filter over the lit one. The
  filter version multiplied the finished panel by 0.46 in sRGB and crushed the
  floor to near black, taking the blend with it; the dim exposure is now picked
  in linear light by sweeping it and measuring, in build-installed-previews.mjs.
*/
function LightingToggle({
  lighting,
  onLighting,
}: {
  lighting: InstalledLighting
  onLighting: (l: InstalledLighting) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Garage lighting
      </p>
      <div role="group" aria-label="Preview lighting" className="flex gap-1 rounded-lg border border-border p-1">
        {(
          [
            ['bright', 'Bright'],
            ['one-bulb', 'One bulb'],
          ] as const
        ).map(([value, label]) => {
          const active = value === lighting
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onLighting(value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/*
  The shortlist toggle, as a full-width labelled control rather than the bare
  icon used on the /colors/ grid. There it sits on one of 27 cards and has to be
  compact; here it is the only one on the page, so it can say what it does.

  Shares useShortlist with the grid, so a blend hearted here is already hearted
  on /colors/ and rides along to the lead — see lib/shortlist.ts.
*/
function SaveFavourite({ slug, name }: { slug: string; name: string }) {
  const { has, toggle, isFull, hydrated } = useShortlist()
  const saved = has(slug)
  const blocked = !hydrated || (isFull && !saved)

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => toggle(slug)}
        disabled={blocked}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
          saved
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-foreground hover:border-primary hover:text-primary'
        } ${blocked && !saved ? 'cursor-not-allowed opacity-40 hover:border-border hover:text-foreground' : ''}`}
      >
        <Heart size={15} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
        {saved ? `${name} saved` : 'Save to favorites'}
      </button>
      {hydrated && isFull && !saved && (
        <p className="text-xs text-muted-foreground">
          Shortlist is full — remove one to add another.
        </p>
      )}
    </div>
  )
}
