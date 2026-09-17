'use client'

import { Heart } from 'lucide-react'
import { useShortlist } from './use-shortlist'

/*
  The heart on a blend card.

  A REAL <button>, not a div with a click handler. It is keyboard reachable,
  it announces its pressed state, and it works before any JavaScript-driven
  styling arrives. `aria-pressed` is the correct role here rather than a
  checkbox: this is a toggle on an existing thing, not a form input.

  The label names the blend ("Save Coyote to your shortlist") because a screen
  reader user tabbing a grid of 27 hearts hears the label alone — twenty-seven
  identical "Save" buttons would be useless.
*/
export function BlendHeart({ slug, name }: { slug: string; name: string }) {
  const { has, toggle, isFull, hydrated } = useShortlist()
  const saved = has(slug)

  /*
    Before hydration nothing is saved as far as this component knows, so the
    button is inert rather than showing a confidently-wrong empty heart that
    flips a moment later. It stays visible to hold its space — hiding it would
    shift the card as the grid hydrates.
  */
  const blocked = !hydrated || (isFull && !saved)

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={blocked}
      aria-pressed={saved}
      aria-label={
        saved
          ? `Remove ${name} from your shortlist`
          : isFull
            ? `Shortlist is full — remove a blend before adding ${name}`
            : `Save ${name} to your shortlist`
      }
      title={
        saved ? `Remove ${name}` : isFull ? 'Shortlist is full (4 max)' : `Save ${name}`
      }
      className={`flex size-9 shrink-0 items-center justify-center border transition-colors ${
        saved
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
      } ${blocked && !saved ? 'cursor-not-allowed opacity-40 hover:border-border hover:text-muted-foreground' : ''}`}
    >
      <Heart size={15} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
    </button>
  )
}
