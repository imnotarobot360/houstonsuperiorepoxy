'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, Phone, X } from 'lucide-react'
import { site } from '@/lib/site'
import { headerNav, mobileNav, r } from '@/lib/routes'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  /* Close the mobile drawer whenever the route changes. */
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.replace(/\/$/, ''))

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      {/*
        gap-4 between logo / nav / CTA until xl, gap-6 from xl up.

        Seven top-level items plus the estimate button do not fit on one line
        at 1024px with the wider gap — the button was pushed ~40px past the
        viewport edge and the whole page gained a horizontal scrollbar. The
        padding stays at lg:px-10 deliberately: it is what aligns the logo with
        the page content below, so the width has to come from the gaps.
      */}
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5 lg:px-10 xl:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${site.company} — home`}>
          {/*
            Renders at 44px from a 560px source. `sizes` matters more here than
            almost anywhere else on the site: without it the browser fetched
            the full 560px mark into a 44px box in the sticky header on every
            single page. Stays `priority` because it is the topmost element.
          */}
          <Image
            src={site.logo.mark}
            alt=""
            aria-hidden="true"
            width={560}
            height={560}
            sizes="44px"
            priority
            className="h-11 w-11 shrink-0"
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold uppercase tracking-[0.1em] text-foreground">
              Houston
            </span>
            <span className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary">
              Superior Epoxy
            </span>
          </span>
        </Link>

        {/* Desktop nav. Dropdown panels are plain markup so every href is
            present in the server-rendered HTML and crawlable. */}
        {/* gap-4 at lg for the same reason as the container above. */}
        <nav aria-label="Main" className="hidden items-center gap-4 lg:flex xl:gap-6">
          {headerNav.map((item) => (
            <div key={item.href} className="group relative">
              <Link
                href={item.href}
                className={`flex items-center gap-1 whitespace-nowrap py-6 text-[0.8rem] transition-colors hover:text-foreground ${
                  isActive(item.href) ? 'text-foreground' : 'text-muted-foreground'
                }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.label}
                {item.children && (
                  <ChevronDown size={12} aria-hidden="true" className="mt-px opacity-60" />
                )}
              </Link>

              {item.children && (
                <div className="invisible absolute left-0 top-full z-10 w-72 -translate-y-1 border border-border bg-card opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <ul>
                    {item.children.map((c) => (
                      <li key={c.href} className="border-b border-border last:border-0">
                        <Link href={c.href} className="block px-5 py-3.5 hover:bg-secondary">
                          <span className="block text-[0.8rem] text-foreground">{c.label}</span>
                          {c.blurb && (
                            <span className="mt-0.5 block text-[0.7rem] text-muted-foreground">
                              {c.blurb}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          <a
            href={site.phoneHref}
            className="hidden items-center gap-2 whitespace-nowrap text-[0.8rem] text-foreground transition-colors hover:text-primary xl:flex"
          >
            <Phone size={14} aria-hidden="true" />
            {site.phone}
          </a>
          {/*
            The "Book Online" button that sat here is gone: /book/ now redirects
            to /schedule/, so it would have pointed at a redirect AND offered a
            second competing action beside "Get a Free Estimate". The scheduler
            is still reachable as a secondary option on /schedule/ itself.
          */}
          <Link
            href={r('schedule')}
            className="hidden bg-primary px-4 py-2.5 text-[0.8rem] font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:block"
          >
            Get a Free Estimate
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center text-foreground lg:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-border bg-background lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col px-5 py-4">
            {/*
              mobileNav, not headerNav — the drawer leads with "Design Your
              Floor" (Colors + Floor Designer) and drops those two from the
              Garage Floors group so neither is listed twice. See lib/routes.ts.
            */}
            {mobileNav.map((item) => (
              <div key={item.label} className="border-b border-border">
                {/*
                  A group with no href is a heading, not a link. Rendering it as
                  a <Link href={undefined}> would emit an anchor with no href,
                  which is keyboard-focusable and announced as a link that goes
                  nowhere.
                */}
                {item.href ? (
                  <Link href={item.href} className="block py-3.5 font-serif text-lg text-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <h2 className="py-3.5 font-serif text-lg text-foreground">{item.label}</h2>
                )}
                {item.children && (
                  <ul className="-mt-1 pb-3 pl-4">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="block py-2 text-sm text-muted-foreground">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <Link
              href={r('schedule')}
              className="mt-5 bg-primary px-5 py-4 text-center text-sm font-medium text-primary-foreground"
            >
              Get a Free Estimate
            </Link>
            <a
              href={site.phoneHref}
              className="mt-3 mb-2 flex items-center justify-center gap-2 border border-border px-5 py-4 text-sm text-foreground"
            >
              <Phone size={16} aria-hidden="true" />
              {site.phone}
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
