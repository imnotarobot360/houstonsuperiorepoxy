#!/usr/bin/env node
/*
  Warranty-claim verification.

  WHY THIS EXISTS. The warranty term changed from five years to Limited
  Lifetime, every page was updated, and three were missed — /about,
  /service-areas and the FAQ rail went on advertising "five-year written
  workmanship warranty" for weeks. Nobody noticed, because nothing could
  notice. A warranty is a contractual claim; "we searched and thought we got
  them all" is not a control.

  TWO MODES, and the second is the one that counts:

    node scripts/verify-site.mjs
        Scans the source tree. Fast, runs before a commit, catches a bad
        string the moment it is typed.

    node scripts/verify-site.mjs https://houstonsuperiorepoxy.com
        Fetches the real pages and scans the rendered HTML. This is the only
        check that proves what a CUSTOMER sees: source can be correct while
        production serves a stale build, an unset environment variable
        changes a page, or a route fails to deploy.

  Exit code 1 on any failure, so CI or a pre-deploy step can gate on it.
*/

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/* fileURLToPath, not url.pathname: this project lives in a folder whose name
   has a space in it, and pathname hands back 'New%20folder'. */
const ROOT = fileURLToPath(new URL('..', import.meta.url))

/* ------------------------------------------------------------------- rules */

/*
  CLAIMS THAT MUST NEVER APPEAR. Each is a promise the business has not
  agreed to underwrite, or one it has explicitly replaced.

  `allow` carves out the places a phrase is legitimately present: this file,
  the policy module that documents the old term, and the warranty page's own
  "if you signed earlier, you still hold the five-year warranty" paragraph —
  which is a true statement about historical contracts, not a current offer.
*/
const BANNED = [
  {
    pattern: /\b(5|five)[-\s]year\s+(written\s+)?workmanship\s+warranty/gi,
    why: 'The five-year term was replaced by the Limited Lifetime Workmanship Warranty.',
    /*
      The last two are INSTRUCTION DOCUMENTS that forbid the term. The string
      is present in them because it is being prohibited, not claimed — the
      same reason /warranty/ is allowed to describe the historical contracts
      it is not changing.
    */
    allow: [
      /warranty\/page\.tsx$/,
      /content\/warranty\.ts$/,
      /verify-site\.mjs$/,
      /^AUDIT-REPORT\.md$/,
      /^docs\/SEO-MASTER-PROMPT\.md$/,
      /^OWNER_VERIFICATION_REQUIRED\.md$/,
    ],
    allowHtml: [/\/warranty\/?$/],
  },
  {
    pattern: /transferable\s+lifetime\s+warranty/gi,
    why: 'The warranty is non-transferable unless a signed contract says otherwise.',
  },
  {
    pattern: /unlimited\s+warranty/gi,
    why: 'No warranty on this site is unlimited.',
  },
  {
    pattern: /lifetime\s+material\s+warranty/gi,
    why: 'Materials are covered by their manufacturer, not by a lifetime promise from us.',
  },
  {
    pattern: /lifetime\s+(commercial|warehouse|industrial)\s+warranty/gi,
    why: 'The Limited Lifetime term is residential only.',
  },
]

/*
  "Lifetime" MUST NEVER APPEAR BARE. Every occurrence has to be part of
  "Limited Lifetime" — the whole risk on this site is a reader hearing
  "lifetime warranty" as forever-and-everything, and "Limited" is the word
  that stops it.

  Prose that quotes a competitor's empty claim is the one legitimate
  exception, so a quoted or curly-quoted "lifetime warranty" is allowed.
*/
const BARE_LIFETIME = /(?<!Limited\s)(?<!“)(?<!")(?<!')\blifetime\s+warranty/gi

/*
  THE WARRANTY MUST BE PRESENT, not merely un-contradicted.

  Everything above this point is an absence check — it fails when a banned
  claim appears. That is only half a control. A content rewrite that quietly
  strips the warranty from a service page breaks no rule above, publishes
  nothing false, and still loses the single strongest trust signal the
  business has. The owner's instruction is to PRESERVE this term, so it is
  asserted positively on the pages that sell the residential system.
*/
const MUST_CARRY_TERM = [
  '/warranty/',
  '/garage-floor-coatings-houston/',
  '/flake-epoxy-garage-floors/',
  '/llms.txt',
]

const WARRANTY_TERM_RE = /Limited Lifetime Workmanship Warranty/i

/*
  THE RESIDENTIAL TERM MUST NOT BE PROMISED ON A COMMERCIAL SURFACE.

  Matching the bare string here would be wrong: /patio- legitimately contains
  "the residential Limited Lifetime term does not extend to outdoor concrete",
  which is a DENIAL and exactly the disclosure we want. So this matches the
  affirmative shapes — a verb attaching the term to the reader's job — rather
  than the term itself.
*/
const LIFETIME_PROMISE =
  /\b(includes?|carries|carry|backed by|covered by|comes with)\s+(our\s+|a\s+|the\s+)?(written\s+)?Limited Lifetime/i

const COMMERCIAL_PAGES = [
  '/warehouse-floor-coatings-houston/',
  '/patio-concrete-coatings-houston/',
  '/metallic-epoxy-floors/',
]

const REQUIRED_ON_WARRANTY_PAGE = [
  ['the controlling-document disclosure', /signed warranty document provided with your project is the controlling agreement/i],
  ['the definition of whose lifetime', /original contracting homeowner owns the property/i],
  ['a covered-workmanship list', /improper surface preparation/i],
  ['an exclusions list', /structural movement|expansive Houston soil/i],
  ['the remedy', /repair or recoating of the affected area/i],
  ['required maintenance', /pH-neutral cleaner/i],
  ['a claim procedure', /inspect the floor before determining whether a claim qualifies/i],
  ['the commercial carve-out', /Commercial warranty terms are provided in the written project proposal/i],
  ['an effective-date statement', /effective date/i],
]

/* --------------------------------------------------------------- source scan */

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.vercel', 'public', '.claude'])
const EXTS = /\.(ts|tsx|md|txt|mjs|json)$/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (EXTS.test(name)) out.push(full)
  }
  return out
}

