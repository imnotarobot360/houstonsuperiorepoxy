import { ShieldCheck, Star, MapPin } from 'lucide-react'
import { assurances } from '@/lib/site'
import { REVIEWS, reviewsEnabled } from '@/lib/pricing-config'

/*
  Social-proof bar shown above Step 1 of the estimator (spec item 3).

  It states only what is TRUE for this entity: the written 5-year workmanship
  warranty, $2M insurance, no upfront payment, and the Greater Houston service
  area (all from lib/site `assurances`).

  Reviews are GATED (see lib/pricing-config REVIEWS). A numeric Google rating and
  review count appear ONLY once the epoxy division's own verified numbers are
  filled in — never the parent company's, which would be false attribution. Until
  then, if a profile URL is set we show a plain "Read our Google reviews" link
  with no numeric claim; if not, no review element renders at all.
*/
export function ProofBar() {
  return (
    <div className="mx-auto mb-8 max-w-2xl">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-lg border border-border bg-card/60 px-5 py-4 text-sm">
        {reviewsEnabled ? (
          <a
            href={REVIEWS.profileUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-semibold text-foreground"
          >
            <Star size={16} className="fill-primary text-primary" aria-hidden="true" />
            {REVIEWS.rating?.toFixed(1)}
            <span className="font-normal text-muted-foreground">
              ({REVIEWS.count?.toLocaleString('en-US')} Google reviews)
            </span>
          </a>
        ) : (
          REVIEWS.profileUrl && (
            <a
              href={REVIEWS.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
            >
              <Star size={16} className="text-primary" aria-hidden="true" />
              Read our Google reviews
            </a>
          )
        )}

        {assurances.map((item) => (
          <span key={item} className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck size={16} className="text-primary" aria-hidden="true" />
            {item}
          </span>
        ))}

        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin size={16} className="text-primary" aria-hidden="true" />
          Greater Houston service area
        </span>
      </div>
    </div>
  )
}
