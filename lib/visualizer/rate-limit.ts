import { createHash } from 'node:crypto'
import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { visualizationRequests } from '@/lib/db/schema'

/*
  Rate limiting for the garage-photo visualizer.

  WHY IT EXISTS: generateFloorVisualization is a public server action with no
  authentication, and once a provider key is configured every call spends real
  money and writes to private storage. Without a ceiling, one script is an
  unbounded invoice.

  THE DECISIONS THAT WERE FLAGGED, AND HOW THEY WERE SETTLED:

  * Per IP, with a global ceiling behind it. Per-IP catches the ordinary case;
    the global cap is the backstop for somebody rotating addresses, because the
    thing being protected is a budget, not a visitor.

  * Counters live in Postgres, which is already here. In-memory would be
    useless: each serverless instance keeps its own, so the real limit becomes
    "N times however many instances are warm".

  * IPs are stored HASHED, never raw. The counter needs to know "same caller",
    not "which caller". Rows are pruned after the longest window, so this holds
    a one-way fingerprint for a day rather than a browsing record.

  * IT FAILS CLOSED. If the limiter cannot reach its store, the request is
    refused. That is the uncomfortable direction, and it is the right one here:
    allowing the call means spending money with no guard on exactly the day the
    database is unwell, and the visitor still has the whole stylized designer,
    which is the page's default anyway. A blocked visitor loses a preview; a
    failing-open limiter loses the budget it exists to protect.
*/

/* Generous for a person, cheap for the account: a genuine visitor compares a
   handful of blends in one sitting. Overridable without a code change. */
function limitFrom(name: string, fallback: number): number {
  const raw = Number(process.env[name] ?? '')
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback
}

export const PER_IP_WINDOW_MS = 60 * 60 * 1000 // 1 hour
export const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000 // 1 day

export function perIpLimit(): number {
  return limitFrom('VIZ_RATE_PER_IP', 12)
}
export function globalLimit(): number {
  return limitFrom('VIZ_RATE_GLOBAL', 300)
}

export type RateDecision =
  | { allowed: true }
  | { allowed: false; scope: 'ip' | 'global' | 'unavailable'; retryAfterMinutes: number }

/*
  The decision, as a pure function of counts.

  Separated from the query so the policy can be tested without a database —
  the thing worth being sure about is the arithmetic and the boundaries, not
  whether drizzle can count rows.
*/
export function decide(counts: { ip: number; global: number }): RateDecision {
  if (counts.global >= globalLimit()) {
    /* A day-scale cap; telling someone to come back in a minute would be a lie. */
    return { allowed: false, scope: 'global', retryAfterMinutes: 60 }
  }
  if (counts.ip >= perIpLimit()) {
    return { allowed: false, scope: 'ip', retryAfterMinutes: 60 }
  }
  return { allowed: true }
}

/*
  Salted so the stored value cannot be reversed by walking the IPv4 space,
  which is small enough to exhaust against an unsalted hash. The salt is
  optional because a weak salt still beats a raw address, and requiring another
  environment variable to make the feature work is its own failure mode.
*/
export function hashIp(ip: string): string {
  const salt = process.env.VIZ_RATE_SALT ?? 'hse-floor-visualizer'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/*
  Extracts the caller's address from the proxy headers Vercel sets.

  x-forwarded-for is a client-controlled header ANYWHERE ELSE, but behind
  Vercel's proxy the left-most entry is the real peer and the header is
  rewritten rather than appended to. Absent that, an empty string is used as a
  single shared bucket, which degrades to "everyone shares one limit" rather
  than "nobody is limited".
*/
export function clientIpFrom(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return headers.get('x-real-ip')?.trim() ?? ''
}

/*
  Checks the limit and, when allowed, records the attempt in the same call.

  Recording happens HERE rather than after the provider responds, so a request
  that is dispatched is always counted. Counting successes only would let a
  caller burn the budget for free by triggering failures.
*/
export async function checkAndRecord(ip: string): Promise<RateDecision> {
  const ipHash = hashIp(ip)
  const now = Date.now()

  try {
    const [ipRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(visualizationRequests)
      .where(
        and(
          eq(visualizationRequests.ipHash, ipHash),
          gte(visualizationRequests.createdAt, new Date(now - PER_IP_WINDOW_MS)),
        ),
      )

    const [globalRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(visualizationRequests)
      .where(gte(visualizationRequests.createdAt, new Date(now - GLOBAL_WINDOW_MS)))

    const decision = decide({ ip: ipRow?.n ?? 0, global: globalRow?.n ?? 0 })
    if (!decision.allowed) return decision

    await db.insert(visualizationRequests).values({ ipHash })

    /*
      Opportunistic pruning, on the same connection that just did the work.
      There is no cron in this project, and a table that only grows is a slow
      leak of exactly the identifiers this design went to trouble to minimise.
    */
    void db
      .delete(visualizationRequests)
      .where(lt(visualizationRequests.createdAt, new Date(now - GLOBAL_WINDOW_MS)))
      .catch(() => {})

    return { allowed: true }
  } catch (error) {
    /* Fail closed — see the note at the top. The message names the code, never
       the address or the hash. */
    console.log('[viz] rate limit unavailable:', error instanceof Error ? error.message : 'unknown')
    return { allowed: false, scope: 'unavailable', retryAfterMinutes: 5 }
  }
}
