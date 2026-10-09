#!/usr/bin/env node
/*
  SEO audit — measures, never edits.

  Separate from verify-site.mjs on purpose. That script is a GATE: a small set
  of claims that must never be wrong, exiting non-zero so a deploy can be
  blocked on it. This one is a REPORT: a wide sweep that surfaces things worth
  a human decision, and whose findings are often judgement calls rather than
  defects. Mixing the two would mean either a gate that blocks on opinions or
  a report nobody runs.

      node scripts/audit-seo.mjs                          # against localhost:3000
      node scripts/audit-seo.mjs https://houstonsuperiorepoxy.com

  Exit code is always 0. Read the output.
*/

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const BASE = process.argv[2] ?? 'http://localhost:3000'

/* Google truncates around these in practice. They are soft limits — a long
   title is a finding, not a failure. */
const TITLE_MAX = 60
const DESC_MIN = 70
const DESC_MAX = 160

const findings = { error: [], warn: [], note: [] }
const add = (level, msg) => findings[level].push(msg)

/* --------------------------------------------------- the routes, from source */

function routePaths() {
  const src = readFileSync(join(ROOT, 'lib', 'routes.ts'), 'utf8')
  const paths = [...src.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1])
  return [...new Set(paths)].filter((p) => p.startsWith('/'))
}

/*
  ONE REAL URL PER DYNAMIC TEMPLATE.

  lib/routes.ts lists the INDEX pages — /resources/, /service-areas/,
  /projects/ — so an audit built only from it never looks at an article, a city
  page or a project page. That blind spot hid a missing og:image on 32 of the
  34 pages that had one: the two static offenders showed up, the templates
  behind the other thirty-two did not.

  Sampling one of each is enough. These pages are generated from one component,
  so a fault in the template is a fault in every page it renders.
*/
function dynamicSamples() {
  const out = []
  const first = (file, re) => {
    try {
      return (readFileSync(join(ROOT, file), 'utf8').match(re) || [])[1]
    } catch {
      return undefined
    }
  }

  const article = first('lib/content/resources.ts', /slug:\s*'([a-z0-9-]+)'/)
  if (article) out.push(`/resources/${article}/`)

  const city = first('lib/content/cities.ts', /slug:\s*'([a-z0-9-]+)'/)
  if (city) out.push(`/service-areas/${city}/`)

  try {
    const dirs = readdirSync(join(ROOT, 'content', 'projects')).filter((d) => !d.includes('.'))
    if (dirs[0]) out.push(`/projects/${dirs[0]}/`)
  } catch {
    /* no projects directory — nothing to sample */
  }

  return out
}

/* --------------------------------------------------------------- the fetcher */

async function get(path) {
  const url = new URL(path, BASE).toString()
  const res = await fetch(url, { redirect: 'manual', cache: 'no-store' })
  if (res.status >= 300 && res.status < 400) {
    return { status: res.status, location: res.headers.get('location'), html: '' }
  }
  return { status: res.status, html: res.status === 200 ? await res.text() : '' }
}

/*
  Entities are DECODED before anything is measured.

  The first run of this script reported eleven titles over 60 characters. Six
  of them were not: "&amp;" is one ampersand to a human and to Google, and
  five characters to String.length. Measuring the raw markup would have had
  me rewriting titles that were already the right length.
*/
const ENTITIES = {
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
  '&rsquo;': '\u2019',
  '&lsquo;': '\u2018',
  '&ldquo;': '\u201c',
  '&rdquo;': '\u201d',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
}

function decode(text) {
  if (!text) return text
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&[a-z]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
}

const pick = (html, re) => decode((html.match(re) || [])[1]?.trim())

const metaOf = (html) => ({
  title: pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
  description: pick(html, /<meta[^>]+name="description"[^>]+content="([^"]*)"/i),
  canonical: pick(html, /<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i),
  robots: pick(html, /<meta[^>]+name="robots"[^>]+content="([^"]*)"/i),
  ogTitle: pick(html, /<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i),
  ogImage: pick(html, /<meta[^>]+property="og:image"[^>]+content="([^"]*)"/i),
  h1s: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    decode(m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()),
  ),
  jsonLd: [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1],
  ),
  internalLinks: [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]),
})

/* ------------------------------------------------------------------- the run */

const samples = dynamicSamples()
const paths = [...routePaths(), ...samples]
console.log(`\nSEO audit — ${BASE}`)
console.log(`${paths.length} pages: ${paths.length - samples.length} static routes + ${samples.length} dynamic samples\n`)

const seenTitles = new Map()
const seenDescs = new Map()
const linkedTo = new Set()
const live = []

