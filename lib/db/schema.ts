import { bigserial, boolean, index, jsonb, text, timestamp } from 'drizzle-orm/pg-core'
import { pgTable } from 'drizzle-orm/pg-core'

/*
  Mirrors the live `estimate_leads` table. DDL is applied through the Neon MCP,
  not Drizzle Kit, so this file is a hand-maintained reflection of the database
  — if you change one, change the other in the same commit.

  There are no user accounts on this site: the quote form is public, so there is
  no `userId` column and nothing here is scoped per user. Every read is
  operator-side only and must never be exposed through a public route.
*/
export const estimateLeads = pgTable(
  'estimate_leads',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),

    /*
      Only name and phone are required. Everything else is optional by design:
      this is a lead form, and a half-filled form with a working phone number
      is a lead. Extra required fields cost more leads than the data is worth.
    */
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),

    /*
      Normalized twins of phone/email, used only for duplicate detection.
      Comparing raw input would treat "(346) 782-0903" and "346-782-0903" as
      different people. `phoneNormalized` is NOT NULL because phone always is;
      `emailNormalized` follows email and may be null.
    */
    phoneNormalized: text('phone_normalized').notNull(),
    emailNormalized: text('email_normalized'),

    // Project details — all optional.
    zip: text('zip'),
    area: text('area'),
    space: text('space'),
    system: text('system'),
    floorCondition: text('floor_condition'),
    timeframe: text('timeframe'),
    contactMethod: text('contact_method'),
    details: text('details'),

    /*
      Blob pathnames, never public URLs. The store is private, so these are
      resolved through an operator-only delivery route.
    */
    photoPathnames: jsonb('photo_pathnames').$type<string[]>().notNull().default([]),

    /*
      Explicit opt-in for SMS. Stored per-lead because consent must be
      demonstrable for the specific submission, not inferred site-wide.
    */
    smsConsent: boolean('sms_consent').notNull().default(false),

    // Attribution, captured server-side at submit.
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmTerm: text('utm_term'),
    utmContent: text('utm_content'),
    gclid: text('gclid'),
    gbraid: text('gbraid'),
    wbraid: text('wbraid'),
    fbclid: text('fbclid'),
    landingPath: text('landing_path'),
    referrer: text('referrer'),
    gaClientId: text('ga_client_id'),
    gaSessionId: text('ga_session_id'),
    userAgent: text('user_agent'),

    // identity+project fingerprint; see dedupeKeyFor().
    dedupeKey: text('dedupe_key').notNull(),

    /*
      Pipeline stage: new | contacted | quoted | won | lost.

      Plus `spam_suspected` (LEAD_STATUS_SPAM), which is a review flag rather
      than a stage. A honeypot hit lands here instead of being discarded, so a
      submission wrongly caught by autofill is still recoverable from the admin
      inbox. No DB-level constraint, so values are validated in application code.
    */
    status: text('status').notNull().default('new'),

    /*
      Outcome of the owner-notification email for THIS lead.

      Both nullable, and the pair is meaningful:
        notifiedAt set,   notifyError null  -> delivered to Resend
        notifiedAt null,  notifyError set   -> send failed, reason recorded
        both null                           -> not attempted (e.g. no API key)

      These exist because a failed notification used to be invisible: the error
      went to a server log the owner cannot read, so a silently undelivered
      lead looked identical to a delivered one. Storing the reason next to the
      lead makes the failure diagnosable from the admin inbox instead.
    */
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    notifyError: text('notify_error'),

    /*
      In-site inspection booking. Populated when the customer picks a time on
      the estimator's scheduling step (see app/actions/appointment.ts), which
      is why they are nullable — a lead can exist without a booked appointment.

      `appointmentAt` is the absolute instant of the chosen window's start;
      `appointmentSlotLabel` is the authoritative human label the server
      validated and emailed ("Thursday, September 24 · 8:00 – 10:00 AM (CT)"),
      stored so the admin inbox shows exactly what the customer was told rather
      than re-deriving and risking a mismatch. `appointmentStatus` is
      'not_scheduled' until a slot is booked, then 'scheduled'.
    */
    appointmentAt: timestamp('appointment_at', { withTimezone: true }),
    appointmentSlotLabel: text('appointment_slot_label'),
    appointmentStatus: text('appointment_status').notNull().default('not_scheduled'),
    appointmentBookedAt: timestamp('appointment_booked_at', { withTimezone: true }),
  },
  (t) => [
    index('estimate_leads_dedupe_idx').on(t.dedupeKey, t.createdAt.desc()),
    index('estimate_leads_created_at_idx').on(t.createdAt.desc()),
  ],
)

export type EstimateLead = typeof estimateLeads.$inferSelect
