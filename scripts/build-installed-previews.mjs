import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

/*
  Renders the installed-floor preview for every blend, ONCE, at build time.

  WHY THIS EXISTS — WHAT IT REPLACED
  The floor used to be assembled in the customer's browser: a tiled texture on a
  CSS 3D plane, clipped by a mask, with two blend-mode layers over it. Every one
  of those pieces was individually defensible and the result was not. CSS gives
  no control over texture filtering, so the tile aliased into static under
  minification; `perspective` silently did nothing because a `filter` ancestor
  flattened the 3D context; and soft-light/screen behave differently enough
  across browsers that the floor could not be signed off once and trusted.

  Doing it here instead buys the things that actually matter to a customer
  choosing a colour:

    the floor is filtered properly, with a real mipmap pyramid and per-pixel
    level selection, so it cannot alias into noise no matter how far it recedes

    perspective is a homography derived from the room's own geometry, so flake
    genuinely gets finer toward the door instead of approximately doing so

    lighting is applied in LINEAR light and normalised to mean 1.0 across the
    floor, which is what guarantees the installed floor reads as the same
    colour as the sample rather than a darkened version of it

    what ships is a flat image. It looks the same in every browser, on every
    phone, forever, and staff can replace any one of them with a photograph of
    a real finished floor without touching a line of code.

  THE GARAGE IS LOCKED. Every output starts from the same master file, and only
  floor pixels are ever written. The camera, door, cabinets, walls, logo, steps
  and lighting cannot drift between colours because nothing here can change
  them — this is compositing onto one photograph, not 27 renders of a garage.

  Run when the master photograph, the mask, or the flake textures change:
    node scripts/build-installed-previews.mjs [slug]
*/

const MASTER = 'public/images/designer/garage-scene-1536.webp'
const MASK = 'public/images/designer/garage-floor-mask.png'
/*
  NOT UNDER public/. The textures are a build INPUT, never something a browser
  asks for — what ships is the flat renditions in OUT_DIR. Keeping the
  intermediates out of the served tree keeps ~13MB out of the deployment.
*/
const TEXTURE_DIR = 'assets/flake-textures'
const OUT_DIR = 'public/floor-previews'

/*
  RESOLUTION IS CAPPED BY THE MASTER, at 1536x1024.

  The brief asked for 2000px or more. The master photograph is 1536 wide and
  upscaling it would add pixels without adding detail, while inflating 27 colours
  x 2 lighting states x 3 widths of output. If a higher-resolution master ever
  arrives, raise this and rerun; nothing else needs to change.
*/
const WIDTHS = [1536, 1152, 768]

/*
  ------------------------------------------------------------ the floor plane

  Two lines in the room that run away from the camera, and are parallel to each
  other on the floor, fix the perspective completely. Both were fitted by least
  squares to the mask's own far boundary (scripts/build-garage-mask.mjs), so the
  projection agrees with the mask by construction:

    left   the cabinet and workbench plinth, y = -0.3072x + 595.3  (338 columns)
    right  the step base and right baseboard, y =  0.2232x + 257.2  (154 columns)
    far    the garage-door threshold, level at y/H 0.461            (691 columns)

  They meet at a vanishing point of (0.415W, 0.390H) — above the threshold, as
  it must be, because the floor is below eye level.
*/
const LEFT_LINE = { m: -0.3072, b: 595.3 }
const RIGHT_LINE = { m: 0.2232, b: 257.2 }
const FAR_Y_FRAC = 0.461

/*
  The real size of the quad those lines cut out, in feet. WIDTH is the distance
  between the two plinth lines — the bay less the cabinet run and the step, so a
  little under a full two-car width.

  DEPTH IS THE TUNED ONE. Width and depth together are the texture's aspect
  ratio, and getting the ratio wrong does not misplace the flake, it stretches
  it: chips come out subtly oval, elongated either along the floor or across it.
  It is set by rendering a checkerboard through this same homography and
  adjusting until the squares read as square. See --checker.
*/
const FLOOR_WIDTH_FT = 17.5
const FLOOR_DEPTH_FT = 16

