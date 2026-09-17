import { MaterialSample } from '@/components/material-sample'
import { SectionHeading } from '@/components/section-heading'
import { systems } from '@/lib/site'

export function Systems() {
  return (
    <section id="systems" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Coating Systems"
          title="Four systems, specified to the slab"
          intro="We do not sell one floor to everyone. The right system depends on how the space is used, what the concrete is doing, and the finish you want. Which one we specify comes out of the onsite inspection."
        />

        <div className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2">
          {systems.map((s) => (
            <article key={s.name} className="group flex flex-col">
              <div className="relative">
                <MaterialSample
                  src={s.sample.src}
                  alt={s.sample.alt}
                  caption={s.sample.caption}
                />
                <span className="absolute top-4 left-4 bg-background/85 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.16em] text-foreground backdrop-blur-sm">
                  {s.best}
                </span>
              </div>

              <div className="mt-7 flex flex-1 flex-col">
                <p className="text-[0.7rem] uppercase tracking-[0.2em] text-primary">{s.tagline}</p>
                <h3 className="mt-3 font-serif text-2xl tracking-tight lg:text-3xl">{s.name}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {s.body}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {s.specs.map((spec) => (
                    <li
                      key={spec}
                      className="border border-border px-3 py-1.5 text-[0.7rem] text-muted-foreground"
                    >
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
