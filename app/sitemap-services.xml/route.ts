import { urlsetXml, XML_HEADERS } from '@/lib/sitemaps'

/* The twelve money pages. The group whose indexation matters most commercially. */
export const dynamic = 'force-static'

export function GET() {
  return new Response(urlsetXml('services'), { headers: XML_HEADERS })
}