for (const path of paths) {
  const { status, location, html } = await get(path)
  if (status !== 200) {
    add('error', `${path}: HTTP ${status}${location ? ` → ${location}` : ''}`)
    continue
  }
  live.push(path)
  const m = metaOf(html)

  /* ---- title ---- */
  if (!m.title) add('error', `${path}: no <title>`)
  else {
    if (m.title.length > TITLE_MAX) add('warn', `${path}: title ${m.title.length} chars — "${m.title}"`)
    const prev = seenTitles.get(m.title)
    if (prev) add('error', `${path}: title duplicates ${prev}`)
    else seenTitles.set(m.title, path)
  }

  /* ---- description ---- */
  if (!m.description) add('error', `${path}: no meta description`)
  else {
    if (m.description.length > DESC_MAX)
      add('warn', `${path}: description ${m.description.length} chars (>${DESC_MAX})`)
    if (m.description.length < DESC_MIN)
      add('warn', `${path}: description only ${m.description.length} chars`)
    const prev = seenDescs.get(m.description)
    if (prev) add('error', `${path}: description duplicates ${prev}`)
    else seenDescs.set(m.description, path)
  }

  /* ---- canonical ---- */
  if (!m.canonical) add('error', `${path}: no canonical`)
  else {
    const expected = new URL(path, 'https://houstonsuperiorepoxy.com').toString()
    if (m.canonical.replace(/\/$/, '') !== expected.replace(/\/$/, ''))
      add('warn', `${path}: canonical points at ${m.canonical}`)
  }

  /* ---- headings ---- */
  if (m.h1s.length === 0) add('error', `${path}: no <h1>`)
  else if (m.h1s.length > 1) add('warn', `${path}: ${m.h1s.length} <h1> tags`)

  /* ---- Open Graph ---- */
  if (!m.ogTitle) add('warn', `${path}: no og:title`)
  if (!m.ogImage) add('warn', `${path}: no og:image`)

  /* ---- structured data ---- */
  if (m.jsonLd.length === 0) add('note', `${path}: no JSON-LD`)
  for (const raw of m.jsonLd) {
    try {
      const data = JSON.parse(raw)
      const nodes = data['@graph'] ?? [data]
      for (const n of nodes) {
        if (n.aggregateRating)
          add('error', `${path}: aggregateRating in schema — this entity has no reviews of its own`)
        if (n.priceRange && !/^\$[\d,]+\+?$/.test(n.priceRange))
          add('warn', `${path}: odd priceRange "${n.priceRange}"`)
      }
    } catch {
      add('error', `${path}: JSON-LD does not parse`)
    }
  }

  for (const href of m.internalLinks) linkedTo.add(href.replace(/\/$/, '') || '/')
}

/* ---- orphans: a live route nothing links to ---- */
for (const path of live) {
  if (samples.includes(path)) continue
  const key = path.replace(/\/$/, '') || '/'
  if (!linkedTo.has(key)) add('warn', `${path}: no internal link found to this page (orphan?)`)
}

/* ---- sitemap integrity ---- */
const { status: idxStatus, html: idxXml } = await get('/sitemap-index.xml')
if (idxStatus !== 200) add('error', `/sitemap-index.xml: HTTP ${idxStatus}`)
else {
  const children = [...idxXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  let urls = []
  for (const child of children) {
    const { status, html } = await get(new URL(child).pathname)
    if (status !== 200) {
      add('error', `${child}: HTTP ${status}`)
      continue
    }
    urls.push(...[...html.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
  }
  console.log(`sitemaps: ${children.length} children, ${urls.length} URLs`)
  /* Sampled rather than exhaustive — the point is to catch a dead template, and
     fetching every URL on every run makes a slow check nobody uses. */
  const sample = urls.filter((_, i) => i % Math.max(1, Math.floor(urls.length / 25)) === 0)
  for (const u of sample) {
    const { status, location } = await get(new URL(u).pathname)
    if (status !== 200) add('error', `sitemap URL ${u}: HTTP ${status}${location ? ` → ${location}` : ''}`)
  }
  console.log(`sitemap URLs sampled: ${sample.length}\n`)
}

/* ------------------------------------------------------------------- report */

for (const [level, label] of [
  ['error', 'MUST FIX'],
  ['warn', 'WORTH A LOOK'],
  ['note', 'NOTES'],
]) {
  const list = findings[level]
  if (!list.length) continue
  console.log(`${label} (${list.length})`)
  for (const f of list) console.log('  • ' + f)
  console.log('')
}

if (!findings.error.length && !findings.warn.length) console.log('Nothing found.\n')
console.log(`${live.length}/${paths.length} routes returned 200.\n`)
