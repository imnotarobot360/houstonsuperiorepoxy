import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { RouteKey } from '@/lib/routes'

/*
  ============================================================================
  COMPLETED PROJECT REGISTRY — INTENTIONALLY EMPTY
  ============================================================================

  No entry may be added here unless it is a real Houston Superior Epoxy job
  with real photography. Inventing a portfolio is both a trust problem and a
  legal one, and stock or AI imagery presented as our work is exactly what the
  content rules for this site prohibit.

  Everything downstream is already built and wired: add one object below and
  /projects/, /projects/[slug]/, the archive filters, the sitemap, the static
  params and the city/service cross-links all pick it up with no further code.

  WHY INDIVIDUAL PROJECT PAGES MATTER HERE
  No Houston competitor publishes a page per completed floor carrying the slab
  condition found, the preparation actually performed, the repairs, the full
  coating build-up and the installer's reasoning. The spec table is copyable;
  the reasoning attached to a real slab in a named city is not. That is the
  structural advantage this route exists to take.

  SLUG CONVENTION — [service]-[city]-[identifier]
  e.g. garage-floor-coating-cypress-tx-530sf
       patio-concrete-coating-katy-tx-picket-fence
  Service first so the URL leads with the commercial term, city second for
  local relevance, and a short identifier last so two jobs in the same city
  cannot collide. The identifier must not be sequential (project-1, project-2
  advertises how few there are) and must never encode an address.
*/

/**
 * The four phases a job is photographed in, in the order they are rendered.
 *
 * Named `completed` rather than `after`: `after` describes a position in a
 * sequence, `completed` describes the state of the floor, and the second is
 * what the section heading and the ImageObject caption both need to say.
 */
export type ProjectPhase = 'before' | 'preparation' | 'installation' | 'completed'

/**
 * Where a project image must live and what format it must be in.
 *
 * This is a template literal type, so it is enforced by the compiler rather
 * than by a comment asking nicely. `src: '/img/DSC_0421.jpg'` does not compile;
 * `src: '/images/projects/full-broadcast-flake-garage-cypress-tx-after.webp'`
 * does. The directory is fixed so every project asset is in one place, and
 * `.webp` is fixed because a JPEG original should be converted at upload time
 * rather than shipped and re-encoded on every request.
 *
 * What a type CANNOT check is whether the filename is actually descriptive —
 * `/images/projects/IMG_1234.webp` satisfies the pattern. That case is caught
 * by the dev-time validation at the foot of this file.
 */
export type ProjectImagePath =
  | `/images/projects/${string}.webp`
  | `/images/projects/${string}.jpg`
  | `/images/projects/${string}.jpeg`
  | `/images/projects/${string}.png`

/**
 * The five shots a job is photographed in, as named in content/projects/README.md.
 *
 * This is the OWNER-FACING vocabulary, and it is deliberately more specific
 * than `ProjectPhase` below. "finished-wide", "finished-detail" and
 * "finished-car" are all the `completed` phase, but they are three different
 * photographs with three different jobs: the wide shot is the card cover, the
 * detail shot proves the finish at standing height, the car shot gives scale
 * and answers "will it survive a vehicle". Collapsing them to one phase would
 * make the cover shot unpickable.
 *
 * Rendered in exactly this order on the project page.
 */
export const PROJECT_STAGES = [
  'before',
  'grind',
  'finished-wide',
  'finished-detail',
  'finished-car',
] as const
export type ProjectStage = (typeof PROJECT_STAGES)[number]

/** Owner-facing stage -> the phase the existing renderers group on. */
export const STAGE_TO_PHASE: Record<ProjectStage, ProjectPhase> = {
  before: 'before',
  grind: 'preparation',
  'finished-wide': 'completed',
  'finished-detail': 'completed',
  'finished-car': 'completed',
}

