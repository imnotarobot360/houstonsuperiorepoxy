import { urlsetXml, XML_HEADERS } from '@/lib/sitemaps'

/*
  Editorial content: the /resources/ hub, every guide, and the buyer's guide at
  /how-to-choose-epoxy-contractor-houston/.

  The retired /resources/how-to-choose-a-garage-floor-coating-contractor/ cannot
  appear here — it was deleted from the `articles` array, which is what this
  file iterates. Removing the data removed the URL from the sitemap in the same
  edit, which is the point of deriving rather than hand-listing.
*/
export const dynamic = 'force-static'

export function GET() {
  return new Response(urlsetXml('resources'), { headers: XML_HEADERS })
}
