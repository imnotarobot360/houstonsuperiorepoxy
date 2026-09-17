import Link from 'next/link'
import { Phone } from 'lucide-react'
import { assurances, site } from '@/lib/site'
import { r } from '@/lib/routes'

/*
  Section 13 of the homepage. One primary CTA (schedule); the phone link is
  styled as the secondary action rather than competing with it.
*/
export function FinalCta() {
  return (
    <section id="estimate" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="relative isolate overflow-hidden border border-border bg-card/40 px-7 py-16 lg:px-16 lg:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent_65%)]"
          />

          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
              Ready to Transform Your Concrete?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">
              Schedule a free onsite assessment and receive a professional recommendation based on
              your concrete, project goals, and preferred finish.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={r('schedule')}
                className="bg-primary px-8 py-4 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Schedule My Free Estimate
              </Link>
              <a
                href={site.phoneHref}
                className="flex items-center justify-center gap-2 border border-border px-8 py-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Phone size={16} aria-hidden="true" />
                Call or Text {site.phone}
              </a>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-8">
              {assurances.map((a) => (
                <li key={a} className="text-xs text-muted-foreground">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