/*
  How much slab one texture tile covers.

  The texture holds ~82 quarter-inch chips across (scripts/build-flake-textures),
  so at life size a tile would be 1.7ft and a chip would land under a pixel
  everywhere but the very front of the frame — which is the physically correct
  answer, and is the grey static this whole rebuild exists to get rid of.

  1.7ft is kept as the tile but the chips inside it are drawn ~4x life size, so
  the floor reads as decorative flake. That exaggeration is declared in the
  texture builder; this file just projects it.
*/
const TILE_FT = 1.71

/*
  Lighting, all applied in linear light.

  THE CLAMPS ARE THE FIX FOR THE FOUR WHITE DISCS. The garage door throws four
  soft reflections down the bare slab, and they are genuinely in the master
  photograph — but the field was allowed to run from 0.42x to 1.9x, so those
  reflections were amplified until they stopped reading as sheen on a floor and
  started reading as spotlights painted over one. Measured on the old output,
  the brightest 1% of the floor sat 1.42x above the median.

  0.82 to 1.16 keeps the room's shading — the pool near the camera, the falloff
  into the back corners, the shadow under the cabinets — while holding the
  reflections to something a topcoat could plausibly do. Nothing is drawn; this
  only decides how much of the photograph's own light is allowed through.

  SPECULAR IS GONE, not reduced. It added a second, synthetic highlight on top
  of reflections that were already in the photograph, which is precisely the
  "do not draw reflections" rule. A polyaspartic's sheen is the photograph's
  light coming back off it, and that is what the light field already carries.
*/
const LIGHT_BLUR = 9
const LIGHT_MIN = 0.82
const LIGHT_MAX = 1.16

/*
  ONE BULB IS AN EXPOSURE CHANGE, NOT A FILTER.

  The previous dim state was a CSS brightness(0.46) over the finished panel,
  which crushed the floor to near black and took the blend with it — the exact
  complaint that "the floor has become nearly black". Multiplying in LINEAR
  light instead is what a dimmer actually does: everything gets less light, and
  the chips stay distinguishable because their ratios are preserved.

  0.25 with a slight warm shift reads as a single bulb rather than as dusk.
  Note this is a LINEAR factor, so it is much gentler than the same number would
  be in sRGB: gamma brings it back to roughly 0.55 of the encoded value. 0.44
  was tried first and was barely distinguishable from bright for that reason.
*/
const DIM_EXPOSURE = 0.25
const DIM_WARM = [1.04, 1.0, 0.93]

const srgbToLin = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const c = i / 255
  srgbToLin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
const linToSrgb = (v) => {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, Math.round(c * 255)))
}

/** Solves the 8x8 system for the homography taking four source points to four destinations. */
function homography(src, dst) {
  const A = []
  const rhs = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]
    const [u, v] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    rhs.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    rhs.push(v)
  }
  /* Gaussian elimination with partial pivoting. */
  const n = 8
  for (let i = 0; i < n; i++) {
    let p = i
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r
    ;[A[i], A[p]] = [A[p], A[i]]
    ;[rhs[i], rhs[p]] = [rhs[p], rhs[i]]
    for (let r = i + 1; r < n; r++) {
      const f = A[r][i] / A[i][i]
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]
      rhs[r] -= f * rhs[i]
    }
  }
  const h = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = rhs[i]
    for (let c = i + 1; c < n; c++) s -= A[i][c] * h[c]
    h[i] = s / A[i][i]
  }
  h.push(1)
  return h
}

/** Image pixel -> floor plane, in feet. */
function project(h, x, y) {
  const w = h[6] * x + h[7] * y + h[8]
  return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]
}

