import { urlsetXml, XML_HEADERS } from '@/lib/sitemaps'

/* Core site pages: home, pricing, process, trust and conversion pages, legal. */
export const dynamic = 'force-static'

export function GET() {
  return new Response(urlsetXml('pages'), { headers: XML_HEADERS })
}
