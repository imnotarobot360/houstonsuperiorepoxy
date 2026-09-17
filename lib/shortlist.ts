/*
  The blend shortlist.

  WHAT THIS IS FOR, because it changes every decision below: a customer taps a
  heart on /colors/, and the crew turns up at the estimate carrying those exact
  sample boards. The hearts are not the feature. Getting the names into the
  lead is the feature — a shortlist that only ever lives in the customer's
  browser is a toy.

  WHY localStorage AND NOT AN ACCOUNT
  Asking someone to register before they can save a colour would lose more
  leads than the shortlist wins. The tradeoff is real and worth stating: the
  list is per-browser, so it does not follow them from phone to laptop, and
  clearing site data loses it. That is acceptable because the list is a
  short-lived aid to one conversation, not a record we owe them.

  THE LIST IS NOT A LEAD. Nothing here is transmitted anywhere by itself. It
  reaches us only when the customer submits the estimate form with it attached,
  which is a deliberate act — see SHORTLIST_FIELD.
*/

/** localStorage key. Namespaced like the attribution keys in lib/analytics.ts. */
export const SHORTLIST_KEY = 'hse_blend_shortlist'

/**
 * Hard cap, and it is a product decision rather than a technical one.
 *
 * The promise attached to this feature is that we bring these exact boards to
 * the estimate. Boards are physical, the van is not infinite, and a customer
 * who "shortlists" nineteen blends has not narrowed anything down — they have
 * moved the decision to the driveway, which is the thing this is meant to
 * prevent. Four is what the /colors/ copy already promises.
 */
export const SHORTLIST_MAX = 4

/**
 * The form field the shortlist rides in on.
 *
 * Read by app/actions/estimate.ts and folded into the lead's `details`, which
 * is what /admin/leads and the notification email already display. Deliberately
 * NOT a new database column: a migration against the production table is a
 * heavier and riskier change than this feature earns, and a line of text in
 * the field the crew already reads is worth more than a column they would have
 * to be told about.
 */
export const SHORTLIST_FIELD = 'blend_shortlist'

/**
 * Same-page sync between the hearts and the shortlist bar.
 *
 * The browser fires `storage` only in OTHER tabs, never the one that wrote, so
 * two components in one page cannot hear each other through it. This custom
 * event covers the same-tab case; `storage` still covers the cross-tab one.
 */
export const SHORTLIST_EVENT = 'hse:shortlist'

/** Guard against a corrupt or hand-edited value. */
const isSlugList = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string' && /^[a-z0-9-]{1,60}$/.test(s))

/**
 * Read the shortlist.
 *
 * Every access is wrapped: localStorage throws outright in some private-mode
 * configurations, and a saved colour is never allowed to be the reason a page
 * fails to render. An unreadable list is an empty list.
 */
export function readShortlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SHORTLIST_KEY) ?? '[]')
    return isSlugList(parsed) ? parsed.slice(0, SHORTLIST_MAX) : []
  } catch {
    return []
  }
}

/** Persist and notify this page's other shortlist components. */
export function writeShortlist(slugs: string[]): string[] {
  const next = slugs.slice(0, SHORTLIST_MAX)
  if (typeof window === 'undefined') return next
  try {
    window.localStorage.setItem(SHORTLIST_KEY, JSON.stringify(next))
  } catch {
    /* Private mode can reject writes. The in-memory state still updates. */
  }
  try {
    window.dispatchEvent(new CustomEvent(SHORTLIST_EVENT, { detail: next }))
  } catch {
    /* Older browsers without CustomEvent still get the state update. */
  }
  return next
}

/**
 * Toggle one blend.
 *
 * At the cap, adding is REFUSED rather than silently dropping the oldest pick.
 * Quietly evicting a colour someone chose is the kind of small betrayal that
 * makes a feature feel broken — the UI tells them the list is full instead.
 */
export function toggleShortlist(slug: string, current = readShortlist()) {
  if (current.includes(slug)) {
    return { slugs: writeShortlist(current.filter((s) => s !== slug)), rejected: false }
  }
  if (current.length >= SHORTLIST_MAX) return { slugs: current, rejected: true }
  return { slugs: writeShortlist([...current, slug]), rejected: false }
}

/**
 * The line appended to the lead's `details`.
 *
 * Prefixed and plain so it is obvious in the inbox that this came from the
 * shortlist rather than being typed by the customer, and so it survives being
 * read on a phone in a driveway.
 */
export function formatShortlistForLead(names: string[]): string {
  if (names.length === 0) return ''
  return `Blend shortlist (bring these sample boards): ${names.join(', ')}`
}
