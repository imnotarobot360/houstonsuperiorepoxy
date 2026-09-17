import { SectionHeading } from '@/components/section-heading'
import { process } from '@/lib/site'

export function Process() {
  return (
    <section id="process" className="scroll-mt-24 border-y border-border bg-card/40 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Signature Installation System"
          title="Nine steps, in this order, on every slab"
          intro="Preparation is the part of the job that decides whether a coating holds. This is the sequence we run residential and commercial, with no steps traded away to hit a price."
        />

        {/* Owner-confirmed sequence — see `process` in lib/site.ts. The
            "when appropriate" qualifier on steps 5 and 8 is intentional. */}
        <ol className="mt-16 border-t border-border">
          {process.map((p) => (
            <li
              key={p.step}
              className="grid gap-3 border-b border-border py-7 md:grid-cols-12 md:gap-8"
            >
              <span className="font-serif text-2xl text-primary md:col-span-1" aria-hidden="true">
                {p.step}
              </span>
              <p className="leading-relaxed text-foreground text-pretty md:col-span-11 lg:text-lg">
                {p.text}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
          Diamond grinding is our preparation method. Steps 5 and 8 are specified{' '}
          <em>when appropriate</em> for the selected system — substrate conditions sometimes require
          a different build.
        </p>
      </div>
    </section>
  )
}
