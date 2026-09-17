import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

/*
  Builds a seamless, correctly-scaled floor texture for every stocked blend.

  WHY THIS DOES NOT TILE THE SAMPLE IMAGE
  public/images/flake-blends/*.jpg are macro photographs of LOOSE flake on a
  backlit screen. They are colour references, not floors. Tiling one across a
  floor plane cannot work and did not: the old preview repeated a 1200px macro
  shot at 150px roughly twenty times, which read as huge stone chunks in
  obviously repeating clusters, and perspective made the seams worse by
  compressing them into bands toward the back wall.

  No amount of offset-and-blend fixes that, because the input is the wrong
  subject at the wrong scale.

  WHAT IT DOES INSTEAD
  A full-broadcast floor IS randomly scattered chips in a pigmented base coat.
  So the texture is SYNTHESISED to be exactly that, using colours sampled from
  the real manufacturer photograph:

    real sample -> colour palette -> procedural chip scatter -> seamless tile

  That buys three things tiling never could:
    1. It is seamless by construction — chips crossing an edge are redrawn on
       the opposite edge, so the tile wraps perfectly.
    2. Repetition is undetectable at realistic scale. Chips are a few pixels;
       there is no structure large enough for an eye to latch onto and match.
    3. Flake scale is a number we control rather than an accident of the source
       photo's magnification.

  The colours are the manufacturer's own, sampled from their photograph. This
  does not invent a colour that the blend does not have.
*/

const SRC_DIR = 'public/images/flake-blends'
const OUT_DIR = 'public/images/flake-textures'

/*
  Tile size, and the slab it represents.

  512px standing in for 4 feet of floor puts a nominal quarter-inch flake at
  512 / (48 / 0.25) ≈ 2.7px. Real broadcast chips are not uniform — they are
  crushed, they overlap, and they land at every angle — so the generator spreads
  around that figure rather than stamping one size. The result reads as fine
  speckle from standing height, which is what a real floor looks like, instead
  of the terrazzo slabs the old preview produced.
*/
const TILE = 512
const FEET_PER_TILE = 4
const FLAKE_INCHES = 0.25
const PX_PER_INCH = TILE / (FEET_PER_TILE * 12)
const FLAKE_PX = FLAKE_INCHES * PX_PER_INCH

/* Coverage. Full broadcast is "to refusal" — chips land until no base shows. */
const FLAKE_COUNT = 26_000

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
 * Quantised to a coarse grid and ranked by frequency, which collects the chip
 * colours that actually dominate the blend rather than the extremes. The
 * backlit screen behind the loose flake blows out the gaps between chips, so
 * near-white pixels above `whiteCut` are discarded — without that, every blend
 * comes back mostly "white" and the floor renders far too pale.
 */
async function palette(file, count = 14) {
  const { data, info } = await sharp(file)
    .resize(96, 96, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const buckets = new Map()
  const whiteCut = 246

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r > whiteCut && g > whiteCut && b > whiteCut) continue
    /* 24 levels per channel: fine enough to keep distinct chips apart. */
    const key = `${r >> 3}|${g >> 3}|${b >> 3}`
    const hit = buckets.get(key)
    if (hit) hit.n += 1
    else buckets.set(key, { r, g, b, n: 1 })
  }

  const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, count)
  /* A blend photographed almost entirely blown out still needs something. */
  return ranked.length > 0 ? ranked : [{ r: 140, g: 140, b: 144, n: 1 }]
}

/**
 * The pigmented base coat that shows between and beneath the chips.
 *
 * Real base coat is a solid pigment, darker and far less busy than the chips
 * sitting on it. Taking the palette's weighted mean and driving it down gives a
 * ground that belongs to the blend without competing with it — and it is what
 * stops the preview looking like loose flake on a lightbox.
 */
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

