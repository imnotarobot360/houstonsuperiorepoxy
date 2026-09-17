import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

/*
  Builds the installed-floor material for every stocked blend, FROM THE REAL
  MANUFACTURER SAMPLE.

  WHAT THIS REPLACED, AND WHY IT WAS WRONG
  The previous version read the sample only to extract a colour histogram, then
  drew its own chips from that palette. It was procedural generation wearing the
  sample's colours, and it failed the only test that matters: a floor rendered
  from Dovetail has to still look like Dovetail. Chips drawn at 5px and shown at
  a fraction of that became grey static — the right colours, none of the
  material. The blend's character lives in its chip SHAPES, its size
  distribution, the way large pale flakes sit against small charcoal ones. A
  histogram throws all of that away.

  So nothing here is invented. The sample is the source of truth for colour,
  shape, ratio and character, and every pixel of the output comes from it.

  THE PROBLEM THIS SOLVES
  A sample holds about 9 chips across, call it 80 in total. A floor tile needs
  thousands. The material therefore has to REUSE the sample, and the whole craft
  is in reusing it without the eye catching the repeat.

  HOW THE PIECES ARE JOINED — MIN-CUT QUILTING, NOT FEATHERING
  The obvious approach, and the first one tried, is to feather the pieces and
  average where they overlap. It does hide the seams, and it ruins the material:
  averaging a white chip in one piece against a charcoal chip in another gives
  mid-grey, so contrast collapses everywhere pieces meet and the floor comes out
  muddy. Dovetail's four separate tones washed into one.

  So pieces are not blended at all. Each patch overlaps its neighbours, and the
  boundary is cut along the path of least difference THROUGH that overlap
  (Efros & Freeman image quilting). Every output pixel is an unmodified sample
  pixel at full contrast, and the join wanders around chips instead of across
  them, so there is no straight edge for the eye to find.

  SCALE IS DELIBERATELY EXAGGERATED, and this is the one honest departure from
  physical accuracy in the whole pipeline. See CHIP_PX.
*/

const SRC_DIR = 'public/images/flake-blends'
/*
  NOT UNDER public/. These textures are an INTERMEDIATE: the only thing that
  reads them is scripts/build-installed-previews.mjs, which bakes them into the
  flat previews that actually ship. Serving them too would put ~13MB of tiles
  in the deployment that no page ever requests.
*/
const OUT_DIR = 'assets/flake-textures'

/*
  The sample photographs have a white rounded border and a soft vignette at the
  corners. Mosaicking those in scatters pale blooms across the floor, so the
  outer 7% is discarded before anything else happens.
*/
const INSET = 0.07

const TILE = 2048

/*
  CHIP SIZE IN THE OUTPUT TEXTURE — and the exaggeration, stated plainly.

  A quarter-inch chip on a garage floor, in a preview about 600px wide, is
  genuinely about ONE PIXEL. That is not a rendering defect, it is what the
  optics give you, and it is why the physically-derived previous version came
  out as static. Rendering this floor to scale means rendering a floor on which
  nobody can see what they are buying.

  So the material is drawn as though the flake were roughly an inch rather than
  a quarter, about 4x. At 25px per chip a tile holds ~82 chips across, and once
  the tile is laid on the perspective plane that lands chips at a few pixels in
  the foreground and merging into the blend at the door — which is what a real
  photograph of a flake floor looks like, and what the preview exists to show.

  Anyone changing the scale should change it here and nowhere else: TILE/CHIP_PX
  decides how many chips a tile holds, and the component's --tile decides how
  big that tile is on screen. Those two together are the scale.
*/
const CHIP_PX = 25
const FLAKE_INCHES = 0.25

/*
  QUILT GEOMETRY. K must divide TILE exactly, or the last patch cannot wrap onto
  the first and the tile will not join itself.

  K=16 gives 128px steps and 160px patches — about six chips per patch. Larger
  patches carry more of the blend's character but need a bigger source to cut
  from, and the smallest source here is 179px (see srcPx): a patch has to fit
  inside it with room left over for distinct crop positions.
*/
const K = 16
const STEP = TILE / K
const OVERLAP = 32
const PATCH = STEP + OVERLAP

/* How many crops are auditioned per patch; the best-matching one is placed. */
const CANDIDATES = 14

