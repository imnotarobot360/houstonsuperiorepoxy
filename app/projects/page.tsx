import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, X } from 'lucide-react'
import { Heading, PendingBlock, Prose, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { r, routes } from '@/lib/routes'
import {
  archiveHref,
  FACETS,
  type Facet,
  facetLabels,
  facetOptions,
  filterProjects,
  coverPhoto,
  portfolioNotice,
  type ProjectFilter,
  projects,
} from '@/lib/content/projects'
import { ImageSlot } from '@/components/image-slot'
import { abs, graph, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'

const KEY = 'projects' as const
const PATH = routes[KEY].path

/*
  The filterable project archive.

  THE FILTERS ARE LINKS, NOT JAVASCRIPT. Every filter state is a real URL
  (/projects/?city=katy, /projects/?system=full-broadcast-vinyl-flake) served
  from the server, reachable by an anchor tag, and therefore crawlable. A
  client-side dropdown that mutates an array would give a visitor the same
  experience and give a crawler exactly one page.

  Filtered views are NOINDEX + canonical to the unfiltered archive. That is
  deliberate and is not a contradiction of the above: we want a crawler to be
  able to FOLLOW these links and discover every project through them, which it
  can. What we do not want is nine near-duplicate collection pages competing
  with each other and with the city pages for the same queries. Discovery
  without index bloat.

  The project registry is intentionally empty until real photography exists, so
  this page currently renders an honest notice plus routes to verifiable proof
  (Google reviews, local references) rather than stock images of work we did
  not do.
*/

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** First value only — ?city=a&city=b is a malformed request, not a multi-select. */
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/**
 * Reads the facet filters out of the query string.
 *
 * A value with no projects behind it is DROPPED rather than honoured. That
 * turns /projects/?city=narnia into the plain archive instead of an indexable
 * "0 results" page, which is a soft 404 — and it stops a crawler that mangled a
 * URL from minting an empty page.
 */
function readFilter(params: Record<string, string | string[] | undefined>): ProjectFilter {
  const filter: ProjectFilter = {}
  for (const facet of FACETS) {
    const value = one(params[facet])
    if (value && facetOptions(facet).some((o) => o.value === value)) filter[facet] = value
  }
  return filter
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const filter = readFilter(await searchParams)
  const active = FACETS.filter((f) => filter[f])

  if (active.length === 0) {
    return {
      title: routes[KEY].title,
      description: routes[KEY].description,
      alternates: { canonical: PATH },
    }
  }

  /*
    A filtered view describes the same collection through a narrower window, so
    it canonicalises to the archive and is kept out of the index. The title
    still names the filter, because the tab and any shared link should say what
    the visitor is looking at.
  */
  const named = active
    .map((f) => facetOptions(f).find((o) => o.value === filter[f])?.label)
    .filter(Boolean)
    .join(' · ')

  return {
    title: `Completed Projects — ${named} | ${site.company}`,
    description: routes[KEY].description,
    alternates: { canonical: PATH },
    robots: { index: false, follow: true },
  }
}

const body = [
  {
    heading: 'What goes on this page',
    paras: [
      /*
        "No renders" used to be stated flatly here. The archive itself still
        admits nothing but our own on-site photography, and that is the promise
        worth keeping — but elsewhere the site now carries labelled
        illustrations of finishes, so the claim is scoped to this archive rather
        than to every image on the site. An unqualified "no renders" on a site
        that has some would be the kind of small lie that discredits the rest.
      */
      'This archive admits one thing only: completed floors we installed, photographed on site, with the scope and system named. No renders, no manufacturer photography, and no stock images of somebody else’s garage. Illustrations of a finish appear elsewhere on the site and are labelled as illustrations — none of them will ever appear here.',
      'That standard is why the page is currently thin. It is a deliberate trade: a portfolio filled with images we did not shoot would look more impressive today and would be worth nothing to you as evidence.',
    ],
  },
]

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const filter = readFilter(await searchParams)
  const activeFacets = FACETS.filter((f) => filter[f])
  const results = filterProjects(filter)
  const hasProjects = projects.length > 0

  /*
    ItemList over the CURRENTLY VISIBLE projects, in the order they are
    rendered. Emitted only when there is something in it — an ItemList with an
    empty `itemListElement` asserts a collection that does not exist.
  */
  const itemList =
    results.length > 0
      ? {
          '@type': 'ItemList',
          '@id': `${abs(PATH)}#projects`,
          name: 'Completed floor coating projects',
          numberOfItems: results.length,
          itemListElement: results.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: abs(`${PATH}${p.slug}/`),
            name: p.title,
          })),
        }
      : null

  return (
    <>
      <JsonLd
        data={graph(
          webPageNode(KEY, { type: 'CollectionPage' }),
          itemList,
        )}
      />

      <PageHero
        routeKey={KEY}
        eyebrow="Our work"
        intro="Completed garage, patio and commercial floors across Greater Houston — photographed on the job, with the system and scope named."
      />

      <Section>
        <Prose sections={body} />
      </Section>

      {hasProjects ? (
        <Section bleed>
          <Heading
            eyebrow="Archive"
            title="Completed floors"
            intro="Filter by city, by coating system or by the kind of space. Every combination is its own page, so you can bookmark or share the view you want."
          />

          {/*
            The filter bar. Each option is an <a> to a real URL — no client
            component, no state, nothing that stops working without JS. Counts
            are shown so a visitor knows what is behind a filter before
            spending a click on it.
          */}
          <div className="mt-12 flex flex-col gap-7 border-y border-border py-8">
            {FACETS.map((facet: Facet) => {
              /*
                Options are counted WITHIN the other active filters, so the
                numbers describe what clicking would actually produce rather
                than the whole archive. An option that would yield nothing in
                combination with the current filters is not offered at all.
              */
              const others: ProjectFilter = { ...filter }
              delete others[facet]
              const options = facetOptions(facet, filterProjects(others))
              if (options.length === 0) return null

              return (
                <div key={facet} className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
                  <h3 className="shrink-0 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground sm:w-24">
                    {facetLabels[facet]}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    <li>
                      <Link
                        href={archiveHref(PATH, others)}
                        aria-current={filter[facet] ? undefined : 'true'}
                        className={`inline-flex items-center border px-3.5 py-1.5 text-xs transition-colors ${
                          filter[facet]
                            ? 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                            : 'border-primary bg-primary/10 text-primary'
                        }`}
                      >
                        All
                      </Link>
                    </li>
                    {options.map((o) => {
                      const selected = filter[facet] === o.value
                      return (
                        <li key={o.value}>
                          <Link
                            /* Selected chip links to its own removal, so it doubles as the clear control. */
                            href={archiveHref(
                              PATH,
                              selected ? others : { ...filter, [facet]: o.value },
                            )}
                            aria-current={selected ? 'true' : undefined}
                            className={`inline-flex items-center gap-1.5 border px-3.5 py-1.5 text-xs transition-colors ${
                              selected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                            }`}
                          >
                            {o.label}
                            <span className="font-mono text-[0.65rem] opacity-60">{o.count}</span>
                            {selected ? (
                              <>
                                <X size={11} aria-hidden="true" />
                                <span className="sr-only">— remove this filter</span>
                              </>
                            ) : null}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>

          {/*
            Result count as a live region so a screen-reader user who follows a
            filter link is told what changed, not just moved to a new page.
          */}
          <p aria-live="polite" className="mt-8 text-sm text-muted-foreground">
            {results.length} {results.length === 1 ? 'project' : 'projects'}
            {activeFacets.length > 0 ? ' matching your filters' : ' in the archive'}
            {activeFacets.length > 0 ? (
              <>
                {' — '}
                <Link href={PATH} className="text-primary underline underline-offset-4">
                  clear all
                </Link>
              </>
            ) : null}
          </p>

          {results.length === 0 ? (
            <div className="mt-10 max-w-2xl border border-dashed border-border bg-card/50 p-8">
              <h3 className="font-serif text-xl tracking-tight text-foreground">
                Nothing matches that combination yet
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                We have not published a floor matching every filter you have set. Clear one of them,
                or ask us directly — we have almost certainly done the work even if it is not
                photographed here yet.
              </p>
              <Link
                href={PATH}
                className="mt-7 inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                Show every project
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <ul className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => {
                /* finished-wide, never photos[0] — see coverPhoto(). */
                const cover = coverPhoto(p)
                return (
                  <li key={p.slug} className="bg-background">
                    <Link
                      href={`${PATH}${p.slug}/`}
                      className="flex h-full flex-col transition-colors hover:bg-secondary"
                    >
                      {cover ? (
                        <ImageSlot
                          label={cover.label}
                          w={cover.w}
                          h={cover.h}
                          src={cover.src}
                          alt={cover.alt}
                          sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
                          className="border-0 border-b border-dashed"
                        />
                      ) : null}
                      <div className="flex flex-1 flex-col gap-2 p-7">
                        <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                          {p.city}, TX · {p.squareFeet}
                        </span>
                        <span className="flex items-start justify-between gap-3 font-serif text-xl tracking-tight text-foreground">
                          {p.title}
                          <ArrowUpRight
                            size={16}
                            aria-hidden="true"
                            className="mt-1 shrink-0 text-primary"
                          />
                        </span>
                        {/*
                          Blend, then system. The blend is the name someone
                          actually remembers and searches for, so it leads;
                          `spaceType` is appended only when a hand-written entry
                          carries one.
                        */}
                        <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
                          {[p.flakeBlend, p.system, p.spaceType].filter(Boolean).join(' — ')}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      ) : (
        <Section bleed>
          {/*
            Title was "Photography in progress" — a status about our internal
            workflow, used as the H1-adjacent heading on the page a visitor
            opens to judge our work. It also matched a placeholder-language
            audit. The heading now states what the page is for, and the intro
            carries the status plus the two ways to verify us right now, which
            is the useful information.
          */}
          <Heading
            eyebrow="Archive"
            title="Completed project case studies"
            intro="Case studies are published here as installation photography from finished floors is organized. Until then, the two fastest ways to judge our workmanship are local references and the reviews on our Google Business Profile."
          />
          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-12">
            <PendingBlock heading={portfolioNotice.heading} body={portfolioNotice.body} />

            {/*
              The 4.9 + five-star row that opened this card was removed: that
              aggregate is the parent company's, so using it as this division's
              proof was false attribution.

              The card's actual argument — references on real floors nearby —
              never depended on the number and is stronger anyway.
            */}
            <div className="border border-border bg-card/40 p-8 lg:p-10">
              <h3 className="font-serif text-xl tracking-tight text-foreground">
                Verifiable proof, available now
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                Ask us at the estimate for references on completed floors near you — in most of our
                service area we can point you at a job within a few miles. That is a stronger check
                than any photograph on this page, because you can go and look at it. Our Google
                reviews are unedited and outside our control.
              </p>
              <a
                href={site.googleBusinessProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                Read the reviews on Google
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </Section>
      )}

      <CtaBand
        title="Ask for references near you"
        body="We would rather point you at a real floor a few streets away than show you a photograph. Mention it at your free estimate and we will tell you what we have completed nearby."
      />

      <Section>
        <RelatedLinks
          heading="Explore the work itself"
          links={[
            { label: routes.flake.label, href: r('flake'), blurb: 'The system most of these floors use.' },
            { label: routes.metallic.label, href: r('metallic'), blurb: 'Showroom and feature floors.' },
            { label: routes.garageCoatings.label, href: r('garageCoatings'), blurb: 'Residential garage work.' },
            { label: routes.commercial.label, href: r('commercial'), blurb: 'Commercial and industrial slabs.' },
            { label: routes.reviews.label, href: r('reviews'), blurb: 'What customers actually said.' },
            { label: routes.serviceAreas.label, href: r('serviceAreas'), blurb: 'Where we work.' },
          ]}
        />
      </Section>
    </>
  )
}
