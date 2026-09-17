#!/usr/bin/env node
/*
  ============================================================================
  INDEXNOW SUBMISSION — run on publish
  ============================================================================

  Pushes the site's canonical URL set to IndexNow (Bing, Yandex, Seznam, Naver;
  NOT Google, which does not participate).

  USAGE
    node scripts/indexnow-ping.mjs                  submit every canonical URL
    node scripts/indexnow-ping.mjs /pricing/ /faq/  submit specific URLs only
    node scripts/indexnow-ping.mjs --dry-run        print the payload, send nothing
    node scripts/indexnow-ping.mjs --dry-run \
      --source=http://localhost:3000               read the URL set locally
                                                   (payload stays canonical)

  WIRING IT TO PUBLISH
  Run it as a post-deploy step so it fires against the live deployment rather
  than during the build (a build-time ping tells the engines to crawl URLs that
  are not serving the new content yet, and on a failed deploy tells them to
  crawl content that never shipped):

    node scripts/indexnow-ping.mjs

  ON UPDATE, pass just the URLs that changed. Submitting the whole site on every
  small edit is the one thing the protocol asks you not to do — it is the signal
  that gets a host's submissions discounted. A handful of changed URLs is exactly
  what IndexNow is for.

  EXIT CODE IS ALWAYS 0 ON A PING FAILURE. A search-engine notification is not
  part of whether a deploy succeeded, and failing a pipeline over an unreachable
  third-party endpoint would be worse than the missed ping. Real problems still
  print loudly. The exceptions are genuine misconfigurations — a missing or
  mismatched key file — which exit 1 because they mean every future submission
  will silently fail until fixed.
*/

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/*
  The key, the canonical origin and the URL list all live in TypeScript modules
  that this plain-Node script cannot import. Rather than add a build step or a
  TS loader for one script, the three values are read out of the source files by
  pattern — and every read is checked, so a refactor that moves them fails here
  with a clear message instead of silently submitting a wrong payload.
*/
const read = (relPath) => readFileSync(resolve(root, relPath), 'utf8')

const extract = (source, pattern, what, file) => {
  const match = source.match(pattern)
  if (!match) {
    console.error(
      `[indexnow] Could not find ${what} in ${file}.\n` +
        `           The script reads it by pattern; if that file was refactored,\n` +
        `           update the pattern in scripts/indexnow-ping.mjs.`,
    )
    process.exit(1)
  }
  return match[1]
}

const indexnowSource = read('lib/indexnow.ts')
const siteSource = read('lib/site.ts')

const KEY = extract(
  indexnowSource,
  /export const INDEXNOW_KEY = '([a-f0-9]+)'/,
  'INDEXNOW_KEY',
  'lib/indexnow.ts',
)

const CANONICAL = extract(
  siteSource,
  /canonical:\s*'(https?:\/\/[^']+)'/,
  'site.canonical',
  'lib/site.ts',
)

/* ------------------------------------------------------------------ */
/* Guard: the key file must exist and agree with the constant          */
/* ------------------------------------------------------------------ */

let keyFileContents
try {
  keyFileContents = read(`public/${KEY}.txt`)
} catch {
  console.error(
    `[indexnow] Key file public/${KEY}.txt does not exist.\n` +
      `           IndexNow verifies host ownership by fetching it, so every\n` +
      `           submission would be rejected with 403 until it is created.`,
  )
  process.exit(1)
}

