import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ImageSlot } from '@/components/image-slot'
import { MaterialSample } from '@/components/material-sample'
import { SectionHeading } from '@/components/section-heading'
import { r } from '@/lib/routes'
import { sceneIllustrations, site } from '@/lib/site'
import { coverPhoto, portfolioNotice, projectForSystem, projects } from '@/lib/content/projects'

/*
  Section 8 of the homepage.

  Two distinct modes, and the difference between them is the point:

   - lib/content/projects.ts HAS entries → renders the real archive as links to
     /projects/[slug]/, with city, space type and system. A true portfolio.
   - projects.ts is EMPTY → renders six labelled illustrations of the finishes
     we install, each stamped "Illustration" and captioned "not our work", with
     no city, no date and no link to a case study.

  What it NEVER does, in either mode, is fabricate a project. No generated
  image ever becomes an entry in projects.ts, gets a slug, gets a city, or
  appears as a project-card cover. The illustrations are a labelled stopgap for
  an empty portfolio, and they are visibly distinguishable from the real thing
  at a glance — that is the property to preserve if you edit this file.

  It also never uses stock photography, and never shows an unlabelled generated
  image as our work.
*/

/*
  The finishes we install, each shown as a labelled ILLUSTRATION while the real
  archive is photographed. `note` states what we intend to photograph in that
  category, so the card still reads as intent rather than as completed work.

  These were six empty frames captioned "Photography pending". They are now six
  labelled illustrations, which is a real change in what this section claims —
  see the heading comment below.

  Ordered so the two process illustrations (removal, repair) sit in the middle
  rather than opening or closing the grid.
*/
/*
  `system` is the string a project.json must carry for its photograph to replace
  that card's illustration — see projectForSystem(). It is matched
  case-insensitively and must be spelled exactly as the archive's system facet
  spells it, which is why content/projects/README.md makes a point of it.

  A card with no matching project keeps its illustration and its label. That is
  the default and it must stay honest: the swap happens only when a real
  photograph of a real job exists.
*/
const finishes = [
  {
    sample: 'residentialGarage',
    system: 'Full-broadcast vinyl flake',
    label: 'Residential garage · full-broadcast flake',
    note: 'Photography planned: before and after, same camera position',
  },
  {
    sample: 'metallicFloor',
    system: 'Metallic epoxy',
    label: 'Metallic epoxy · interior feature floor',
    note: 'Photography planned: finished floor detail',
  },
  {
    sample: 'coatingRemoval',
    system: 'Coating removal and resurface',
    label: 'Failed coating · removal and resurface',
    note: 'Photography planned: peeling floor, stripped slab, finished floor',
  },
  {
    sample: 'crackRepair',
    system: 'Crack and spall repair',
    label: 'Crack repair · chased, filled, ground flush',
    note: 'Photography planned: open crack, filled groove, finished floor',
  },
  {
    sample: 'patioDeck',
    system: 'Textured patio coating',
    label: 'Patio & pool deck · textured finish',
    note: 'Photography planned: before and after, same camera position',
  },
  {
    sample: 'commercialFloor',
    system: 'Commercial floor coating',
    label: 'Commercial shop floor · phased install',
    note: 'Photography planned: before and after, same camera position',
  },
] as const satisfies readonly {
  sample: keyof typeof sceneIllustrations
  system: string
  label: string
  note: string
}[]

