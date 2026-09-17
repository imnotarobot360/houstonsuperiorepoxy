import { ArrowUpRight } from 'lucide-react'
import { site } from '@/lib/site'

/*
  NO RATING NUMBER, NO REVIEW COUNT, NO STARS. DO NOT ADD THEM BACK.

  This block used to read "Rated 4.9 across 200+ Google reviews" beside a
  five-star row. Those reviews belong to Houston Superior Painting, a separate
  business — so displaying them as this division's rating was false attribution,
  and the matching AggregateRating markup made the same claim to Google.

  The five-star row went with the number. Five filled stars next to no figure
  still reads as a rating, which would be the same claim made visually.

  What is left is the part that was always true: the corporate relationship, and
  a link to the epoxy division's own profile. The reader gets the real number
  from the source instead of a number we asserted.
*/
export function Reviews() {
  return (
    <section id="reviews" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <div className="grid gap-12 border border-border bg-card/40 p-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:p-14">
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary">
              Reviews
            </p>
            <h2 className="mt-5 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
              Read our Google reviews
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground text-pretty">
              {site.company} is the concrete coatings division of {site.parentCompany}, an
              established Houston painting contractor. Our coatings work is reviewed on its own
              Google Business Profile — unedited and in full, including anything less than glowing.
            </p>
          </div>

          <div className="flex flex-col items-start gap-6 lg:items-end">
            <a
              href={site.googleBusinessProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-border px-6 py-3.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              Read our Google reviews
              <ArrowUpRight size={16} aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
