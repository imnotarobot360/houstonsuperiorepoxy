import { AlertTriangle, Check, CloudRain, Quote, ScrollText, X } from 'lucide-react'
import Link from 'next/link'
import {
  attribution,
  author,
  contentDates,
  glossary,
  type GlossaryKey,
  isPlaceholder,
  referenceCaveat,
  technicalReferences,
} from '@/lib/content/authority'
import { pageAnswers } from '@/lib/content/answers'
import { projects } from '@/lib/content/projects'
import { pageSpecs, pageTerms } from '@/lib/content/specs'
import type { RouteKey } from '@/lib/routes'
import { site } from '@/lib/site'

/*
  Answer-engine optimisation blocks.

  The whole premise here is that extractability comes from structure and real
  expertise, not from tricks. So: everything in this file renders as visible,
  server-rendered text. There are no hidden keyword blocks, no sr-only keyword
  dumps, no display:none content. If a block is not worth showing a homeowner,
  it is not worth emitting for a crawler either.
*/

/* ---------------------------------------------------------------- */
/* Opening answer                                                    */
/* ---------------------------------------------------------------- */

/*
  Dev-only guard on the 40-70 word target from the content brief.

  An answer engine lifting a two-sentence fragment gets something incomplete;
  lifting six sentences gets something it will truncate mid-thought. Rather
  than trusting every future author to count words by hand, this warns at
  build time in development and stays silent in production.
*/
function checkAnswerLength(answer: string, label: string) {
  if (process.env.NODE_ENV === 'production') return
  const words = answer.trim().split(/\s+/).length
  if (words < 40 || words > 70) {
    console.log(
      `[v0] QuickAnswer for "${label}" is ${words} words; the target is 40-70 for a liftable answer.`,
    )
  }
}

/**
 * The opening answer pattern: a question-shaped H2 followed by a
 * self-contained answer that reads correctly with zero surrounding context.
 *
 * `as` lets a page drop it to an H3 when it sits inside a section that already
 * owns an H2, so the heading outline never breaks.
 */