type PhotoBase = {
  /*
    The owner-facing stage, when this photo came from a project.json. Absent on
    a hand-written entry that only declares a phase.
  */
  stage?: ProjectStage
  /*
    Which stage of the job this frame shows. Drives grouping on the page — a
    project without `before` and `preparation` frames cannot demonstrate the
    preparation work, which is the entire technical argument of this business.
  */
  phase: ProjectPhase
  /* Caption shown under the frame. Also the fallback label before shooting. */
  label: string
  /*
    Real intrinsic pixel dimensions, ALWAYS supplied — for a shot photo so
    next/image can reserve exact layout space, and for a planned one so the
    empty frame reserves the same box. This is why adding photography later
    causes no layout shift: the space was already the right shape.
  */
  w: number
  h: number
}

/**
 * A frame that has actually been shot.
 *
 * `src` and `alt` are BOTH required here — that is the whole point of splitting
 * the type. Alt text was previously optional, which meant a project could be
 * added with photography and no alt text and still compile, with
 * `alt={photo.alt ?? photo.label}` silently covering for it downstream. A
 * caption and an alt attribute are different jobs: the caption adds context a
 * sighted reader cannot get from the image, the alt describes what is in the
 * frame for someone who cannot see it. Falling back from one to the other
 * produces plausible-looking output and a genuinely worse page.
 *
 * WRITING `alt`: describe what is visibly in the frame, factually. It is not a
 * keyword slot — "best cheap garage epoxy Houston Texas" in an alt attribute is
 * keyword stuffing and is read as such. "Ground concrete slab showing exposed
 * aggregate and a filled crack along the centre joint" is correct.
 */
export type ShotPhoto = PhotoBase & {
  src: ProjectImagePath
  alt: string
}

/**
 * A frame that is planned but not yet taken.
 *
 * `src` and `alt` are `never`, so a half-populated photo — a src with no alt,
 * or an alt with no src — is a compile error rather than a runtime surprise.
 * Renders as the honest labelled empty frame via components/project-photo.
 */
export type PlannedPhoto = PhotoBase & {
  src?: never
  alt?: never
}

/*
  Responsive srcset and WebP/AVIF negotiation are handled by next/image — see
  components/project-photo.tsx. Nothing here needs to hand-write <picture>.
*/
export type ProjectPhoto = ShotPhoto | PlannedPhoto

