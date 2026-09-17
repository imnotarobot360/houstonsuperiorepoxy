import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowUpRight, Check } from 'lucide-react'
import { ProfessionalRecommendation, QuickAnswer, RelatedProjects } from '@/components/aeo'
import { Heading, RelatedLinks, Section } from '@/components/blocks'
import { CtaBand } from '@/components/cta-band'
import { JsonLd } from '@/components/json-ld'
import { PageHero } from '@/components/page-hero'
import { ProjectPhoto } from '@/components/project-photo'
import { crumbsFor, r, routes } from '@/lib/routes'
import { cityBySlug } from '@/lib/content/cities'
import {
  orderedPhotos,
  type ProjectPhase,
  projectBySlug,
  projects,
} from '@/lib/content/projects'
import { graph, projectNode, webPageNode } from '@/lib/schema'
import { site } from '@/lib/site'

/*
  Detail template for a single completed job.

  Driven entirely by lib/content/projects, which is empty by design until real
  photography exists — so this route currently generates zero static params and
  404s on any direct hit. That is the correct state: an empty archive with a
  working template is honest, a fabricated project is not.

  Individual project URLs are the biggest structural gap in this market. No
  local competitor publishes one page per completed floor carrying the slab
  condition found, the preparation performed, the repairs, the full coating
  build-up and the reasoning behind the specification. That combination is not
  something a competitor can copy without doing the work.
*/

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = projectBySlug(slug)
  if (!project) return {}

  const path = `${routes.projects.path}${project.slug}/`
  const title = `${project.title} | ${project.city}, TX | ${site.company}`
  /*
    A file-authored project carries no summary, so the description falls back to
    the facts it does have. Never left empty — an empty meta description gets
    replaced by whatever fragment the search engine picks off the page.
  */
  const description = (
    project.summary ??
    `${project.flakeBlend} ${project.system.toLowerCase()} installed in ${project.city}, TX — ${project.squareFeet}.`
  ).slice(0, 155)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: 'article' },
  }
}

