import Link from 'next/link'
import { Phone } from 'lucide-react'
import { site } from '@/lib/site'
import { r } from '@/lib/routes'

export function MobileCallBar() {
  return (
    /*
      data-analytics-location lets the delegated tracker tell this phone tap
      apart from the header and footer ones. Without it every tel: click on the
      site reports identically and you cannot tell which CTA is earning calls.
    */
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
  )
}
