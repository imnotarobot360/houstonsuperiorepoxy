'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { META_PIXEL_ID, metaEnabled } from '@/lib/meta-events'

/*
  Loads the Meta Pixel and reports PageView, mirroring components/ga4.tsx.

  `strategy="afterInteractive"` keeps fbevents.js off the critical path so it
  cannot delay LCP — a lead funnel must never feel slow because of a tag.

  Renders nothing when NEXT_PUBLIC_META_PIXEL_ID is unset, so an unconfigured
  environment ships zero Pixel script and zero Meta cookies. Conversions
  (Lead / Schedule / QualifiedLead) are fired from the funnel with a shared
  eventID and mirrored server-side via the Conversions API for dedup — see
  lib/meta-events.ts and lib/meta.ts.
*/
export function MetaPixel() {
  const pathname = usePathname()

  /*
    Never track /admin — same reasoning as GA4: the owner's own lead-inbox
    visits are not ad traffic, and its per-lead controls could otherwise
    manufacture events.
  */
  const isAdmin = pathname?.startsWith('/admin') ?? false

  /* The init `track('PageView')` covers the first view; skip it once here. */
  const seenFirst = useRef(false)

  useEffect(() => {
    if (!metaEnabled || isAdmin) return
    if (!seenFirst.current) {
      seenFirst.current = true
      return
    }
    /* App Router client navigations don't reload fbevents.js — send PageView by hand. */
    window.fbq?.('track', 'PageView')
  }, [pathname, isAdmin])

  if (!metaEnabled || isAdmin) return null

  return (
    <Script id="meta-pixel-init" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${META_PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  )
}
