import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { site, socialProfiles } from '@/lib/site'
import { footerNav, legalNav } from '@/lib/routes'
import { cities } from '@/lib/content/cities'

/*
  The footer is the site's crawl backbone: every route in the registry is
  reachable from here on every page, including the routes that only appear
  inside a header dropdown.
*/
export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-2">
            {/*
              Intrinsic dimensions are the real ones, so the box is reserved and
              the footer does not reflow. It renders at ~96px tall, roughly
              290px wide — `sizes` is what stops the browser choosing the
              1411px candidate for a 290px slot, and it lazy-loads because the
              footer is below the fold on every page.
            */}
            <Image
              src={site.logo.lockup}
              alt={`${site.company} — ${site.tagline}`}
              width={1411}
              height={467}
              sizes="290px"
              loading="lazy"
              className="h-20 w-auto sm:h-24"
            />
            <p className="mt-6 max-w-md leading-relaxed text-muted-foreground text-pretty">
              Diamond-ground concrete coatings for garages, patios and commercial slabs, installed
              across Greater Houston. Insured, warrantied in writing, and quoted after we have
              actually seen your concrete.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              A division of{' '}
              <a href={site.parentSite} className="text-primary underline-offset-4 hover:underline">
                {site.parentCompany} →
              </a>
            </p>
          </div>

          {footerNav.map((col) => (
            <div key={col.heading}>
              <h2 className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                {col.heading}
              </h2>
              <ul className="mt-5 space-y-3">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-10 border-t border-border pt-10 lg:grid-cols-3">
          <div>
            <h2 className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Contact
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a href={site.phoneHref} className="text-foreground/80 hover:text-primary">
                  Call {site.phone}
                </a>
              </li>
              <li>
                <a href={site.smsHref} className="text-foreground/80 hover:text-primary">
                  Text {site.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="text-foreground/80 hover:text-primary">
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.googleBusinessProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-primary"
                >
                  {/*
                    Was "4.9 ★ · 200+ Google reviews" on every page of the site.
                    That aggregate is the parent company's, so it has been
                    removed along with the star — a filled star beside the link
                    would still imply a rating we have not earned here.
                  */}
                  <span>Read our Google reviews</span>
                  <ArrowUpRight size={12} aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
              {/* Service-area business — no street address is published. */}
              <li className="pt-1 text-muted-foreground">Mobile service across Greater Houston</li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Service areas
            </h2>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/service-areas/${c.slug}/`}
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Also serving {site.serviceAreas.filter((a) => !cities.some((c) => c.name === a)).join(' · ')}
            </p>
          </div>
        </div>

        {/*
          Legal strip. Present on every page because a privacy policy is a
          hard requirement for running Google Ads or Local Services Ads, and
          the SMS consent language lives in the terms.
        */}
        <div className="mt-10 border-t border-border pt-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {/*
              Official profiles come from `socialProfiles` in lib/site.ts, which
              is also what feeds schema `sameAs`. Adding one there renders it
              here automatically — do not hardcode a profile URL in this file,
              or the footer and the entity graph can drift apart.

              These sit in the legal/meta row rather than getting their own
              icon block: they are identity corroboration for the entity, not a
              conversion path, and the footer already carries the phone CTA.
            */}
            {socialProfiles.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="me noopener noreferrer"
                  aria-label={`${site.company} on ${s.label} (opens in a new tab)`}
                  className="text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {site.company}. All rights reserved.
            </p>
            <p>Fully insured · $2M liability + workers&apos; comp · 5-year workmanship warranty</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
