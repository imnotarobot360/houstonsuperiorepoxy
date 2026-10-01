'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { FlakeBlend } from '@/lib/content/flake-blends'
import type { InstalledLighting } from '@/lib/content/blend-visuals'
import { useShortlist } from '@/components/shortlist/use-shortlist'
import { SYSTEM_WARRANTY, systemLayers } from '@/lib/content/system'
import { r } from '@/lib/routes'

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
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Your selection
        </p>
        <h2 className="mt-1.5 font-serif text-3xl leading-none tracking-tight text-foreground">
          {blend.name}
        </h2>
        <p className="mt-1.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-primary">
          {blend.family} · {blend.tone}-tone
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Flake sample
        </p>
        {/*
          The manufacturer's photograph of the loose flake. Not cropped to a
          swatch: the chip mix IS the product, and shrinking it too far hides
          the small accent chips that tell one blend from its neighbour.

          THE CAP IS RESPONSIVE BECAUSE THE COLUMN IS. On desktop this sits in
          a 35% column where 15rem is proportionate. On a phone that column
          goes full width and the cap did not, so the sample rendered 240px
          tall against a 222px garage preview — the supporting detail came out
          LARGER than the product shot it supports, which is the wrong way
          round on the one screen where you cannot see both at once.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={blend.image}
          alt={blend.alt}
          width={240}
          height={240}
          className="w-full max-w-[10rem] rounded-xl border border-border object-cover sm:max-w-[15rem]"
        />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{blend.blurb}</p>

      <LightingToggle lighting={lighting} onLighting={onLighting} />

      <SystemSummary />

      <SaveFavourite slug={blend.slug} name={blend.name} />
    </div>
  )
}

/*
  What the previewed floor actually is.

  The visitor has just chosen a colour, which is the decorative layer and the
  thinnest part of the decision. This names the three layers under it and the
  warranty over it, so the choice reads as a system rather than a swatch.

  Layer names come from lib/content/system.ts rather than being typed here:
  they are factual claims about the installed product and they also render in
  the cross-section on the service pages, so there is exactly one copy.
*/
function SystemSummary() {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Your Houston Superior Epoxy system
      </p>
      <dl className="mt-4 space-y-2.5">
        {systemLayers.map((l) => (
          <div key={l.step} className="flex gap-3 text-sm leading-snug">
            <dt className="w-20 shrink-0 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
              {l.step}
            </dt>
            <dd className="text-foreground text-pretty">{l.name}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
        <Link href={r('warranty')} className="font-medium text-foreground underline underline-offset-4">
          {SYSTEM_WARRANTY}
        </Link>{' '}
        on qualifying installations, subject to the written terms.
      </p>
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
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
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
              className={`flex-1 rounded-md px-3 py-3 text-xs font-medium transition-colors ${
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
