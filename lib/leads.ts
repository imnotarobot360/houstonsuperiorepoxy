import { z } from 'zod'
import { systems as siteSystems } from '@/lib/site'
import {
  COATING_CONDITIONS as ESTIMATOR_CONDITIONS,
  TIMEFRAMES as ESTIMATOR_TIMEFRAMES,
} from '@/lib/pricing-config'

/*
  Shared validation contract for the estimate form.

  Both the client form and the server action import this, so the rules cannot
  drift apart. The client copy is a convenience that gives fast feedback; the
  server copy is the one that actually decides whether a lead is accepted —
  client validation is trivially bypassed.
*/

/** Digits only, US 10-digit or 11-digit leading-1, for duplicate matching. */
export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
}

export const normalizeEmail = (raw: string) => raw.trim().toLowerCase()

/* ------------------------------------------------------------ choice fields */

export const SPACES = [
  'Garage',
  'Patio / pool deck',
  'Basement',
  'Commercial / retail',
  'Warehouse / industrial',
  'Other',
] as const

/*
  System options are DERIVED from lib/site.ts rather than retyped here.

  The four coating systems are already described in one canonical place and
  rendered across the systems section and service pages. Hardcoding a second
  list would let the form offer a system the site does not sell (or omit one it
  does) the first time that list changes.

  The extra entries are lead-form-only intents that are not products: they
  route to the same estimator but describe why the customer is calling.
*/
export const SYSTEMS = [
  'Not sure — recommend one',
  ...siteSystems.map((s) => s.name),
  'Repair / recoat existing floor',
  'Coating removal',
] as const satisfies readonly string[]

/*
  Condition options are phrased as things a homeowner can actually assess by
  looking at the floor — not trade terms they would have to guess at.
*/
export const CONDITIONS = [
  'Not sure',
  'Bare concrete, good shape',
  'Cracks or pitting',
  'Existing coating peeling',
  'Oil stains',
  'New construction',
] as const

export const TIMEFRAMES = [
  'As soon as possible',
  'Within a month',
  '1 – 3 months',
  'Just getting prices',
] as const

export const CONTACT_METHODS = ['Call', 'Text', 'Email'] as const

/* --------------------------------------------------- Meta Ads funnel options

  The /lp garage funnel asks the SAME facts in more granular, ad-matched
  language than the main estimate form. These live in their own arrays rather
  than being merged into SPACES/CONDITIONS/TIMEFRAMES, because those three are
  rendered directly by components/estimate.tsx — appending funnel-specific
  wording there would silently change the main form's UI. Keeping them separate
  lets the funnel speak its own language while the canonical form is untouched.

  How they map onto the existing columns (no schema migration needed):
    - garage size  -> `area`           (free text, so any label is accepted)
    - floor state  -> `floorCondition` (validated via ACCEPTED_CONDITIONS)
    - timeline     -> `timeframe`      (validated via ACCEPTED_TIMEFRAMES)
*/
export const FUNNEL_GARAGE_SIZES = [
  '1-Car Garage',
  'Standard 2-Car Garage',
  '3-Car or Tandem Garage',
  'Larger Than 3-Car',
  'Other Area',
] as const

export const FUNNEL_FLOOR_CONDITIONS = [
  'Bare Concrete',
  'New Construction Concrete',
  'Existing Epoxy or Coating',
  'Paint or Sealer',
  'Not Sure',
] as const

export const FUNNEL_TIMELINES = [
  'As Soon as Possible',
  'Within 2 Weeks',
  'Within 30 Days',
  'Within 1–3 Months',
  'Just Researching',
] as const

/*
  Floor conditions that trigger the "existing coating may need removal" notice
  in the funnel — the single largest pricing swing, so it is called out before
  the customer expects a firm number.
*/
export const FUNNEL_COATING_REMOVAL_CONDITIONS: readonly string[] = [
  'Existing Epoxy or Coating',
  'Paint or Sealer',
]

/*
  The SERVER accepts the union of both vocabularies so a funnel submission
  validates without weakening the main form's stricter option list. Only the
  server-side `oneOf` checks read these; the client forms each render their own
  narrower array. De-duplicated in case the two lists ever share a value.
*/
const unique = (values: readonly string[]) => Array.from(new Set(values))
export const ACCEPTED_CONDITIONS = unique([
  ...CONDITIONS,
  ...FUNNEL_FLOOR_CONDITIONS,
  ...ESTIMATOR_CONDITIONS,
])
export const ACCEPTED_TIMEFRAMES = unique([
  ...TIMEFRAMES,
  ...FUNNEL_TIMELINES,
  ...ESTIMATOR_TIMEFRAMES,
])

