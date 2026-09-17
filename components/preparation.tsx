import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { preparationTopics } from '@/lib/site'
import { r, routes } from '@/lib/routes'

/*
  Section 7 — the site's differentiator.

  Content rule for this block: every statement is either a description of our
  own process or publicly documented industry standard / polymer chemistry.
  No performance figures (adhesion psi, DCOF values, mil thickness, chemical
  resistance ratings, lifespan claims) — those belong to the manufacturer's
  current technical data sheet, not to marketing copy.
*/

const deeper = [
  { key: 'grinding' as const, blurb: 'Diamond grinding and the profile it produces.' },
  { key: 'repair' as const, blurb: 'How cracks and spalls are actually treated.' },
  { key: 'polyaspartic' as const, blurb: 'Aromatic vs aliphatic, in detail.' },
  { key: 'removal' as const, blurb: 'What a failed bond looks like on the way out.' },
]

export function Preparation() {
  return (
    <section
      id="preparation"
      className="scroll-mt-24 border-y border-border bg-card/40 py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="The Differentiator"
          title="Why professional preparation matters"
          intro="This is the part of the job you will never see once the floor is finished, and it is the part that decides whether the floor is still there in five years. It is also the first thing a low bid removes. Here is the actual engineering, without the adjectives."
        />

        <div className="mt-16 grid gap-px border border-border bg-border md:grid-cols-2">
          {/*
            These are independent reasons, not ordered steps, so they are not
            numbered — see the same note in service-cards.tsx.
          */}
          {preparationTopics.map((t) => (
            <article key={t.title} className="flex flex-col gap-3 bg-background p-7 lg:p-9">
              <h3 className="font-serif text-xl tracking-tight text-foreground lg:text-[1.4rem]">
                {t.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{t.body}</p>
            </article>
          ))}
        </div>

        <p className="mt-12 max-w-3xl border-l-2 border-primary pl-6 leading-relaxed text-foreground/85 text-pretty">
          None of the above is proprietary. It is documented industry practice that a properly
          equipped installer can follow and an underequipped one cannot, which is why we publish it
          instead of claiming a secret system. What we will not publish are adhesion, cure or
          chemical-resistance figures — those come from the manufacturer&apos;s current technical
          data sheet for the exact system going on your slab, and we will show you that sheet.
        </p>

        <div className="mt-14 border-t border-border pt-10">
          <h3 className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
            Go deeper on preparation
          </h3>
          <ul className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {deeper.map((d) => (
              <li key={d.key} className="bg-background">
                <Link
                  href={r(d.key)}
                  className="flex h-full flex-col gap-2 p-6 transition-colors hover:bg-secondary"
                >
                  <span className="flex items-start justify-between gap-3 font-serif text-lg tracking-tight text-foreground">
                    {routes[d.key].label}
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-primary"
                    />
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{d.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
