import { sitemapIndexXml, XML_HEADERS } from '@/lib/sitemaps'

/*
  /sitemap-index.xml — the document robots.txt advertises.

  A route handler rather than Next's built-in `generateSitemaps` because that
  API produces /sitemap/0.xml, /sitemap/1.xml … and the filenames requested
  here are meaningful ones (sitemap-services.xml). The names matter: they are
  what appears in the Search Console sitemap list, and "sitemap-services.xml"
  is legible there in a way "sitemap/1.xml" is not.

  `force-static` because the output is derived entirely from checked-in
  registries. Nothing here reads a request, a cookie or a database, so there is
  no reason to run this per request.
*/
export const dynamic = 'force-static'

export function GET() {
  return new Response(sitemapIndexXml(), { headers: XML_HEADERS })
}
