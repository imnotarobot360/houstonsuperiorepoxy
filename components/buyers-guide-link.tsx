import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { r, routes } from '@/lib/routes'

/*
  Featured link to the buyer's guide, dropped into the related-reading section
  of every service page.

  WHY THIS IS A COMPONENT AND NOT A SEVENTH GRID CELL: every service page's
  RelatedLinks list holds exactly six items, and that grid is
  `sm:grid-cols-2 lg:grid-cols-3` — six fills both layouts evenly (2+2+2 and
  3+3). A seventh item strands one card alone on a final row at both
  breakpoints. Adding it as a distinct featured band instead keeps the grid
  balanced, gives the guide a more prominent position than a grid cell would,
  and lets the anchor carry descriptive text rather than a two-word label,
  which is worth more as an internal link.

  Implemented once and reused so twelve pages cannot drift apart, and so the
  destination is read from the route registry rather than hardcoded twelve
  times.

  `KEY` is intentionally not a prop: this component exists to point at one
  page. If it ever needs to point at another, that is a different component
  with a different rationale.
*/

const KEY = 'chooseContractor' as const

export function BuyersGuideLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href={r(KEY)}
      className={`group flex flex-col gap-4 border border-border bg-card/40 p-7 transition-colors hover:border-primary/50 hover:bg-secondary sm:flex-row sm:items-center sm:justify-between sm:gap-8 lg:p-8 ${className}`}
    >
      <div className="max-w-2xl">
        <p className="text-[0.65rem] uppercase tracking-[0.18em] text-primary">
          Before you hire anyone
        </p>
        <p className="mt-3 font-serif text-xl tracking-tight text-foreground text-pretty">
          {routes[KEY].h1}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
          Fourteen checks, what a good answer sounds like, and the questions to read
          aloud during an estimate. Written to be used against us as readily as anyone
          else.
        </p>
      </div>
      <ArrowUpRight
        size={20}
        aria-hidden="true"
        className="shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </Link>
  )
}