export type Project = {
  /** See the slug convention above. */
  slug: string
  title: string
  /*
    The service page this job belongs to, as a route key rather than a URL.
    TypeScript rejects a key that stops existing, so the cross-link cannot rot
    into a 404 the way a hardcoded path would.
  */
  /*
    OPTIONAL FROM HERE DOWN, and the reason matters.

    Everything below that is marked optional is prose a hand-written case study
    supplies and a project.json does not. content/projects/<slug>/project.json is the
    owner-facing authoring format — photographs, a scope list and the hard facts
    of the job — because that is what actually gets filled in between jobs. A
    required `narrative.problem` would mean either no projects get published, or
    someone invents the prose to satisfy the compiler. Both are worse than a
    page that renders what it genuinely has.

    Every renderer guards these. A project with photographs, a scope list and a
    spec table is a complete page; the prose deepens it when it exists.
  */
  serviceKey?: RouteKey
  /* e.g. "Garage floor coating". Archive facet + spec row. */
  projectType?: string
  /*
    CITY LEVEL ONLY. Never a street address, never a subdivision name, never a
    cross street. This is a customer's home; the city is enough to establish
    local relevance and anything narrower is a privacy problem the homeowner
    did not agree to.
  */
  citySlug: string
  city: string
  /*
    AREA LEVEL ONLY — "Memorial", "Cypress", "Bridgeland". Never a subdivision
    a single street could be picked out of, never a street name, never a cross
    street. Same rule as `city` above, and the same reason: this is a
    customer's home and they agreed to a photograph of a floor.

    Rendered as "Installed — Memorial" beside a blend on /colors/, which is the
    whole point of carrying it: "someone near you has this floor" is the claim
    a city name is too coarse to make.
  */
  neighborhood?: string
  /* Garage / space type, e.g. "Two-car attached garage". Archive facet. */
  spaceType?: string
  /* e.g. "530 sq ft". */
  squareFeet: string
  /*
    What was actually done, as short bullet lines — "Diamond ground to CSP-2",
    "Two control joints chased and filled". The owner-facing replacement for
    the prose fields below: a list is writable in a couple of minutes between
    jobs, three paragraphs of narrative are not.
  */
  scope?: string[]
  /* Honest description of the slab as found, before anything was done to it. */
  conditionFound?: string
  /* The preparation actually performed on this specific slab. */
  preparationPerformed?: string
  /* Cracks, spalls, pitting, joints. "None required" is a valid answer. */
  repairsPerformed?: string
  /* Product-level build-up, in the manufacturer's own naming. */
  baseCoat?: string
  flakeBlend: string
  topcoat?: string
  /*
    System family, used as the archive's system facet — keep the wording
    consistent between jobs ("Full-broadcast vinyl flake", "Metallic epoxy")
    or the filter fragments into one-entry buckets.
  */
  system: string
  /* e.g. "Two days, cured and driven on the fourth". */
  duration?: string
  /* Month and year is sufficient granularity. */
  completed: string
  /*
    ISO date for structured data only. Omit unless the completion date is
    exact — an invented day-of-month in `datePublished` is a fabricated fact.
  */
  completedISO?: string
  /*
    Ordered summary of the job. Doubles as the page's opening answer, so keep
    it to 40-70 words and make it self-contained — it should read correctly
    quoted on its own, with no surrounding context.
  */
  summary?: string
  /*
    Problem / solution / outcome, in the installer's own voice. First person,
    plain language, specific to this slab. This is the field that makes the
    page worth indexing.
  */
  narrative?: {
    problem: string
    solution: string
    outcome: string
  }
  /*
    Why the floor was specified the way it was, and when this specification
    would be the wrong call. Rendered as the professional recommendation.
  */
  rationale?: string
  /* Optional extra spec rows appended after the standard ones. */
  details?: { label: string; value: string }[]
  /* Real photography only, tagged by phase. */
  photos: ProjectPhoto[]
  /*
    OPTIONAL customer comment about THIS floor.

    This field is deliberately constrained, because it sits against a policy
    this site already publishes. /reviews/ states plainly that we do not
    reprint selected quotes, on the grounds that "a hand-picked quote on a
    company's own website is worth very little, because the company chose it" —
    and lib/schema.ts omits Review objects for the related reason that marking
    up review text that cannot be verified is fabrication.

    A comment attached to a specific, dated, photographed job is a different
    object from a floating testimonial: it is checkable against a real floor in
    a named city, which is exactly what the general case is not. That is why the
    field exists at all. Three rules keep it on the right side of the policy:

      1. VERBATIM. Trim whitespace, nothing else. No tightening, no fixing
         grammar, no removing the sentence that mentions the delay.
      2. Only if the customer knows it will be published, and only from a
         review they actually wrote — not a remark recalled from a driveway
         conversation.
      3. NO Review OR AggregateRating MARKUP IS EMITTED FROM IT. See the note
         in projectNode. It renders as visible, attributed text and nothing
         more, so it cannot become self-serving review markup.

    Leave it undefined for most projects. The photography and the spec table
    are the evidence this page rests on; a quote is a supporting detail, and an
    archive where every single job carries a glowing one-liner reads as curated
    whether or not it is.
  */
  customerReview?: {
    /* Verbatim text, as written by the customer. */
    quote: string
    /*
      First name and city only — "Marcus, Cypress". Never a full name, never a
      street, never a subdivision. Same privacy rule as `city` above: this is
      someone's home, and they agreed to a comment about a floor, not to being
      locatable.
    */
    attribution: string
    /*
      Where it can be read unedited, if it was posted publicly. When present the
      quote becomes independently checkable, which is the difference between a
      testimonial and a citation — so supply it whenever the review exists on
      Google rather than having been sent to us directly.
    */
    sourceUrl?: string
  }
}

