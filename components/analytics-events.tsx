'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { type AnalyticsEvent, captureAttribution, track } from '@/lib/analytics'

/*
  Named CTAs that carry their own event, keyed by the value of
  data-analytics-cta on (or around) the link.

  Same reasoning as the delegated listeners below: tagging the markup with an
  attribute keeps the components that render these CTAs server-rendered, where
  an onClick handler would force each of them into a client component for the
  sake of one analytics call.

  `satisfies` ties every value to the AnalyticsEvent union, so a typo here is a
  compile error rather than a silently mis-named event in GA4.
*/
const CTA_EVENTS = {
  preview_floor: 'preview_floor_click',
  catalog: 'catalog_click',
  shortlist_to_estimate: 'shortlist_to_estimate',
} as const satisfies Record<string, AnalyticsEvent>

/*
  Site-wide analytics listeners.

  Uses ONE delegated listener on the document rather than an onClick on every
  CTA. That is a deliberate architectural choice:

  - Phone and SMS links appear in the utility bar, header, hero, CTA bands,
    footer and the sticky mobile bar. Wiring each by hand means editing every
    component, and silently under-reporting the moment someone adds a new CTA.
  - Delegation covers links that do not exist yet, including any rendered by
    future components, with no further work.

  Because the listener reads `href`, it cannot drift out of sync with what the
  link actually does.
*/

/*
  Human-readable location for an element, so reporting can distinguish the
  header phone number from the sticky bar one. Prefers an explicit
  data-analytics-location, then falls back to the nearest landmark.
*/
function locationOf(el: HTMLElement): string {
  const explicit = el.closest('[data-analytics-location]')
  if (explicit instanceof HTMLElement) {
    return explicit.dataset.analyticsLocation ?? 'unknown'
  }
  if (el.closest('header')) return 'header'
  if (el.closest('footer')) return 'footer'
  if (el.closest('form')) return 'form'
  const section = el.closest('section[id]')
  if (section instanceof HTMLElement && section.id) return section.id
  return 'body'
}

export function AnalyticsEvents() {
  const pathname = usePathname()

  /*
    /admin is excluded entirely. The lead inbox renders a `tel:` "Call" button
    for every lead, and the delegated listener below reports a phone click as a
    CONVERSION. Without this guard, the owner working through their own inbox
    would generate a fake conversion per lead — corrupting exactly the numbers
    used to judge ad spend.
  */
  const isAdmin = pathname?.startsWith('/admin') ?? false

  useEffect(() => {
    if (isAdmin) return
    /*
      Record ad attribution as early as possible. The visitor typically lands
      on a URL carrying gclid/utm parameters and submits the form several pages
      later, by which point those parameters are gone.
    */
    captureAttribution()

    /* ------------------------------------------------ contact link clicks */
    const onClick = (e: MouseEvent) => {
      const target = e.target
      if (!(target instanceof Element)) return

      const link = target.closest('a')
      if (!(link instanceof HTMLAnchorElement)) return

      const href = link.getAttribute('href') ?? ''
      const where = locationOf(link)

      if (href.startsWith('tel:')) {
        track('phone_click', { location: where, link_url: href })
        return
      }
      if (href.startsWith('sms:')) {
        track('sms_click', { location: where, link_url: href })
        return
      }
      if (href.startsWith('mailto:')) {
        track('email_click', { location: where, link_url: href })
        return
      }

      /*
        Gallery interaction.

        Note the site currently has no before/after slider — the project list
        is empty and the gallery renders labeled placeholder slots. So this
        tracks the gallery links that genuinely exist (project cards and the
        "see photos on Google" link) rather than inventing engagement with a
        widget that is not there. When a real before/after component ships, tag
        it with data-analytics-gallery and it is covered automatically.
      */
      /*
        Named CTA clicks (see CTA_EVENTS above). Checked before the gallery
        branch because a tagged CTA is the more specific match, and an unknown
        attribute value is ignored rather than guessed at — an event name that
        does not exist in the contract must never reach GA4.
      */
      const cta = link.closest('[data-analytics-cta]')
      if (cta instanceof HTMLElement) {
        const key = cta.dataset.analyticsCta
        const event = key ? CTA_EVENTS[key as keyof typeof CTA_EVENTS] : undefined
        if (event) {
          track(event, { location: where, link_url: href })
          return
        }
      }

      const gallery = link.closest('[data-analytics-gallery]')
      if (gallery instanceof HTMLElement) {
        track('gallery_interact', {
          location: where,
          interaction: gallery.dataset.analyticsGallery || 'link',
          link_url: href,
        })
      }
    }

    /* ------------------------------------------------------- scroll depth */
    /*
      Only 50% and 90%, each fired once per page. Firing on every threshold on
      every scroll event would flood GA4 and hit event quotas without adding
      information.
    */
    const reached = new Set<number>()
    let queued = false

    const measure = () => {
      queued = false
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return
      const percent = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100

      for (const threshold of [50, 90]) {
        if (percent >= threshold && !reached.has(threshold)) {
          reached.add(threshold)
          track('scroll_depth', { percent_scrolled: threshold })
        }
      }
    }

    /*
      rAF-throttled: scroll fires far more often than once per frame, and doing
      layout reads on every event is exactly how a smooth page starts to jank.
    */
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(measure)
    }

    document.addEventListener('click', onClick, true)
    window.addEventListener('scroll', onScroll, { passive: true })
    measure() // a short page may already be past 50%

    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isAdmin])

  return null
}
