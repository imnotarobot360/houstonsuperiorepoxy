import Link from 'next/link'
import { SectionHeading } from '@/components/section-heading'
import { faqs, site } from '@/lib/site'
import { r, routes } from '@/lib/routes'

/*
  Section 12 of the homepage.

  Deliberately NOT an accordion. Every answer is rendered open and visible so
  the text is in the server HTML *and* readable without interaction — the
  <details> version passed the crawl test but still hid eighteen answers
  behind eighteen clicks.

  Each answer leads with the direct response in the first sentence or two,
  then adds context. No invented figures: cure times, lifespans and
  resistance ratings are answered by pointing at the manufacturer data sheet
  and the written warranty instead.
*/

/*
  `chooseContractor` is placed first deliberately. A reader who has just worked
  through eighteen questions is still deciding whether to trust anyone at all,
  not yet comparing our chemistry against our warranty — so the objective
  buyer's guide is genuinely the most useful next step. Putting the least
  self-interested link in the most prominent slot is also consistent with how
  the rest of this section is written.
*/
const followUps = [
  { key: 'chooseContractor' as const, blurb: 'Fourteen checks before you hire anyone.' },
  { key: 'pricing' as const, blurb: 'The ten variables in every quote.' },
  { key: 'process' as const, blurb: 'The nine-step install, in order.' },
  { key: 'polyaspartic' as const, blurb: 'Epoxy vs polyaspartic in full.' },
  { key: 'warranty' as const, blurb: 'What the five years covers.' },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-10">
        <SectionHeading
          eyebrow="Questions"
          title="Eighteen questions we get before every job"
          intro="Answered directly, in the first sentence, with no figures we cannot support. Where the honest answer is “it depends on your slab,” we say that and explain what we are looking at."
        />

        <dl className="mt-16 max-w-4xl border-t border-border">
          {faqs.map((f, i) => (
            <div key={f.q} className="border-b border-border py-8">
              <dt className="flex gap-5">
                <span
                  className="mt-1.5 shrink-0 font-mono text-[0.7rem] text-primary/70 tabular-nums"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-serif text-xl tracking-tight text-foreground text-balance lg:text-[1.4rem]">
                  {f.q}
                </h3>
              </dt>
              <dd className="mt-4 leading-relaxed text-muted-foreground text-pretty sm:pl-10">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h3 className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
              Still deciding?
            </h3>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5">
              {followUps.map((f) => (
                <li key={f.key}>
                  <Link
                    href={r(f.key)}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    title={f.blurb}
                  >
                    {routes[f.key].label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Question not here? Call or text{' '}
            <a href={site.phoneHref} className="text-foreground hover:text-primary">
              {site.phone}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
