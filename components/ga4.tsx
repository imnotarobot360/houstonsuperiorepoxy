'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { GA_MEASUREMENT_ID, analyticsEnabled } from '@/lib/analytics'

/*
  Loads GA4 and reports page views.

  `strategy="afterInteractive"` keeps gtag.js off the critical path — it loads
  after the page is interactive, so it cannot delay LCP. Analytics must never
  be the reason a landing page feels slow.

  Renders nothing at all when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset, so an
  unconfigured environment ships zero third-party script and zero cookies.
*/
export function GA4() {
  const pathname = usePathname()

  /*
    Never track /admin. The lead inbox is the owner's own internal tool, and
    counting their visits as site traffic pollutes the very reports used to
    judge whether the marketing site is working. Worse, the inbox renders a
    `tel:` "Call" button per lead, and the delegated listener in
    <AnalyticsEvents> treats a phone click as a CONVERSION — so an owner
    working through their leads would manufacture fake conversions.
  */
  const isAdmin = pathname?.startsWith('/admin') ?? false

  /*
    The gtag `config` call already reports the first page view. Skipping the
    first pathname effect avoids counting the landing page twice, which would
    inflate every page and skew bounce rate.
  */
  const seenFirst = useRef(false)

  useEffect(() => {
    if (!analyticsEnabled || isAdmin) return
    if (!seenFirst.current) {
      seenFirst.current = true
      return
    }
    /*
      App Router client navigations do not reload gtag.js, so subsequent page
      views must be sent by hand or the whole site looks like a one-page visit.
    */
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname, isAdmin])

  if (!analyticsEnabled || isAdmin) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname
          });
        `}
      </Script>
    </>
  )
}