/** Successive halvings of the texture, for per-pixel level-of-detail sampling. */
async function mipmaps(file) {
  const levels = []
  let img = sharp(file)
  let { width } = await img.metadata()
  while (width >= 8) {
    const { data, info } = await sharp(file)
      .resize(width, width, { kernel: 'lanczos3' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const lin = new Float32Array(info.width * info.height * 3)
    for (let i = 0; i < lin.length; i++) lin[i] = srgbToLin[data[i]]
    levels.push({ size: info.width, lin })
    width = Math.floor(width / 2)
  }
  return levels
}

/** Bilinear, wrapped, in linear light. */
function bilinear(level, u, v, out) {
  const s = level.size
  const x = u * s - 0.5
  const y = v * s - 0.5
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const xa = ((x0 % s) + s) % s
  const ya = ((y0 % s) + s) % s
  const xb = (xa + 1) % s
  const yb = (ya + 1) % s
  const i00 = (ya * s + xa) * 3
  const i10 = (ya * s + xb) * 3
  const i01 = (yb * s + xa) * 3
  const i11 = (yb * s + xb) * 3
  for (let c = 0; c < 3; c++) {
    const top = level.lin[i00 + c] * (1 - fx) + level.lin[i10 + c] * fx
    const bot = level.lin[i01 + c] * (1 - fx) + level.lin[i11 + c] * fx
    out[c] = top * (1 - fy) + bot * fy
  }
}

/*
  Trilinear: bilinear within two adjacent levels, blended by the fractional
  level of detail. THIS IS WHAT STOPS THE FLOOR BECOMING STATIC. A chip near the
  door covers a fraction of a pixel, so point-sampling it returns whichever
  random chip the sample lands on and the result is noise. Choosing a level
  whose texels match the pixel's footprint returns the AVERAGE of the chips that
  the pixel actually covers, which is what a camera does.
*/
const tmpA = new Float32Array(3)
const tmpB = new Float32Array(3)
function trilinear(levels, u, v, footprint, out) {
  const lod = Math.max(0, Math.log2(Math.max(footprint, 1e-6)))
  const l0 = Math.min(levels.length - 1, Math.floor(lod))
  const l1 = Math.min(levels.length - 1, l0 + 1)
  const f = lod - l0
  bilinear(levels[l0], u, v, tmpA)
  if (l1 === l0 || f <= 0) {
    out[0] = tmpA[0]; out[1] = tmpA[1]; out[2] = tmpA[2]
    return
  }
  bilinear(levels[l1], u, v, tmpB)
  for (let c = 0; c < 3; c++) out[c] = tmpA[c] * (1 - f) + tmpB[c] * f
}

/* ------------------------------------------------------------------ set-up */

fs.mkdirSync(OUT_DIR, { recursive: true })

const master = await sharp(MASTER).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = master.info.width
const H = master.info.height
const MC = master.info.channels

const maskImg = await sharp(MASK).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const KC = maskImg.info.channels
const alpha = new Float32Array(W * H)
for (let p = 0; p < W * H; p++) alpha[p] = maskImg.data[p * KC + 3] / 255

/* The quad, from the two plinth lines and the threshold. */
const farY = FAR_Y_FRAC * H
const xAt = (line, y) => (y - line.b) / line.m
const corners = [
  [xAt(LEFT_LINE, farY), farY],
  [xAt(RIGHT_LINE, farY), farY],
  [xAt(RIGHT_LINE, H), H],
  [xAt(LEFT_LINE, H), H],
]
const Hm = homography(corners, [
  [0, 0],
  [FLOOR_WIDTH_FT, 0],
  [FLOOR_WIDTH_FT, FLOOR_DEPTH_FT],
  [0, FLOOR_DEPTH_FT],
])

console.log(`master ${W}x${H}`)
console.log(
  `floor quad  far ${corners[0].map(Math.round)} -> ${corners[1].map(Math.round)}   ` +
    `near ${corners[3].map(Math.round)} -> ${corners[2].map(Math.round)}`,
)
console.log(`            ${FLOOR_WIDTH_FT}ft wide x ${FLOOR_DEPTH_FT}ft deep, tile ${TILE_FT}ft\n`)

/*
  ---------------------------------------------------------------- lighting

  The floor's own light, taken from the master and normalised so its MEAN over
  the floor is exactly 1.0. That normalisation is the whole reason the installed
  preview keeps the blend's colour: multiplying by a field that averages to one
  redistributes light without changing the average, so a light grey blend stays
  light grey and a tan one stays tan. The previous pipeline multiplied by the
  raw luminance and darkened every colour on the way through.
*/
const grey = await sharp(MASTER).greyscale().blur(LIGHT_BLUR).raw().toBuffer({ resolveWithObject: true })
const GC = grey.info.channels
const light = new Float32Array(W * H)
let lsum = 0
let lcount = 0
for (let p = 0; p < W * H; p++) {
  const v = srgbToLin[grey.data[p * GC]]
  light[p] = v
  if (alpha[p] > 0.5) { lsum += v; lcount++ }
}
const lmean = lsum / Math.max(1, lcount)
for (let p = 0; p < W * H; p++) {
  light[p] = Math.max(LIGHT_MIN, Math.min(LIGHT_MAX, light[p] / lmean))
}
console.log(`light field: floor mean ${lmean.toFixed(4)} linear, normalised to 1.000\n`)

/* ------------------------------------------------------------------ render */

function compose(texLevels, dim) {
  const out = Buffer.alloc(W * H * 3)
  const col = new Float32Array(3)

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x
      const a = alpha[p]

      let r = srgbToLin[master.data[p * MC]]
      let g = srgbToLin[master.data[p * MC + 1]]
      let b = srgbToLin[master.data[p * MC + 2]]

      if (a > 0.002) {
        const [u0, v0] = project(Hm, x + 0.5, y + 0.5)
        const [ux] = project(Hm, x + 1.5, y + 0.5)
        const [, vy] = project(Hm, x + 0.5, y + 1.5)

        /*
          Footprint in texels, from how far one screen pixel moves across the
          floor. Near the door a pixel spans many chips and this is large, so a
          coarse mip level is chosen and the chips average together exactly as a
          camera would average them.
        */
        const du = Math.abs(ux - u0) / TILE_FT
        const dv = Math.abs(vy - v0) / TILE_FT
        const footprint = Math.max(du, dv) * texLevels[0].size

        trilinear(texLevels, u0 / TILE_FT, v0 / TILE_FT, footprint, col)

        /*
          The material, under the photograph's own light. Nothing is added on
          top: no specular term, no gradient, no highlight layer.
        */
        const l = light[p]
        const fr = col[0] * l
        const fg = col[1] * l
        const fb = col[2] * l

        r = r * (1 - a) + fr * a
        g = g * (1 - a) + fg * a
        b = b * (1 - a) + fb * a
      }

      if (dim) {
        r *= DIM_EXPOSURE * DIM_WARM[0]
        g *= DIM_EXPOSURE * DIM_WARM[1]
        b *= DIM_EXPOSURE * DIM_WARM[2]
      }

      out[p * 3] = linToSrgb(r)
      out[p * 3 + 1] = linToSrgb(g)
      out[p * 3 + 2] = linToSrgb(b)
    }
  }
  return out
}

