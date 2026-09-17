import Image from 'next/image'
import { Droplets, ShieldCheck, Sparkles, Sun } from 'lucide-react'

/* Reusable CTA anchor — every one returns the visitor to the form, no reload. */
function CtaAnchor({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="#estimate"
      className="inline-flex items-center justify-center bg-primary px-8 py-4 text-base font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
    >
      {children}
    </a>
  )
}

/* 2. Before-and-after. */
export function LpBeforeAfter() {
  const benefits = [
    { icon: ShieldCheck, label: 'Professionally Prepared' },
    { icon: Sparkles, label: 'Easy to Maintain' },
    { icon: Sun, label: 'UV-Stable Protective Finish' },
  ]
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center font-serif text-3xl text-foreground text-balance sm:text-4xl">
          From Bare Concrete to Showroom Finish
        </h2>

        <div className="mx-auto mt-10 max-w-3xl overflow-hidden border border-border">
          <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
            <Image
              src="/lp/before-after.png"
              alt="Left: dull stained bare garage concrete. Right: the same floor finished with a glossy charcoal flake epoxy coating."
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        </div>

        <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          {benefits.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 border border-border bg-background px-4 py-4 text-sm font-medium text-foreground"
            >
              <Icon size={20} className="shrink-0 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <CtaAnchor>Check My Garage</CtaAnchor>
        </div>
      </div>
    </section>
  )
}

/* 3. Why preparation matters. */
export function LpPreparation() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="relative aspect-[4/5] w-full overflow-hidden border border-border sm:aspect-[3/2] lg:aspect-square">
          <Image
            src="/lp/diamond-grinding.png"
            alt="A professional floor grinder diamond-grinding a garage slab connected to a dust-extraction system"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Preparation Is Everything
          </p>
          <h2 className="mt-3 font-serif text-3xl text-foreground text-balance sm:text-4xl">
            A floor is only as good as the concrete under it
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">
            A beautiful garage floor starts with the concrete underneath. We mechanically
            diamond-grind the surface to create the correct profile before applying the coating
            system. Proper preparation helps improve adhesion and reduces the risk of peeling and
            premature coating failure.
          </p>
        </div>
      </div>
    </section>
  )
}

/* 5. Trust and system — the four-stage process (a genuine sequence, so numbered). */
export function LpSystem() {
  const stages = [
    { n: 1, title: 'Diamond Grinding', icon: Sparkles },
    { n: 2, title: 'Concrete & Crack Preparation', icon: ShieldCheck },
    { n: 3, title: '100% Solids Epoxy + Full Flake Broadcast', icon: Droplets },
    { n: 4, title: 'UV-Stable Polyaspartic Topcoat', icon: Sun },
  ]
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-center font-serif text-3xl text-foreground text-balance sm:text-4xl">
          A Complete Professional Coating System
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map(({ n, title, icon: Icon }) => (
            <li key={n} className="flex flex-col border border-border bg-background p-6">
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl text-primary">{n}</span>
                <Icon size={22} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold leading-snug text-foreground text-pretty">
                {title}
              </h3>
            </li>
          ))}
        </ol>

        {/* Owner-confirmed facts only (mirrors lib/site.ts); no lifetime or performance claims. */}
        <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
          <li>$2M insured (liability + workers&apos; comp)</li>
          <li aria-hidden="true" className="text-border">
            |
          </li>
          <li>5-year workmanship warranty</li>
          <li aria-hidden="true" className="text-border">
            |
          </li>
          <li>No upfront payment</li>
        </ul>
      </div>
    </section>
  )
}

/* 6. Service area. */
export function LpServiceArea() {
  const cities = [
    'Houston',
    'Katy',
    'Cypress',
    'Fulshear',
    'Richmond',
    'Sugar Land',
    'Tomball',
    'Spring',
    'The Woodlands',
    'Memorial',
    'Bellaire',
    'West University',
  ]
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 className="font-serif text-3xl text-foreground text-balance sm:text-4xl">
          Professional Garage Floor Installation Across Greater Houston
        </h2>
        <ul className="mt-8 flex flex-wrap justify-center gap-2.5">
          {cities.map((city) => (
            <li
              key={city}
              className="border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
            >
              {city}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-xl leading-relaxed text-muted-foreground text-pretty">
          Not sure if your home is inside our service area? Submit your ZIP code and our team will
          confirm availability.
        </p>
      </div>
    </section>
  )
}

/* 7. Final CTA. */
export function LpFinalCta() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-24">
        <h2 className="font-serif text-3xl text-foreground text-balance sm:text-4xl">
          Ready to Upgrade Your Garage?
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground text-pretty">
          Tell us about your floor and receive a personalized estimate from Houston Superior Epoxy.
        </p>
        <div className="mt-8">
          <CtaAnchor>Get My Free Estimate</CtaAnchor>
        </div>
      </div>
    </section>
  )
}
