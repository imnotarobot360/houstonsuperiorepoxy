import { normalizePhone } from '@/lib/leads'

/*
  Lead scoring for the Meta Ads funnel (and, harmlessly, every other lead).

  This is a PURE function of facts already stored on the lead row, so nothing
  new has to be persisted — the score is derived on demand for the owner email,
  the admin inbox and the CRM payload. Recomputing beats storing it: the rules
  below will be tuned over time, and a stored score would freeze whatever logic
  was live the day the lead came in.

  The rules are the ones the owner specified for the funnel:
    HOT     — ready now (ASAP / 2 weeks), a real garage, in-area ZIP, callable
    WARM    — near-term (30 days / 1–3 months) and in the service area
    NURTURE — just researching, out of area, or too little to qualify on
  Nurture is never a rejection: those leads still submit and still get emailed.
*/

export type LeadScore = 'hot' | 'warm' | 'nurture'

export type ScoreResult = {
  score: LeadScore
  /* Short human reasons, shown to the owner so the label is never a black box. */
  reasons: string[]
}

export type ScoreInput = {
  phone?: string | null
  zip?: string | null
  /* Garage size lives in `area`; timeline in `timeframe`. */
  area?: string | null
  timeframe?: string | null
}

/*
  Timelines are matched across BOTH vocabularies (funnel wording + main-form
  wording) because scoreLead runs for every lead, not just funnel ones.
*/
const READY_NOW = new Set(['As Soon as Possible', 'As soon as possible', 'Within 2 Weeks'])
const NEAR_TERM = new Set([
  'Within 30 Days',
  'Within a month',
  'Within 1–3 Months',
  '1 – 3 months',
])
const RESEARCHING = new Set(['Just Researching', 'Just getting prices'])

/*
  A garage size that represents an actual garage job — "Other Area" is a real
  lead but not the qualifying signal the HOT rule is about, so it is excluded.
*/
const REAL_GARAGE = new Set([
  '1-Car Garage',
  'Standard 2-Car Garage',
  '3-Car or Tandem Garage',
  'Larger Than 3-Car',
])

/*
  Greater-Houston ZIP heuristic.

  Every city this business serves — Houston, Katy, Cypress, Fulshear, Richmond,
  Sugar Land, Tomball, Spring, The Woodlands, Memorial, Bellaire, West
  University — sits in the 77xxx ZIP range, so a 5-digit ZIP starting "77" is a
  good in-area proxy without hardcoding a brittle list of individual ZIPs. It is
  deliberately approximate: the owner confirms exact coverage on the call, and
  the qualification copy on the page says exactly that. Tighten to a specific
  ZIP set here if false positives become a problem.
*/
export function isHoustonAreaZip(zip?: string | null): boolean {
  if (!zip) return false
  return /^77\d{3}$/.test(zip.trim())
}

export function isValidPhone(phone?: string | null): boolean {
  return normalizePhone(phone ?? '').length === 10
}

export function scoreLead(input: ScoreInput): ScoreResult {
  const timeframe = input.timeframe ?? ''
  const inArea = isHoustonAreaZip(input.zip)
  const hasZip = Boolean(input.zip)
  const realGarage = input.area ? REAL_GARAGE.has(input.area) : false
  const phoneValid = isValidPhone(input.phone)

  /* Explicit low intent — the owner asked that these be de-prioritised, not blocked. */
  if (RESEARCHING.has(timeframe)) {
    return { score: 'nurture', reasons: ['Just researching'] }
  }

  /* A known out-of-area ZIP outranks any timeline for prioritisation. */
  if (hasZip && !inArea) {
    return { score: 'nurture', reasons: ['ZIP outside primary service area'] }
  }

  if (READY_NOW.has(timeframe) && realGarage && inArea && phoneValid) {
    return {
      score: 'hot',
      reasons: ['Ready to start now', 'Garage project', 'In-area ZIP', 'Callable number'],
    }
  }

  if (NEAR_TERM.has(timeframe) && inArea) {
    return { score: 'warm', reasons: ['Near-term timeline', 'In-area ZIP'] }
  }

  /* Everything else is a real lead with too little to qualify on yet. */
  const gaps: string[] = []
  if (!timeframe) gaps.push('No timeline given')
  if (!hasZip) gaps.push('No ZIP given')
  if (!realGarage) gaps.push('No garage size given')
  return { score: 'nurture', reasons: gaps.length ? gaps : ['Does not meet hot/warm criteria'] }
}

export const SCORE_LABELS: Record<LeadScore, string> = {
  hot: 'Hot',
  warm: 'Warm',
  nurture: 'Nurture',
}

/*
  Lead-source label, derived rather than stored.

  A funnel visitor lands on /lp, so the landing path is the most reliable
  signal; Meta click id and a facebook/instagram utm_source are corroborating
  fallbacks for cases where the path was rewritten. Anything else is the
  ordinary website.
*/
export function leadSourceLabel(lead: {
  landingPath?: string | null
  utmSource?: string | null
  fbclid?: string | null
}): string {
  const fromFunnel = lead.landingPath?.startsWith('/lp')
  const fromMeta =
    Boolean(lead.fbclid) || /facebook|instagram|meta|fb|ig/i.test(lead.utmSource ?? '')
  if (fromFunnel || fromMeta) return 'Meta Ads – Houston Superior Epoxy'
  if (lead.utmSource) return lead.utmSource
  return 'Website'
}

/*
  Coarse device class from the user-agent, for the CRM/notification only. This
  is triage metadata, not a security or feature decision, so a simple regex is
  the right amount of effort.
*/
export function deviceTypeFromUserAgent(ua?: string | null): 'mobile' | 'tablet' | 'desktop' {
  if (!ua) return 'desktop'
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) return 'tablet'
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile'
  return 'desktop'
}
