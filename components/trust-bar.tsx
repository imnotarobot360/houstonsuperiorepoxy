import {
  Building2,
  CalendarDays,
  HandCoins,
  Layers,
  type LucideIcon,
  ShieldCheck,
} from 'lucide-react'
import { trackRecord } from '@/lib/site'

/*
  Section 4 of the homepage.

  ONLY owner-confirmed facts appear here. The two counts in `record` were
  previously visible {{TOKENS}}; they are now confirmed values, so they render
  with the same weight as the credentials above them.

  Nothing in this file may be estimated. An invented "10+ years" or
  "1,500 floors" is an unverifiable claim, and unverifiable claims on a
  contractor's site are a Google Business Profile risk as well as a trust
  problem. See the maintenance note on `trackRecord` in lib/site.ts — the
  years count needs an annual re-check.
*/

/*
  Explicitly typed rather than `as const`: with a const array the members form
  a union, and TypeScript will not let you read `href` or `fill` off a member
  that lacks them. Declaring the optional fields up front keeps the render
  loop simple.
*/
type Fact = {
  value: string
  label: string
  icon: LucideIcon
  href?: string
  fill?: boolean
}

/*
  Insurance, warranty and terms. Merged into `facts` below.

  The "4.9 · Google rating · 200+ reviews" cell was removed from the front of
  this list: those are the parent company's reviews, so presenting them as this
  division's headline credential was false attribution. `fill` on the Fact type
  existed only for that cell's filled star and is now unused by any entry — kept
  on the type rather than removed, since it is the natural way to render a
  rating cell if the epoxy profile earns one.
*/
const credentials: Fact[] = [
  { value: '$2M', label: 'Liability + workers’ comp', icon: ShieldCheck },
  { value: '5-Year', label: 'Written workmanship warranty', icon: ShieldCheck },
  { value: '$0', label: 'Due upfront', icon: HandCoins },
  { value: 'Res. + Com.', label: 'Residential & commercial', icon: Building2 },
]

/*
  The owner-confirmed track record, appended to `facts` above rather than kept
  in a separate row.

  These were previously a dimmed second row because they were unconfirmed
  tokens. Now that they are real they join one grid.

  Six items after the Google rating cell was removed, which grids more evenly
  than the previous seven: exact rows at 2-col and sm 3-col, two trailing gaps
  at lg 4-col. Adding a seventh item to "balance" the row would mean inventing a
  credential, which is the trade this file exists to refuse.
*/
const facts: Fact[] = [
  { value: trackRecord.yearsInBusiness, label: 'Years in business', icon: CalendarDays },
  { value: trackRecord.projectsCompleted, label: 'Projects completed', icon: Layers },
  ...credentials,
]

/*
  One cell, shared by both rows so the confirmed track record cannot drift
  visually from the credentials above it.
*/
function FactCell({ fact }: { fact: Fact }) {
  const Icon = fact.icon
  const inner = (
    <>
      <dt className="flex items-center gap-2">
        <Icon
          size={14}
          aria-hidden="true"
          className={`shrink-0 text-primary ${fact.fill ? 'fill-primary' : ''}`}
        />
        <span className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
          {fact.label}
        </span>
      </dt>
      <dd className="mt-3 font-serif text-2xl leading-none text-foreground lg:text-[1.75rem]">
        {fact.value}
      </dd>
    </>
  )

  return (
    <div className="bg-card/40 px-5 py-7 lg:px-6">
      {fact.href ? (
        <a
          href={fact.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block transition-colors hover:text-primary"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  )
}

export function TrustBar() {
  return (
    <section aria-labelledby="trust-heading" className="border-y border-border bg-card/40">
      <h2 id="trust-heading" className="sr-only">
        Credentials and terms
      </h2>

      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        {/* 4 columns at lg so seven items leave one trailing gap, not three. */}
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
          {facts.map((f) => (
            <FactCell key={f.label} fact={f} />
          ))}
        </dl>

        <p className="py-5 text-xs leading-relaxed text-muted-foreground">
          Insurance certificates and a sample warranty are available on request.
        </p>
      </div>
    </section>
  )
}
