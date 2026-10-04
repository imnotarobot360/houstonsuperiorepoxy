'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { FlakeBlend } from '@/lib/content/flake-blends'
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

export function SelectedColor({ blend }: { blend: FlakeBlend }) {
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

      <SaveFavourite slug={blend.slug} name={blend.name} />
    </div>
  )
}

/*
  What the previewed floor actually is.

  The visitor has just chosen a colour, which is the decorative layer and the
  thinnest part of the decision. This names the three layers under it and the
  warranty over it, so the choice reads as a system rather than a swatch.

  IT RENDERS BELOW THE COLOUR RAIL, NOT IN THE COLUMN BESIDE THE PREVIEW. It
  lived in that column first and cost 357px there on a phone, pushing the
  colour picker — the only thing this page exists to do — 377px further down,
  about half a screen. Measured against main: rail top 1588 -> 1965 at 375px.
  Nothing on this page may come between the preview and the picker.

  So it reads as a footnote to the choice rather than a precondition for it,
  and because it now spans the full width it lays the layers out across the
  row instead of down it.

  Layer names come from lib/content/system.ts rather than being typed here:
  they are factual claims about the installed product and they also render in
  the cross-section on the service pages, so there is exactly one copy.
*/
export function SystemSummary() {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 sm:p-6">
      <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Your Houston Superior Epoxy system
      </p>
      <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {systemLayers.map((l) => (
          <div key={l.step} className="flex flex-col gap-1">
            <dt className="text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
              {l.step}
            </dt>
            <dd className="text-sm leading-snug text-foreground text-pretty">{l.name}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground text-pretty">
        <Link href={r('warranty')} className="font-medium text-foreground underline underline-offset-4">
          {SYSTEM_WARRANTY}
        </Link>{' '}
        on qualifying installations, subject to the written terms.
      </p>
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