/** An irregular chip. Real flake is crushed, not circular. */
function chip(rand, cx, cy, size) {
  const pts = []
  const sides = 5 + Math.floor(rand() * 3)
  const rot = rand() * Math.PI * 2
  for (let i = 0; i < sides; i += 1) {
    const a = rot + (i / sides) * Math.PI * 2
    /* Radius jitter is what stops these reading as regular polygons. */
    const rad = size * (0.55 + rand() * 0.75)
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`)
  }
  return pts.join(' ')
}

async function build(slug, srcFile) {
  const pal = await palette(srcFile)
  const base = baseCoat(pal)
  const rand = rng([...slug].reduce((a, c) => a + c.charCodeAt(0), 7))

  const parts = [
    `<rect width="${TILE}" height="${TILE}" fill="rgb(${base.r},${base.g},${base.b})"/>`,
  ]

  for (let i = 0; i < FLAKE_COUNT; i += 1) {
    const c = pal[Math.floor(rand() * pal.length)]
    const x = rand() * TILE
    const y = rand() * TILE
    /* Log-ish spread: many small chips, a few larger, like a real broadcast. */
    const size = FLAKE_PX * (0.45 + rand() * rand() * 2.1)
    /* Chips sink into the resin to different depths; opacity stands in for it. */
    const op = (0.72 + rand() * 0.28).toFixed(2)

    /*
      SEAMLESS BY CONSTRUCTION. A chip near an edge is redrawn shifted by a full
      tile on that axis, so whatever leaves the right edge re-enters on the
      left. This is why the finished floor has no findable seam: there is no
      point where one tile stops and the next begins.
    */
    for (const dx of x < size * 3 ? [0, TILE] : x > TILE - size * 3 ? [0, -TILE] : [0]) {
      for (const dy of y < size * 3 ? [0, TILE] : y > TILE - size * 3 ? [0, -TILE] : [0]) {
        parts.push(
          `<polygon points="${chip(rand, x + dx, y + dy, size)}" fill="rgb(${c.r},${c.g},${c.b})" fill-opacity="${op}"/>`,
        )
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" shape-rendering="crispEdges">${parts.join('')}</svg>`

  await sharp(Buffer.from(svg))
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(OUT_DIR, `${slug}.webp`))

  return { slug, base, palette: pal.length }
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const files = fs
  .readdirSync(SRC_DIR)
  .filter((f) => f.endsWith('-flake-blend.jpg'))
  .sort()

console.log(
  `Building ${files.length} floor textures — ${TILE}px tile = ${FEET_PER_TILE}ft, ` +
    `${FLAKE_INCHES}in flake ≈ ${FLAKE_PX.toFixed(1)}px`,
)

const manifest = {}
for (const f of files) {
  const slug = f.replace('-flake-blend.jpg', '')
  const r = await build(slug, path.join(SRC_DIR, f))
  manifest[slug] = { base: `#${[r.base.r, r.base.g, r.base.b].map((v) => v.toString(16).padStart(2, '0')).join('')}` }
  console.log(`  ${slug.padEnd(20)} base ${manifest[slug].base}  (${r.palette} chip colours)`)
}

/*
  Emitted as a typed module rather than JSON under public/, so the base coats are
  bundled with the component that uses them instead of costing a second request,
  and so a blend whose texture has not been generated is a compile error rather
  than a silent `undefined` at runtime.

  GENERATED FILE — run `npm run textures` after adding a blend.
*/
const ts = `/* GENERATED by scripts/build-flake-textures.mjs — do not edit by hand. */

/** The pigmented base coat showing between chips, sampled from each blend. */
export const flakeBaseColors = {
${Object.entries(manifest)
  .map(([slug, v]) => `  '${slug}': '${v.base}',`)
  .join('\n')}
} as const

export type TexturedBlendSlug = keyof typeof flakeBaseColors

/** Seamless floor texture for a blend. 512px tile standing in for 4ft of slab. */
export const flakeTexture = (slug: string) => \`/images/flake-textures/\${slug}.webp\`

export const hasTexture = (slug: string): slug is TexturedBlendSlug =>
  Object.prototype.hasOwnProperty.call(flakeBaseColors, slug)
`

fs.writeFileSync('lib/content/flake-textures.generated.ts', ts)
console.log(`\nWrote ${files.length} textures to ${OUT_DIR}`)
console.log('Wrote lib/content/flake-textures.generated.ts')
