import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { site, assurances } from '@/lib/site'
import { r } from '@/lib/routes'

/* Closing conversion block used at the foot of every subpage. */
export function CtaBand({
  title = 'Get an itemized quote after we have seen your concrete',
  body = 'Every estimate is free, happens onsite, and comes back itemized. No payment is due upfront.',
}: {
  title?: string
  body?: string
}) {
  return (
    <section className="border-y border-border bg-card/40 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">{body}</p>
        </div>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href={r('schedule')}
            className="inline-flex items-center gap-2 bg-primary px-7 py-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Schedule a free estimate
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <a
            href={site.phoneHref}
            className="inline-flex items-center gap-2 border border-border px-7 py-4 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Phone size={16} aria-hidden="true" />
            {site.phone}
          </a>
        </div>

        <ul className="mt-9 flex flex-wrap gap-x-8 gap-y-2">
          {assurances.map((a) => (
            <li key={a} className="text-[0.75rem] text-muted-foreground">
              {a}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
