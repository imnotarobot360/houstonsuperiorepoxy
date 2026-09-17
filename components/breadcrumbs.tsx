import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { breadcrumbId } from '@/lib/schema'
import { site } from '@/lib/site'
import type { Crumb } from '@/lib/routes'

/*
  Visible breadcrumbs + the matching BreadcrumbList JSON-LD.

  Both come from the same array so the markup a crawler reads and the trail a
  visitor sees can never disagree. `current` is the page you are on: it is
  included in the schema (as the last item) but rendered as plain text, not a
  link.
*/
export function Breadcrumbs({
  trail,
  current,
  path,
}: {
  trail: Crumb[]
  current: string
  /*
    The page's own canonical path. Used only to mint the BreadcrumbList `@id`
    that this page's WebPage node points at, which is what links the visible
    trail into the graph. Omitted on pages with no WebPage reference.
  */
  path?: string
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    ...(path ? { '@id': breadcrumbId(path) } : {}),
    itemListElement: [
      ...trail.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.label,
        item: `${site.canonical}${c.href}`,
      })),
      {
        '@type': 'ListItem',
        position: trail.length + 1,
        name: current,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-y-1 text-[0.7rem] text-muted-foreground">
          {trail.map((c) => (
            <li key={c.href} className="flex items-center">
              <Link href={c.href} className="transition-colors hover:text-foreground">
                {c.label}
              </Link>
              <ChevronRight size={12} aria-hidden="true" className="mx-2 opacity-50" />
            </li>
          ))}
          <li aria-current="page" className="text-foreground/70">
            {current}
          </li>
        </ol>
      </nav>
    </>
  )
}
