'use client'

import { Heart } from 'lucide-react'
import { flakeBlends } from '@/lib/content/flake-blends'
import { SHORTLIST_FIELD } from '@/lib/shortlist'
import { useShortlist } from './use-shortlist'

/*
  Carries the shortlist into the estimate submission.

  This is the half of the feature that is actually worth building. Hearts that
  never leave the browser are decoration; this is what puts "bring the Coyote,
  Basalt and Nightfall boards" in front of whoever loads the van.

  IT IS VISIBLE, NOT A BARE HIDDEN INPUT. The customer can see exactly what is
  being attached to their request and remove any of it before sending. Silently
  posting a list of their browsing behaviour alongside their phone number —
  even a list they built themselves — is not something to do out of sight.

  Renders nothing when the shortlist is empty, so the form is unchanged for
  anyone who did not use it.
*/
export function ShortlistField() {
  const { slugs, count, hydrated, toggle } = useShortlist()

  if (!hydrated || count === 0) return null

  const chosen = slugs
    .map((slug) => flakeBlends.find((b) => b.slug === slug))
    .filter((b): b is (typeof flakeBlends)[number] => Boolean(b))

  return (
    <div className="border border-border bg-card/40 p-5">
      {/*
        The names, not the slugs. app/actions/estimate.ts re-derives the names
        server-side from these slugs rather than trusting this string — see the
        note there. Posting slugs keeps the payload small and the source of
        truth in one place.
      */}
      <input type="hidden" name={SHORTLIST_FIELD} value={slugs.join(',')} />

      <p className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-primary">
        <Heart size={12} aria-hidden="true" fill="currentColor" />
        Your blend shortlist
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
        We will bring these sample boards to your estimate so you can see them on your own slab,
        under your own light.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {chosen.map((b) => (
          <li key={b.slug}>
            <button
              type="button"
              onClick={() => toggle(b.slug)}
              aria-label={`Remove ${b.name} from your shortlist`}
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {b.name}
              <span aria-hidden="true">&times;</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
