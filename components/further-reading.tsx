import { RelatedLinks } from '@/components/blocks'
import { articleBySlug, pageArticles } from '@/lib/content/resources'
import type { RouteKey } from '@/lib/routes'

/*
  The guides belonging to a hub page, rendered from one map.

  WHY A COMPONENT AND NOT A HAND-WRITTEN LIST PER PAGE. Every service page used
  to link to the /resources/ index and stop, which left six guides with no
  inbound links at all and eighteen of twenty-two unreachable from any service
  page. Fixing that by pasting an array into each page would work once and then
  drift: slugs change, guides get renamed, and nothing would catch it.

  The mapping lives in lib/content/resources.ts, typed against the articles
  themselves, so a renamed guide is a build error rather than a dead link.
  Pages get one line.

  SEPARATE FROM THE "Keep going" BLOCK at the foot of each page, deliberately.
  That block points at other services — what else we do. This one points at
  reading — how to judge what we do. Merging them would bury the guides among
  sales links, which is roughly how they ended up unreachable in the first
  place.
*/

export function FurtherReading({
  routeKey,
  heading = 'Further reading',
}: {
  routeKey: RouteKey
  heading?: string
}) {
  const slugs = pageArticles[routeKey]
  if (!slugs || slugs.length === 0) return null

  const links = slugs.flatMap((slug) => {
    const article = articleBySlug(slug)
    /*
      Defensive, though the typed map should make it unreachable: a missing
      article renders nothing rather than a link to a 404.
    */
    if (!article) return []
    return [
      {
        label: article.h1,
        href: `/resources/${article.slug}/`,
        /* The kicker, not the description — it is written as a one-line framing. */
        blurb: article.kicker,
      },
    ]
  })

  if (links.length === 0) return null

  return <RelatedLinks heading={heading} links={links} />
}
