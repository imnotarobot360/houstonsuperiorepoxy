import Link from 'next/link'
import { ArrowUpRight, Phone } from 'lucide-react'
import { Section } from '@/components/blocks'
import { r } from '@/lib/routes'
import { site } from '@/lib/site'

/*
  Custom 404.

  There was no `app/not-found.tsx`, so Next.js served its bare built-in page —
  literally "404: This page could not be found." on a black screen, with no
  header, no footer, no phone number and no way back into the site. Every
  mistyped URL, stale link or bad ad destination ended there, which on a
  lead-generating site is a dead end for a visitor who was actively looking for
  the company.

  Rendering inside the root layout means the header, footer and mobile call bar
  come with it, so the visitor always has navigation and a tappable phone
  number.

  NOTE ON METADATA: a plain `not-found.tsx` cannot export `metadata` — only the
  experimental `global-not-found` can, and that replaces the root layout
  entirely. So this page still inherits the homepage title and canonical. That
  is cosmetic and NOT an indexing risk: Next.js serves this with a real 404
  status and `robots: noindex`, and a canonical is ignored on a noindexed page.
  Enabling an experimental flag on a live site to tidy a tag no crawler acts on
  was the worse trade.
*/

/* The routes a lost visitor is most likely to have been looking for. */
const DESTINATIONS = [
  { href: r('garageCoatings'), label: 'Garage floor coatings', note: 'The main service' },
  { href: r('pricing'), label: 'Pricing', note: 'Starting figures and what moves them' },
  { href: r('projects'), label: 'Recent work', note: 'Completed Houston-area floors' },
  { href: r('serviceAreas'), label: 'Service areas', note: 'Cities we cover' },
  { href: r('process'), label: 'Our process', note: 'Grinding, repair and installation' },
  { href: r('contact'), label: 'Contact', note: 'Reach the team directly' },
] as const

export default function NotFound() {
  return (
    <Section>
      <div className="max-w-2xl">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary">
          404 — Page not found
        </p>
        <h1 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
          That page moved or never existed
        </h1>
        <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">
          The link you followed does not point to a page on this site. Nothing is wrong with your
          floor quote — you can pick up where you left off below, or call and we will point you
          straight to it.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Get a free estimate
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            href={site.phoneHref}
            className="inline-flex items-center gap-2 border border-border px-5 py-3 text-sm font-medium text-foreground hover:bg-card"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {site.phone}
          </a>
        </div>
      </div>

      {/*
        Real internal links rather than a lone "go home" button: a visitor who
        landed here had a specific intent, and this lets them resume it in one
        click instead of restarting from the homepage.
      */}
      <nav aria-label="Popular pages" className="mt-14 border-t border-border pt-10">
        <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Where you might be headed
        </h2>
        <ul className="mt-6 grid gap-x-10 gap-y-1 sm:grid-cols-2">
          {DESTINATIONS.map((d) => (
            <li key={d.href} className="border-b border-border/60">
              <Link
                href={d.href}
                className="group flex items-baseline justify-between gap-4 py-4 hover:text-primary"
              >
                <span className="text-sm font-medium">{d.label}</span>
                <span className="text-xs text-muted-foreground text-right">{d.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Section>
  )
}
