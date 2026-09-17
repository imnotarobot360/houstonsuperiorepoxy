import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

/*
  Builds the installed-floor material for every stocked blend.

  THE MANUFACTURER SAMPLE IS NOT A FLOOR TEXTURE. public/images/flake-blends/*.jpg
  are macro product references — loose chips on a backlit screen, shot close.
  Stretching or tiling one across a garage floor cannot work at any scale,
  because the subject and the magnification are both wrong. The sample is used
  here for one thing only: the colours actually in the blend.

  WHAT THIS GENERATES INSTEAD
  A full-broadcast floor IS densely scattered chips in a pigmented base, so the
  material is drawn as exactly that, seamlessly, at physically-derived scale:

    sample -> colour distribution -> dense chip scatter -> seamless tile

  SCALE AND DENSITY ARE THE WHOLE POINT, and the previous version got both
  wrong: chips read several inches across and the coverage was sparse enough to
  look like gravel. The numbers below are derived rather than guessed.

    tile          1024px standing in for 4ft of slab
    chip          1/4in nominal -> 1024 / (48/0.25) = 5.3px in texture space
    density       12,000 chips per square foot (~96% coverage; see below)

  Density is derived from Poisson coverage rather than guessed — see the note on
  CHIPS_PER_SQFT. An earlier 3,000/sqft covered only 57% and read as gravel.

  RASTERISED DIRECTLY, NOT VIA SVG. At this density a tile holds ~190,000
  chips; as SVG polygons that is a multi-megabyte document per blend and a slow
  rasterise. Filling pixels directly is faster and lets chips wrap the tile edge
  with a modulo instead of being drawn three times.
*/

const SRC_DIR = 'public/images/flake-blends'
const OUT_DIR = 'public/images/flake-textures'

/*
  TILE SIZE IS A DELIVERY DECISION, NOT A QUALITY ONE.

  What matters visually is the chip-to-tile RATIO, and 1024px standing in for
  4ft gives exactly the same 5.3px chip as 2048/8ft — the same material, at a
  quarter of the pixels. Dense random chip noise is close to incompressible, so
  the 2048 version landed at ~1.4MB per blend; across 27 blends that is a
  texture swap no phone should be asked to make.
*/
const TILE = 1024
const FEET_PER_TILE = 4
const FLAKE_INCHES = 0.25
const PX_PER_INCH = TILE / (FEET_PER_TILE * 12)
const FLAKE_PX = FLAKE_INCHES * PX_PER_INCH
/*
  DENSITY IS A SCATTER PROBLEM, NOT A TILING ONE.

  A quarter-inch chip covers ~0.0625 sq in, so if chips tiled perfectly a
  square foot would need ~2,300. They do not tile — they land at random and
  overlap, which is Poisson: coverage is 1 - e^-lambda, so 3,000/sqft yields
  only 57% and leaves the base coat showing through as gaps. That is precisely
  the "gravel" reading, and no amount of scale tuning fixes it.

  12,000/sqft reaches ~96%, which is what "broadcast to refusal" looks like:
  base coat visible only in the last few slivers between chips.
*/
const CHIPS_PER_SQFT = 12000
const CHIP_COUNT = Math.round(CHIPS_PER_SQFT * FEET_PER_TILE * FEET_PER_TILE)

/** Deterministic PRNG, so a rebuild produces a byte-identical texture. */
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/**
 * The blend's real colours, sampled from the manufacturer photograph.
 *
 * Quantised and ranked by frequency, so the palette reflects what actually
 * dominates the blend. Near-white pixels above `whiteCut` are discarded: the
 * backlit screen behind the loose flake blows out the gaps between chips, and
 * without this every blend comes back mostly "white" and renders far too pale.
 *
 * Frequency is kept, not just the colour — chips are then drawn in proportion,
 * so a blend that is mostly grey with a little navy renders mostly grey.
 */
async function palette(file, count = 16) {
  const { data, info } = await sharp(file)
    .resize(128, 128, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const buckets = new Map()
  const whiteCut = 246

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    if (r > whiteCut && g > whiteCut && b > whiteCut) continue
    const key = `${r >> 3}|${g >> 3}|${b >> 3}`
    const hit = buckets.get(key)
    if (hit) hit.n += 1
    else buckets.set(key, { r, g, b, n: 1 })
  }

  const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, count)
  return ranked.length > 0 ? ranked : [{ r: 140, g: 140, b: 144, n: 1 }]
}

/** Cumulative weights, so chip colours are picked in the blend's real proportions. */
function weighted(pal) {
  const total = pal.reduce((s, c) => s + c.n, 0)
  let acc = 0
  return pal.map((c) => {
    acc += c.n / total
    return { ...c, upto: acc }
  })
}