export function Gallery() {
  /*
    Per-card, not per-section.

    This section is a fixed taxonomy of the six finishes we install, and it
    stays six cards whether we have photographed none of them or all of them.
    Each card independently shows either a photograph of a real job in that
    system or a labelled illustration — so publishing one flake floor replaces
    exactly one illustration and leaves the other five honestly labelled.

    An earlier version flipped the WHOLE section to a project archive as soon
    as any project existed, which meant the first published floor silently
    deleted the other five finish categories from the homepage and duplicated
    /projects/. The archive belongs at /projects/; this section answers "what
    can you install", which is a different question.
  */
  const cards = finishes.map((f) => {
    const project = projectForSystem(f.system)
    const photo = project ? coverPhoto(project) : undefined
    return { finish: f, project: project && photo ? project : undefined, photo }
  })

  const shot = cards.filter((c) => c.project && c.photo).length
  const remainingIllustrations = cards.length - shot

  return (
    <section id="projects" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        {/*
          THE HEADING AND INTRO BELOW ARE LOAD-BEARING. READ BEFORE EDITING.

          The intro used to read: "Every image on this site is either a real
          Houston Superior Epoxy project or a labeled empty slot. There is no
          third category — no stock photography, no renders, and nothing
          generated to look like work we have not done."

          That sentence became FALSE the moment labelled illustrations were
          added to this site, and it stayed false for a while before anyone
          noticed, which is exactly how a site ends up lying by omission. A
          blanket "there is no third category" promise cannot survive a third
          category being introduced, so it has been replaced with an accurate
          three-category statement rather than quietly deleted.

          The promise that DOES still hold, and that the copy still makes, is
          the one that actually matters commercially: no stock photography, and
          nothing unlabelled dressed up as our work. Keep that.

          THREE STATES, and the copy has to match the grid underneath it or it
          is back to lying by omission:
            none shot  -> every card is an illustration, and it says so
            some shot  -> it says plainly that it is a mix
            all shot   -> no illustrations left, so the caveat goes
        */}
        <SectionHeading
          eyebrow={shot === 0 ? 'Finishes We Install' : 'Our Work'}
          title={
            shot === cards.length
              ? 'Completed floors, photographed honestly'
              : 'The finishes we install'
          }
          intro={
            shot === 0
              ? 'Our own project photography is still being shot, so the six frames below are labelled illustrations of the finishes and the space types we work in — not photographs of our work. Every image on this site falls into one of three clearly marked categories: a real project photograph, a labelled illustration like these, or an empty slot saying what belongs in it. What you will not find is stock photography, or a generated image passed off as a floor we installed.'
              : shot === cards.length
                ? 'Every image in this section is a real Houston Superior Epoxy project, photographed on site. No stock photography, and nothing generated to look like work we have not done.'
                : `Photographed floors and labelled illustrations, side by side. ${shot} of these ${cards.length} finishes is a real job photographed on site and links to the full case study; the remaining ${remainingIllustrations} are labelled illustrations of what we install, not photographs of our work. What you will not find here is stock photography, or a generated image passed off as a floor we installed.`
          }
        />

        <ul className="mt-16 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ finish: f, project, photo }) => {
            /*
              A real job in this system. The card becomes a link to the case
              study and the "Illustration · not our work" label goes with the
              illustration — keeping that label over a genuine project photo
              would be the same failure as the reverse, in the other direction.
            */
            if (project && photo) {
              return (
                <li key={f.label} className="flex flex-col bg-background">
                  <Link
                    href={`/projects/${project.slug}/`}
                    data-analytics-gallery="project_card"
                    className="flex h-full flex-col transition-colors hover:bg-secondary"
                  >
                    <ImageSlot
                      label={photo.label}
                      w={photo.w}
                      h={photo.h}
                      src={photo.src}
                      alt={photo.alt}
                      sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
                      className="border-0 border-b border-dashed"
                    />
                    <div className="flex flex-1 flex-col gap-1.5 p-6">
                      <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                        {project.city}, TX
                      </span>
                      <span className="flex items-start justify-between gap-3 font-serif text-lg tracking-tight text-foreground">
                        {project.title}
                        <ArrowUpRight
                          size={16}
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-primary"
                        />
                      </span>
                      <span className="text-sm leading-relaxed text-muted-foreground">
                        {project.flakeBlend} — {project.system}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            }

            const img = sceneIllustrations[f.sample]
            return (
              <li key={f.label} className="flex flex-col bg-background">
                {/*
                  Deliberately NOT <ImageSlot> and NOT a <Link>. These cards are
                  illustrations of a finish, so they must not look or behave
                  like the project cards above — no city, no /projects/ href, no
                  arrow affordance. A reader who clicks expecting a case study
                  would be right to feel misled.
                */}
                <MaterialSample
                  src={img.src}
                  alt={img.alt}
                  kind={img.kind}
                  caption={img.caption}
                  aspect="3/2"
                  sizes="(min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
                  className="border-0 border-b border-dashed"
                />
                <div className="flex flex-1 flex-col gap-1.5 p-6">
                  {/*
                    Was "Photography pending", which read as a promise about an
                    empty frame. With an image present that label would imply
                    the image IS the pending photography, so it now names the
                    category instead. The `note` underneath carries the
                    photography-pending meaning explicitly.
                  */}
                  <span className="text-[0.65rem] uppercase tracking-[0.16em] text-primary">
                    Illustration · not our work
                  </span>
                  <span className="font-serif text-lg tracking-tight text-foreground">
                    {f.label}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{f.note}</span>
                </div>
              </li>
            )
          })}
        </ul>

        {/*
          The "archive is being built" notice, while any illustration remains.
          Once all six are photographed it is simply untrue and disappears.
        */}
        {remainingIllustrations > 0 ? (
          <div className="mt-12 flex flex-col gap-6 border border-dashed border-border bg-card/50 p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="max-w-2xl">
              <h3 className="font-serif text-xl tracking-tight text-foreground">
                {portfolioNotice.heading}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                {portfolioNotice.body}
              </p>
            </div>
            <a
              href={site.googleBusinessProfile}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-gallery="google_photos"
              className="flex shrink-0 items-center justify-center gap-2 border border-border px-6 py-3.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            >
              See photos on Google
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        ) : null}

        <p className="mt-10">
          <Link
            href={r('projects')}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            View the full project archive →
          </Link>
        </p>
      </div>
    </section>
  )
}
