import { urlsetXml, XML_HEADERS } from '@/lib/sitemaps'

/*
  The /service-areas/ hub and every city page.

  Kept as its own file because city pages are the group most at risk of being
  judged thin or templated — isolating them means Search Console will say so
  directly instead of averaging that signal into the site total.
*/
export const dynamic = 'force-static'

export function GET() {
  return new Response(urlsetXml('locations'), { headers: XML_HEADERS })
}
