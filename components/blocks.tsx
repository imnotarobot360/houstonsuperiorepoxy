import Link from 'next/link'
import { ArrowUpRight, Check, Plus } from 'lucide-react'
import { site, socialProfiles } from '@/lib/site'

/* ---------------------------------------------------------------- */
/* Layout                                                           */
/* ---------------------------------------------------------------- */

export function Section({
  children,
  className = '',
  bleed = false,
  id,
}: {
  children: React.ReactNode
  className?: string
  bleed?: boolean
  id?: string
}) {
  return (
    <section
      id={id}
      className={`${bleed ? 'border-y border-border bg-card/40' : ''} py-20 lg:py-24 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">{children}</div>
    </section>
  )
}

/* H2 + optional intro. Kept at h2 so subpage hierarchy stays H1 → H2 → H3. */
export function Heading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string
  title: string
  intro?: string
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">{intro}</p>}
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Content                                                          */
/* ---------------------------------------------------------------- */

/** Long-form body copy with H3 subheads. */
export function Prose({
  sections,
}: {
  sections: { heading: string; paras: readonly string[] }[]
}) {
  return (
    <div className="max-w-3xl">
      {sections.map((s, i) => (
        <div key={s.heading} className={i > 0 ? 'mt-12' : ''}>
          <h3 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
            {s.heading}
          </h3>
          {s.paras.map((p) => (
            <p key={p} className="mt-4 leading-relaxed text-muted-foreground text-pretty">
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Bordered card grid. */
export function CardGrid({
  items,
  cols = 3,
}: {
  items: { title: string; body: string; tag?: string }[]
  cols?: 2 | 3
}) {
  return (
    <div
      className={`mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 ${
        cols === 3 ? 'lg:grid-cols-3' : ''
      }`}
    >
      {items.map((it) => (
        <div key={it.title} className="bg-background p-7 lg:p-8">
          {it.tag && (
            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">{it.tag}</p>
          )}
          <h3 className="mt-3 font-serif text-xl tracking-tight text-foreground">{it.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">{it.body}</p>
        </div>
      ))}
    </div>
  )
}

/** Checklist. */
export function CheckList({ items, className = '' }: { items: readonly string[]; className?: string }) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
          <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
          <span className="text-pretty">{i}</span>
        </li>
      ))}
    </ul>
  )
}

/** Numbered step list, used by the process pages. */
export function Steps({ steps }: { steps: readonly { step: string; text: string }[] }) {
  return (
    <ol className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((s) => (
        <li key={s.step} className="flex gap-5 bg-background p-7">
          <span className="font-mono text-xs text-primary" aria-hidden="true">
            {s.step}
          </span>
          <p className="text-sm leading-relaxed text-foreground/90 text-pretty">{s.text}</p>
        </li>
      ))}
    </ol>
  )
}

/** Accordion FAQ + no schema (page owner emits FAQPage where appropriate). */
export function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="mt-12 max-w-4xl border-t border-border">
      {items.map((f) => (
        <details key={f.q} className="group border-b border-border">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left">
            <span className="font-serif text-lg tracking-tight text-foreground">{f.q}</span>
            <Plus
              size={18}
              aria-hidden="true"
              className="mt-1 shrink-0 text-primary transition-transform duration-300 group-open:rotate-45"
            />
          </summary>
          <p className="pb-6 leading-relaxed text-muted-foreground text-pretty lg:max-w-3xl">
            {f.a}
          </p>
        </details>
      ))}
    </div>
  )
}

/** Contextual internal links — the crawl paths between sibling pages. */
export function RelatedLinks({
  heading = 'Keep reading',
  links,
}: {
  heading?: string
  links: readonly { label: string; href: string; blurb?: string }[]
}) {
  return (
    <div>
      <h2 className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">{heading}</h2>
      <ul className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <li key={l.href} className="bg-background">
            <Link href={l.href} className="flex h-full flex-col gap-2 p-6 hover:bg-secondary">
              <span className="flex items-start justify-between gap-3 font-serif text-lg tracking-tight text-foreground">
                {l.label}
                <ArrowUpRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
              </span>
              {l.blurb && (
                <span className="text-sm leading-relaxed text-muted-foreground">{l.blurb}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The business's official profiles elsewhere on the web.
 *
 * Reads `socialProfiles` directly rather than taking a prop, because this and
 * schema `sameAs` must always assert the same set — a prop would let a page
 * pass a subset and quietly disagree with the entity graph.
 *
 * Renders nothing when the list is empty, so no page ends up with a heading
 * over a blank space if the profiles are ever pulled.
 *
 * `rel="me"` is deliberate: it is the microformats relation for "this profile
 * is the same person/organisation as this site", which is the HTML-level
 * counterpart to the `sameAs` assertion in the JSON-LD. Verification is
 * strongest when the site and the profile point at each other, so each profile
 * should link back to houstonsuperiorepoxy.com in its own bio.
 */
export function SocialProfiles({
  heading = 'Official profiles',
  intro,
}: {
  heading?: string
  intro?: string
}) {
  if (socialProfiles.length === 0) return null

  return (
    <div>
      <h2 className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">{heading}</h2>
      {intro && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
          {intro}
        </p>
      )}
      <ul className="mt-6 flex flex-wrap gap-px border border-border bg-border">
        {socialProfiles.map((s) => (
          <li key={s.href} className="min-w-[12rem] flex-1 bg-background">
            <a
              href={s.href}
              target="_blank"
              rel="me noopener noreferrer"
              aria-label={`${site.company} on ${s.label} (opens in a new tab)`}
              className="flex h-full items-start justify-between gap-3 p-6 hover:bg-secondary"
            >
              <span className="font-serif text-lg tracking-tight text-foreground">{s.label}</span>
              <ArrowUpRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Two-column comparison table. */
export function CompareTable({
  rows,
  oursLabel,
  theirsLabel,
}: {
  rows: readonly { point: string; ours: string; theirs: string }[]
  oursLabel: string
  theirsLabel: string
}) {
  return (
    <div className="mt-14 overflow-x-auto">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-4 pr-6 font-normal text-muted-foreground">
              &nbsp;
            </th>
            <th scope="col" className="py-4 pr-6 font-medium text-primary">
              {oursLabel}
            </th>
            <th scope="col" className="py-4 font-normal text-muted-foreground">
              {theirsLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.point} className="border-b border-border align-top">
              <th scope="row" className="py-5 pr-6 font-medium text-foreground">
                {row.point}
              </th>
              <td className="py-5 pr-6 leading-relaxed text-foreground/85">{row.ours}</td>
              <td className="py-5 leading-relaxed text-muted-foreground">{row.theirs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * A section that has no content yet, stated plainly to the reader.
 *
 * The eyebrow used to read "Awaiting real data" — internal build language on a
 * production page, which reads as an unfinished site rather than as an honest
 * status. The heading and body passed in already say what is pending and why,
 * so the eyebrow now just labels the section instead of announcing a gap.
 *
 * Still deliberately dashed: it should look different from a real content card
 * so nobody mistakes it for finished work. Use this only where the absence is
 * itself worth explaining to a visitor — if a section has nothing to say and
 * no reason to justify, omit the section instead (see the city pages, which
 * used to render one of these on every URL).
 */
export function PendingBlock({
  heading,
  body,
  className = '',
}: {
  heading: string
  body: string
  className?: string
}) {
  return (
    <div
      className={`border border-dashed border-border bg-card/50 p-8 lg:p-10 ${className}`}
    >
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-primary">In progress</p>
      <h3 className="mt-3 font-serif text-xl tracking-tight text-foreground">{heading}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
        {body}
      </p>
    </div>
  )
}