/*
  Phase headings and the intro each one takes from the project record, so the
  photo sections are self-explaining rather than four unlabelled galleries.
  Ordered: this array IS the render order of the page.
*/
const PHASES: {
  phase: ProjectPhase
  eyebrow: string
  title: string
  /*
    Undefined when the project has no prose for this phase — the section still
    renders its photographs, just without an intro paragraph.
  */
  intro: (p: NonNullable<ReturnType<typeof projectBySlug>>) => string | undefined
}[] = [
  {
    phase: 'before',
    eyebrow: 'Before',
    title: 'The slab as we found it',
    intro: (p) => p.conditionFound,
  },
  {
    phase: 'preparation',
    eyebrow: 'Preparation',
    title: 'Grinding and repair',
    intro: (p) => p.preparationPerformed,
  },
  {
    phase: 'installation',
    eyebrow: 'Installation',
    title: 'The system going down',
    /* Only the blend is guaranteed; the coat names come from a case study. */
    intro: (p) =>
      [p.baseCoat, p.flakeBlend, p.topcoat].filter(Boolean).join(' · ') || undefined,
  },
  {
    phase: 'completed',
    eyebrow: 'Completed',
    title: 'The finished floor',
    intro: (p) => p.narrative?.outcome,
  },
]

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projectBySlug(slug)
  if (!project) notFound()

  /* Same value generateMetadata derives, so canonical and @id cannot drift. */
  const path = `${routes.projects.path}${project.slug}/`
  const service = project.serviceKey ? routes[project.serviceKey] : undefined
  const city = cityBySlug(project.citySlug)
  const cityPath = city ? `/service-areas/${city.slug}/` : undefined

  /*
    The full specification, assembled in one place so the row order is
    identical on every project page and a missing field cannot leave a hole in
    the middle of the table. Rendered as a definition list, not prose: this is
    reference data, and a visitor comparing two quotes reads it by scanning.
  */
  /*
    Rows with no value are dropped rather than rendered empty. A file-authored
    project supplies roughly half of these; a written case study supplies all of
    them. Either way the order is identical, so two project pages can be read
    against each other.
  */
  const spec = (
    [
      { label: 'Project type', value: project.projectType },
      /* City only. Never a street address for a customer's home. */
      { label: 'Location', value: `${project.city}, TX` },
      { label: 'Area', value: project.neighborhood },
      { label: 'Space', value: project.spaceType },
      { label: 'Square footage', value: project.squareFeet },
      { label: 'Concrete condition found', value: project.conditionFound },
      { label: 'Preparation performed', value: project.preparationPerformed },
      { label: 'Repairs performed', value: project.repairsPerformed },
      { label: 'Base coat system', value: project.baseCoat },
      { label: 'Flake blend', value: project.flakeBlend },
      { label: 'Coating system', value: project.system },
      { label: 'Topcoat system', value: project.topcoat },
      { label: 'Installation duration', value: project.duration },
      { label: 'Completion date', value: project.completed },
      ...(project.details ?? []),
    ] satisfies { label: string; value?: string }[]
  ).filter((row): row is { label: string; value: string } => Boolean(row.value))

  /*
    The opening answer, used for the meta description, the JSON-LD and the page
    intro alike so all three agree.

    A written case study supplies it. A file-authored project does not, so one
    is composed from the facts the project genuinely carries — the size, the
    system, the blend, the city and the scope lines. Composed from real fields,
    not invented: there is no sentence here that the project.json did not
    already assert.
  */
  const summary =
    project.summary ??
    [
      `${project.squareFeet} ${project.system.toLowerCase()} in ${project.city}, TX, finished in ${project.flakeBlend}.`,
      project.scope?.length ? `Scope: ${project.scope.join('; ')}.` : '',
    ]
      .filter(Boolean)
      .join(' ')

  /*
    orderedPhotos first, so the three completed frames appear in their intended
    order — finished-wide, then finished-detail, then finished-car — rather than
    whatever order they happen to sit in the file.
  */
  const ordered = orderedPhotos(project)
  const photosFor = (phase: ProjectPhase) => ordered.filter((p) => p.phase === phase)

  /*
    Exactly one image on the page may be preloaded, and it must be the first
    one in document order or the preload competes with the real LCP element
    and makes the metric worse. That is the first frame of the earliest phase
    that actually has photography.
  */
  const firstPhaseWithPhotos = PHASES.find((p) => photosFor(p.phase).length > 0)?.phase

  /* Empty for a file-authored project; the scope list carries the page instead. */
  const narrative = project.narrative
    ? [
        { heading: 'The problem', body: project.narrative.problem },
        { heading: 'What we did', body: project.narrative.solution },
        { heading: 'The outcome', body: project.narrative.outcome },
      ]
    : []

  return (
    <>
      <JsonLd
        data={graph(
          webPageNode({
            path,
            name: project.title,
            description: summary,
          }),
          projectNode({
            path,
            title: project.title,
            summary: summary,
            city: project.city,
            photos: project.photos,
            servicePath: service?.path,
            cityPath,
            completedISO: project.completedISO,
            system: project.system,
            spaceType: project.spaceType,
          }),
        )}
      />

      {/*
        Breadcrumb trail is Home → Projects → City → this project. The city
        level is what makes the trail worth having: it tells a crawler this job
        belongs to a place that has its own page, and it gives a visitor who
        arrived from search a one-click route to the rest of our work nearby.
      */}
      <PageHero
        h1={project.title}
        eyebrow={`${project.city}, TX — completed ${project.completed}`}
        intro={summary}
        trail={[
          ...crumbsFor('projects'),
          { label: routes.projects.label, href: routes.projects.path },
          ...(city && cityPath ? [{ label: city.name, href: cityPath }] : []),
        ]}
        current={project.title}
        path={path}
      />

      {/* Opening answer: what was actually done here, liftable on its own. */}
      <Section>
        <QuickAnswer question="What was done on this floor?" answer={summary} />
      </Section>

      {/*
        Specification first, narrative second. Someone who found this page is
        deciding whether their floor is like this floor, and the spec block
        answers that in about four seconds.
      */}
      <Section bleed>
        <Heading
          eyebrow="Specification"
          title="Exactly what went down"
          intro="The full scope as recorded on site — condition found, preparation performed and every product in the build-up."
        />
        <dl className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {spec.map((row) => (
            <div key={row.label} className="bg-background p-6">
              <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                {row.label}
              </dt>
              <dd className="mt-2.5 text-sm leading-relaxed text-foreground text-pretty">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {/*
          The scope list, when the project carries one. On a file-authored
          project this is the substance of the page — the ordered account of
          what was actually done, which the spec table's individual rows cannot
          convey as a sequence.
        */}
        {project.scope?.length ? (
          <div className="mt-12 max-w-3xl">
            <h3 className="font-serif text-xl tracking-tight text-foreground">
              What we did on this slab
            </h3>
            <ul className="mt-6 flex flex-col gap-3">
              {project.scope.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-pretty">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      {/*
        The job in the installer's own voice. The spec table above is something
        anyone could fabricate; the reasoning attached to a specific slab is
        not, which is why this block is prose and stays first person.

        Rendered only for a project that carries the narrative — an empty "How
        it went" heading over nothing is worse than no section.
      */}
      {narrative.length > 0 ? (
        <Section>
          <Heading eyebrow="On this job" title="How it went" />
          <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-12">
            {narrative.map((n) => (
              <div key={n.heading} className="border-t border-border pt-6">
                <h3 className="font-serif text-xl tracking-tight text-foreground">{n.heading}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {n.body}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/*
        Photography, in job order: before, preparation, installation,
        completed. A project page without before and preparation frames cannot
        demonstrate the grinding work, which is the entire technical argument
        this business rests on — so the phases are labelled and never merged
        into one undifferentiated gallery.
      */}
      {PHASES.map(({ phase, eyebrow, title, intro }) => {
        const photos = photosFor(phase)
        if (photos.length === 0) return null

        return (
          <Section key={phase} bleed>
            <Heading eyebrow={eyebrow} title={title} intro={intro(project)} />
            <div className="mt-12 grid gap-10 sm:grid-cols-2">
              {photos.map((photo, i) => (
                <figure key={`${phase}-${photo.label}`}>
                  <ProjectPhoto
                    photo={photo}
                    priority={phase === firstPhaseWithPhotos && i === 0}
                    sizes="(min-width: 640px) 46vw, 100vw"
                  />
                  <figcaption className="mt-3 text-[0.7rem] leading-relaxed text-muted-foreground">
                    {photo.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )
      })}

      {/*
        The customer's own words about this floor, when they exist.

        Placed AFTER the photography deliberately. Coming before it, a quote is
        an unsupported claim; coming after the before/preparation/completed
        frames, it is corroboration of something the reader has already seen.

        Rendered as visible attributed text only — no Review or rating markup is
        emitted from this field. The reasoning is in projectNode in
        lib/schema.ts, and it is the same reasoning /reviews/ publishes: a quote
        the company selected about itself is not evidence, and marking one up as
        a machine-readable rating of ourselves is a policy problem on top of
        that. This one earns its place because it is bolted to a dated,
        photographed job in a named city, which a reader can weigh for
        themselves — and where it was posted publicly, follow and check.
      */}
      {project.customerReview ? (
        <Section>
          <Heading eyebrow="The customer" title="What they said afterwards" />
          <figure className="mt-12 max-w-3xl border-l-2 border-primary pl-7 lg:pl-9">
            <blockquote>
              {/*
                Verbatim, per the field contract in lib/content/projects. If a
                quote needs tightening to read well, the right move is not to
                publish it.
              */}
              <p className="font-serif text-xl leading-relaxed tracking-tight text-foreground text-pretty lg:text-2xl">
                {`"${project.customerReview.quote}"`}
              </p>
            </blockquote>
            <figcaption className="mt-5 text-sm text-muted-foreground">
              {/* First name and city only — never a full name or an address. */}
              {project.customerReview.attribution}
              {project.customerReview.sourceUrl ? (
                <>
                  {' — '}
                  <a
                    href={project.customerReview.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    read it unedited on Google
                  </a>
                </>
              ) : null}
            </figcaption>
          </figure>
        </Section>
      ) : null}

      {/*
        Why this floor was specified this way — and, just as importantly, when
        it would be the wrong specification.
      */}
      {/*
        Only for a project carrying a written rationale. The block asserts a
        professional verdict, so it must not render with an empty one — an
        empty recommendation still reads as a recommendation.
      */}
      {project.rationale ? (
        <Section bleed>
          <ProfessionalRecommendation
            verdict={project.rationale}
            chooseWhen={`Slabs in ${project.city} presenting like this one — see the condition found above.`}
            avoidWhen="The slab shows active moisture movement, structural cracking, or contamination that grinding alone will not resolve. Those change the specification."
          />
        </Section>
      ) : null}

      {/*
        The two links a visitor on this page actually wants next: the service
        in full, and the rest of our work in their city. Given prominence
        rather than buried in the related-links grid at the foot of the page.
      */}
      <Section>
        <Heading eyebrow="Next" title="The service and the area" />
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2">
          {/* Only a case study names its service page; a project.json does not. */}
          {service ? (
            <Link
              href={service.path}
              className="flex flex-col gap-2 bg-background p-8 transition-colors hover:bg-secondary"
            >
              <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                The service
              </span>
              <span className="flex items-start justify-between gap-3 font-serif text-xl tracking-tight text-foreground">
                {service.h1}
                <ArrowUpRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
                How this system is built up, what it costs and what it is suited to.
              </span>
            </Link>
          ) : null}

          {city && cityPath ? (
            <Link
              href={cityPath}
              className="flex flex-col gap-2 bg-background p-8 transition-colors hover:bg-secondary"
            >
              <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                The area
              </span>
              <span className="flex items-start justify-between gap-3 font-serif text-xl tracking-tight text-foreground">
                Epoxy flooring in {city.name}
                <ArrowUpRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
                What the slabs are like locally and how that changes the preparation.
              </span>
            </Link>
          ) : (
            <Link
              href={r('serviceAreas')}
              className="flex flex-col gap-2 bg-background p-8 transition-colors hover:bg-secondary"
            >
              <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                The area
              </span>
              <span className="flex items-start justify-between gap-3 font-serif text-xl tracking-tight text-foreground">
                Where we work
                <ArrowUpRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
              </span>
              <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
                Every city we cover across Greater Houston.
              </span>
            </Link>
          )}
        </div>
      </Section>

      <CtaBand
        title={`Want something similar in ${project.city}?`}
        body="Every floor starts with an onsite inspection of your concrete, because that is what determines the scope and the price. The visit is free and the quote comes back itemized."
      />

      {/*
        Only rendered when another project actually exists to link to. Showing
        "More work in Cypress" above an "awaiting photography" notice on a page
        that is itself the Cypress project reads as broken, so the section is
        omitted rather than filled.
      */}
      {projects.some((p) => p.slug !== project.slug) && (
        <Section>
          <RelatedProjects
            citySlug={project.citySlug}
            excludeSlug={project.slug}
            heading={`More work in ${project.city}`}
          />
        </Section>
      )}

      <Section bleed>
        <Heading eyebrow="Related" title="Explore further" />
        <div className="mt-10">
          <RelatedLinks
            heading="Continue reading"
            links={[
              { label: 'All projects', href: r('projects'), blurb: 'The rest of the archive.' },
              {
                label: routes.process.label,
                href: r('process'),
                blurb: 'How this floor was installed.',
              },
              { label: routes.pricing.label, href: r('pricing'), blurb: 'What drives the cost.' },
              {
                label: routes.serviceAreas.label,
                href: r('serviceAreas'),
                blurb: 'Where else we work.',
              },
            ]}
          />
        </div>
      </Section>
    </>
  )
}
