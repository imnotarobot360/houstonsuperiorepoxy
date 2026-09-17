import { ArrowUpRight } from 'lucide-react'
import { verifiedReviews } from '@/content/reviews'
import { site } from '@/lib/site'

/*
  Verified customer quotes on the homepage.

  RENDERS NOTHING UNTIL A VERIFIED REVIEW EXISTS. content/reviews.ts ships
  empty, so today this returns null and the homepage is unchanged. That is the
  intended resting state, not a temporary gap to fill with an example.

  NO STARS, NO RATING, NO COUNT — not here and not anywhere else on the site.
  The 4.9 / 200+ figure belongs to Houston Superior Painting; this division has
  its own profile and its own much smaller number. A five-star row with no
  figure beside it still reads as a rating, so that is out too. See the standing
  note in components/reviews.tsx.

  Three at most. An endless wall of quotes reads as curated whether or not it
  is, and the "read all reviews on Google" link below is the honest answer to
  anyone who wants the full picture — including the reviews we would not have
  chosen.
*/
export function HomeownerReviews() {
  /* Only verified entries are ever eligible — see the Review type. */
  const shown = verifiedReviews.slice(0, 3)
  if (shown.length === 0) return null

  return (
    <section id="homeowner-reviews" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-primary">
          In their words
        </p>
        <h2 className="mt-5 max-w-3xl font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
          What Houston homeowners say
        </h2>

        <ul className="mt-14 grid gap-px border border-border bg-border lg:grid-cols-3">
          {shown.map((review) => (
            <li key={review.sourceUrl} className="flex flex-col bg-background p-8">
              {/*
                <blockquote> with cite, because this is a quotation from a
                traceable source rather than decorative text. The quote is
                rendered verbatim — see rule 1 in content/reviews.ts.
              */}
              <blockquote cite={review.sourceUrl} className="flex-1">
                <p className="leading-relaxed text-muted-foreground text-pretty">
                  &ldquo;{review.text}&rdquo;
                </p>
              </blockquote>
              <footer className="mt-7">
                <p className="font-serif text-lg tracking-tight text-foreground">
                  {review.name}
                  <span className="text-muted-foreground"> · {review.neighborhood}</span>
                </p>
                <p className="mt-1 text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
                  {review.date}
                </p>
              </footer>
            </li>
          ))}
        </ul>

        <p className="mt-10">
          <a
            href={site.googleBusinessProfile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            Read all reviews on Google
            <ArrowUpRight size={15} aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </p>
      </div>
    </section>
  )
}
