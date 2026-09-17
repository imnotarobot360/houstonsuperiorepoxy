import Image from 'next/image'

/*
  Hero. Headline and CTA are ordered first so they stay visible without
  scrolling on mobile (the image follows the CTA on small screens, and sits
  beside the copy on large ones). The offer badge and trust line frame the
  primary conversion without any competing navigation.
*/
export function LpHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-28 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pb-20 lg:pt-36">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-primary">
            2-Car Garage Systems Starting at $1,800*
          </span>

          <h1 className="mt-5 font-serif text-4xl leading-[1.05] text-foreground text-balance sm:text-5xl lg:text-6xl">
            Transform Your Garage With a Showroom-Quality Floor
          </h1>

          <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground text-pretty">
            Professional diamond grinding, 100% solids epoxy, full decorative flakes and a UV-stable
            polyaspartic topcoat—installed by Houston flooring specialists.
          </p>

          <a
            href="#estimate"
            className="mt-8 inline-flex w-full items-center justify-center bg-primary px-8 py-4 text-base font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            Get My Free Estimate
          </a>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Serving Houston, Katy, Cypress, Fulshear, Richmond, Sugar Land, Tomball, Spring, The
            Woodlands and surrounding areas.
          </p>
        </div>

        <div className="relative aspect-[4/5] w-full overflow-hidden border border-border sm:aspect-[3/2] lg:aspect-[4/5]">
          <Image
            src="/lp/garage-hero.png"
            alt="A completed high-gloss charcoal flake epoxy floor in a residential two-car garage"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>

      {/*
        Starting-price disclaimer, verbatim from the offer. Kept directly under
        the hero so the qualified "starting at" figure is never divorced from
        the conditions that apply to it.
      */}
      <div className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <p className="text-xs leading-relaxed text-muted-foreground/80">
          *Starting price applies to a standard 2-car garage of approximately up to 400 sq. ft.,
          with bare concrete in serviceable condition, standard preparation and standard flake
          selection. Existing coating removal, moisture mitigation and major concrete repairs are
          quoted separately.
        </p>
      </div>
    </section>
  )
}