export function QuickAnswer({
  question,
  answer,
  as: Tag = 'h2',
  className = '',
}: {
  question: string
  answer: string
  as?: 'h2' | 'h3'
  className?: string
}) {
  checkAnswerLength(answer, question)

  return (
    <div className={`max-w-3xl ${className}`}>
      <Tag className="font-serif text-2xl leading-tight tracking-tight text-balance text-foreground sm:text-3xl">
        {question}
      </Tag>
      {/*
        Larger than body copy and given its own ground so it reads as the
        answer rather than as the first paragraph of an essay.
      */}
      <div className="mt-6 border-y border-border bg-card/40 px-6 py-7 sm:px-8">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">Short answer</p>
        <p className="mt-4 text-lg leading-relaxed text-foreground/90 text-pretty">{answer}</p>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* E-E-A-T byline                                                    */
/* ---------------------------------------------------------------- */

/*
  ISO date -> "29 August 2026" for display, while the raw ISO string stays in
  the <time dateTime> attribute.

  Parsed as an explicit UTC instant rather than `new Date('2026-08-29')`
  formatted in local time: a bare date string is treated as UTC midnight, so a
  server or reader west of Greenwich would render the previous day. `timeZone:
  'UTC'` pins the output to the date that was actually written.
*/
function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Author, hands-on experience, reviewer, published and last-reviewed dates.
 *
 * Every value starts as a placeholder token until the owner supplies a real
 * named installer — see the note in lib/content/authority.ts on why inventing
 * an author is the one unrecoverable E-E-A-T mistake.
 *
 * UNFILLED VALUES ARE OMITTED, NOT RENDERED.
 * The original intent was that a visible `{{AUTHOR_NAME}}` would nag the owner
 * into filling it in. In practice it shipped: eight live pages published the
 * literal string "{{AUTHOR_NAME}}" to visitors, and would have grown to
 * twenty-nine with the new articles. A crawler reads that as the page's actual
 * author text, which is worse for E-E-A-T than having no byline at all — and
 * a visitor reads it as a broken site.
 *
 * So each row renders only when its value is real. The tokens stay in
 * authority.ts as the single refill point, and the whole block disappears if
 * nothing in it is fillable, which is the correct "we are not claiming an
 * author yet" state. Dates are independent of the person, so they still show.
 */
export function Byline({
  className = '',
  /*
    Per-article overrides. Both fall back to the batch defaults in
    authority.ts, so an article that has never been revised needs to pass
    nothing, and one that has carries its own real dates.
  */
  published,
  reviewed,
}: {
  className?: string
  published?: string
  reviewed?: string
}) {
  const hasName = !isPlaceholder(author.name)
  const hasRole = !isPlaceholder(author.role)
  const hasBio = !isPlaceholder(author.bio)
  const hasReviewer = !isPlaceholder(author.reviewer)

  const publishedDate = published ?? contentDates.published
  const reviewedDate = reviewed ?? contentDates.reviewed
  const hasPublished = !isPlaceholder(publishedDate)
  const hasReviewed = !isPlaceholder(reviewedDate)

  return (
    <div className={`border-y border-border bg-card/30 ${className}`}>
      <div className="flex flex-col gap-6 px-6 py-7 sm:px-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <div className="max-w-xl">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">
            {hasName ? 'Written and reviewed by' : attribution.label}
          </p>
          {/*
            Falls back to the company's technical team rather than rendering
            nothing. An article with no author is an incomplete entity, and
            answer engines weight authorship when deciding what to cite — so
            "no byline at all" was quietly costing citations. The team line is
            true; a named individual would not be, until the owner names one.
          */}
          <p className="mt-3 font-serif text-lg tracking-tight text-foreground">
            {hasName ? author.name : attribution.team}
            {hasName && hasRole ? (
              <span className="text-muted-foreground"> · {author.role}</span>
            ) : null}
          </p>
          {hasBio ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
              {author.bio}
            </p>
          ) : null}
          {hasReviewer ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Technical review: {author.reviewer}
            </p>
          ) : null}
        </div>

        {hasPublished || hasReviewed ? (
          <dl className="flex shrink-0 gap-10 text-sm lg:gap-12">
            {hasPublished ? (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Published
                </dt>
                {/*
                  <time> with a machine-readable datetime, so the visible date
                  and the schema value are the same fact rather than two
                  strings that can drift apart.
                */}
                <dd className="mt-2 font-mono text-xs text-foreground/80">
                  <time dateTime={publishedDate}>{formatDate(publishedDate)}</time>
                </dd>
              </div>
            ) : null}
            {hasReviewed ? (
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Last reviewed
                </dt>
                <dd className="mt-2 font-mono text-xs text-foreground/80">
                  <time dateTime={reviewedDate}>{formatDate(reviewedDate)}</time>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Article key takeaways                                             */
/* ---------------------------------------------------------------- */

/**
 * The skimmable conclusions of an article, as a real `<ul>`.
 *
 * Placed directly under the quick answer so the page reads answer → claims →
 * evidence. A list is used rather than a paragraph because these are discrete
 * assertions: that is what makes them individually quotable, and it is the
 * shape an engine reaches for when it needs to build a bulleted response.
 */
export function KeyTakeaways({
  items,
  heading = 'Key takeaways',
}: {
  items: readonly string[]
  heading?: string
}) {
  if (items.length === 0) return null

  return (
    <div className="max-w-3xl">
      <h2 className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{heading}</h2>
      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
            <Check size={15} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
            <span className="text-pretty">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Article comparison table                                          */
/* ---------------------------------------------------------------- */

/**
 * A two-option comparison table for "X vs Y" articles.
 *
 * A real `<table>` with a `<caption>` and scoped row headers, because that is
 * what the content is. The first cell of each row is a `<th scope="row">` so a
 * screen reader announces "Cure sensitivity — epoxy: …" rather than reading
 * three disconnected cells, and so an engine can associate each value with the
 * dimension it describes.
 *
 * The scroll container is a focusable labelled region for the same reason as
 * the pricing cost table: a bare `overflow-x-auto` div cannot be scrolled by
 * keyboard, which silently hides the third column on a narrow viewport.
 */
export function ComparisonTable({
  caption,
  columns,
  rows,
}: {
  caption: string
  columns: readonly [string, string, string]
  rows: readonly (readonly [string, string, string])[]
}) {
  return (
    <div className="max-w-4xl">
      <div
        role="region"
        aria-label={`${caption}, scrollable horizontally`}
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="mb-5 text-left text-[0.65rem] uppercase tracking-[0.2em] text-primary">
            {caption}
          </caption>
          <thead>
            <tr className="border-y border-border">
              {columns.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`py-4 pr-6 align-bottom text-xs font-medium uppercase tracking-[0.12em] ${
                    i === 0 ? 'text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-border align-top">
                <th
                  scope="row"
                  className="py-5 pr-6 text-sm font-normal leading-relaxed text-muted-foreground"
                >
                  {row[0]}
                </th>
                <td className="py-5 pr-6 text-sm leading-relaxed text-foreground/90 text-pretty">
                  {row[1]}
                </td>
                <td className="py-5 text-sm leading-relaxed text-foreground/90 text-pretty">
                  {row[2]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground md:hidden" aria-hidden="true">
        Scroll the table sideways to compare both options.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Professional recommendation                                       */
/* ---------------------------------------------------------------- */

/**
 * A specific, first-person judgment on when to choose a system and when not
 * to. The brief flags this as the highest-value AEO block on the site, and the
 * reason is simple: competitors publish specifications, almost none of them
 * publish a defensible opinion with a "don't buy this when" attached.
 *
 * `avoidWhen` is not optional by accident — a recommendation with no stated
 * limits is marketing copy, and both readers and answer engines discount it.
 */
export function ProfessionalRecommendation({
  chooseWhen,
  avoidWhen,
  verdict,
}: {
  chooseWhen: string
  avoidWhen: string
  verdict: string
}) {
  return (
    <div className="max-w-3xl border border-border bg-card/50 p-8 lg:p-10">
      <div className="flex items-center gap-3">
        <Quote size={16} aria-hidden="true" className="shrink-0 text-primary" />
        <h3 className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">
          Professional recommendation
        </h3>
      </div>

      <p className="mt-6 font-serif text-xl leading-snug tracking-tight text-foreground text-pretty lg:text-2xl">
        {verdict}
      </p>

      <dl className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Check size={15} aria-hidden="true" className="shrink-0 text-primary" />
            Choose it when
          </dt>
          <dd className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            {chooseWhen}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-sm font-medium text-foreground">
            <X size={15} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            Look elsewhere when
          </dt>
          <dd className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
            {avoidWhen}
          </dd>
        </div>
      </dl>

      {/*
        Attribution, built from whatever is actually real.

        This was the SECOND source of the visible-token leak — it printed
        `{{AUTHOR_NAME}} · {{AUTHOR_ROLE}}` on every page carrying a
        recommendation. Falling back to the company name keeps the block
        attributed to a named entity, which is the point of the signature, while
        never publishing a token.
      */}
      <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
        {[
          !isPlaceholder(author.name) ? author.name : null,
          !isPlaceholder(author.role) ? author.role : null,
          site.company,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Suitability                                                       */
/* ---------------------------------------------------------------- */

/** Paired "best for" / "not recommended when" lists. */
export function BestFor({
  bestFor,
  notFor,
  heading = 'Where this system fits',
}: {
  bestFor: readonly string[]
  notFor: readonly string[]
  heading?: string
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h3>
      <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
        <div className="bg-background p-7 lg:p-8">
          <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Check size={15} aria-hidden="true" className="shrink-0 text-primary" />
            Best for
          </h4>
          <ul className="mt-5 space-y-3">
            {bestFor.map((b) => (
              <li key={b} className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-background p-7 lg:p-8">
          <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <AlertTriangle size={15} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            Not recommended when
          </h4>
          <ul className="mt-5 space-y-3">
            {notFor.map((n) => (
              <li key={n} className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {n}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Cost factors                                                      */
/* ---------------------------------------------------------------- */

/**
 * What moves the number, and in which direction. Deliberately carries no
 * prices itself: the published figures live in `pricing` in lib/site.ts and are
 * rendered by <Pricing>, so there is exactly one place to change them.
 */
export function CostFactors({
  factors,
  heading = 'What determines the cost',
}: {
  factors: readonly { factor: string; effect: string }[]
  heading?: string
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h3>
      <dl className="mt-8 border-t border-border">
        {factors.map((f) => (
          <div
            key={f.factor}
            className="flex flex-col gap-2 border-b border-border py-5 sm:flex-row sm:gap-8"
          >
            <dt className="shrink-0 text-sm font-medium text-foreground sm:w-64">{f.factor}</dt>
            <dd className="text-sm leading-relaxed text-muted-foreground text-pretty">{f.effect}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Installation timeline                                             */
/* ---------------------------------------------------------------- */

/**
 * Day-by-day sequence. Note what this does NOT contain: cure times and
 * return-to-service windows in hours. Those are product-specific figures from
 * a technical data sheet we have not been given, so the timeline describes
 * sequence and the caveat says where the real numbers come from.
 */
export function InstallationTimeline({
  phases,
  heading = 'How long installation takes',
}: {
  phases: readonly { phase: string; detail: string }[]
  heading?: string
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h3>
      <ol className="mt-8 border-t border-border">
        {phases.map((p, i) => (
          <li
            key={p.phase}
            className="flex flex-col gap-2 border-b border-border py-5 sm:flex-row sm:gap-8"
          >
            <span className="flex shrink-0 items-baseline gap-3 text-sm font-medium text-foreground sm:w-64">
              <span className="font-mono text-xs text-primary" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              {p.phase}
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {p.detail}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Exact cure and return-to-service times depend on the specific product installed and on slab
        and air temperature on the day. Both are stated on your written quote and in the
        manufacturer&apos;s technical data sheet, which we provide on request.
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* System comparison                                                 */
/* ---------------------------------------------------------------- */

/**
 * Multi-system comparison table. Tables get extracted far more reliably than
 * equivalent prose, so anything genuinely tabular belongs in one.
 */
export function SystemComparison({
  systems,
  rows,
  heading = 'How the systems compare',
}: {
  systems: readonly string[]
  rows: readonly { attribute: string; values: readonly string[] }[]
  heading?: string
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h3>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <caption className="sr-only">{heading}</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-4 pr-6 font-normal text-muted-foreground">
                &nbsp;
              </th>
              {systems.map((s) => (
                <th key={s} scope="col" className="py-4 pr-6 font-medium text-primary">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.attribute} className="border-b border-border align-top">
                <th scope="row" className="py-5 pr-6 font-medium text-foreground">
                  {row.attribute}
                </th>
                {row.values.map((v, i) => (
                  <td
                    key={`${row.attribute}-${systems[i] ?? i}`}
                    className="py-5 pr-6 leading-relaxed text-muted-foreground"
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Maintenance                                                       */
/* ---------------------------------------------------------------- */

/** Ordered care instructions, plus an explicit "avoid" list. */
export function MaintenanceInstructions({
  routine,
  avoid,
  heading = 'How to maintain this floor',
}: {
  routine: readonly string[]
  avoid: readonly string[]
  heading?: string
}) {
  return (
    <div>
      <h3 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h3>
      <div className="mt-8 grid gap-10 sm:grid-cols-2 sm:gap-14">
        <div>
          <h4 className="text-sm font-medium text-foreground">Routine care</h4>
          <ol className="mt-5 space-y-4">
            {routine.map((step, i) => (
              <li key={step} className="flex gap-4 text-sm leading-relaxed text-muted-foreground">
                <span className="shrink-0 font-mono text-xs text-primary" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-pretty">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h4 className="text-sm font-medium text-foreground">Avoid</h4>
          <ul className="mt-5 space-y-4">
            {avoid.map((a) => (
              <li key={a} className="flex gap-4 text-sm leading-relaxed text-muted-foreground">
                <X size={14} aria-hidden="true" className="mt-1 shrink-0 text-muted-foreground" />
                <span className="text-pretty">{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Houston climate                                                   */
/* ---------------------------------------------------------------- */

/**
 * Local technical context. This is the block that earns the word "Houston" on
 * a page — it is genuinely locally specific, which is why the rest of the
 * site does not need "Houston" jammed into every heading.
 */
export function HoustonClimateConsiderations({
  points,
  heading = 'Houston-specific considerations',
}: {
  points: readonly { title: string; body: string }[]
  heading?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <CloudRain size={16} aria-hidden="true" className="shrink-0 text-primary" />
        <h3 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h3>
      </div>
      <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {points.map((p) => (
          <div key={p.title} className="bg-background p-7">
            <h4 className="font-serif text-lg tracking-tight text-foreground">{p.title}</h4>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Glossary terms                                                    */
/* ---------------------------------------------------------------- */

/**
 * Inline definitions for the technical terms used on a page, pulled from the
 * single glossary map so a definition can never drift between two pages.
 */
export function DefinedTerms({
  terms,
  heading = 'Terms used on this page',
  /*
    Heading level, because this block is used at two different depths.

    Defaults to h2: on a service page the glossary is its own top-level section,
    a peer of "At a glance" and the FAQ. It was previously hardcoded to h3,
    which put it in the outline as a SUBSECTION of whatever h2 happened to
    precede it — on the grinding page it appeared to belong to "Why etching
    persists, and what grinding reveals". That misleads a screen reader
    navigating by heading, and misleads an answer engine about which section
    the definitions qualify.

    Kept overridable so it can still nest correctly if ever placed inside a
    section that already owns an h2.
  */
  as: Tag = 'h2',
}: {
  terms: readonly GlossaryKey[]
  heading?: string
  as?: 'h2' | 'h3'
}) {
  if (terms.length === 0) return null

  return (
    <div>
      <Tag className="font-serif text-2xl tracking-tight text-foreground">{heading}</Tag>
      <dl className="mt-8 max-w-3xl border-t border-border">
        {terms.map((key) => {
          const entry = glossary[key]
          return (
            <div key={key} className="border-b border-border py-5">
              <dt className="text-sm font-medium text-foreground">{entry.term}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
                {entry.definition}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Related projects                                                  */
/* ---------------------------------------------------------------- */

/**
 * Links to completed project pages, optionally filtered to a city or system.
 *
 * The project registry is intentionally empty until real photographed jobs
 * exist, so this renders the honest notice rather than an empty grid or, far
 * worse, invented projects.
 */
export function RelatedProjects({
  citySlug,
  system,
  excludeSlug,
  heading = 'Related completed projects',
}: {
  citySlug?: string
  system?: string
  /** Slug of the project currently being viewed, so it is never recommended. */
  excludeSlug?: string
  heading?: string
}) {
  /*
    `excludeSlug` is what keeps a project page from listing itself under "More
    work in <city>" — the pool has to exclude the current project BEFORE the
    city/system filter and before the fallback, or a city with exactly one job
    recommends the page you are already reading.
  */
  const pool = projects.filter((p) => p.slug !== excludeSlug)
  const matches = pool.filter(
    (p) => (!citySlug || p.citySlug === citySlug) && (!system || p.system === system),
  )
  /* Fall back to any other project before showing nothing at all. */
  const shown = (matches.length > 0 ? matches : pool).slice(0, 3)

  /*
    RENDER NOTHING when there are no projects to relate to.

    This used to fall back to a dashed "Awaiting real data" card repeating
    `portfolioNotice`. Because this component is embedded on service and city
    pages, that put the same "archive is being built" paragraph on many URLs at
    once — the exact repetition the content brief prohibits — and it did it
    under a heading promising related work, which makes the empty state read
    worse than no section.

    /projects/ is the one page where the archive's status is genuinely the
    subject, so that is the only place the notice now appears. Everywhere else
    an empty project list means this block disappears entirely.
  */
  if (shown.length === 0) return null

  return (
    <div>
      <h3 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h3>

      <ul className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.slug} className="bg-background">
              <Link
                href={`/projects/${p.slug}/`}
                className="flex h-full flex-col gap-2 p-6 transition-colors hover:bg-secondary"
              >
                <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                  {p.city} · {p.spaceType}
                </span>
                <span className="font-serif text-lg tracking-tight text-foreground text-pretty">
                  {p.title}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{p.system}</span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Sources                                                           */
/* ---------------------------------------------------------------- */

/**
 * Published standards this site's technical positions rest on, plus an
 * explicit statement of what we will not quote and why.
 *
 * Not hyperlinked: these standards sit behind paywalls, and linking to a
 * reseller's listing page is not a citation.
 */
export function SourcesAndTechnicalReferences({
  heading = 'Sources and technical references',
}: {
  heading?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <ScrollText size={16} aria-hidden="true" className="shrink-0 text-primary" />
        <h3 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h3>
      </div>

      <dl className="mt-8 max-w-3xl border-t border-border">
        {technicalReferences.map((ref) => (
          <div key={ref.ref} className="border-b border-border py-5">
            <dt className="text-sm font-medium text-foreground">
              <span className="font-mono text-xs text-primary">{ref.org}</span>
              <span className="ml-3">{ref.ref}</span>
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
              {ref.covers}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 max-w-3xl text-xs leading-relaxed text-muted-foreground text-pretty">
        {referenceCaveat}
      </p>
    </div>
  )
}

/**
 * The glossary block for a route, reading its term list from `pageTerms`.
 *
 * Wraps `DefinedTerms` so a page spends one line instead of importing the
 * glossary and hand-maintaining an array of keys inline — which is how two
 * pages end up disagreeing about which terms they bothered to define.
 */
export function PageTerms({ routeKey, heading }: { routeKey: RouteKey; heading?: string }) {
  const terms = pageTerms[routeKey]
  if (!terms?.length) return null
  return <DefinedTerms terms={terms} {...(heading ? { heading } : {})} />
}

/* ---------------------------------------------------------------- */
/* At-a-glance spec block                                            */
/* ---------------------------------------------------------------- */

/** One labeled row. Arrays render as a list; strings render as a paragraph. */
function SpecRow({ label, value }: { label: string; value: string | readonly string[] }) {
  return (
    <div className="grid gap-2 border-b border-border py-5 sm:grid-cols-[13rem_1fr] sm:gap-8">
      <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{label}</dt>
      <dd className="text-sm leading-relaxed text-foreground/90">
        {Array.isArray(value) ? (
          <ul className="flex flex-col gap-2">
            {value.map((v) => (
              <li key={v} className="flex gap-3 text-pretty">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-primary" />
                {v}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-pretty">{value}</span>
        )}
      </dd>
    </div>
  )
}

/**
 * The labeled, extractable spec table for a service page.
 *
 * Rendered as a real `<dl>` because that is what the content is — key/value
 * pairs. An answer engine lifts a definition list far more reliably than the
 * same facts buried in paragraphs, and a screen reader announces it as a
 * term/definition pair rather than as undifferentiated text. Same reason the
 * "what drives cost" value is a `<ul>` and not a comma-run sentence.
 *
 * DELIBERATE OVERLAP HANDLING
 * Ten of the twelve service pages already render `ProfessionalRecommendation`
 * (verdict, choose when, avoid when) and two also render `BestFor`, both driven
 * by `pageAnswers`. Emitting the spec's `verdict` / `bestFor` /
 * `notRecommendedWhen` unconditionally would print the same guidance twice
 * within one screen — the exact repetition problem that made the old /reviews/
 * page read badly.
 *
 * So those three fields are suppressed when the route's answer entry already
 * covers them, and rendered when it does not. Every page ends up with all the
 * labeled fields present exactly once; only the source differs.
 */
export function AtAGlance({
  routeKey,
  heading = 'At a glance',
}: {
  routeKey: RouteKey
  heading?: string
}) {
  const spec = pageSpecs[routeKey]
  if (!spec) return null

  const answer = pageAnswers[routeKey]
  /* Already shown above by PageAnswer — don't repeat it here. */
  const hasVerdictAbove = Boolean(answer?.recommendation)
  const hasListsAbove = Boolean(answer?.recommendation || answer?.suitability)

  return (
    <div>
      <h2 className="font-serif text-2xl tracking-tight text-foreground">{heading}</h2>
      <dl className="mt-8 max-w-4xl border-t border-border">
        {!hasVerdictAbove ? <SpecRow label="Quick answer" value={spec.verdict} /> : null}
        {!hasListsAbove ? <SpecRow label="Best for" value={spec.bestFor} /> : null}
        {!hasListsAbove ? (
          <SpecRow label="Not recommended when" value={spec.notRecommendedWhen} />
        ) : null}

        <SpecRow label="Installation time" value={spec.installationTime} />
        {spec.returnToService ? (
          <SpecRow label="Return to service" value={spec.returnToService} />
        ) : null}
        {spec.preparationMethod ? (
          <SpecRow label="Preparation method" value={spec.preparationMethod} />
        ) : null}
        {spec.warranty ? <SpecRow label="Warranty" value={spec.warranty} /> : null}
        <SpecRow label="What drives cost" value={spec.whatDrivesCost} />
      </dl>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Per-route composite                                               */
/* ---------------------------------------------------------------- */

/**
 * Renders whatever answer content exists for a route: the opening answer, plus
 * the professional recommendation and suitability lists when that route has
 * them.
 *
 * Exists so each page needs one line rather than three imports and a block of
 * duplicated markup, and so a route with no entry in `pageAnswers` renders
 * nothing instead of an empty section wrapper.
 */
export function PageAnswer({ routeKey }: { routeKey: RouteKey }) {
  const entry = pageAnswers[routeKey]
  if (!entry) return null

  return (
    <div className="flex flex-col gap-14">
      <QuickAnswer question={entry.question} answer={entry.quickAnswer} />

      {entry.recommendation ? (
        <ProfessionalRecommendation
          verdict={entry.recommendation.verdict}
          chooseWhen={entry.recommendation.chooseWhen}
          avoidWhen={entry.recommendation.avoidWhen}
        />
      ) : null}

      {entry.suitability ? (
        <BestFor
          bestFor={entry.suitability.bestFor}
          notFor={entry.suitability.notFor}
        />
      ) : null}
    </div>
  )
}
