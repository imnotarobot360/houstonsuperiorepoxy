'use client'

import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { activeBlends } from '@/lib/content/flake-blends'

/*
  The colour picker: a horizontal rail of the REAL manufacturer samples.

  EVERY CARD IS A PHOTOGRAPH, not a generated swatch or an average colour. A
  blend is chosen on its chip mix — how much charcoal is in it, whether the tan
  reads warm — and a flat swatch of its mean colour throws away exactly the
  information the decision turns on. Two blends with the same average can look
  nothing alike.

  The rail replaced a wrapped grid of all 27. The grid was three rows deep, so
  the garage preview was pushed off-screen on a laptop and the customer could
  not see the floor change as they picked. A single scrolling row keeps the
  preview and the choice visible at once, which is the whole point of the page.
*/

export function ColorCarousel({
  selectedSlug,
  onSelect,
}: {
  selectedSlug: string
  onSelect: (slug: string) => void
}) {
  const railRef = useRef<HTMLUListElement>(null)
  const selectedRef = useRef<HTMLLIElement>(null)

  /*
    Keep the chosen card on screen when the selection changes from outside the
    rail — arrow keys, or a deep link. `nearest` rather than `center` so a click
    on a card that is already visible does not yank the rail around under the
    cursor.
  */
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [selectedSlug])

  return (
    <ul
      ref={railRef}
      /*
        snap-x with scroll-padding so a snapped card never sits half under the
        rounded edge of the container.
      */
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scroll-padding-inline:1rem] sm:mx-0 sm:px-0 sm:[scroll-padding-inline:0]"
    >
      {activeBlends.map((blend) => {
        const selected = blend.slug === selectedSlug
        return (
          <li
            key={blend.slug}
            ref={selected ? selectedRef : undefined}
            className="w-[7.5rem] shrink-0 snap-start sm:w-[8.5rem]"
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(blend.slug)}
              className="group flex w-full flex-col gap-2 text-left"
            >
              <span
                className={`relative block overflow-hidden rounded-xl border-2 transition-colors ${
                  selected ? 'border-primary' : 'border-transparent group-hover:border-border'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blend.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  width={136}
                  height={136}
                  className="block aspect-square w-full object-cover"
                />
                {selected && (
                  <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="flex flex-col">
                <span
                  className={`text-sm font-medium leading-tight ${
                    selected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  {blend.name}
                </span>
                <span className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                  {blend.family}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
