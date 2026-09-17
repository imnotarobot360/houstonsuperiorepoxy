'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Heart, X } from 'lucide-react'
import { flakeBlends } from '@/lib/content/flake-blends'
import { SHORTLIST_MAX } from '@/lib/shortlist'
import { useShortlist } from './use-shortlist'

/*
  The shortlist summary on /colors/.

  POSITIONING IS LOAD-BEARING. components/mobile-call-bar.tsx is already fixed
  to bottom-0 at z-40 below lg, so this sits at bottom-14 to clear it and drops
  to bottom-0 from lg up where the call bar is hidden. Overlapping the Call now
  button would trade a colour-picking aid for a phone call, which is a bad deal
  in any direction.

  TWO LAYOUTS, AND THE MOBILE ONE IS THE CONSTRAINED CASE.

  Below lg: ONE ROW. Count, the blend names truncated to whatever fits, and the
  CTA. Stacked chips with their own remove buttons cost 148px here — roughly a
  quarter of an 812px phone screen, on top of the 53px call bar — which is a lot
  of viewport to spend summarising something the page behind it is already
  showing. Removal on mobile happens by tapping the same heart again in the
  grid, a thumb's reach away on the page this bar is pinned to.

  From lg up: the full chip list, each chip its own remove button. The room is
  there, the pointer is precise, and the grid may be scrolled far out of view.

  Renders NOTHING until something is saved, so the page is untouched for a
  visitor who never taps a heart — which is most of them.
*/
export function ShortlistBar() {
  const { slugs, count, hydrated, atCap, toggle } = useShortlist()
  const ref = useRef<HTMLDivElement>(null)

  /*
    Reserve space for the bar at the foot of the page.

    The bar is `fixed`, so it is out of flow and sits on top of whatever the
    page ends with. globals.css already pads the body by 64px to clear the
    mobile call bar; this ADDS the bar's own height on top, so the last section
    of /colors/ stays reachable instead of hiding under it.

    Measured rather than hardcoded because the height differs between the two
    layouts and changes as chips wrap on desktop. Restored on unmount, so
    navigating away leaves the body exactly as it was found.
  */
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const base = 64
    const apply = () => {
      document.body.style.paddingBottom = `${base + el.offsetHeight}px`
    }
    apply()

    /* Chips rewrap and the layout swaps at lg, both changing the height. */
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => {
      observer.disconnect()
      document.body.style.paddingBottom = ''
    }
  }, [count])

  /* `hydrated` guard: see the note in use-shortlist — never announce "0 saved". */
  if (!hydrated || count === 0) return null

  /* Ordered by the customer's picks, not by the catalogue's ordering. */
  const chosen = slugs
    .map((slug) => flakeBlends.find((b) => b.slug === slug))
    .filter((b): b is (typeof flakeBlends)[number] => Boolean(b))

  const names = chosen.map((b) => b.name).join(', ')

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Your blend shortlist"
      className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:bottom-0"
    >
      {/* ------------------------------------------------ mobile: one row */}
      <div className="flex items-center gap-3 px-5 py-3 lg:hidden">
        <p className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary">
          <Heart size={14} aria-hidden="true" fill="currentColor" />
          {/*
            The visible number is bare to save width; the screen-reader text
            restores the meaning, so this is never announced as a naked "4".
          */}
          <span aria-live="polite">
            {count}
            <span className="sr-only"> of {SHORTLIST_MAX} blends saved</span>
          </span>
        </p>

        {/*
          min-w-0 is what actually makes `truncate` work inside a flex row: a
          flex item defaults to min-width:auto and refuses to shrink below its
          content, so without it four blend names shove the CTA off the screen
          instead of ellipsing.

          At the cap this line carries the explanation in place of the names,
          which keeps the bar one row high rather than growing a second.
        */}
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {atCap ? `That is all ${SHORTLIST_MAX} — tap a heart to swap one out.` : names}
        </p>

        <Link
          href="/schedule/"
          data-analytics-cta="shortlist_to_estimate"
          className="flex shrink-0 items-center gap-1.5 bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Bring these
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {/* --------------------------------------- desktop: removable chips */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between gap-6 px-10 py-4 lg:flex">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-primary">
            <Heart size={12} aria-hidden="true" fill="currentColor" />
            <span aria-live="polite">
              {count} of {SHORTLIST_MAX} saved
            </span>
          </p>

          <ul className="mt-2 flex flex-wrap gap-2">
            {chosen.map((b) => (
              <li key={b.slug}>
                <button
                  type="button"
                  onClick={() => toggle(b.slug)}
                  aria-label={`Remove ${b.name} from your shortlist`}
                  className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {b.name}
                  <X size={11} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          {atCap ? (
            <p role="status" className="mt-2 text-xs text-muted-foreground">
              That is {SHORTLIST_MAX} — the most boards we bring to one estimate. Remove one to
              swap it out.
            </p>
          ) : null}
        </div>

        <Link
          href="/schedule/"
          data-analytics-cta="shortlist_to_estimate"
          className="flex shrink-0 items-center justify-center gap-2 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Bring these to my estimate
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