/*
  NO TONAL COMPRESSION. These were 0.88 gain and +8 lift, on the theory that
  chips under resin sit calmer than loose flake in a photographer's lightbox.

  The theory is defensible and the effect was not affordable. Measured at
  matched chip scale, the installed floor was retaining only 70% of the
  sample's tonal span — and it does not have 30% to give away. Two other
  unavoidable stages already cost contrast on the way to the screen: the mipmap
  averages several chips into every pixel once the floor recedes, which is what
  a real camera does, and WebP smooths what survives that. Spending another 12%
  on a stylistic hunch is what let Dovetail's charcoal wash into its mid grey,
  and charcoal-against-white IS Dovetail.

  Any settling the resin really does is better carried by the light field in
  build-installed-previews.mjs, where it is tied to the photograph's own light
  instead of applied blindly to every blend.
*/
const TOPCOAT_GAIN = 1
const TOPCOAT_LIFT = 0

/** Deterministic PRNG, so a rebuild produces a byte-identical texture. */
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

/**
 * The blend's own chip size, in pixels of its sample photograph.
 *
 * Counting edge crossings along scanlines: a chip boundary is a luminance step,
 * so crossings per row divided into the row's width is the mean chip diameter.
 * Blends genuinely differ — Dovetail runs ~94px, Obsidian ~66px — and without
 * this every blend would be rescaled by the same factor and the coarse ones
 * would render finer than the fine ones.
 *
 * CLAMPED, because the measure is confounded by chips that carry striation
 * within them: those read as extra edges and make a coarse blend measure fine.
 * The clamp keeps an outlier from rescaling one blend's whole floor, and its
 * upper end also sets the smallest source the quilt will ever have to cut from.
 */
function measureChip(L, W, H) {
  const T = 14
  let edges = 0
  let rows = 0
  for (let y = 2; y < H - 2; y += 2) {
    let prev = false
    for (let x = 2; x < W - 2; x++) {
      const isEdge = Math.abs(L[y * W + x + 1] - L[y * W + x - 1]) > T
      if (isEdge && !prev) edges++
      prev = isEdge
    }
    rows++
  }
  const perRow = edges / Math.max(1, rows)
  return Math.max(55, Math.min(120, W / Math.max(1, perRow)))
}

/** The eight square symmetries, so one sample yields eight stocks of pieces. */
function orientations(src, n) {
  const out = []
  for (let o = 0; o < 8; o++) {
    const b = Buffer.alloc(n * n * 3)
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let u = x
        let v = y
        if (o & 1) u = n - 1 - u
        if (o & 2) v = n - 1 - v
        if (o & 4) { const t = u; u = v; v = t }
        const s = (v * n + u) * 3
        const d = (y * n + x) * 3
        b[d] = src[s]
        b[d + 1] = src[s + 1]
        b[d + 2] = src[s + 2]
      }
    }
    out.push(b)
  }
  return out
}

/**
 * Minimum-error boundary through an overlap strip.
 *
 * `err[i * len + t]` is the cost of cutting at depth i along the strip at
 * position t. Returns, for each t, the depth at which to switch from the old
 * pixels to the new ones. Standard DP: each step may move one place sideways,
 * so the boundary is continuous and free to wander around chips.
 */
function minCut(err, depth, len) {
  const E = new Float64Array(depth * len)
  for (let i = 0; i < depth; i++) E[i * len] = err[i * len]
  for (let t = 1; t < len; t++) {
    for (let i = 0; i < depth; i++) {
      let best = E[i * len + t - 1]
      if (i > 0) best = Math.min(best, E[(i - 1) * len + t - 1])
      if (i < depth - 1) best = Math.min(best, E[(i + 1) * len + t - 1])
      E[i * len + t] = err[i * len + t] + best
    }
  }
  let bi = 0
  for (let i = 1; i < depth; i++) if (E[i * len + len - 1] < E[bi * len + len - 1]) bi = i
  const cut = new Int32Array(len)
  cut[len - 1] = bi
  for (let t = len - 2; t >= 0; t--) {
    let best = bi
    let bv = E[bi * len + t]
    if (bi > 0 && E[(bi - 1) * len + t] < bv) { bv = E[(bi - 1) * len + t]; best = bi - 1 }
    if (bi < depth - 1 && E[(bi + 1) * len + t] < bv) { best = bi + 1 }
    bi = best
    cut[t] = bi
  }
  return cut
}

