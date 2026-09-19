import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

/*
  Takes a generated garage image, checks it, and installs it as a blend's
  preview.

    node scripts/import-generated-preview.mjs <slug> <image> [--force]

  WHY THIS IS NOT JUST A COPY
  The floor previews may now be AI-generated (owner decision, 18 Sep 2026 —
  CONTENT-POLICY.md). What that changes is where the pixels come from. What it
  does not change is that the pixels still have to be true: the customer is
  choosing a product from this picture, and a preview that has quietly drifted
  from the blend, or from the room, misleads them just as effectively whether a
  renderer or a model drew it.

  The compositing pipeline got these properties for free, because it only ever
  wrote floor pixels and sampled colour from the real sample. A generated image
  gets none of them for free — a model redraws every pixel, including the
  cabinets, the logo and the camera — so they have to be measured instead.

  THE CHECKS, and what each one is actually protecting:

    GEOMETRY   dimensions and aspect must match the master, or the preview
               cannot sit in the same box as the other 26 without cropping.

    ROOM       how much of the NON-FLOOR area differs from the master. This is
               the one that catches a model regenerating the garage. 27 colours
               are meant to be the same room; if this drifts, the customer
               steps through the rail and watches the cabinets change shape.

    COLOUR     floor tone against the blend's own sample, as an exposure ratio
               and a hue spread. Catches "it made a nice floor, but not this
               blend" — the failure the whole rebuild started from.

    BRIGHTNESS floor median. Catches the near-black floor.

    LIGHT      how far the brightest part of the floor sits above the median,
               with chips blurred out. Catches invented spotlights and the four
               white discs.

  A failure prints and stops. --force installs anyway and says loudly that it
  did, because there are legitimate reasons to override — a deliberately
  different room, say — and no legitimate reason to override silently.
*/

const MASTER = 'public/images/designer/garage-scene-1536.webp'
const MASK = 'public/images/designer/garage-floor-mask.png'
const SAMPLES = 'public/images/flake-blends'
const OUT_DIR = 'public/floor-previews'
const WIDTHS = [1536, 1152, 768]

/* Thresholds. Chosen from what the compositing pipeline actually achieves. */
const ROOM_MAX_CHANGED = 0.02 // fraction of non-floor pixels allowed to differ
const ROOM_DELTA = 12 // ...by more than this, per channel
const EXPOSURE_MIN = 0.75
const EXPOSURE_MAX = 1.25
const HUE_SPREAD_MAX = 0.08
const MEDIAN_MIN = 28 // below this a floor reads as black rather than dark
const LIGHT_SPREAD_MAX = 1.45 // the old disc artefact measured 1.45x

const [, , slug, imagePath, ...rest] = process.argv
const force = rest.includes('--force')

if (!slug || !imagePath) {
  console.error('usage: node scripts/import-generated-preview.mjs <slug> <image> [--force]')
  process.exit(1)
}
if (!fs.existsSync(imagePath)) {
  console.error(`no such image: ${imagePath}`)
  process.exit(1)
}

/*
  Importing a file that already lives in OUT_DIR re-encodes lossy WebP a second
  time, which degrades it for no gain — the checks below would pass and the
  image would come out very slightly worse than it went in. Almost always this
  means someone pointed at the installed copy instead of the source, so it is
  refused rather than silently accepted.
*/
if (!force && path.resolve(imagePath).startsWith(path.resolve(OUT_DIR))) {
  console.error(
    `${imagePath} is already installed in ${OUT_DIR}.\n` +
      'Re-encoding it would compress an already-compressed image a second time.\n' +
      'Point at the original export, or pass --force if you really mean to.',
  )
  process.exit(1)
}

const samplePath = path.join(SAMPLES, `${slug}-flake-blend.jpg`)
if (!fs.existsSync(samplePath)) {
  console.error(`no sample for "${slug}" — expected ${samplePath}`)
  process.exit(1)
}

