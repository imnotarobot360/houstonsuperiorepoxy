'use client'

import { usePathname } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { MobileCallBar } from '@/components/mobile-call-bar'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { UtilityBar } from '@/components/utility-bar'
import { siteGraph } from '@/lib/schema'

/*
  The public site's header, footer, call bar and LocalBusiness JSON-LD — all
  suppressed on /admin AND on the /lp Meta Ads funnel.

  Why this exists: the root layout renders the chrome around every route, and a
  nested app/admin/layout.tsx renders inside it, so it cannot remove it. The
  textbook fix is a (marketing) route group, but that means moving ~25 route
  folders; this is the same result in one small client component.

  What is wrong with marketing chrome on the lead inbox:
  - A "Get a Free Estimate" CTA above the owner's own lead list is noise.
  - The fixed mobile call bar covers the leads on a phone, which is exactly
    where the owner reads them.
  - Emitting LocalBusiness structured data from a noindexed private page is
    pointless at best.

  Why /lp is also chromeless: a paid-traffic landing page must not leak clicks
  to site navigation — the spec is explicit that only the logo, phone and the
  primary CTA appear. The funnel renders its own minimal header, so the shared
  site header/footer/call bar would be competing exits. It carries its own
  JSON-LD needs too, so the site-wide LocalBusiness graph is not wanted here.

  Splitting top/bottom keeps `children` inside <main> in the root layout, so
  document order and landmark structure are unchanged for the public site.
*/
function useIsChromeless() {
  const pathname = usePathname()
  return (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/lp') ||
    /* The instant-estimate paid LP renders its own minimal header, same as /lp. */
    pathname?.startsWith('/garage-floor-estimator-houston') ||
    false
  )
}

export function MarketingChromeTop() {
  if (useIsChromeless()) return null

  return (
    <>
      {/*
        The Organization, LocalBusiness, WebSite and logo entities, declared
        once for the whole site. Pages add their own WebPage / Service /
        Article nodes in a second script and reference these by @id, so a
        crawler sees one business rather than one per URL.
      */}
      <JsonLd data={siteGraph} />
      <UtilityBar />
      <SiteHeader />
    </>
  )
}

/*
  The floor designer pins its own bar on phones, carrying the chosen colour and
  the way on to the estimate. Two fixed bars would take about a hundred pixels
  off the bottom of the one page whose whole job is scrolling a rail of colours,
  so the site-wide one stands down here. Nothing is lost: the designer's bar
  keeps the same reach, and the header's phone number is a tap away.

  The FOOTER still renders — this is about the fixed bar only, which is why the
  check is separate from useIsChromeless above.
*/
function useHidesCallBar() {
  const pathname = usePathname()
  return pathname?.startsWith('/floor-designer') ?? false
}

export function MarketingChromeBottom() {
  /* Both hooks run before any early return, so the order never changes. */
  const chromeless = useIsChromeless()
  const hidesCallBar = useHidesCallBar()
  if (chromeless) return null

  return (
    <>
      <SiteFooter />
      {!hidesCallBar && <MobileCallBar />}
    </>
  )
}
