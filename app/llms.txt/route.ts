import { llmsTxt } from '@/lib/llms'

/*
  /llms.txt — served as plain text, built at build time.

  `force-static` for the same reason the sitemaps use it: the content is a
  function of constants in the repository, so there is nothing to compute per
  request and no reason to keep a serverless function warm for a file that
  changes when we deploy.

  Content type is text/plain with an explicit charset — the file contains
  typographic apostrophes and an en dash, and without the charset a consumer
  that guesses latin-1 renders them as mojibake.
*/
export const dynamic = 'force-static'

export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