/** The pigmented base coat showing beneath and between the chips. */
function baseCoat(pal) {
  const total = pal.reduce((s, c) => s + c.n, 0)
  const mix = pal.reduce(
    (a, c) => ({
      r: a.r + (c.r * c.n) / total,
      g: a.g + (c.g * c.n) / total,
      b: a.b + (c.b * c.n) / total,
    }),
    { r: 0, g: 0, b: 0 },
  )
  const darken = 0.52
  return {
    r: Math.round(mix.r * darken),
    g: Math.round(mix.g * darken),
    b: Math.round(mix.b * darken),
  }
}

async function build(slug, srcFile) {
  const pal = await palette(srcFile)
  const wpal = weighted(pal)
  const base = baseCoat(pal)
  const rand = rng([...slug].reduce((a, c) => a + c.charCodeAt(0), 7))

  const buf = Buffer.alloc(TILE * TILE * 3)
  for (let i = 0; i < buf.length; i += 3) {
    buf[i] = base.r
    buf[i + 1] = base.g
    buf[i + 2] = base.b
  }

  const pick = () => {
    const u = rand()
    for (const c of wpal) if (u <= c.upto) return c
    return wpal[wpal.length - 1]
  }

  for (let n = 0; n < CHIP_COUNT; n++) {
    const c = pick()
    const cx = rand() * TILE
    const cy = rand() * TILE
    /*
      Real flake is crushed, so sizes spread around the nominal rather than
      being uniform. Kept tight: the spread that made the old version look like
      terrazzo came from a long tail of oversized chips.
    */
    const rad = (FLAKE_PX / 2) * (0.62 + rand() * 0.85)
    const rot = rand() * Math.PI * 2
    const sides = 4 + Math.floor(rand() * 3)

    /* Chips sit at different depths in the resin and catch light differently. */
    const shade = 0.82 + rand() * 0.36
    const cr = Math.min(255, c.r * shade)
    const cg = Math.min(255, c.g * shade)
    const cb = Math.min(255, c.b * shade)

    const verts = []
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * Math.PI * 2
      const rr = rad * (0.68 + rand() * 0.64)
      verts.push([Math.cos(a) * rr, Math.sin(a) * rr])
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const [vx, vy] of verts) {
      if (vx < minX) minX = vx
      if (vx > maxX) maxX = vx
      if (vy < minY) minY = vy
      if (vy > maxY) maxY = vy
    }

    for (let py = Math.floor(minY); py <= Math.ceil(maxY); py++) {
      for (let px = Math.floor(minX); px <= Math.ceil(maxX); px++) {
        /* Ray-cast point-in-polygon against the chip's local vertices. */
        let inside = false
        for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
          const [xi, yi] = verts[i]
          const [xj, yj] = verts[j]
          if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
        }
        if (!inside) continue

        /*
          SEAMLESS BY MODULO. A chip crossing an edge simply wraps to the other
          side, so the tile joins itself perfectly and there is no point where
          one repeat ends and the next begins.
        */
        const tx = (((Math.round(cx + px) % TILE) + TILE) % TILE)
        const ty = (((Math.round(cy + py) % TILE) + TILE) % TILE)
        const o = (ty * TILE + tx) * 3
        buf[o] = cr
        buf[o + 1] = cg
        buf[o + 2] = cb
      }
    }
  }

  await sharp(buf, { raw: { width: TILE, height: TILE, channels: 3 } })
    .webp({ quality: 80, effort: 6 })
    .toFile(path.join(OUT_DIR, `${slug}.webp`))

  return { slug, base }
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('-flake-blend.jpg')).sort()

console.log(
  `Building ${files.length} floor materials — ${TILE}px tile = ${FEET_PER_TILE}ft, ` +
    `${FLAKE_INCHES}in chip ≈ ${FLAKE_PX.toFixed(1)}px, ` +
    `${CHIP_COUNT.toLocaleString()} chips (${CHIPS_PER_SQFT}/sqft)`,
)

const manifest = {}
for (const f of files) {
  const slug = f.replace('-flake-blend.jpg', '')
  const r = await build(slug, path.join(SRC_DIR, f))
  manifest[slug] = {
    base: `#${[r.base.r, r.base.g, r.base.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`,
  }
  console.log(`  ${slug.padEnd(20)} base ${manifest[slug].base}`)
}

const ts = `/* GENERATED by scripts/build-flake-textures.mjs — do not edit by hand. */

/** The pigmented base coat showing between chips, sampled from each blend. */
export const flakeBaseColors = {
${Object.entries(manifest)
  .map(([slug, v]) => `  '${slug}': '${v.base}',`)
  .join('\n')}
} as const

export type TexturedBlendSlug = keyof typeof flakeBaseColors

/** Seamless installed-floor material. ${TILE}px tile standing in for ${FEET_PER_TILE}ft of slab. */
export const flakeTexture = (slug: string) => \`/images/flake-textures/\${slug}.webp\`

export const hasTexture = (slug: string): slug is TexturedBlendSlug =>
  Object.prototype.hasOwnProperty.call(flakeBaseColors, slug)
`

fs.writeFileSync('lib/content/flake-textures.generated.ts', ts)
console.log(`\nWrote ${files.length} materials to ${OUT_DIR}`)
console.log('Wrote lib/content/flake-textures.generated.ts')