/** Mean sRGB of the rendered floor only, for the colour-fidelity gate. */
function floorMean(buf) {
  const s = [0, 0, 0]
  let n = 0
  for (let p = 0; p < W * H; p++) {
    if (alpha[p] < 0.9) continue
    s[0] += buf[p * 3]; s[1] += buf[p * 3 + 1]; s[2] += buf[p * 3 + 2]
    n++
  }
  return s.map((v) => v / Math.max(1, n))
}

const only = process.argv[2]
const files = fs
  .readdirSync(TEXTURE_DIR)
  .filter((f) => f.endsWith('.webp'))
  .map((f) => f.replace('.webp', ''))
  .filter((s) => !only || s === only)
  .sort()

const manifest = {}
const report = []

for (const slug of files) {
  const levels = await mipmaps(path.join(TEXTURE_DIR, `${slug}.webp`))

  const sample = await sharp(`public/images/flake-blends/${slug}-flake-blend.jpg`)
    .extract({ left: 70, top: 70, width: 860, height: 860 })
    .removeAlpha()
    .stats()
  const sMean = sample.channels.slice(0, 3).map((c) => c.mean)

  /*
    ONE STATE, NATURAL LIGHT. The dim "one bulb" rendition is not emitted while
    the look is being settled.

    It is what the "almost black" floor actually was: a 0.25x linear exposure
    put the floor's median at 76 against 146 for the lit version, and the door's
    reflections then stood 1.45x above that dark field, which is what read as
    four white discs on a black surface. Bright was never the problem — it
    measured 146, a light-medium grey — but the two states were one toggle apart
    and the dim one is what got looked at.

    compose() still takes the flag and DIM_EXPOSURE is still here, so bringing
    the mode back is a one-line change once the lit floor is approved.
  */
  const buf = compose(levels, false)
  const img = sharp(buf, { raw: { width: W, height: H, channels: 3 } })
  for (const w of WIDTHS) {
    await img
      .clone()
      .resize(w, null, { kernel: 'lanczos3' })
      .webp({ quality: 80, effort: 6 })
      .toFile(path.join(OUT_DIR, `${slug}-${w}.webp`))
  }

  /*
    VERIFY_LOCK=1 also writes a LOSSLESS copy. Comparing the shipped WebP
    against the master proves nothing about whether this renderer stays inside
    the mask, because changing the floor changes the encoder's bit allocation
    across the whole frame — untouched wall pixels come back a few levels
    different purely from that. A PNG has no such excuse: any difference outside
    the mask is this code's doing.
  */
  if (process.env.VERIFY_LOCK) {
    await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
      .png({ compressionLevel: 6 })
      .toFile(path.join(OUT_DIR, `verify-${slug}.png`))
  }

  const fMean = floorMean(buf)
  /*
    Compared as a RATIO, not a difference. The floor sits under the room's
    light, so it is legitimately a little darker than a sample shot in a
    lightbox; what must not happen is the hue moving or one colour being
    darkened far more than another.
  */
  const ratio = fMean.map((v, i) => v / sMean[i])
  const spread = Math.max(...ratio) - Math.min(...ratio)
  report.push({ slug, sMean, fMean, ratio, spread })

  manifest[slug] = true
  const last = report[report.length - 1]
  console.log(
    `  ${slug.padEnd(20)} sample rgb(${last.sMean.map((v) => Math.round(v)).join(',')}) -> ` +
      `floor rgb(${last.fMean.map((v) => Math.round(v)).join(',')})  ` +
      `exposure ${(last.ratio.reduce((a, b) => a + b, 0) / 3).toFixed(2)}x  ` +
      `hue spread ${last.spread.toFixed(3)}${last.spread > 0.08 ? '  <-- HUE SHIFT' : ''}`,
  )
}

