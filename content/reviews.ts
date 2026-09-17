/*
  ============================================================================
  CUSTOMER REVIEWS — INTENTIONALLY EMPTY
  ============================================================================

  Every entry here is published on the homepage as a quote attributed to a real
  Houston homeowner. There is no "example" or "placeholder" mode: a crawler, an
  answer engine and a visitor all read a placeholder review as a review.

  THE 4.9 / 200+ FIGURE DOES NOT BELONG TO THIS BUSINESS. Those reviews are
  Houston Superior Painting's. Houston Superior Epoxy is a separate Google
  Business Profile with its own, much smaller, review count. Copying the parent
  company's aggregate onto this site is false attribution — see the standing
  note in components/reviews.tsx, which is where that number was removed from.

  RULES FOR ADDING AN ENTRY
    1. VERBATIM `text`. Trim whitespace, nothing else. No tightening, no fixing
       spelling, no dropping the sentence about the delay. An edited review is
       a review we wrote.
    2. `sourceUrl` must point at the review where it can be read unedited. That
       is what separates a citation from a testimonial: the reader can check it.
    3. `verified: true` means a specific person has opened `sourceUrl` and
       confirmed the text matches. It is not a formatting flag and it is not
       set optimistically — an unverified entry simply does not render.
    4. `name` is a first name only, `neighborhood` is an area ("Cypress",
       "Memorial"), never a street or a subdivision. This is a customer's home.
*/

export type Review = {
  /** First name only. Never a full name. */
  name: string
  /** Area-level location only — same privacy rule as the project registry. */
  neighborhood: string
  /** VERBATIM review text, exactly as the customer wrote it. */
  text: string
  /** As displayed on the source review, e.g. "August 2026". */
  date: string
  /** Where the review can be read unedited. Required — see rule 2. */
  sourceUrl: string
  /**
   * Someone has opened `sourceUrl` and confirmed this text matches.
   *
   * The homepage section renders only entries where this is true, and hides
   * itself entirely when none are. So the failure mode of forgetting to verify
   * is "the section does not appear", never "an unchecked quote is published".
   */
  verified: boolean
}

/*
  EMPTY. Add nothing here that has not been read at its sourceUrl.

  TEMPLATE — kept as a comment on purpose. As live code it would be a fabricated
  review the moment someone deleted the surrounding braces.

  {
    name: 'Marcus',
    neighborhood: 'Cypress',
    text: '...',                       // verbatim, unedited
    date: 'August 2026',
    sourceUrl: 'https://www.google.com/maps/...',
    verified: true,                     // only after reading it at sourceUrl
  }
*/
export const reviews: Review[] = []

/** The verified subset — the only entries any component may render. */
export const verifiedReviews = reviews.filter((r) => r.verified)

/*
  ============================================================================
  OWNER: RATING AND REVIEW COUNT — DELIBERATELY NOT SET
  ============================================================================

  Uncomment and fill these two ONLY with the figures shown on the Houston
  Superior Epoxy Google Business Profile itself:

      https://www.google.com/maps?cid=12278763065042880776

  Not the Houston Superior Painting profile, and not a total of the two. At the
  time of writing that profile has fewer than 25 reviews, so the honest number
  is small — which is fine, and is still worth more than a borrowed one.

  Nothing reads these yet. Wiring them up means rendering a star row and an
  AggregateRating, and BOTH must appear together or not at all: a visible rating
  without the markup under-sells it, and markup without the visible rating is a
  structured-data violation. Whoever turns this on should do both in one change.

  export const rating = 0      // e.g. 5.0 — exactly as the profile shows it
  export const reviewCount = 0 // e.g. 18  — exactly as the profile shows it
*/
