'use client'

import { useState } from 'react'
import { blendsByTone, type FlakeTone, toneGroups } from '@/lib/content/flake-blends'

/*
  Tone-first swatch picker. Tone (light/mid/dark) is the primary axis for the
  same reason /colors/ groups by it: the light-vs-dark call is the one most
  often regretted, so it is the first choice offered — not colour family.

  Selecting a swatch only changes the preview; it never commits anything. The
  swatch images are the same real manufacturer chip photos used on /colors/,
  carried here purely to drive the preview and the shortlist.
*/
export function BlendPicker({
  selectedSlug,
  onSelect,
}: {
  selectedSlug: string
  onSelect: (slug: string) => void
}) {
  const [tone, setTone] = useState<FlakeTone>('mid')
  const blends = blendsByTone(tone)

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Flake tone" className="flex gap-1 rounded-lg border border-border p-1">
        {toneGroups.map((g) => {
          const active = g.tone === tone
          return (
            <button
              key={g.tone}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTone(g.tone)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-card hover:text-foreground'
              }`}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
        {toneGroups.find((g) => g.tone === tone)?.note}
      </p>

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {blends.map((b) => {
          const selected = b.slug === selectedSlug
          return (
            <li key={b.slug}>
              <button
                type="button"
                onClick={() => onSelect(b.slug)}
                aria-pressed={selected}
                title={b.name}
                className={`group flex w-full flex-col gap-1.5 rounded-lg p-1 text-left transition-colors ${
                  selected ? 'bg-card' : 'hover:bg-card'
                }`}
              >
                <span
                  className={`relative block aspect-square overflow-hidden rounded-md border bg-cover bg-center ${
                    selected ? 'border-primary ring-2 ring-primary' : 'border-border'
                  }`}
                  style={{ backgroundImage: `url("${b.image}")` }}
                />
                <span className="truncate px-0.5 text-[0.7rem] font-medium leading-tight text-foreground">
                  {b.name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