/*
  READ ONCE, THEN NEVER TOUCH THE PATH AGAIN. Every check below runs off this
  buffer rather than re-opening the file, because libvips keeps a handle on a
  path it has read and Windows then refuses to write to it. That bites exactly
  when the image being imported already lives in OUT_DIR — which is the case
  every time someone re-checks an installed preview.
*/
const source = fs.readFileSync(imagePath)

const master = await sharp(MASTER).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = master.info.width
const H = master.info.height
const C = master.info.channels

const meta = await sharp(source).metadata()
const failures = []
const notes = []

/* ------------------------------------------------------------- 1. geometry */
const aspectIn = meta.width / meta.height
const aspectMaster = W / H
if (Math.abs(aspectIn - aspectMaster) > 0.005) {
  failures.push(
    `GEOMETRY  aspect ${aspectIn.toFixed(3)} vs master ${aspectMaster.toFixed(3)} — ` +
      `it would have to be cropped to sit in the same box`,
  )
} else {
  notes.push(`geometry   ${meta.width}x${meta.height}, aspect matches the master`)
}

/* Everything below compares at the master's size. */
const img = await sharp(source)
  .resize(W, H, { fit: 'fill', kernel: 'lanczos3' })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
const IC = img.info.channels

const maskImg = await sharp(MASK).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const KC = maskImg.info.channels
const alpha = new Float32Array(W * H)
for (let p = 0; p < W * H; p++) alpha[p] = maskImg.data[p * KC + 3] / 255

/* ----------------------------------------------------------------- 2. room */
let outside = 0
let changed = 0
let worst = 0
for (let p = 0; p < W * H; p++) {
  if (alpha[p] > 0) continue
  outside++
  let d = 0
  for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(master.data[p * C + c] - img.data[p * IC + c]))
  if (d > ROOM_DELTA) changed++
  if (d > worst) worst = d
}
const changedFrac = changed / Math.max(1, outside)
if (changedFrac > ROOM_MAX_CHANGED) {
  failures.push(
    `ROOM      ${(changedFrac * 100).toFixed(1)}% of non-floor pixels differ from the master ` +
      `by more than ${ROOM_DELTA} (worst ${worst}). The garage is not the same garage; ` +
      `stepping through the colour rail will show the room changing.`,
  )
} else {
  notes.push(`room       ${(changedFrac * 100).toFixed(2)}% of non-floor pixels moved, worst delta ${worst}`)
}

/* --------------------------------------------------- 3. colour, 4. brightness */
const sample = await sharp(samplePath)
  .extract({ left: 70, top: 70, width: 860, height: 860 })
  .removeAlpha()
  .stats()
const sMean = sample.channels.slice(0, 3).map((c) => c.mean)

const fSum = [0, 0, 0]
let n = 0
const lum = []
for (let p = 0; p < W * H; p++) {
  if (alpha[p] < 0.9) continue
  const r = img.data[p * IC]
  const g = img.data[p * IC + 1]
  const b = img.data[p * IC + 2]
  fSum[0] += r; fSum[1] += g; fSum[2] += b
  lum.push(0.299 * r + 0.587 * g + 0.114 * b)
  n++
}
const fMean = fSum.map((v) => v / Math.max(1, n))
const ratio = fMean.map((v, i) => v / sMean[i])
const exposure = ratio.reduce((a, b) => a + b, 0) / 3
const hueSpread = Math.max(...ratio) - Math.min(...ratio)

