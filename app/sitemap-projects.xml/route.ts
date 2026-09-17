import { urlsetXml, XML_HEADERS } from '@/lib/sitemaps'

/*
  The /projects/ archive plus one URL per published project.

  Currently just the archive, because lib/content/projects.ts is empty by
  design. The file exists now rather than being added later so that publishing
  the first real project needs no sitemap work at all.

  Filtered archive views (/projects/?city=katy) are deliberately absent: they
  are noindex and canonical to /projects/, discovered by following the filter
  links rather than by being advertised here.
*/
export const dynamic = 'force-static'

export function GET() {
  return new Response(urlsetXml('projects'), { headers: XML_HEADERS })
}
