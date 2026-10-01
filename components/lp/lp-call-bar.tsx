import { Phone } from 'lucide-react'
import { site } from '@/lib/site'

/*
  The landing page's own pinned bar, and deliberately NOT the site-wide
  MobileCallBar.

  Two things make the shared one wrong here. It sends its second half to
  /schedule, and this is paid traffic on a chromeless funnel whose entire
  premise is that the only exits are the phone and the estimator on the page —
  a link to another route is a leaked click. And it says "Call now" rather than
  the number, which is exactly the problem this bar exists to fix.

  WHAT IT FIXES: below sm the header's number is sr-only (there is no room for
  it beside the logo and the CTA at 375px), the page has no footer, and nothing
  else on the page prints the phone number. So a visitor on a phone could see
  a 16px handset glyph and no way to read or dial the number short of tapping
  a target smaller than a fingertip. The number is spelled out here instead of
  hidden behind an icon.

  Hidden from sm up because the header shows the full number there, and two
  copies of it on one screen is just clutter.

  No spacer is needed: the root layout already reserves pb-16 below lg, which
  is more than this bar's height.
*/
export function LpCallBar() {
  return (
    <div
      /*
        Tells the delegated tracker this tap came from the LP bar rather than
        the LP header, which is the only other phone affordance on the page.
      */
      data-analytics-location="lp_call_bar"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-background/95 backdrop-blur-md sm:hidden"
    >
      <a
        href={site.phoneHref}
        className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-foreground"
      >
        <Phone size={16} aria-hidden="true" />
        {site.phone}
      </a>
      {/*
        Same-page jump, so the funnel is never left. The estimator section
        carries scroll-mt-24 to clear the fixed header on arrival.
      */}
      <a
        href="#estimate"
        className="flex items-center justify-center bg-primary py-4 text-sm font-semibold text-primary-foreground"
      >
        Get my estimate
      </a>
    </div>
  )
}