/*
  ============================================================================
  THE REGISTRY. EMPTY, AND CORRECTLY SO.
  ============================================================================

  Do not add an entry unless it is a real completed job with real photography.
  Not a sample, not a demo, not a clearly-labelled example — a labelled example
  still renders a project page, still enters the sitemap, still gets crawled,
  and a crawler does not read the label. There is no version of a fabricated
  project that is safe.

  TEMPLATE — copy the block below, uncomment it, fill every field.

  Kept as a comment ON PURPOSE. As live code it would be a fake project the
  moment someone deleted the surrounding braces by accident; as a comment it
  cannot render, cannot be crawled, and cannot end up in the sitemap.

  {
    slug: 'garage-floor-coating-cypress-tx-530sf',
    title: 'Two-Car Garage Floor Coating in Cypress',
    serviceKey: 'flake',
    projectType: 'Garage floor coating',
    citySlug: 'cypress',
    city: 'Cypress',
    spaceType: 'Two-car attached garage',
    squareFeet: '530 sq ft',
    conditionFound: '...',
    preparationPerformed: '...',
    repairsPerformed: '...',
    baseCoat: '...',
    flakeBlend: '...',
    topcoat: '...',
    system: 'Full-broadcast vinyl flake',
    duration: 'Two days, driven on the fourth',
    completed: 'March 2026',
    completedISO: '2026-03-14',        // omit unless the exact day is known
    summary: '...',                     // 40-70 words, self-contained
    narrative: { problem: '...', solution: '...', outcome: '...' },
    rationale: '...',
    details: [{ label: 'Slab age', value: '1998 build' }],   // optional
    photos: [
      {
        phase: 'before',
        label: 'The slab as we found it, looking toward the garage door',
        w: 1600,
        h: 1067,
        src: '/images/projects/garage-floor-coating-cypress-tx-before.webp',
        alt: 'Bare concrete garage slab with grey tyre marks and a hairline crack running from the centre joint toward the door.',
      },
      // ...preparation, installation, completed
    ],
    customerReview: {                   // optional, verbatim only
      quote: '...',
      attribution: 'First name, City',
      sourceUrl: 'https://...',
    },
  }
*/

/*
  Hand-written case studies. Still empty, and the rules above still apply to
  anything added here.

  This is no longer the only way to publish a project — see the file-based
  loader below — but it remains the richer one: narrative, rationale and the
  full spec table have no equivalent in project.json. Use it when a job is
  worth a written case study; use content/projects/ for everything else.
*/
const caseStudies: Project[] = []

/* ---------------------------------------------------------------- */
/* content/projects/ — the owner-facing authoring format            */
/* ---------------------------------------------------------------- */

/*
  One folder per job, each holding a project.json and its photographs. See
  content/projects/README.md for the shot list and the field reference.

  WHY JSON ON DISK AND NOT MORE ENTRIES IN THIS FILE
  The registry above is TypeScript, which is the right format for a full case
  study and the wrong one for the person who actually has the photographs. A
  job gets documented in the twenty minutes after the van is loaded, from a
  phone, by someone who is not going to open a .ts file and will not be
  reminded by a compiler. JSON beside the images is a format that survives that.

  The registry above is NOT deprecated — a hand-written entry can still carry
  narrative, rationale and a full spec table, and both sources merge into the
  same `projects` array below.

  READ AT BUILD TIME. This module is imported only by server components and
  route handlers, so `node:fs` here is safe. Importing it from a client
  component would break the build — which is the correct, loud failure.
*/

const PROJECTS_DIR = path.join(process.cwd(), 'content', 'projects')

