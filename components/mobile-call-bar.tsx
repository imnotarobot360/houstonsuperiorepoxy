import Link from 'next/link'
import { Phone } from 'lucide-react'
import { site } from '@/lib/site'
import { r } from '@/lib/routes'

export function MobileCallBar() {
  return (
    <>
      {/*
        The bar is fixed, so it is out of flow and would otherwise sit on top
        of whatever the page ends with. This spacer reserves exactly the bar's
        height — py-4 (32) + text-sm's 20px line box + the 1px top border —
        and carries the bar's own breakpoint.

        It lives here rather than as padding on <body> because the site has
        four different fixed bars of three different heights, and a single
        number on the layout could only ever be right for one of them.
      */}
      <div aria-hidden className="h-[53px] lg:hidden" />

      {/*
        data-analytics-location lets the delegated tracker tell this phone tap
        apart from the header and footer ones. Without it every tel: click on
        the site reports identically and you cannot tell which CTA is earning
        calls.
      */}
      <div
        data-analytics-location="mobile_call_bar"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      >
        <a
          href={site.phoneHref}
          className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-foreground"
        >
          <Phone size={16} aria-hidden="true" />
          Call now
        </a>
        <Link
          href={r('schedule')}
          className="bg-primary py-4 text-center text-sm font-medium text-primary-foreground"
        >
          Free estimate
        </Link>
      </div>
    </>
  )
}
