import sharp from 'sharp'

const SRC = 'public/images/hse-mark.png'

// Brand ink (#14181f). The metallic "HSE" letters are near-white with dark
// shading, so they need a dark ground to stay legible — that ground is baked
// into every icon rather than relying on the browser's tab colour.
const INK = { r: 0x14, g: 0x18, b: 0x1f, alpha: 1 }

// House + letters only. The speckled floor plinth (y >= 388) is pure noise
// below ~48px, so it is cropped out entirely.
const CROP = { left: 65, top: 49, width: 439, height: 332 }

const base = await sharp(SRC)
  .extract(CROP)
  // Lift the metallic letters and deepen the orange so both survive downscaling.
  .modulate({ brightness: 1.12, saturation: 1.3 })
  .linear(1.18, -12)
  .png()
  .toBuffer()

async function emit(size, file, padRatio = 0.04) {
  const pad = Math.max(1, Math.round(size * padRatio))
  const inner = size - pad * 2

  const art = await sharp(base)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3',
    })
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: INK },
  })
    .composite([{ input: art, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(file)

  console.log('[v0] wrote', file, `${size}x${size}`)
}

await emit(16, 'public/favicon-16.png', 0)
await emit(32, 'public/favicon-32.png', 0)
await emit(48, 'public/favicon-48.png', 0.03)
// iOS applies its own rounded mask, so this stays a full-bleed square.
await emit(180, 'public/apple-icon.png', 0.08)
await emit(192, 'public/icon-192.png', 0.08)
await emit(512, 'public/icon-512.png', 0.08)
