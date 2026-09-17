import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

/*
  Entry points to the FlakeColor mobile catalog.

  WHY THESE LINK TO /app/ AND NOT TO THE CATALOG DIRECTLY
  /app/ is the short URL printed on QR codes (sample boards, door hangers, the
  estimate folder) and it redirects to FLAKECOLOR_URL — see next.config.mjs. On
  the site we link to the same hop rather than to the catalog URL, so the
  catalog's address lives in exactly one place. When it changes, one
  environment variable moves and both the printed codes and these links follow.

  WHY THEY RENDER NOTHING WHEN THE CATALOG IS UNSET
  A "save your favourites" button leading to a redirect that lands back on
  /colors/ is a loop: it promises a catalog and returns the reader to the page
  they are already on. Better to render nothing until there is something to
  open. FLAKECOLOR_URL is not currently set, so neither of these appears.

  `enabled` IS A PROP, NOT AN ENV READ. One of these renders inside a client
  component, where a non-public env var reads as `undefined` — see lib/catalog.ts.
  Both take the flag from their server page so the two cannot diverge.

  Note this is a build-time value on statically rendered pages: setting
  FLAKECOLOR_URL needs a redeploy before the CTAs appear, which is the same
  deploy that switches /app/ from its 307 fallback to the 308.
*/

type Props = { enabled: boolean }

/* Internal, so the canonical trailing-slash form avoids a needless hop. */
const CATALOG_PATH = '/app/'

/**
 * The /colors/ call to action — outlined, never filled.
 *
 * The sub-line is the functional half: tapping a heart in a catalog is only
 * worth doing if something happens as a result, and what happens is that those
 * exact sample boards arrive at the estimate.
 */
export function CatalogButton({ enabled }: Props) {
  if (!enabled) return null

  return (
    <div className="mx-auto max-w-7xl px-5 lg:px-10">
      <div className="max-w-2xl">
        <Link
          href={CATALOG_PATH}
          data-analytics-cta="catalog"
          className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
        >
          Open the mobile catalog — save your favorites
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
          Tap &hearts; on 3&ndash;4 blends and we&rsquo;ll bring those exact sample boards to your
          estimate.
        </p>
      </div>
    </div>
  )
}

/**
 * The /floor-designer/ equivalent — a text link, not a button.
 *
 * Deliberately quieter than the /colors/ treatment: the designer is itself the
 * interactive tool, so a second prominent button competing with it would offer
 * the reader two versions of the same job at equal weight.
 */
export function CatalogTextLink({ enabled }: Props) {
  if (!enabled) return null

  return (
    <p>
      <Link
        href={CATALOG_PATH}
        data-analytics-cta="catalog"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Prefer to browse on your phone? Open the mobile catalog →
      </Link>
    </p>
  )
}