async function build(slug, srcFile) {
  const meta = await sharp(srcFile).metadata()
  const inset = Math.round(meta.width * INSET)
  const interior = sharp(srcFile).extract({
    left: inset,
    top: inset,
    width: meta.width - 2 * inset,
    height: meta.height - 2 * inset,
  })

  const probe = await interior.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const PW = probe.info.width
  const PC = probe.info.channels
  const lum = new Float32Array(PW * probe.info.height)
  for (let i = 0, p = 0; i < probe.data.length; i += PC, p++) {
    lum[p] = 0.299 * probe.data[i] + 0.587 * probe.data[i + 1] + 0.114 * probe.data[i + 2]
  }
  const chipPx = measureChip(lum, PW, probe.info.height)

  /*
    Prefiltered ONCE by sharp, at the scale the quilt needs, before any patch is
    cut. This is the multi-scale step: the expensive, high-quality minification
    happens here with a proper Lanczos kernel, and every patch placed afterwards
    is copied at 1:1. Downscaling at placement time instead would alias, which
    is exactly the harsh digital shimmer to avoid.
  */
  const srcPx = Math.max(PATCH + 16, Math.round(PW * (CHIP_PX / chipPx)))
  const src = await interior
    .clone()
    .resize(srcPx, srcPx, { kernel: 'lanczos3' })
    .removeAlpha()
    .raw()
    .toBuffer()

  const orient = orientations(src, srcPx)
  const rand = rng([...slug].reduce((a, c) => a + c.charCodeAt(0), 7))
  const canvas = Buffer.alloc(TILE * TILE * 3)

  const at = (x, y) => ((((y % TILE) + TILE) % TILE) * TILE + (((x % TILE) + TILE) % TILE)) * 3
  const pick = () => ({
    o: Math.floor(rand() * 8),
    ox: Math.floor(rand() * (srcPx - PATCH)),
    oy: Math.floor(rand() * (srcPx - PATCH)),
  })
  const sAt = (c, dx, dy) => ((c.oy + dy) * srcPx + (c.ox + dx)) * 3

  for (let j = 0; j < K; j++) {
    for (let i = 0; i < K; i++) {
      const px = i * STEP
      const py = j * STEP
      /*
        Which sides already have neighbours. The last row and column wrap onto
        the first, which by then IS written — that is what makes the finished
        tile join itself, with a real min-cut rather than a blended fudge.
      */
      const hasL = i > 0
      const hasT = j > 0
      const hasR = i === K - 1
      const hasB = j === K - 1

      let best = null
      let bestErr = Infinity
      for (let c = 0; c < CANDIDATES; c++) {
        const cand = pick()
        const buf = orient[cand.o]
        let e = 0
        if (hasL) {
          for (let dy = 0; dy < PATCH; dy += 2) {
            for (let dx = 0; dx < OVERLAP; dx += 2) {
              const a = at(px + dx, py + dy)
              const b = sAt(cand, dx, dy)
              for (let ch = 0; ch < 3; ch++) { const d = canvas[a + ch] - buf[b + ch]; e += d * d }
            }
          }
        }
        if (hasT) {
          for (let dy = 0; dy < OVERLAP; dy += 2) {
            for (let dx = 0; dx < PATCH; dx += 2) {
              const a = at(px + dx, py + dy)
              const b = sAt(cand, dx, dy)
              for (let ch = 0; ch < 3; ch++) { const d = canvas[a + ch] - buf[b + ch]; e += d * d }
            }
          }
        }
        if (hasR) {
          for (let dy = 0; dy < PATCH; dy += 2) {
            for (let dx = PATCH - OVERLAP; dx < PATCH; dx += 2) {
              const a = at(px + dx, py + dy)
              const b = sAt(cand, dx, dy)
              for (let ch = 0; ch < 3; ch++) { const d = canvas[a + ch] - buf[b + ch]; e += d * d }
            }
          }
        }
        if (hasB) {
          for (let dy = PATCH - OVERLAP; dy < PATCH; dy += 2) {
            for (let dx = 0; dx < PATCH; dx += 2) {
              const a = at(px + dx, py + dy)
              const b = sAt(cand, dx, dy)
              for (let ch = 0; ch < 3; ch++) { const d = canvas[a + ch] - buf[b + ch]; e += d * d }
            }
          }
        }
        if (e < bestErr) { bestErr = e; best = cand }
      }

      const buf = orient[best.o]
      const diff = (dx, dy) => {
        const a = at(px + dx, py + dy)
        const b = sAt(best, dx, dy)
        let d = 0
        for (let ch = 0; ch < 3; ch++) { const t = canvas[a + ch] - buf[b + ch]; d += t * t }
        return d
      }

      /* Cut depths: how far into the patch the old pixels are kept on each side. */
      let cutL = null, cutR = null, cutT = null, cutB = null
      if (hasL) {
        const err = new Float64Array(OVERLAP * PATCH)
        for (let dx = 0; dx < OVERLAP; dx++) for (let dy = 0; dy < PATCH; dy++) err[dx * PATCH + dy] = diff(dx, dy)
        cutL = minCut(err, OVERLAP, PATCH)
      }
      if (hasR) {
        const err = new Float64Array(OVERLAP * PATCH)
        for (let k = 0; k < OVERLAP; k++) for (let dy = 0; dy < PATCH; dy++) err[k * PATCH + dy] = diff(PATCH - 1 - k, dy)
        cutR = minCut(err, OVERLAP, PATCH)
      }
      if (hasT) {
        const err = new Float64Array(OVERLAP * PATCH)
        for (let dy = 0; dy < OVERLAP; dy++) for (let dx = 0; dx < PATCH; dx++) err[dy * PATCH + dx] = diff(dx, dy)
        cutT = minCut(err, OVERLAP, PATCH)
      }
      if (hasB) {
        const err = new Float64Array(OVERLAP * PATCH)
        for (let k = 0; k < OVERLAP; k++) for (let dx = 0; dx < PATCH; dx++) err[k * PATCH + dx] = diff(dx, PATCH - 1 - k)
        cutB = minCut(err, OVERLAP, PATCH)
      }

      for (let dy = 0; dy < PATCH; dy++) {
        for (let dx = 0; dx < PATCH; dx++) {
          if (cutL && dx < cutL[dy]) continue
          if (cutR && PATCH - 1 - dx < cutR[dy]) continue
          if (cutT && dy < cutT[dx]) continue
          if (cutB && PATCH - 1 - dy < cutB[dx]) continue
          const a = at(px + dx, py + dy)
          const b = sAt(best, dx, dy)
          canvas[a] = buf[b]
          canvas[a + 1] = buf[b + 1]
          canvas[a + 2] = buf[b + 2]
        }
      }
    }
  }

  const mean = [0, 0, 0]
  for (let p = 0; p < TILE * TILE; p++) {
    for (let c = 0; c < 3; c++) {
      const v = Math.max(0, Math.min(255, canvas[p * 3 + c] * TOPCOAT_GAIN + TOPCOAT_LIFT))
      canvas[p * 3 + c] = v
      mean[c] += v
    }
  }
  for (let c = 0; c < 3; c++) mean[c] /= TILE * TILE

  await sharp(canvas, { raw: { width: TILE, height: TILE, channels: 3 } })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(OUT_DIR, `${slug}.webp`))

  const sSum = [0, 0, 0]
  for (let i = 0; i < probe.data.length; i += PC) {
    sSum[0] += probe.data[i]
    sSum[1] += probe.data[i + 1]
    sSum[2] += probe.data[i + 2]
  }
  const sMean = sSum.map((s) => s / (probe.data.length / PC))

  return { slug, chipPx, srcPx, mean, sMean }
}