/*
  The policy module is load-bearing: every warranty claim on the site
  interpolates from it. Deleting the term or blanking it would propagate
  silently to twenty pages at once, so source mode checks it exists before
  checking anything else.
*/
function checkPolicyModule() {
  const path = join(ROOT, 'lib', 'content', 'warranty.ts')
  try {
    const text = readFileSync(path, 'utf8')
    if (!/WARRANTY_TERM\s*=\s*'Limited Lifetime Workmanship Warranty'/.test(text)) {
      return ['lib/content/warranty.ts: WARRANTY_TERM is not the owner-approved string.']
    }
    return []
  } catch {
    return ['lib/content/warranty.ts is missing — every warranty claim on the site reads from it.']
  }
}

function scanSource() {
  const failures = checkPolicyModule()
  for (const file of walk(ROOT)) {
    const rel = relative(ROOT, file).replace(/\\/g, '/')
    const text = readFileSync(file, 'utf8')

    for (const rule of BANNED) {
      if (rule.allow?.some((re) => re.test(rel))) continue
      const hits = text.match(rule.pattern)
      if (hits) failures.push(`${rel}: "${hits[0]}" — ${rule.why}`)
    }

    /* The bare-lifetime rule only applies to strings a visitor can read, and
       separating those from code comments reliably is not worth the false
       positives. It runs against rendered HTML instead, where every match is
       by definition something published. */
  }
  return failures
}

/* ----------------------------------------------------------------- live scan */

const PAGES = [
  '/',
  /* The machine-readable summary. It states the warranty term, the rate and the
     minimum, which makes it the likeliest place on the site for a stale claim
     to sit unnoticed — so it is checked like any page. */
  '/llms.txt',
  '/warranty/',
  '/about/',
  '/terms/',
  '/pricing/',
  '/service-areas/',
  '/our-process/',
  '/floor-designer/',
  '/garage-floor-estimator-houston/',
  '/garage-floor-coatings-houston/',
  '/flake-epoxy-garage-floors/',
  '/polyaspartic-floor-coatings-houston/',
  '/epoxy-flooring-houston/',
  '/warehouse-floor-coatings-houston/',
  '/patio-concrete-coatings-houston/',
  '/metallic-epoxy-floors/',
  '/how-to-choose-epoxy-contractor-houston/',
  '/contact/',
  '/schedule/',
]

/* Strip tags and decode the few entities that matter, so a phrase split across
   elements by React still matches. React also inserts <!-- --> between a text
   node and an interpolated value, which would otherwise hide every
   interpolated warranty term from a naive search. */
function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
}

async function scanLive(base) {
  const failures = []
  let checked = 0

  for (const path of PAGES) {
    const url = new URL(path, base).toString()
    let html
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) {
        failures.push(`${path}: HTTP ${res.status}`)
        continue
      }
      html = await res.text()
    } catch (error) {
      failures.push(`${path}: ${error instanceof Error ? error.message : 'fetch failed'}`)
      continue
    }
    checked += 1
    const text = toText(html)

    for (const rule of BANNED) {
      if (rule.allowHtml?.some((re) => re.test(path.replace(/\/$/, '') || '/'))) continue
      const hits = text.match(rule.pattern)
      if (hits) failures.push(`${path}: "${hits[0]}" — ${rule.why}`)
    }

    const bare = text.match(BARE_LIFETIME)
    if (bare) {
      failures.push(
        `${path}: ${bare.length} bare "lifetime warranty" (not preceded by "Limited") — e.g. "${bare[0]}"`,
      )
    }

    if (MUST_CARRY_TERM.includes(path) && !WARRANTY_TERM_RE.test(text)) {
      failures.push(
        `${path}: the Limited Lifetime Workmanship Warranty is GONE from this page. It is owner-approved and must be preserved.`,
      )
    }

    if (COMMERCIAL_PAGES.includes(path)) {
      const promise = text.match(LIFETIME_PROMISE)
      if (promise) {
        failures.push(
          `${path}: "${promise[0]}" promises the residential term on a commercial or exterior surface.`,
        )
      }
    }

    if (path === '/warranty/') {
      for (const [label, re] of REQUIRED_ON_WARRANTY_PAGE) {
        if (!re.test(text)) failures.push(`/warranty/: missing ${label}`)
      }
    }
  }

  return { failures, checked }
}

/* --------------------------------------------------------------------- main */

const base = process.argv[2]

if (base) {
  const { failures, checked } = await scanLive(base)
  console.log(`\nverify-site — ${base}`)
  console.log(`${checked}/${PAGES.length} pages fetched`)
  if (failures.length) {
    console.log('\nFAILURES:')
    for (const f of failures) console.log('  ✗ ' + f)
    console.log(`\n${failures.length} problem(s).\n`)
    process.exit(1)
  }
  console.log('\n✓ Every warranty claim on the live site is consistent.\n')
} else {
  const failures = scanSource()
  console.log('\nverify-site — source tree')
  if (failures.length) {
    console.log('\nFAILURES:')
    for (const f of failures) console.log('  ✗ ' + f)
    console.log(`\n${failures.length} problem(s).\n`)
    process.exit(1)
  }
  console.log('\n✓ No banned warranty claims in the source.\n')
}