if (keyFileContents.trim() !== KEY) {
  console.error(
    `[indexnow] Key file public/${KEY}.txt does not contain the key.\n` +
      `           Expected: ${KEY}\n` +
      `           Found:    ${keyFileContents.trim().slice(0, 64)}\n` +
      `           These must match or the API returns 403.`,
  )
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Build the URL list                                                  */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const explicit = args.filter((a) => !a.startsWith('--'))

/*
  --source=<origin> reads the sitemap from somewhere other than the canonical
  domain, while the submitted payload still contains canonical URLs.

  This exists so the script is testable before the site is live. Without it the
  only way to exercise the sitemap-walking path is to already be deployed —
  which meant the first real run would also be the first run ever, on the one
  occasion where a broken payload is least welcome.

    node scripts/indexnow-ping.mjs --dry-run --source=http://localhost:3000

  Deliberately has no effect on the payload: `host`, `keyLocation` and every
  submitted URL are always built from site.canonical, so pointing this at
  localhost cannot produce a submission containing localhost URLs (which
  IndexNow would reject with 422 anyway).
*/
const sourceArg = args.find((a) => a.startsWith('--source='))
const SOURCE = sourceArg ? sourceArg.slice('--source='.length).replace(/\/$/, '') : CANONICAL

let paths
if (explicit.length > 0) {
  paths = explicit
} else {
  /*
    No arguments means the whole site. The canonical path list is derived from
    the sitemap children rather than restated here, by fetching the sitemap
    index off the live site — the same document the search engines read, so the
    two cannot disagree. This is also why the script runs post-deploy.
  */
  const indexUrl = `${SOURCE}/sitemap-index.xml`
  console.log(`[indexnow] Reading URL set from ${indexUrl}`)

  const childUrls = await fetchLocs(indexUrl)
  if (childUrls.length === 0) {
    console.error(`[indexnow] ${indexUrl} listed no child sitemaps. Nothing to submit.`)
    process.exit(1)
  }

  const collected = []
  for (const child of childUrls) {
    /*
      The index lists its children by canonical URL, so under --source those
      point at a domain we are not reading from. Swap the origin for the fetch
      only — the <loc> values collected out of each child stay canonical, which
      is what gets submitted.
    */
    const fetchUrl = SOURCE === CANONICAL ? child : child.replace(CANONICAL, SOURCE)
    const locs = await fetchLocs(fetchUrl)
    console.log(`[indexnow]   ${child} -> ${locs.length} URLs`)
    collected.push(...locs)
  }
  paths = collected
}

async function fetchLocs(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!response.ok) {
    console.error(`[indexnow] Failed to fetch ${url} (HTTP ${response.status}).`)
    process.exit(1)
  }
  const xml = await response.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

const urlList = [
  ...new Set(paths.map((p) => (p.startsWith('http') ? p : `${CANONICAL}${p}`))),
]

if (urlList.length === 0) {
  console.log('[indexnow] Nothing to submit.')
  process.exit(0)
}

const payload = {
  host: new URL(CANONICAL).host,
  key: KEY,
  keyLocation: `${CANONICAL}/${KEY}.txt`,
  urlList,
}

console.log(`[indexnow] ${urlList.length} URLs for ${payload.host}`)

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2))
  console.log('[indexnow] --dry-run: nothing submitted.')
  process.exit(0)
}

/* ------------------------------------------------------------------ */
/* Submit                                                              */
/* ------------------------------------------------------------------ */

try {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  })

  /* 200 accepted; 202 accepted pending key validation. Both are successes. */
  if (response.status === 200 || response.status === 202) {
    console.log(`[indexnow] Accepted (HTTP ${response.status}). ${urlList.length} URLs submitted.`)
    process.exit(0)
  }

  const body = await response.text().catch(() => '')
  const explain =
    {
      400: 'Malformed request.',
      403: `Key not valid — check ${payload.keyLocation} is reachable and contains the key.`,
      422: 'URLs do not match the declared host, or the key does not match the schema.',
      429: 'Too many requests. Submit only changed URLs rather than the whole site.',
    }[response.status] ?? 'Unexpected response.'

  console.warn(`[indexnow] Not accepted (HTTP ${response.status}). ${explain}`)
  if (body) console.warn(`[indexnow] Response body: ${body.slice(0, 400)}`)
  /* Deliberately 0 — see the note at the top of this file. */
  process.exit(0)
} catch (error) {
  console.warn(`[indexnow] Submission failed: ${error?.message ?? error}`)
  process.exit(0)
}
