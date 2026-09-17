import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'
import { site } from '@/lib/site'
import { r } from '@/lib/routes'

/* Thin bar above the header. Server-rendered, no JS. */
export function UtilityBar() {
  return (
    /*
      Hidden below `sm`: at phone widths these three items wrapped onto two
      cramped lines, and MobileCallBar already pins call + estimate to the
      bottom of the viewport, so this bar was pure duplication there.
    */
    <div
      data-analytics-location="utility_bar"
      className="hidden border-b border-border bg-card/60 sm:block"
    >
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-5 text-[0.7rem] lg:px-10">
        <p className="flex items-center gap-2 whitespace-nowrap text-muted-foreground">
          <MapPin size={12} aria-hidden="true" className="text-primary" />
          <Link href={r('serviceAreas')} className="hover:text-foreground">
            Serving Greater Houston
          </Link>
        </p>

        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2 whitespace-nowrap text-muted-foreground">
            <Phone size={12} aria-hidden="true" className="text-primary" />
            Call or text
            <a href={site.phoneHref} className="text-foreground hover:text-primary">
              {site.phone}
            </a>
          </span>
          <Link
            href={r('schedule')}
            className="whitespace-nowrap font-medium text-primary underline-offset-4 hover:underline"
          >
            Schedule a Free Estimate
          </Link>
        </div>
      </div>
    </div>
  )
}
