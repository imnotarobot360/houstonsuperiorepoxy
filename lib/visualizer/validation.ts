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
export function checkPhotoParts(type: string, size: number, name?: string): PhotoCheck {
  if (size <= 0) {
    return reject('empty', `${name ? `"${name}"` : 'That file'} is empty. Try taking the photo again.`)
  }

  /*
    Type is compared case-insensitively and with any codec parameters stripped:
    some Android browsers send `image/jpeg; charset=utf-8` and iOS has sent
    `IMAGE/HEIC`, and rejecting those would turn a working photo into a dead end.
  */
  const normalized = type.split(';')[0]!.trim().toLowerCase()
  if (!PHOTO_TYPES.includes(normalized)) {
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
export const PHOTO_ACCEPT = PHOTO_TYPES.join(',')
