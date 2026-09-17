import Link from 'next/link'
import { MapPin, Phone, ShieldCheck } from 'lucide-react'
import { SystemBuildup } from '@/components/system-buildup'
import { assurances, site } from '@/lib/site'
import { r } from '@/lib/routes'

/*
  Section 3 of the homepage.

  The H1 is the search-intent headline. The line directly beneath it —
  "Ground to bare concrete. Finished like furniture." — is the brand's actual
  competitive wedge and must not be deleted or demoted: every competitor in
  this market sells on price and speed, none sell on preparation rigor.

  One FILLED CTA only — "Schedule My Free Estimate". "Preview Your Floor"
  beside it is outlined, and the phone number below is plain text. That ranking
  is deliberate and is the thing to preserve if this block is edited: the
  moment a second button is filled, neither reads as the primary action.
*/
export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklab,var(--color-primary)_9%,transparent),transparent_60%)]"
      />

      <div className="mx-auto grid max-w-7xl gap-14 px-5 pt-16 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-10 lg:pt-24 lg:pb-28">
        <div>
          {/* Houston location signal, above the fold and in text. */}
          <p className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary">
            <MapPin size={13} aria-hidden="true" />
            Houston, TX &amp; Greater Houston
          </p>

          <h1 className="mt-7 max-w-3xl font-serif text-[2.4rem] leading-[1.06] tracking-tight text-balance sm:text-5xl lg:text-[3.9rem]">
            Premium Garage Floor Coatings in Houston, TX
          </h1>

          {/* The positioning line. Signature element — keep it loud. */}
          <p className="mt-6 font-serif text-xl italic leading-snug text-primary text-balance sm:text-2xl">
            Ground to bare concrete. Finished like furniture.
          </p>

          <p className="mt-7 max-w-xl leading-relaxed text-muted-foreground text-pretty">
            Transform damaged, stained, or unfinished concrete with a professionally installed
            full-broadcast flake floor designed for Houston homes, garages, workshops, and
            commercial spaces.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={r('schedule')}
              className="bg-primary px-8 py-4 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Schedule My Free Estimate
            </Link>
            {/*
              Secondary, outlined — never filled. The estimate is the only
              filled button in this viewport and this must not compete with it.

              It earns the slot because choosing a blend is the question a
              visitor actually arrives with, and /floor-designer/ answers it
              without asking for a phone number first. Tagged for GA4 via the
              delegated listener in components/analytics-events.tsx, which is
              what keeps this a server component.
            */}
            <Link
              href={r('floorDesigner')}
              data-analytics-cta="preview_floor"
              className="border border-border px-8 py-4 text-center text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Preview Your Floor →
            </Link>
          </div>

          {/*
            The phone number was a full-width bordered button beside the
            estimate CTA. On mobile that made three stacked blocks of equal
            weight, and it duplicated the sticky Call / Free estimate bar
            (components/mobile-call-bar.tsx) sitting a thumb's width below it.

            Demoted to a text link: still above the fold, still one tap, still
            picked up as a `phone_click` by the delegated tel: listener, but no
            longer competing with the two buttons above it.
          */}
          <p className="mt-5">
            <a
              href={site.phoneHref}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Phone size={14} aria-hidden="true" />
              Call or Text {site.phone}
            </a>
          </p>

          {/* Three trust indicators — confirmed facts only. */}
          <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            {assurances.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <ShieldCheck size={14} className="shrink-0 text-primary" aria-hidden="true" />
                <span className="text-xs text-muted-foreground">{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/*
          Was an empty "hero project photo" slot. It is now a cross-section of
          the system we install, which argues the preparation case that a
          finished-floor photograph cannot.

          Still no stock or AI imagery presented as our work: the only photo
          inside is a labeled material sample of loose flake. When real project
          photography exists, it belongs here — see SystemBuildup for the note.
        */}
        <SystemBuildup />
      </div>
    </section>
  )
}
