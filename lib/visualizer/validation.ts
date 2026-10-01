import { PHOTO_MAX_BYTES, PHOTO_TYPES } from '@/lib/leads'

/*
  Photo validation for the garage-photo visualizer, written once and run twice.

  THE CLIENT COPY IS A COURTESY; THE SERVER COPY IS THE RULE. A file input's
  `accept` attribute and any check in the browser are hints — the action is
  reachable without the page. So the same functions below are called in the
  component (to tell someone immediately that their 40MB screenshot will not
  work) and again in the server action (to decide whether anything happens).
  Sharing the module is what keeps those two answers from drifting, which is
  the same reasoning as HONEYPOT_FIELD in lib/leads.ts.

  Types and the size ceiling are REUSED from lib/leads.ts rather than redefined:
  a visitor who can attach a 10MB HEIC to the estimator should not discover a
  different limit thirty seconds later on the same page.
*/

/** One file only — this is "my garage", not an album. */
export const VISUALIZER_MAX_FILES = 1

export type PhotoRejection =
  | { code: 'empty'; message: string }
  | { code: 'type'; message: string }
  | { code: 'size'; message: string }

export type PhotoCheck = { ok: true } | { ok: false; reason: PhotoRejection }

/*
  Messages are written for the person holding the phone, not for a log. They
  name the limit and the fix, because "invalid file" tells somebody standing in
  their garage nothing they can act on.
*/
function reject(code: PhotoRejection['code'], message: string): PhotoCheck {
  return { ok: false, reason: { code, message } }
}

export function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  /* One decimal under 10MB, none above: "9.4 MB", "24 MB". */
  return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`
}

/*
  Deliberately takes the three primitives rather than a File, so it runs in a
  test and on the server without constructing a browser File object.
*/
/*
  Maps a filename extension onto a supported type. Used only when the browser
  reports no type at all.
*/
const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}

export function extensionType(name?: string): string {
  const ext = name?.toLowerCase().split('.').pop() ?? ''
  return EXTENSION_TYPES[ext] ?? ''
}

export function checkPhotoParts(type: string, size: number, name?: string): PhotoCheck {
  if (size <= 0) {
    return reject('empty', `${name ? `"${name}"` : 'That file'} is empty. Try taking the photo again.`)
  }

  /*
    Type is compared case-insensitively and with any codec parameters stripped:
    some Android browsers send `image/jpeg; charset=utf-8`, and rejecting that
    would turn a working photo into a dead end.
  */
  const normalized = type.split(';')[0]!.trim().toLowerCase()

  /*
    AN EMPTY TYPE IS NOT A WRONG TYPE. iOS and several cloud pickers (Files,
    Drive, some gallery apps) hand over a perfectly good HEIC or JPEG with
    `type: ""` — the browser simply did not work out what it was. Refusing
    those told customers "Photos need to be JPG, PNG, WebP or HEIC" about a
    file that was one, which is the kind of error message that makes somebody
    give up rather than retry.

    So when the browser has no opinion, the extension gets one. This is a
    hint, not proof — the server re-checks, and nothing downstream trusts the
    name — but it is the difference between an iPhone photo uploading and an
    iPhone photo being silently impossible.
  */
  const fromName = extensionType(name)
  const effective = normalized || fromName

  if (!PHOTO_TYPES.includes(effective)) {
    return reject(
      'type',
      'That file is not an image we can read. Use a photo from your camera or gallery — JPEG, PNG, WebP or HEIC.',
    )
  }

  if (size > PHOTO_MAX_BYTES) {
    return reject(
      'size',
      `That photo is ${formatMegabytes(size)}. The limit is ${formatMegabytes(
        PHOTO_MAX_BYTES,
      )} — most phones stay under it unless the camera is set to maximum resolution.`,
    )
  }

  return { ok: true }
}

/** Convenience wrapper for the two callers that do hold a File. */
export function checkPhoto(file: { type: string; size: number; name?: string }): PhotoCheck {
  return checkPhotoParts(file.type, file.size, file.name)
}

/*
  The `accept` attribute for the file input, derived from the same list so a
  new supported type cannot be allowed by the server while the picker still
  filters it out.
*/
/*
  EXTENSIONS AS WELL AS TYPES. A picker that cannot map a HEIC to a MIME type
  will also fail to match `image/heic` in `accept`, and then greys the file
  out so it cannot be chosen at all — the most literal version of "I select a
  picture and nothing happens". Listing the extensions gives those pickers
  something they can match on.
*/
export const PHOTO_ACCEPT = [...PHOTO_TYPES, '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].join(
  ',',
)