fs.mkdirSync(OUT_DIR, { recursive: true })

const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('-flake-blend.jpg')).sort()

const inchesPerTile = (TILE / CHIP_PX) * FLAKE_INCHES
console.log(
  `Building ${files.length} floor materials from the real samples\n` +
    `  ${TILE}px tile, ${CHIP_PX}px chips => ${Math.round(TILE / CHIP_PX)} chips across ` +
    `= ${(inchesPerTile / 12).toFixed(2)} ft of slab at ${FLAKE_INCHES}in flake\n` +
    `  ${K}x${K} quilt, ${PATCH}px patches, ${OVERLAP}px overlap, min-cut joins, ${CANDIDATES} candidates each\n`,
)

let worstDrift = 0
for (const f of files) {
  const slug = f.replace('-flake-blend.jpg', '')
  const r = await build(slug, path.join(SRC_DIR, f))

  /*
    COLOUR FIDELITY GATE. The output must still be the blend. Expected is the
    sample's own mean put through the topcoat settle; drifting far from that
    means the floor is no longer the colour the customer picked.
  */
  const expect = r.sMean.map((v) => v * TOPCOAT_GAIN + TOPCOAT_LIFT)
  const drift = Math.max(...r.mean.map((v, i) => Math.abs(v - expect[i])))
  if (drift > worstDrift) worstDrift = drift

  console.log(
    `  ${slug.padEnd(20)} chip ${r.chipPx.toFixed(0).padStart(3)}px -> src ${String(r.srcPx).padStart(3)}px   ` +
      `sample rgb(${r.sMean.map((v) => Math.round(v)).join(',')}) -> ` +
      `floor rgb(${r.mean.map((v) => Math.round(v)).join(',')})  drift ${drift.toFixed(1)}` +
      `${drift > 6 ? '  <-- DRIFT' : ''}`,
  )
}

console.log(`\nworst colour drift across all blends: ${worstDrift.toFixed(1)} levels`)

const total = fs
  .readdirSync(OUT_DIR)
  .filter((f) => f.endsWith('.webp'))
  .reduce((a, f) => a + fs.statSync(`${OUT_DIR}/${f}`).size, 0)
console.log(`Wrote ${files.length} materials, ${Math.round(total / 1024 / files.length)} KB average`)
