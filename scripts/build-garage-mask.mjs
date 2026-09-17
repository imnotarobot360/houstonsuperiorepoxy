import sharp from 'sharp'
import fs from 'node:fs'

/*
  Builds the permanent, pixel-aligned floor mask for the master garage image.

  Run once when the master photograph changes:
    node scripts/build-garage-mask.mjs [source.png]

  WHY A MASK AND NOT A clip-path POLYGON
  A four-point polygon cannot describe this floor. Its real boundary steps in
  and out around the cabinet footprint, the workbench toe kick, two runs of
  baseboard at different heights, the garage-door threshold and the concrete
  steps on the right. A polygon either cuts through those objects or leaves bare
  slab showing beside them.

  THE TWO THINGS THIS SEPARATES, previously conflated in one clip-path:
    perspective quad  -> how the texture is PROJECTED (finer toward the door)
    this mask         -> where the coating is VISIBLE
  Different questions, different answers.

  HOW THE BOUNDARY IS FOUND — REGION GROWING, NOT COLUMN SCANNING
  An earlier version scanned each column from the bottom for the first dark run.
  It striped: neighbouring columns disagreed wherever the test was marginal, so
  the boundary came out ragged, sat well below the cabinet bases, and sent
  magenta fingers climbing the step face under inspection.

  Region growing from seeds inside the slab is stable because it follows
  CONNECTIVITY. Every real boundary here is dark — baseboards 76-102, cabinet
  carcasses ~46, the equipment panel 0, the door threshold's shadow — so the
  fill stops at them on its own, with no per-column decision to disagree about.

  Two things the fill cannot work out for itself, both handled explicitly:

    CEILING   it climbed the right-hand wall where the baseboard runs light near
              the step. No slab pixel sits above the door threshold, so the fill
              is barred from going higher.
    STEPS     the concrete steps sit ON the slab, are the same grey, and are
              connected to it, so nothing about colour or connectivity
              distinguishes them. They are excluded by hand — which is what
              manual mask refinement is for.
*/

const SRC = process.argv[2] ?? 'D:/Houston Superior Epoxy/garage-scene.png'
const OUT = 'public/images/designer/garage-floor-mask.png'

/*
  Only a LOWER bound is needed. Dark means boundary — baseboard, cabinet,
  threshold shadow — and the fill must stop there.

  104, not 118: the slab falls into shadow under the wall equipment on the
  right and reads 105-132 there, which a 118 cutoff carved a bite out of. The
  baseboard runs 76-102, so this still separates them — and it can be this
  close to the boundary only because the envelope already prevents any upward
  leak, which a brightness threshold alone never could.

  There is deliberately no upper bound. The slab carries the garage door's
  reflections as bright vertical streaks, and capping brightness rejected them,
  punching pale stripes straight down the finished floor where the reflections
  fell. Growing upward into the wall is prevented by the per-column envelope
  below, which is a far better guard than a brightness threshold: it is
  geometric, and the wall and the reflections are not distinguishable by
  luminance anyway.
*/
const LO = 104
const HI = 255
/*
  The slab's highest point is the garage-door threshold, measured at 0.462H.
  This sits just above it.

  IT MUST NOT SIT ANY HIGHER. At 0.448 the fill had a 14px band of wall and
  door it was permitted to occupy, and because growth is 4-connected it ran
  along that band horizontally — putting a thin magenta stripe clean across the
  door under inspection. A ceiling above the real slab line does not just admit
  a few stray pixels; it opens a corridor.
*/
const CEILING = 0.458

/*
  The concrete steps, traced by hand and verified by overlay at 400%.
  Generous by a couple of pixels on the slab side: coating stopping a hair short
  of the step reads as a shadow line, whereas coating climbing it reads as a bug.

  A COUPLE OF PIXELS, THOUGH — NOT TWENTY-FIVE. The first trace put the base at
  0.60 clean across, well below where the step actually meets the slab, and
  carved a visible wedge of finished floor away in front of it. The three points
  along the bottom follow the real base line: 0.540 where the step's left face
  lands, 0.578 by the right-hand wall.

  The top edge stays up at 0.452, above the step itself. Everything between
  there and the step is wall, already excluded, so the extra reach costs nothing
  and closes the corner where the two meet.
*/
const STEPS = [
  [0.862, 0.452],
  [1.0, 0.452],
  [1.0, 0.578],
  [0.958, 0.578],
  [0.889, 0.540],
  [0.862, 0.523],
]

const FEATHER = 1.2

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: C } = info

