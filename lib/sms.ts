import 'server-only'

/*
  Customer SMS — TEMPLATE AND HOOK ONLY, not a live sender.

  The owner wants an automatic text to the customer on submit. This project has
  no SMS provider connected (email goes through Resend; there is no Twilio,
  MessageBird, etc.), and none is available to add here. So this module does the
  honest thing: it builds the exact approved message, and exposes a single
  `sendCustomerSms` seam that currently returns `no_provider` WITHOUT pretending
  anything was sent.

  When a provider is added later, implement the send inside `sendCustomerSms`
  and nothing else in the funnel has to change — the action already calls it and
  already records the outcome. Until then, the funnel's thank-you page gives the
  customer a "Text us your photos" deep link so the conversation still starts,
  just customer-initiated instead of automated.

  Consent gate: this must only ever be called when the lead granted SMS consent
  (the unchecked-by-default box on step 4). The caller enforces that; this
  comment is the reminder that an automated text without consent is a TCPA
  problem, not just bad manners.
*/

/* Extract a usable first name from a full name for the greeting. */
export function firstNameFrom(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0]
  return first || 'there'
}

export type CustomerSmsInput = {
  firstName: string
  garageSize: string | null
  zip: string | null
}

/*
  The owner-approved copy, verbatim, with the three tokens filled. Garage size
  and ZIP fall back to neutral phrasing when the customer skipped them so the
  sentence still reads correctly.
*/
export function buildCustomerSms(input: CustomerSmsInput): string {
  const size = input.garageSize ? input.garageSize.toLowerCase() : 'garage'
  const where = input.zip ? ` in ${input.zip}` : ''
  return (
    `Hi ${input.firstName}, this is Juan with Houston Superior Epoxy. ` +
    `We received your request for a ${size}${where}. ` +
    `Please reply with three photos of your garage floor and the approximate ` +
    `dimensions so we can prepare the correct pricing range.`
  )
}

export type SmsResult =
  | { sent: true; id: string }
  | { sent: false; reason: 'no_provider' | 'no_consent' | 'send_failed'; detail?: string }

/*
  The provider seam. Deliberately a no-op that reports `no_provider` rather than
  a fake success, so lead handling never claims a text went out when it did not.
  Wire a real provider here when one is connected.
*/
export async function sendCustomerSms(
  _to: string,
  _message: string,
): Promise<SmsResult> {
  return { sent: false, reason: 'no_provider' }
}
