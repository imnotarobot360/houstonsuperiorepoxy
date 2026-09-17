'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  readShortlist,
  SHORTLIST_EVENT,
  SHORTLIST_KEY,
  SHORTLIST_MAX,
  toggleShortlist,
} from '@/lib/shortlist'

/**
 * Shared shortlist state for every component on the page.
 *
 * STARTS EMPTY ON PURPOSE, THEN FILLS IN AN EFFECT. The server has no access to
 * localStorage, so rendering the saved list during the first client render
 * would produce markup that disagrees with the server's and React would throw a
 * hydration mismatch. Reading it in an effect costs one paint where the hearts
 * are briefly unfilled — the honest price for a static page that knows
 * something only the browser knows.
 *
 * `hydrated` is exposed so callers can hold back anything whose empty state
 * would be actively misleading, like a bar announcing "0 blends saved" to
 * someone who saved three yesterday.
 */
export function useShortlist() {
  const [slugs, setSlugs] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)
  /* Set when an add is refused at the cap, so the UI can explain why. */
  const [atCap, setAtCap] = useState(false)

  useEffect(() => {
    setSlugs(readShortlist())
    setHydrated(true)

    /*
      Two listeners because they cover different cases and neither covers both:
      `storage` fires only in OTHER tabs, so it keeps a second tab honest;
      SHORTLIST_EVENT fires in THIS tab, so the hearts and the bar agree.
    */
    const onLocal = () => setSlugs(readShortlist())
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHORTLIST_KEY) setSlugs(readShortlist())
    }

    window.addEventListener(SHORTLIST_EVENT, onLocal)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(SHORTLIST_EVENT, onLocal)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const toggle = useCallback((slug: string) => {
    const { slugs: next, rejected } = toggleShortlist(slug)
    setSlugs(next)
    setAtCap(rejected)
    /* Clear the cap warning shortly after, so it reads as a response to the tap. */
    if (rejected) window.setTimeout(() => setAtCap(false), 4000)
    return !rejected
  }, [])

  return {
    slugs,
    hydrated,
    atCap,
    count: slugs.length,
    isFull: slugs.length >= SHORTLIST_MAX,
    has: useCallback((slug: string) => slugs.includes(slug), [slugs]),
    toggle,
  }
}