/*
  Photo limits. Enforced on the server as well — a client-side `accept`
  attribute and size check are hints, not protection.
*/
export const PHOTO_MAX_COUNT = 6
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024 // 10 MB each
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

/* ---------------------------------------------------------------- honeypot */

/*
  Name of the off-screen bot-trap field, shared so the form and the server
  action can never disagree about which field to check. A mismatch here would
  disable spam filtering silently.

  The name matters more than it looks. This was previously `company_website`,
  which is precisely the kind of name Chrome's address autofill and password
  managers recognise and fill — `company`, `website`, `url`, `address`, `email`
  and friends are all autofill magnets, and `autocomplete="off"` is widely
  ignored for them. A filled honeypot meant a discarded lead, so that naming
  quietly turned autofill into data loss.

  `referral_code_confirm` is meaningless to an autofill heuristic (it maps to no
  known personal-data type) while still looking like a real field to a bot that
  blindly fills every input it finds.
*/
export const HONEYPOT_FIELD = 'referral_code_confirm'

/*
  Status marking a lead whose honeypot was filled. It is intentionally NOT in
  the admin status buttons: it is a review flag the owner clears by choosing a
  real status, not a stage in the sales pipeline.
*/
export const LEAD_STATUS_SPAM = 'spam_suspected'

/* ------------------------------------------------------------------ schema */

/*
  Collapses '' and undefined to undefined so an untouched optional <select> or
  input is stored as NULL rather than an empty string.
*/
const blankToUndefined = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess((v) => (v === '' || v == null ? undefined : v), inner.optional())

/*
  Membership check against a runtime list.

  Used instead of z.enum because SYSTEMS is derived from lib/site.ts by
  spreading a mapped array, which produces a plain string array rather than the
  literal tuple z.enum requires. Validating by `includes` gives the same
  guarantee — an unknown option is rejected — without forcing the canonical
  list to be retyped as literals just to satisfy the type checker.
*/
const oneOf = (allowed: readonly string[], message: string) =>
  blankToUndefined(z.string().trim().refine((v) => allowed.includes(v), message))

export const leadSchema = z.object({
  /*
    ONLY `name` and `phone` are required.

    Deliberate: every extra required field on a lead form costs real leads. A
    name plus a working phone number is already a callable lead, and the
    estimator collects the rest on the phone. Do not promote fields to required
    without a business reason.
  */
  name: z.string().trim().min(2, 'Enter your name.').max(120),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v).length === 10, 'Enter a 10-digit US phone number.'),

  /* Optional — but if given, it has to be a real address. */
  email: blankToUndefined(z.string().trim().toLowerCase().email('Enter a valid email address.').max(200)),

  zip: blankToUndefined(z.string().trim().regex(/^\d{5}$/, 'Enter a 5-digit ZIP code.')),

  // Free text: customers write "about 500 sq ft", "2 car", "20x22".
  area: blankToUndefined(z.string().trim().max(120)),

  space: oneOf(SPACES, 'Choose one of the listed spaces.'),
  system: oneOf(SYSTEMS, 'Choose one of the listed systems.'),
  /*
    Validated against the UNION of the main-form and funnel vocabularies (see
    ACCEPTED_*), so both entry points post to this one schema without either
    having to adopt the other's wording.
  */
  floorCondition: oneOf(ACCEPTED_CONDITIONS, 'Choose one of the listed conditions.'),
  timeframe: oneOf(ACCEPTED_TIMEFRAMES, 'Choose one of the listed timeframes.'),
  contactMethod: oneOf(CONTACT_METHODS, 'Choose call, text or email.'),

  details: blankToUndefined(z.string().trim().max(2000)),

  /*
    Opt-in, defaulting to false. An unchecked box must mean "no consent", so
    this is never inferred from the presence of a phone number.
  */
  smsConsent: z.coerce.boolean().default(false),
})

export type LeadInput = z.infer<typeof leadSchema>

/** Field-keyed messages, shaped for rendering beside each input. */
export type LeadFieldErrors = Partial<Record<keyof LeadInput | 'photos' | 'form', string>>

/* ------------------------------------------------------------------ dedupe */

/*
  Identity + project fingerprint used to spot repeat submissions.

  Deliberately excludes free-text fields and photos: someone who submits, then
  resubmits after adding a sentence of detail, is the same lead — not a new one.
  Includes space/system so a genuinely different project from the same person
  still gets through.
*/
export function dedupeKeyFor(input: {
  phone: string
  email?: string
  space?: string
  system?: string
}) {
  return [
    normalizePhone(input.phone),
    input.email ? normalizeEmail(input.email) : '',
    input.space ?? '',
    input.system ?? '',
  ].join('|')
}

/** Window within which an identical fingerprint is treated as a duplicate. */
export const DEDUPE_WINDOW_MINUTES = 30