/*
  Alt text minimum is 25 characters, matching the dev-time check further down:
  anything shorter is a label, not a description of a photograph.
*/
const imageSchema = z.object({
  src: z
    .string()
    .regex(
      /^\/images\/projects\/[^/]+\.(webp|jpg|jpeg|png)$/,
      'src must be /images/projects/<file>.webp|jpg|jpeg|png',
    ),
  alt: z.string().min(25, 'alt text is too short to describe the frame'),
  stage: z.enum(PROJECT_STAGES),
  /*
    OPTIONAL BUT STRONGLY WANTED. Supplying the real pixel dimensions is what
    lets next/image reserve the exact box before the photo loads. Without them
    we fall back to 3:2, which is right for most phone photos held sideways and
    wrong for any that are not — and a wrong ratio is a visible jump as the
    image lands. The dev validator names any photo missing them.
  */
  w: z.number().int().positive().optional(),
  h: z.number().int().positive().optional(),
})

const projectFileSchema = z.object({
  slug: z.string().min(3),
  title: z.string().min(3),
  city: z.string().min(2),
  /* Area level only — see the `neighborhood` field note on Project above. */
  neighborhood: z.string().min(2).optional(),
  blend: z.string().min(2),
  system: z.string().min(2),
  /* Accepts 530 or "530 sq ft"; normalised to the second form below. */
  sqft: z.union([z.string(), z.number()]),
  /* "2026-08-14" or "August 2026" — both are handled. */
  installedOn: z.string().min(4),
  scope: z.array(z.string()).default([]),
  images: z.array(imageSchema).default([]),
})

export type ProjectFile = z.infer<typeof projectFileSchema>

/** "530" / 530 / "530 sq ft" -> "530 sq ft". */
function normaliseSqft(value: string | number): string {
  const raw = String(value).trim()
  return /sq\s*\.?\s*(ft|feet)/i.test(raw) ? raw : `${raw} sq ft`
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Splits `installedOn` into the human string and, only when the exact day was
 * actually given, an ISO date for structured data.
 *
 * The guard matters: `completedISO` feeds `datePublished`, and inventing a
 * day-of-month to fill it is a fabricated fact. "August 2026" in, no ISO out.
 */
function readInstalledOn(value: string): { completed: string; completedISO?: string } {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!iso) return { completed: value.trim() }
  const [, y, m, d] = iso
  const month = MONTHS[Number(m) - 1]
  if (!month || Number.isNaN(Date.parse(value))) return { completed: value.trim() }
  return { completed: `${month} ${Number(d)}, ${y}`, completedISO: value.trim() }
}

/** Maps one validated project.json onto the Project shape the site renders. */
function toProject(file: ProjectFile): Project {
  const { completed, completedISO } = readInstalledOn(file.installedOn)

  return {
    slug: file.slug,
    title: file.title,
    citySlug: slugify(file.city),
    city: file.city,
    neighborhood: file.neighborhood,
    squareFeet: normaliseSqft(file.sqft),
    flakeBlend: file.blend,
    system: file.system,
    scope: file.scope,
    completed,
    completedISO,
    photos: file.images.map((img) => ({
      stage: img.stage,
      phase: STAGE_TO_PHASE[img.stage],
      label: img.alt,
      /* 3:2 fallback — see the note on the w/h fields above. */
      w: img.w ?? 1600,
      h: img.h ?? 1067,
      src: img.src as ProjectImagePath,
      alt: img.alt,
    })),
  }
}

/**
 * Reads every content/projects/<slug>/project.json.
 *
 * A malformed or unreadable file is WARNED ABOUT AND SKIPPED, never thrown.
 * Same trade as validateProjects() below: a typo in one project.json must not
 * take the whole site down, and the warning lands in the build log where the
 * person who just added the project will see it. The cost is that a rejected
 * project is silently absent from the site, which is why the message names the
 * folder and the failing field.
 */