const L = new Float32Array(W * H)
for (let i = 0, p = 0; i < data.length; i += C, p++) {
  L[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
}

/*
  ------------------------------------------------- 1a. per-column envelope

  A single flat ceiling is not enough. The slab line is not level across the
  frame — 0.462H at the door, 0.49H by the right wall, 0.58H under the cabinets
  — so a flat ceiling set for the highest point leaves a band of wall open
  everywhere else, and 4-connected growth runs along it. That is what put a
  block of coating on the wall beside the step.

  So the flat ceiling becomes a coarse PER-COLUMN envelope: scan each column
  from the bottom for the first sustained dark run, then median it hard across
  columns. On its own this scan is too jittery to be a mask — that was the
  first attempt — but as an upper bound for the fill it is exactly right, and
  the fill still decides the precise edge within it.
*/
/*
  112 sits in the gap between the two things this has to tell apart:

    baseboard, cabinet, threshold shadow   0 - 102   boundary
    slab in shadow under the wall equip   123 - 132   floor

  At 125 the darkest shadowed slab fell on the wrong side of the line, so the
  scan walked up from the bottom, met the floor's own shadow at luma 123 and
  reported a boundary two thirds of the way down the frame. The fill then had an
  envelope below the floor it was meant to find, and a wedge of finished floor
  by the right wall stayed bare no matter how the brightness bounds were moved.
*/
const DARK = 112
const RUN = 3
const SLACK = 8
/*
  Wide, because the envelope only needs to be a coarse upper bound — the fill
  finds the real edge inside it. At 41 the shadows the wall equipment throws on
  the slab were narrow enough to survive the median and bit notches up into the
  floor near the right baseboard. 91 bridges them while still tracking the
  genuine, gradual rise of the slab line across the frame.
*/
const ENV_MEDIAN = 91

/*
  A column that finds no dark run at all reports NULL, not a number.

  THIS DISTINCTION IS THE WHOLE FIX. An earlier version defaulted a failed scan
  to the bottom of the search range, which quietly asserted a boundary at 0.66H
  in exactly the columns that had found no evidence of one — and there are two
  such runs, both where the wall behind is bright white rather than dark: beside
  the wall equipment at x 0.73-0.77, and around the step at x 0.83-0.90. The
  first carved a bite clean out of the finished floor near the right wall.

  "I could not find the boundary" and "the boundary is here" are different
  answers, and only the median below is entitled to guess between them.
*/
const rawEnv = new Array(W).fill(null)
const yHard = Math.round(H * CEILING)
const yLow = Math.round(H * 0.66)
for (let x = 0; x < W; x++) {
  for (let y = H - 1; y > yHard; y--) {
    let dark = true
    for (let k = 0; k < RUN; k++) {
      if (L[Math.max(0, y - k) * W + x] >= DARK) { dark = false; break }
    }
    if (dark) { rawEnv[x] = Math.max(yHard, Math.min(yLow, y)); break }
  }
}
const envelope = new Array(W)
const envRaw = new Array(W)
const eHalf = Math.floor(ENV_MEDIAN / 2)
for (let x = 0; x < W; x++) {
  const win = []
  for (let d = -eHalf; d <= eHalf; d++) {
    const v = rawEnv[Math.max(0, Math.min(W - 1, x + d))]
    if (v !== null) win.push(v)
  }
  if (win.length === 0) {
    /* No column anywhere near here found an edge — impose nothing but the ceiling. */
    envelope[x] = yHard
    continue
  }
  win.sort((a, b) => a - b)
  envRaw[x] = win[win.length >> 1]
  /* Slack lets the fill find the true edge a little above the coarse estimate. */
  envelope[x] = Math.max(yHard, envRaw[x] - SLACK)
}

/* ------------------------------------------------------- 1b. region growing */
const seen = new Uint8Array(W * H)
const stack = []
for (const [fx, fy] of [[0.5, 0.95], [0.15, 0.9], [0.85, 0.9], [0.5, 0.72], [0.3, 0.62], [0.7, 0.62]]) {
  stack.push(Math.round(fy * H) * W + Math.round(fx * W))
}

let filled = 0
while (stack.length) {
  const p = stack.pop()
  if (seen[p]) continue
  const y = (p / W) | 0
  if (y < envelope[p % W]) continue
  const v = L[p]
  if (v < LO || v > HI) continue
  seen[p] = 1
  filled++
  const x = p % W
  if (x > 0) stack.push(p - 1)
  if (x < W - 1) stack.push(p + 1)
  if (y > 0) stack.push(p - W)
  if (y < H - 1) stack.push(p + W)
}

/*
  -------------------------------------------- 1c. climb into the baseboard shadow

  The slab darkens where the baseboard shades it, down into the 90s — below the
  bound that keeps the fill off the baseboard itself, which runs 76-102. So the
  fill stops short and leaves a ragged strip of bare concrete a few pixels below
  the wall, which under inspection reads as a bad masking job rather than as a
  shadow.

  No threshold can fix this, and the measurements say so plainly. Under the
  workbench, where it is worst, a column reads:

    baseboard   79 - 108
    slab         90 - 122

  Those overlap. Any cutoff that takes all the floor takes baseboard with it.

  What every column does have is a sharp dark LINE where the baseboard meets the
  slab — its own shadow, a local minimum, 7 to 14 under the bright wall and
  still down at 57 to 97 in the shadowed corner. It is a minimum everywhere,
  even where it is nowhere near dark in absolute terms.

  So this does not threshold. Walking up from a pixel already known to be floor,
  it finds the darkest point of that line and treats everything below it as
  floor. A minimum is relative, which is exactly why it survives the shadow that
  defeats every fixed bound.

  WHERE TO STOP LOOKING is the whole difficulty, and two simpler rules each
  failed in the opposite direction:

    darkest in the band   ran up onto the baseboard along the right-hand wall,
                          by gradually more as it went. The baseboard shades
                          toward its own bottom edge there, and past the
                          junction that shading is darker than the junction.

    first valley          stopped short in the deep shadow under the workbench,
                          on a two-pixel wiggle in the concrete, leaving the
                          ragged bare notch it was meant to close.

  So the search stops on the RISE. Walking up, it tracks the running minimum and
  gives up once the column has climbed VALLEY_RISE back above it — that rise is
  the far side of the junction, the baseboard starting. The minimum seen before
  then is the line. This needs no knowledge of how dark the junction is, which
  is the point: it is 7 under the bright wall and 56 under the workbench.

  AND THE RISE MUST ACTUALLY BE SEEN. A column that reaches the cap still
  falling has not found a junction — it is looking up something dark, and the
  minimum it holds is just the darkest part of that. The cabinet toe kicks are
  exactly this: recessed, near black, no brighter above than at the floor. Left
  unchecked the climb ran its full allowance up each one and stamped blocks of
  coating on the cabinet faces. Unconfirmed now means no climb at all, which is
  also why the allowance can afford to be generous.

  The column is smoothed by three pixels first, or the concrete's own speckle
  supplies both the minimum and the rise within a pixel of wherever it starts.

  Two guards, because a per-column scan is exactly what made the first version
  of this mask stripe:

    the climb is hard-capped, so a column with no boundary above it — the step,
    which is light concrete all the way up — cannot run away. The widest gap
    measured anywhere in this photograph is 18px; 34 leaves the rise room to
    show itself above even that one.

    the heights are median-filtered across columns, so neighbouring columns
    cannot disagree by more than the noise the median absorbs
*/
const MAX_CLIMB = 34
const CLIMB_MEDIAN = 31
/*
  8, not 18. The two cases this has to tell apart are not separated by how FAR
  the column recovers, and asking for 18 rejected the shadowed stretch under the
  workbench outright — the baseboard there is only 9 brighter than the junction,
  and the ragged notch came straight back.

  They are separated by whether it recovers AT ALL. Past a junction the column
  always turns and rises, however little; up a toe kick it falls to the cap and
  stays there. So the bar is low, and it is the turn that is being detected.
  Speckle cannot clear even this one, because the column is smoothed by three
  pixels first and the heights are median-filtered across 31 columns after.
*/
const VALLEY_RISE = 8

const topFilled = new Array(W).fill(-1)
for (let x = 0; x < W; x++) {
  for (let y = yHard; y < H; y++) {
    if (seen[y * W + x]) { topFilled[x] = y; break }
  }
}

const rawClimb = new Array(W).fill(0)
for (let x = 0; x < W; x++) {
  const top = topFilled[x]
  if (top < 0) continue
  /*
    Measured from the fill's own edge, not from envRaw. The envelope is a median
    across 91 columns and is nowhere near the edge in the columns that need
    this; anchoring the band there capped the climb at almost nothing.
  */
  /*
    THE SEARCH IS NOT BOUND BY THE CEILING, only the fill is. Clipping the band
    at yHard left the columns under the workbench with the junction found but no
    room above it to watch for the rise, so nothing was ever confirmed and the
    bare notch survived every other adjustment. Reading a pixel above the slab
    line commits to nothing; the clamp below is what keeps coating off the wall.
  */
  const stop = Math.max(2, top - MAX_CLIMB)
  const sm = (y) => (L[(y - 1) * W + x] + L[y * W + x] + L[(y + 1) * W + x]) / 3

  let lowest = Infinity
  let yb = top - 1
  let confirmed = false
  for (let y = top - 1; y > stop; y--) {
    const v = sm(y)
    if (v < lowest) { lowest = v; yb = y }
    else if (v > lowest + VALLEY_RISE) { confirmed = true; break }
  }
  rawClimb[x] = confirmed ? Math.max(0, Math.min(top - 1 - yb, top - 1 - yHard)) : 0
}

let climbed = 0
const cHalf = CLIMB_MEDIAN >> 1
for (let x = 0; x < W; x++) {
  if (topFilled[x] < 0) continue
  const win = []
  for (let d = -cHalf; d <= cHalf; d++) win.push(rawClimb[Math.max(0, Math.min(W - 1, x + d))])
  win.sort((a, b) => a - b)
  const n = Math.min(win[cHalf], rawClimb[x])
  for (let k = 1; k <= n; k++) {
    const p = (topFilled[x] - k) * W + x
    if (!seen[p]) { seen[p] = 1; climbed++ }
  }
}

/* ------------------------------------------------------ 2. subtract the steps */
const poly = STEPS.map(([fx, fy]) => [fx * W, fy * H])
const inPoly = (x, y) => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
let carved = 0
for (let y = Math.round(0.44 * H); y < Math.round(0.62 * H); y++) {
  for (let x = Math.round(0.85 * W); x < W; x++) {
    const p = y * W + x
    if (seen[p] && inPoly(x, y)) {
      seen[p] = 0
      carved++
    }
  }
}

/*
  ------------------------------------------------------- 3. morphological close
  Fills the pinholes the fill leaves behind — dark flecks in the polished
  concrete that fall under LO and are not boundaries. Dilate then erode, so
  holes close without the outer boundary moving.
*/
const R = 2
const dil = new Uint8Array(W * H)
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let on = 0
    for (let dy = -R; dy <= R && !on; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const yy = y + dy, xx = x + dx
        if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue
        if (seen[yy * W + xx]) { on = 1; break }
      }
    }
    dil[y * W + x] = on
  }
}
const mask = Buffer.alloc(W * H, 0)
let floorPx = 0
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let all = 1
    for (let dy = -R; dy <= R && all; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const yy = y + dy, xx = x + dx
        if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue
        if (!dil[yy * W + xx]) { all = 0; break }
      }
    }
    if (all) { mask[y * W + x] = 255; floorPx++ }
  }
}

