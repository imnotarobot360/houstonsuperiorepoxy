import { Check, Minus } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { comparison } from '@/lib/site'

export function Standard() {
  return (
    <section id="standard" className="scroll-mt-24 border-y border-border bg-card/40 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Our Standard"
          title="Where the extra time and material actually goes"
          intro="Epoxy is not a single product. These are the parts of the job we can speak to directly — how the concrete is prepared, what goes on it, and what you get in writing."
        />

        <div className="mt-16 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-left">
            <caption className="sr-only">
              Comparison of Houston Superior Epoxy specifications against typical low-cost coatings
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-5 pr-6 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Specification
                </th>
                <th scope="col" className="py-5 pr-6 text-[0.7rem] uppercase tracking-[0.18em] text-primary">
                  Houston Superior
                </th>
                <th scope="col" className="py-5 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Typical low bid
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.point} className="border-b border-border align-top">
                  <th scope="row" className="py-6 pr-6 text-sm font-medium text-foreground">
                    {c.point}
                  </th>
                  <td className="py-6 pr-6">
                    <span className="flex gap-3 text-sm leading-relaxed text-foreground">
                      <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                      {c.ours}
                    </span>
                  </td>
                  <td className="py-6">
                    <span className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <Minus size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {c.theirs}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