function loadProjectFiles(): Project[] {
  let entries: string[]
  try {
    entries = fs
      .readdirSync(PROJECTS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  } catch {
    /* No content/projects/ directory at all is a valid, empty state. */
    return []
  }

  const loaded: Project[] = []

  for (const dir of entries.sort()) {
    const file = path.join(PROJECTS_DIR, dir, 'project.json')
    let parsed: unknown
    try {
      parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (error) {
      /* A folder with no project.json is a photo drop in progress, not an error. */
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
        console.warn(`[projects] content/projects/${dir}/project.json is not valid JSON — skipped`)
      }
      continue
    }

    const result = projectFileSchema.safeParse(parsed)
    if (!result.success) {
      for (const issue of result.error.issues) {
        console.warn(
          `[projects] content/projects/${dir} — ${issue.path.join('.') || '(root)'}: ${issue.message}`,
        )
      }
      console.warn(`[projects] content/projects/${dir} was skipped and will not appear on the site`)
      continue
    }

    loaded.push(toProject(result.data))
  }

  return loaded
}

/*
  The published archive: file-authored projects first, then any hand-written
  case studies. Newest first — `completedISO` when the exact date is known,
  otherwise the order the folders were read in.
*/
export const projects: Project[] = [...loadProjectFiles(), ...caseStudies].sort((a, b) =>
  (b.completedISO ?? '').localeCompare(a.completedISO ?? ''),
)

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug)

/**
 * The card cover for a project.
 *
 * `finished-wide` by preference — the driveway shot at standing height is the
 * frame that reads as a floor at thumbnail size. Falls back to any completed
 * photo, then to the first shot photo, and returns undefined only when the
 * project has no photography at all.
 *
 * NEVER just `photos[0]`: on a properly documented job that is the `before`
 * shot, so the archive would open with a grid of damaged concrete.
 */
export const coverPhoto = (p: Project): ShotPhoto | undefined => {
  const shot = p.photos.filter((ph): ph is ShotPhoto => Boolean(ph.src))
  return (
    shot.find((ph) => ph.stage === 'finished-wide') ??
    shot.find((ph) => ph.phase === 'completed') ??
    shot[0]
  )
}

/**
 * Photos in the order they are presented on a project page, which is the order
 * the job actually happened in — see PROJECT_STAGES.
 *
 * A hand-written entry with no `stage` sorts after the staged ones, grouped by
 * phase, rather than being dropped.
 */
export const orderedPhotos = (p: Project): ProjectPhoto[] =>
  [...p.photos].sort((a, b) => {
    const ai = a.stage ? PROJECT_STAGES.indexOf(a.stage) : PROJECT_STAGES.length
    const bi = b.stage ? PROJECT_STAGES.indexOf(b.stage) : PROJECT_STAGES.length
    return ai - bi
  })

/**
 * The published project installed in a given flake blend, if there is one.
 *
 * Matched on the blend NAME, case-insensitively, because that is the only
 * identifier a project.json and lib/content/flake-blends.ts share. Returns the
 * first match — with a small archive that is the only one; when several floors
 * share a blend, the newest wins by way of the sort on `projects`.
 */
/**
 * The published project installed in a given coating system, if there is one.
 *
 * Matched on the system NAME, case-insensitively — the same string the archive
 * filters on, which is why content/projects/README.md insists the wording stays
 * identical between jobs. Only projects with a usable cover photo qualify: the
 * caller is swapping an illustration for a photograph, so a match with no
 * photograph is no use to it.
 */
export const projectForSystem = (systemName: string): Project | undefined => {
  const needle = systemName.trim().toLowerCase()
  return projects.find((p) => p.system.trim().toLowerCase() === needle && coverPhoto(p))
}

export const projectForBlend = (blendName: string): Project | undefined => {
  const needle = blendName.trim().toLowerCase()
  return projects.find((p) => p.flakeBlend.trim().toLowerCase() === needle && coverPhoto(p))
}

/* ---------------------------------------------------------------- */
/* Archive filtering                                                */
/* ---------------------------------------------------------------- */

/*
  The three dimensions the archive can be sliced on. Each is a real question a
  visitor asks — "have you worked in my city", "have you installed this
  system", "have you done a space like mine" — which is also why each deserves
  a crawlable URL rather than a client-side dropdown.
*/
export const FACETS = ['city', 'system', 'space'] as const
export type Facet = (typeof FACETS)[number]

