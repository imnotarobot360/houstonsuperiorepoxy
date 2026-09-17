import { MaterialSample } from '@/components/material-sample'
import { SectionHeading } from '@/components/section-heading'
import { applications, sceneIllustrations } from '@/lib/site'

/*
  NOT CURRENTLY RENDERED ANYWHERE. The homepage section order in app/page.tsx
  is fixed at 15 slots and has no Applications slot, so this is dead code. That
  predates the illustration work, and it has been left unmounted rather than
  silently added to the homepage.

  It is kept in sync with sceneIllustrations regardless, so that if it is ever
  mounted it renders labelled illustrations through <MaterialSample> rather than
  the empty "Garage project photo" frames it used to show. If you do mount it,
  the disclosure rules documented on sceneIllustrations in lib/site.ts apply.
*/
export function Applications() {
  return (
    <section id="applications" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Where We Work"
          title="Slabs we coat across Greater Houston"
        />

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {applications.map((a) => {
            const img = sceneIllustrations[a.sample]
            return (
            <article key={a.title} className="flex flex-col border border-border bg-card">
              {/*
                A labelled ILLUSTRATION of this space type, not our work. These
                were empty "Garage project photo" frames; MaterialSample stamps
                a visible "Illustration" chip on each, which is the whole
                reason it is safe to show a room-context image here.

                3/2 rather than the component default 4/3 — matches the
                proportions these frames had as slots, so the card grid keeps
                its original rhythm.
              */}
              <MaterialSample
                src={img.src}
                alt={img.alt}
                kind={img.kind}
                caption={img.caption}
                aspect="3/2"
                sizes="(min-width: 1024px) 32vw, 100vw"
                className="border-0 border-b border-dashed"
              />
              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-serif text-xl tracking-tight lg:text-2xl">{a.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {a.body}
                </p>
                <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
                  {a.tags.map((t) => (
                    <li key={t} className="text-[0.7rem] uppercase tracking-[0.14em] text-primary">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
