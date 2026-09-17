import { Breadcrumbs } from '@/components/breadcrumbs'
import { crumbsFor, type RouteKey, routes } from '@/lib/routes'
import type { Crumb } from '@/lib/routes'

/*
  Standard subpage masthead: breadcrumbs, the page's single H1, and an intro.

  Every subpage uses this, so there is exactly one H1 per page by construction
  and the breadcrumb trail is always derived from the route registry rather
  than hand-typed.
*/
export function PageHero({
  routeKey,
  eyebrow,
  intro,
  /* Overrides for dynamic routes not in the registry (cities, articles). */
  h1,
  trail,
  current,
  path,
  children,
}: {
  routeKey?: RouteKey
  eyebrow: string
  intro: string
  h1?: string
  trail?: Crumb[]
  current?: string
  /*
    Canonical path, forwarded to Breadcrumbs so the BreadcrumbList carries the
    `@id` this page's WebPage node references. Derived from the route registry
    when a routeKey is given; dynamic routes pass it explicitly.
  */
  path?: string
  children?: React.ReactNode
}) {
  const heading = h1 ?? (routeKey ? routes[routeKey].h1 : '')
  const crumbTrail = trail ?? (routeKey ? crumbsFor(routeKey) : [])
  const currentLabel = current ?? (routeKey ? routes[routeKey].label : heading)
  const canonicalPath = path ?? (routeKey ? routes[routeKey].path : undefined)

  return (
    <section className="border-b border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-10 lg:py-16">
        <Breadcrumbs trail={crumbTrail} current={currentLabel} path={canonicalPath} />

        <div className="mt-8 max-w-3xl">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-5 font-serif text-3xl leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {heading}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">{intro}</p>
          {children}
        </div>
      </div>
    </section>
  )
}