/*
  ------------------------------------------------------------- 4. write it out

  WHITE WITH THE COVERAGE IN THE ALPHA CHANNEL, not a greyscale image.

  CSS mask-image defaults to mask-mode: match-source, and for a raster image
  that means ALPHA. A greyscale mask is uniformly opaque, so it masks nothing
  and the coating covers the whole frame. mask-mode: luminance says otherwise
  but is younger than the browsers this has to run on, and there is no reason to
  depend on it when the alpha channel is free.

  The blur lands on the alpha, which is where the 1-2px of anti-aliasing along
  the boundary has to be: the edge then fades rather than stair-steps, and the
  coating meets the baseboard the way a real one does.
*/
/*
  toColourspace('b-w') AFTER THE BLUR IS LOAD-BEARING. sharp promotes a
  one-channel raw buffer to three-channel sRGB when it blurs it, so without this
  the buffer comes back interleaved RGB at three times the length. Indexing it
  per pixel then reads the top third of the image stretched across the whole
  frame — which here is ceiling, so every alpha byte came out 0 and the mask hid
  the coating completely while still looking correct in every overlay, because
  the overlays were rendered from `mask` rather than from the file.

  The assertion is there because that failure is silent and the symptom appears
  three steps away.
*/
const feathered = await sharp(mask, { raw: { width: W, height: H, channels: 1 } })
  .blur(FEATHER)
  .toColourspace('b-w')
  .raw()
  .toBuffer()

if (feathered.length !== W * H) {
  throw new Error(`feathered mask is ${feathered.length} bytes, expected ${W * H} (one channel)`)
}

const rgba = Buffer.alloc(W * H * 4)
for (let i = 0; i < W * H; i++) {
  rgba[i * 4] = 255
  rgba[i * 4 + 1] = 255
  rgba[i * 4 + 2] = 255
  rgba[i * 4 + 3] = feathered[i]
}

await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUT)

console.log(`region grow: ${filled} px, shadow climb: ${climbed} px, steps carved: ${carved}`)
console.log(`mask: ${W}x${H}, floor = ${((floorPx / (W * H)) * 100).toFixed(1)}% -> ${OUT}`)
console.log(`  ${Math.round(fs.statSync(OUT).size / 1024)} KB`)
