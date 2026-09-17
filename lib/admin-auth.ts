import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

/*
  Password gate for /admin/leads.

  THE CENTRAL RULE: this FAILS CLOSED. If ADMIN_PASSWORD is not set, access is
  denied — it does not fall back to open. The page behind this gate lists
  customer names, phone numbers, email addresses, ZIPs and photographs of the
  inside of people's homes. An unprotected version of that page reachable at a
  guessable URL is a privacy breach, and one that Google would happily index.
  "Broken until configured" is the only acceptable failure mode.

  Sessions are a signed cookie rather than server state so there is nothing to
  store and nothing to leak. The signing key is derived from the password
  itself, which conveniently means changing the password invalidates every
  existing session for free.

  Scope note: this is a single shared password for the business owner, not a
  user system. It is the right weight for one operator reading their own leads.
  If this ever needs per-user accounts, audit trails or roles, replace it with
  Better Auth rather than growing this file.
*/

const COOKIE = 'hse_admin'
const SESSION_HOURS = 12

/*
  Guard evaluated per call rather than cached at module load, so adding the env
  var in the Vercel dashboard takes effect on the next request without needing
  a rebuild.
*/
const secret = () => process.env.ADMIN_PASSWORD ?? null

export const isAdminConfigured = () => Boolean(secret())

function sign(expiresAt: number, key: string) {
  return createHmac('sha256', key).update(`admin|${expiresAt}`).digest('hex')
}

/*
  Constant-time comparison. A plain `===` on a secret leaks how many leading
  characters matched via response timing, which is enough to recover a value
  byte by byte. Lengths are compared first because timingSafeEqual throws on
  mismatched buffer lengths.
*/
function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function verifyPassword(candidate: string) {
  const key = secret()
  if (!key) return false
  return safeEqual(candidate, key)
}

export async function createAdminSession() {
  const key = secret()
  if (!key) return
  const expiresAt = Date.now() + SESSION_HOURS * 3_600_000
  const store = await cookies()
  store.set(COOKIE, `${expiresAt}.${sign(expiresAt, key)}`, {
    httpOnly: true, // not readable by JavaScript, so XSS cannot exfiltrate it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // blocks cross-site form-POST CSRF against the gate
    path: '/',
    maxAge: SESSION_HOURS * 3_600,
  })
}

export async function destroyAdminSession() {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function isAdminAuthed() {
  const key = secret()
  if (!key) return false // fail closed

  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return false

  const [expiresRaw, signature] = raw.split('.')
  const expiresAt = Number(expiresRaw)
  if (!expiresAt || !signature) return false
  if (Date.now() > expiresAt) return false

  /*
    Signature is verified against the expiry embedded in the cookie, so a
    tampered expiry invalidates the signature and cannot extend a session.
  */
  return safeEqual(signature, sign(expiresAt, key))
}
