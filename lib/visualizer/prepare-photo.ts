/*
  Shrinks and re-encodes a photo in the browser before it is uploaded.

  TWO PROBLEMS, ONE FIX.

  SPEED. A modern phone takes 4000x3000 photos of 3-5 MB. Every one of those
  bytes crosses a cellular connection before generation can even start, and the
  provider downscales the image anyway — so the upload was pure waiting. A long
  edge of 1536px is more than the model uses and lands around 300 KB.

  HEIC. iPhones shoot HEIC by default and most image APIs cannot decode it. The
  upload accepts HEIC (see validation.ts) but the provider would reject it. The
  browser CAN decode anything it is able to display, so drawing the file to a
  canvas and reading it back as JPEG converts it on the device, for free, with
  no server-side codec and no extra dependency.

  IT IS BEST-EFFORT AND NEVER FATAL. If decoding fails — an exotic format, a
  browser without createImageBitmap, a canvas that refuses — the original file
  is returned untouched and the server decides. A photo that might have worked
  must never be lost to an optimisation.
*/

/** Long edge after resizing. Larger than the model needs, small enough to send. */
export const MAX_EDGE = 1536

/** JPEG quality. 0.82 is visually clean on a photo and roughly a tenth the bytes. */
const QUALITY = 0.82

export type PreparedPhoto = {
  file: File
  /** True when the file was actually re-encoded, for reporting and tests. */
  converted: boolean
  originalBytes: number
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const originalBytes = file.size

  try {
    /*
      createImageBitmap handles HEIC on iOS and is markedly faster than an
      <img> round trip, because it decodes off the main thread.
    */
    if (typeof createImageBitmap !== 'function') return { file, converted: false, originalBytes }

    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))

    /*
      Already small AND already a format the provider takes: leave it alone
      rather than re-encoding for nothing, which only loses quality.

      WEBP BELONGS IN THIS LIST. Leaving it out meant an already-small WebP was
      re-encoded to JPEG and came back 42% LARGER — measured, not guessed. The
      point of this module is to send fewer bytes; making a file bigger is the
      exact opposite.
    */
    const providerSafe =
      file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
    if (scale === 1 && providerSafe) {
      bitmap.close?.()
      return { file, converted: false, originalBytes }
    }

    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return { file, converted: false, originalBytes }
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    )
    if (!blob) return { file, converted: false, originalBytes }

    /*
      Keep whichever is smaller — unless the original is a format the provider
      cannot read (HEIC, or no type at all), in which case the conversion is
      the whole point and size does not get a vote.

      A downscale can still lose to the original when the source was
      aggressively compressed: a modern codec at 1536px can beat JPEG at the
      same size. Shipping the bigger file would be a pessimisation wearing an
      optimisation's clothes.
    */
    if (providerSafe && blob.size >= file.size) {
      return { file, converted: false, originalBytes }
    }

    /*
      Renamed to .jpg as well as retyped: a provider that sniffs the extension
      rather than the content type would otherwise still see a HEIC name.
    */
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return {
      file: new File([blob], name, { type: 'image/jpeg' }),
      converted: true,
      originalBytes,
    }
  } catch {
    /* Decoding failed — send what we were given and let the server judge. */
    return { file, converted: false, originalBytes }
  }
}