export const facetLabels: Record<Facet, string> = {
  city: 'City',
  system: 'System',
  space: 'Space type',
}

/*
  Stable, URL-safe value for a facet — the thing that appears in ?city=.

  Returns '' for a project with no `spaceType`, which a file-authored project
  does not carry. facetOptions() drops empty values, so such a project simply
  is not offered under the "space type" filter rather than appearing under a
  blank chip.
*/
export const facetValue = (p: Project, facet: Facet) =>
  facet === 'city' ? p.citySlug : slugify((facet === 'system' ? p.system : p.spaceType) ?? '')

/** Human-readable value for a facet, for the chip label and the heading. */
export const facetDisplay = (p: Project, facet: Facet) =>
  facet === 'city' ? p.city : ((facet === 'system' ? p.system : p.spaceType) ?? '')

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export type FacetOption = { value: string; label: string; count: number }

/*
  Options for one facet, derived from the registry rather than hardcoded.

  Only values that actually have projects behind them are offered. A filter
  that leads to "0 results" is a dead end for a visitor and a soft-404 for a
  crawler, so the archive never links to one.
*/
export function facetOptions(facet: Facet, pool: Project[] = projects): FacetOption[] {
  const map = new Map<string, FacetOption>()
  for (const p of pool) {
    const value = facetValue(p, facet)
    /* A project that does not carry this facet is not offered under it. */
    if (!value) continue
    const existing = map.get(value)
    if (existing) existing.count += 1
    else map.set(value, { value, label: facetDisplay(p, facet), count: 1 })
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
}

export type ProjectFilter = Partial<Record<Facet, string>>

/** Applies any combination of facets. Unknown values simply match nothing. */
export function filterProjects(filter: ProjectFilter, pool: Project[] = projects) {
  return pool.filter((p) => FACETS.every((f) => !filter[f] || facetValue(p, f) === filter[f]))
}

/**
 * Builds an archive URL for a filter set.
 *
 * Query parameters are emitted in a FIXED order (city, system, space) so that
 * one filter combination has exactly one URL. Letting the object's key order
 * decide would mint ?system=x&city=y and ?city=y&system=x as two crawlable
 * URLs for identical content.
 */
export function archiveHref(base: string, filter: ProjectFilter) {
  const params = FACETS.filter((f) => filter[f]).map(
    (f) => `${f}=${encodeURIComponent(filter[f] as string)}`,
  )
  return params.length > 0 ? `${base}?${params.join('&')}` : base
}

/* ---------------------------------------------------------------- */
/* Dev-time validation                                              */
/* ---------------------------------------------------------------- */

/*
  The types make a malformed project impossible to compile. These checks cover
  the things a type cannot see — a filename that matches the pattern but says
  nothing, alt text that is really a keyword list, a slug that leaks an address.

  Runs on import in development only, and only ever WARNS. A hard throw here
  would take the whole site down over a photo caption, which is the wrong
  trade: the person who just added a project needs to see the problem, not a
  white screen. In production it is stripped entirely.
*/
function validateProjects(pool: Project[]) {
  const warn = (slug: string, msg: string) =>
    console.log(`[v0] projects.ts — ${slug}: ${msg}`)

  const seen = new Set<string>()

  for (const p of pool) {
    /* Duplicate slugs silently shadow each other in projectBySlug. */
    if (seen.has(p.slug)) warn(p.slug, 'duplicate slug — the second entry is unreachable')
    seen.add(p.slug)

    /* [service]-[city]-[identifier]: at least three hyphen-separated parts. */
    if (p.slug.split('-').length < 3)
      warn(p.slug, 'slug should follow [service]-[city]-[identifier]')

    /* Sequential identifiers advertise how few projects exist. */
    if (/-(project-)?\d+$/.test(p.slug) && !/\d+(sf|sqft)$/.test(p.slug))
      warn(p.slug, 'slug ends in a bare number — use a descriptive identifier, not a counter')

    /* A street number in a slug is the privacy failure this system must not have. */
    if (/\b\d{3,5}\s|-\d{3,5}-(?!sf)/.test(p.slug))
      warn(p.slug, 'slug may contain a street number — city-level location only')

    /* The technical argument of the business needs these two phases. */
    for (const phase of ['before', 'preparation'] as const)
      if (!p.photos.some((ph) => ph.phase === phase && ph.src))
        warn(p.slug, `no shot "${phase}" photo — cannot demonstrate the preparation work`)

    for (const photo of p.photos) {
      if (!photo.src) continue

      /* Matches the required pattern but carries no information. */
      const file = photo.src.split('/').pop() ?? ''
      if (/^(img|dsc|photo|image|untitled)[-_]?\d*\.webp$/i.test(file))
        warn(p.slug, `"${file}" is not a descriptive filename`)

      if (file.split('-').length < 3)
        warn(p.slug, `"${file}" should describe the system, city and phase`)

      /* Alt text that is too short cannot be describing a photograph. */
      if (photo.alt.trim().length < 25)
        warn(p.slug, `alt text for "${file}" is too short to describe the frame`)

      /* Commas separating city/keyword fragments is what stuffing looks like. */
      if ((photo.alt.match(/,/g) ?? []).length >= 4 && !/\s(and|with|then)\s/i.test(photo.alt))
        warn(p.slug, `alt text for "${file}" reads as a keyword list, not a description`)
    }

    /*
      Summary is quoted as the page's opening answer, so length matters — but
      only when there is one. A file-authored project has no summary and is not
      expected to; the page falls back to the scope list.
    */
    if (p.summary) {
      const words = p.summary.trim().split(/\s+/).length
      if (words < 30 || words > 90)
        warn(p.slug, `summary is ${words} words — aim for 40-70 so it quotes cleanly`)
    }

    /*
      The cover shot. Without it the archive card has no image, so this is the
      one photo a published project genuinely cannot do without.
    */
    if (p.photos.length > 0 && !p.photos.some((ph) => ph.stage === 'finished-wide' && ph.src))
      warn(p.slug, 'no "finished-wide" photo — the archive card has no cover image')

    /* Real dimensions are what keep the page from jumping as photos land. */
    for (const photo of p.photos)
      if (photo.src && (photo.w === 1600 && photo.h === 1067) && photo.stage)
        warn(
          p.slug,
          `"${photo.src.split('/').pop()}" is using the 3:2 fallback size — add real w/h to project.json`,
        )

    /* An ISO date must parse, and must agree with the human-readable one. */
    if (p.completedISO && Number.isNaN(Date.parse(p.completedISO)))
      warn(p.slug, `completedISO "${p.completedISO}" is not a valid date`)
  }
}

if (process.env.NODE_ENV === 'development') validateProjects(projects)

/*
  Rendered wherever a project list would otherwise be empty — currently on the
  homepage <Gallery> and on /projects/.

  The body used to say we were photographing floors "rather than filling this
  page with stock images or renders of work we did not do". Half of that is
  still true and worth saying: no stock images, and nothing presented as work
  we did not do. But the site now does show labelled illustrations, including
  in the grid directly above this notice on the homepage, so the flat "or
  renders" claim had to go — leaving it would have had this paragraph
  contradicting the six images immediately above it.

  The distinction the copy now draws is the honest one: an illustration that
  announces itself is a different thing from a render passed off as a project.
  Keep that distinction if you reword this.
*/
export const portfolioNotice = {
  heading: 'Our project archive is being built',
  body: 'We are photographing completed floors properly rather than filling this page with stock images, or with generated pictures passed off as jobs we did. Anything on this site that is an illustration rather than a photograph is labelled as one. Until the archive is up, the fastest way to judge our workmanship is to ask for local references, or to read the reviews left by the homeowners whose floors we have already installed.',
} as const