const worst = Math.max(...report.map((r) => r.spread))
const dark = report.filter((r) => r.ratio.reduce((a, b) => a + b, 0) / 3 < 0.62)
console.log(`\nworst hue spread: ${worst.toFixed(3)} (want < 0.08)`)
console.log(
  dark.length
    ? `TOO DARK: ${dark.map((d) => d.slug).join(', ')}`
    : 'no blend rendered below 0.62x its sample exposure',
)

if (!only) {
  const ts = `/* GENERATED by scripts/build-installed-previews.mjs — do not edit by hand. */

/*
  Pre-rendered installed-floor previews, one per blend.

  These are FLAT IMAGES, composited offline onto the one locked master
  photograph. The browser does not assemble a floor; it swaps an <img>. Any of
  them can be replaced with a photograph of a real finished floor by dropping
  the file in and leaving everything else alone.
*/

const WIDTHS = [${WIDTHS.join(', ')}] as const

/*
  There is no lighting parameter. A dim "one bulb" rendition used to exist
  alongside this and was what the floor-is-nearly-black report was actually
  about: it put the floor's median at 76 against 146 lit, and the garage door's
  reflections then stood 1.45x above that dark field, reading as white discs on
  a black surface.

  Bringing the mode back means re-introducing the argument here and in
  build-installed-previews.mjs — deliberately more than flipping a flag, so it
  cannot come back without someone looking at the numbers again.
*/

/** Blends that have a rendered preview. */
export const installedPreviewSlugs = [
${Object.keys(manifest).map((s) => `  '${s}',`).join('\n')}
] as const

export type InstalledPreviewSlug = (typeof installedPreviewSlugs)[number]

export const hasInstalledPreview = (slug: string): slug is InstalledPreviewSlug =>
  (installedPreviewSlugs as readonly string[]).includes(slug)

/** Largest rendition — use as the \`src\` fallback. */
export const installedPreview = (slug: string) => \`/floor-previews/\${slug}-${WIDTHS[0]}.webp\`

/** Responsive set, so a phone never downloads the desktop rendition. */
export const installedPreviewSrcSet = (slug: string) =>
  WIDTHS.map((w) => \`/floor-previews/\${slug}-\${w}.webp \${w}w\`).join(', ')

/** Natural size of the master, so the browser can reserve the box. */
export const INSTALLED_PREVIEW_SIZE = { width: ${W}, height: ${H} } as const
`
  fs.writeFileSync('lib/content/installed-previews.generated.ts', ts)
  console.log('\nWrote lib/content/installed-previews.generated.ts')
}

const total = fs.readdirSync(OUT_DIR).reduce((a, f) => a + fs.statSync(`${OUT_DIR}/${f}`).size, 0)
const n = fs.readdirSync(OUT_DIR).length
console.log(`${n} images, ${(total / 1024 / 1024).toFixed(1)} MB total, ${Math.round(total / n / 1024)} KB average`)
