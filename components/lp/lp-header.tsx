import Image from 'next/image'
import { Phone } from 'lucide-react'
import { site } from '@/lib/site'

/*
  Minimal landing-page header. The spec is explicit: no navigation menu — only
  the logo, a phone option and the primary CTA. Anything else is a competing
  exit from a paid click. Phone clicks are picked up by the site-wide delegated
  analytics listener (tel: hrefs), so no per-link handler is needed here and
  this stays a server component.
*/
export function LpHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Image
          src={site.logo.lockup}
          alt={`${site.company} logo`}
          width={200}
          height={48}
          priority
          className="h-9 w-auto sm:h-10"
        />
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href={site.phoneHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary"
          >
            <Phone size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{site.phone}</span>
            <span className="sr-only sm:hidden">Call {site.phone}</span>
          </a>
          <a
            href="#estimate"
            className="bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 sm:text-sm"
          >
            Get My Free Estimate
          </a>
        </div>
      </div>
    </header>
  )
}