if (exposure < EXPOSURE_MIN || exposure > EXPOSURE_MAX) {
  failures.push(
    `COLOUR    floor sits at ${exposure.toFixed(2)}x the sample's brightness ` +
      `(want ${EXPOSURE_MIN}-${EXPOSURE_MAX}). rgb(${fMean.map(Math.round).join(',')}) ` +
      `against sample rgb(${sMean.map(Math.round).join(',')}).`,
  )
} else {
  notes.push(`colour     exposure ${exposure.toFixed(2)}x, rgb(${fMean.map(Math.round).join(',')})`)
}
if (hueSpread > HUE_SPREAD_MAX) {
  failures.push(
    `COLOUR    hue spread ${hueSpread.toFixed(3)} (want < ${HUE_SPREAD_MAX}) — one channel has ` +
      `shifted relative to the others, so this is not the blend the customer picked.`,
  )
} else {
  notes.push(`hue        spread ${hueSpread.toFixed(3)}`)
}

lum.sort((a, b) => a - b)
const median = lum[Math.floor(lum.length / 2)]
if (median < MEDIAN_MIN) {
  failures.push(`BRIGHTNESS floor median ${Math.round(median)} — reads as black, not as a floor.`)
} else {
  notes.push(`brightness floor median ${Math.round(median)}`)
}

/* ---------------------------------------------------------------- 5. light */
/*
  Chips blurred out so this measures LIGHTING rather than the blend's own
  contrast, and the floor eroded from its edge so the blur cannot reach a wall
  — on a dark floor, bright wall pixels bleeding in look exactly like a
  spotlight and would fail a clean image.
*/
const R = 24
const interior = []
for (let y = R; y < H - R; y++) {
  for (let x = R; x < W - R; x++) {
    let ok = true
    for (let dy = -R; dy <= R && ok; dy += R) {
      for (let dx = -R; dx <= R; dx += R) {
        if (alpha[(y + dy) * W + (x + dx)] < 0.98) { ok = false; break }
      }
    }
    if (ok) interior.push(y * W + x)
  }
}
const blurred = await sharp(source)
  .resize(W, H, { fit: 'fill' })
  .greyscale()
  .blur(14)
  .raw()
  .toBuffer({ resolveWithObject: true })
const BC = blurred.info.channels
const field = interior.map((p) => blurred.data[p * BC]).sort((a, b) => a - b)
const spread = field[Math.floor(field.length * 0.99)] / field[Math.floor(field.length * 0.5)]
if (spread > LIGHT_SPREAD_MAX) {
  failures.push(
    `LIGHT     brightest 1% of the floor sits ${spread.toFixed(2)}x above the median ` +
      `(want < ${LIGHT_SPREAD_MAX}) — that is the signature of drawn-in highlights.`,
  )
} else {
  notes.push(`light      spread ${spread.toFixed(2)}x above median`)
}

/* ---------------------------------------------------------------- verdict */
console.log(`\nchecking ${imagePath} as "${slug}"\n`)
for (const s of notes) console.log(`  ok    ${s}`)
for (const f of failures) console.log(`  FAIL  ${f}`)

if (failures.length && !force) {
  console.log(`\n${failures.length} check(s) failed. Nothing was written.`)
  console.log('Re-run with --force to install it anyway.')
  process.exit(1)
}
if (failures.length && force) {
  console.log(`\n${failures.length} check(s) failed and --force was given. Installing anyway.`)
}

fs.mkdirSync(OUT_DIR, { recursive: true })
/*
  Read once into memory before writing anything. sharp refuses to use the same
  path for input and output, and one of the renditions shares a name with the
  source whenever the image being imported already lives in OUT_DIR — which is
  exactly what happens when re-checking a preview that is already installed.
*/
for (const w of WIDTHS) {
  await sharp(source)
    .resize(w, Math.round((w * H) / W), { fit: 'fill', kernel: 'lanczos3' })
    .webp({ quality: 80, effort: 6 })
    .toFile(path.join(OUT_DIR, `${slug}-bright-${w}.webp`))
}
console.log(`\ninstalled ${WIDTHS.length} renditions as ${slug}-bright-*.webp`)
console.log(
  'NOTE: this writes the lit state only. The One bulb rendition for this blend is still\n' +
    'the composited one, so the two will not match until a dim version is imported too.',
)
