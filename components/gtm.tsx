'use client'

import Script from 'next/script'

/*
  Google Tag Manager container (spec item 7).

  Self-disabling exactly like <GA4> and <MetaPixel>: renders nothing unless
  NEXT_PUBLIC_GTM_ID is set, so an unconfigured environment ships zero GTM
  script and zero cookies. When set, GTM loads afterInteractive so it never
  delays LCP on the ad landing page.

  GA4 and the Meta Pixel here fire directly (not through GTM) so tracking works
  with or without a container. If the owner prefers to manage tags in GTM
  instead, the container can own them and the direct tags can be removed — the
  event names pushed to dataLayer via lib/analytics are already GTM-friendly.

  `dataLayer` is initialised before the container script so no early event is
  lost, and the same object is shared with gtag (see components/ga4.tsx).
*/
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? ''
const gtmEnabled = GTM_ID.length > 0

export function GoogleTagManager() {
  if (!gtmEnabled) return null
  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
    </>
  )
}

/* The <noscript> fallback iframe, rendered immediately after <body> opens. */
export function GoogleTagManagerNoscript() {
  if (!gtmEnabled) return null
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  )
}
