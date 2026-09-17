import sharp from 'sharp'
import fs from 'node:fs'

/*
  Prepares the garage photograph and the two maps the floor is lit with.

  Run when the source photograph changes:
    node scripts/build-garage-scene.mjs <path-to-source.png>

  OUTPUTS
    garage-scene-{768,1152,1536}.webp   the scene, responsive
    garage-light.webp                   luminance, for soft-light
    garage-highlight.webp               specular only, for screen

  WHY TWO MAPS AND NOT ONE
  The brief's model is the right one:

      finalFloor = material * originalFloorLighting + clearCoatHighlights

  A single blended map cannot do both halves. `light` carries the broad shading
  — the bright pool near the camera, falloff into the back corners, the shadow
  the cabinets throw — and lands as soft-light so it both darkens and lifts.
  `highlight` carries only the specular returns, chiefly the four soft
  reflections the door throws down the slab, and lands as screen so it adds
  light without touching anything below its threshold.

  Splitting them is what stops the floor reading as a sticker: shading gives it
  a place in the room, and the reflections give the topcoat something to do.

  CONTRAST IS DELIBERATE. An earlier version blurred and normalised into a very
  flat map, and the result inherited almost none of the room — the floor went
  uniformly pale and sat on top of the photograph rather than in it. The linear
  stretch below pushes the shading back out around its own mean.
*/

const SRC = process.argv[2] ?? 'D:/Houston Superior Epoxy/garage-scene.png'
const OUT = 'public/images/designer'

/* Brand primary, resolved from the site's own --primary token. */
const ORANGE = [237, 96, 0]
/* The wall logo's saturated blue, sampled from the photograph. */
const BLUE_VALUE = 175
/*
  Logo bounding box, and the blue it must lead by before anything is recoloured.
  Both guards are needed: the walls and floor in this scene are cool-neutral, so
  a bare blue test without the box repainted half the image warm.
*/
const LOGO_BOX = { x0: 1230, x1: 1375, y0: 135, y1: 345 }
const BLUE_FLOOR = 14
const BLUE_RAMP = 40

fs.mkdirSync(OUT, { recursive: true })

/* ---------------------------------------------- 1. recolour the wall logo */
const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: C } = info
const px = Buffer.from(data)
let recoloured = 0

for (let y = LOGO_BOX.y0; y <= LOGO_BOX.y1; y++) {
  for (let x = LOGO_BOX.x0; x <= LOGO_BOX.x1; x++) {
    const i = (y * W + x) * C
    const r = px[i], g = px[i + 1], b = px[i + 2]
    const lead = b - Math.max(r, g)
    const blueness = Math.max(0, Math.min(1, (lead - BLUE_FLOOR) / BLUE_RAMP))
    if (blueness <= 0) continue
    /* Scale the orange by this pixel's lightness so the mark keeps its shading. */
    const t = Math.min(1.25, Math.max(r, g, b) / BLUE_VALUE)
    for (let ch = 0; ch < 3; ch++) {
      px[i + ch] = Math.round(px[i + ch] * (1 - blueness) + Math.min(255, ORANGE[ch] * t) * blueness)
    }
    recoloured++
  }
}
console.log(`logo: recoloured ${recoloured} px to brand orange`)

const scene = await sharp(px, { raw: { width: W, height: H, channels: C } }).png().toBuffer()

/* ------------------------------------------------- 2. the scene, responsive */
for (const w of [768, 1152, 1536]) {
  await sharp(scene).resize(w).webp({ quality: 82, effort: 6 }).toFile(`${OUT}/garage-scene-${w}.webp`)
}

/* ------------------------------------------------------- 3. the light map */
/*
  Blur enough to erase the bare concrete's own speckle — which would otherwise
  print through every blend — but not so much that the cabinet shadow and the
  corner falloff dissolve. Then stretch around the mean so the shading actually
  reads once blended.
*/
const grey = await sharp(scene).greyscale().blur(11).resize(768).raw().toBuffer({ resolveWithObject: true })
let sum = 0
for (let i = 0; i < grey.data.length; i += grey.info.channels) sum += grey.data[i]
const mean = sum / (grey.data.length / grey.info.channels)
/*
  1.15, down from 1.75. The stretch exists to stop the shading washing out once
  it is blended, not to become the subject. At 1.75 — and composited at full
  strength, which it also was — the bright pool in the middle of the slab
  swallowed the flake entirely and read as a radial gradient painted over the
  floor. The map's job is to place the material in the room, not to replace it.
*/
const CONTRAST = 1.15
console.log(`light map: mean ${mean.toFixed(1)}, contrast x${CONTRAST}`)

await sharp(scene)
  .greyscale()
  .blur(11)
  .resize(768)
  /* out = (in - mean) * CONTRAST + mean, as a linear transform */
  .linear(CONTRAST, -(mean * (CONTRAST - 1)))
  .webp({ quality: 82, effort: 6 })
  .toFile(`${OUT}/garage-light.webp`)

/* --------------------------------------------------- 4. the highlight map */
/*
  Specular only. Everything below the threshold is crushed to black so `screen`
  adds nothing there; what survives is the door reflections down the slab.

  GAIN AND BLUR BOTH CUT HARD, and for the same reason. A 2.6x gain behind a
  hard threshold saturates every surviving pixel, and a blur of 9 then spreads
  that saturated mass into soft round blooms — so what began as the photograph's
  own reflections arrived as white blobs with no relation to anything in the
  room. 1.5 keeps the reflections short of saturation and a blur of 4 keeps
  their actual shape, which is the whole point of deriving this from the
  photograph rather than drawing a gradient.
*/
const THRESHOLD = 172
await sharp(scene)
  .greyscale()
  .resize(768)
  .linear(1.5, -(THRESHOLD * 1.5 - 8))
  .blur(4)
  .webp({ quality: 80, effort: 6 })
  .toFile(`${OUT}/garage-highlight.webp`)

for (const f of fs.readdirSync(OUT)) {
  console.log(`  ${f.padEnd(26)}${Math.round(fs.statSync(`${OUT}/${f}`).size / 1024)} KB`)
}
