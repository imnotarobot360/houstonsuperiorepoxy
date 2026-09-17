import Image from 'next/image'
import { blendsByTone, type FlakeBlend, toneGroups } from '@/lib/content/flake-blends'
import { coverPhoto, projectForBlend } from '@/lib/content/projects'

/*
  The installed-floor photo for a blend, if one exists.

  Explicit `installedPhoto` wins; otherwise a published project whose `blend`
  matches this blend's name supplies its finished-wide frame. Returns undefined
  when neither exists, which is the case for every blend today.

  The neighbourhood is required for the caption, so a project without one is
  not used — "Installed — undefined" is worse than no photo.
*/
function installedFor(blend: FlakeBlend) {
  if (blend.installedPhoto) return blend.installedPhoto

  const project = projectForBlend(blend.name)
  const photo = project ? coverPhoto(project) : undefined
  if (!project?.neighborhood || !photo) return undefined

  return { src: photo.src, alt: photo.alt, neighborhood: project.neighborhood }
}

/*
  The stocked flake blend range, grouped by tone.

  Grouped by tone rather than by colour family on purpose: /colors/ states that
  the most common colour regret is a dark blend in a poorly lit garage, so the
  light/mid/dark decision is the one worth making first.

  The caveat under the heading is RENDERED TEXT, not a code comment and not
  just an alt attribute. These are real manufacturer photos of loose flake, but
  a backlit photo of loose chips still is not the colour of a finished floor —
  see the long note in lib/content/flake-blends.ts. Removing that line would
  turn an honest reference grid into an implied promise about colour accuracy.
*/
export function FlakeBlendGrid() {
  /*
    Eager-load only the first row. The rest are below the fold on every
    viewport, and eagerly loading the whole range of chip photos would compete
    with the hero for
    bandwidth on a phone.
  */
  let rendered = 0

  return (
    <div className="mt-14 flex flex-col gap-16">
      {toneGroups.map((group) => {
        const blends = blendsByTone(group.tone)

        return (
          <section key={group.tone} aria-labelledby={`tone-${group.tone}`}>
            <div className="flex flex-col gap-2 border-b border-border pb-5">
              {/*
                Flex with baseline alignment rather than an inline span with
                align-middle: inside a 2xl serif heading the inline version
                dropped the count well below the cap height and read as a
                subscript.
              */}
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h3
                  id={`tone-${group.tone}`}
                  className="font-serif text-2xl tracking-tight text-foreground"
                >
                  {group.label}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {blends.length} {blends.length === 1 ? 'blend' : 'blends'}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
                {group.note}
              </p>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {blends.map((b) => {
                const priority = rendered < 4
                rendered += 1

                const installed = installedFor(b)

                return (
                  <li key={b.slug} className="flex flex-col">
                    {/*
                      Manufacturer sample and, when we have one, our own
                      installed floor beside it. Side by side is the point: the
                      difference between the two IS the information — loose
                      backlit chips against the same blend laid, sealed and lit
                      like a garage.
                    */}
                    <div className={installed ? 'grid grid-cols-2 gap-1.5' : undefined}>
                      <div className="relative aspect-square overflow-hidden border border-border bg-card">
                        <Image
                          src={b.image}
                          alt={b.alt}
                          fill
                          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                          priority={priority}
                          loading={priority ? undefined : 'lazy'}
                          className="object-cover"
                        />
                      </div>

                      {installed ? (
                        <figure className="flex flex-col">
                          <div className="relative aspect-square overflow-hidden border border-border bg-card">
                            <Image
                              src={installed.src}
                              alt={installed.alt}
                              fill
                              sizes="(min-width: 1024px) 11vw, (min-width: 640px) 15vw, 22vw"
                              loading="lazy"
                              className="object-cover"
                            />
                          </div>
                          <figcaption className="mt-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-primary">
                            Installed — {installed.neighborhood}
                          </figcaption>
                        </figure>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <h4 className="font-serif text-lg leading-none tracking-tight text-foreground">
                          {b.name}
                        </h4>
                        <span className="text-[0.6rem] uppercase tracking-[0.16em] text-primary">
                          {b.family}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
                        {b.blurb}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
