import Image from 'next/image'

/*
  Hero visual — replaces what used to be an empty "hero project photo" slot.

  WHY THIS INSTEAD OF A PHOTO:
  The slot sat empty because the site will not present stock or AI imagery as
  our own completed work. But an empty dashed box reads as an unfinished
  website and costs real leads, so the slot needed to become something.

  A cross-section of the system we actually install is a better hero visual
  than a garage photo would be even if we had one. Every competitor in this
  market shows a glossy finished floor; almost none can show what is under it.
  The brand's stated wedge is "Ground to bare concrete" — preparation rigor —
  and that argument is invisible in a finished-floor photograph by definition.

  HONESTY BOUNDARY:
  The chip image is a MATERIAL SAMPLE — loose vinyl flake photographed as a
  product specimen, the same category of image as a paint chip card. It makes
  no claim about any job we performed. The layer names and products come from
  lib/site.ts and must stay in sync with what we actually specify; if the
  system changes, this changes.
*/

/*
  Read top-down as a real cross-section: wearing surface first, slab last.
  `depth` is a visual weight for the band, loosely proportional to build —
  it is an illustration of sequence and relative thickness, not a scale drawing.
*/
type Layer = {
  n: string
  name: string
  note: string
  depth: string
  band: string
  /* Only the flake layer renders the chip photo inside its band. */
  textured?: boolean
}

const layers: Layer[] = [
  {
    n: '04',
    name: 'Polyaspartic F61 clear topcoat',
    note: 'Aliphatic, UV stable. This is the wearing surface.',
    depth: 'h-8',
    band: 'bg-[linear-gradient(100deg,color-mix(in_oklab,var(--color-foreground)_16%,transparent),color-mix(in_oklab,var(--color-foreground)_4%,transparent))]',
  },
  {
    n: '03',
    name: 'Vinyl flake, broadcast to refusal',
    note: 'Scraped and vacuumed even. Texture comes from the flake edges.',
    depth: 'h-12',
    band: 'bg-secondary',
    textured: true,
  },
  {
    n: '02',
    name: 'Citadel SLE-100 epoxy base coat',
    note: 'Build and bond into the open concrete profile.',
    depth: 'h-10',
    band: 'bg-[linear-gradient(100deg,color-mix(in_oklab,var(--color-primary)_58%,transparent),color-mix(in_oklab,var(--color-primary)_32%,transparent))]',
  },
  {
    n: '01',
    name: 'Diamond-ground concrete',
    note: 'Mechanical profile. Not acid etch, not a pressure wash.',
    depth: 'h-16',
    band: 'bg-[repeating-linear-gradient(52deg,color-mix(in_oklab,var(--color-muted-foreground)_26%,transparent)_0_2px,transparent_2px_7px)]',
  },
]

export function SystemBuildup() {
  return (
    <figure className="border border-border bg-card">
      {/*
        Material specimen, not a project photo. The caption says so in visible
        text rather than only in the alt attribute, because the distinction is
        the entire reason this image is allowed to be here.
      */}
      <div className="relative aspect-[16/9] overflow-hidden border-b border-border">
        <Image
          src="/images/materials/vinyl-flake-chip-blend-black-red-material-sample.jpg"
          alt="Loose vinyl flake chips in a black, red, white and grey blend, photographed as a material sample against a dark surface."
          fill
          priority
          sizes="(min-width: 1024px) 46vw, 100vw"
          className="object-cover"
        />
        <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-2 bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          <span className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-primary">
            Material sample
          </span>
          <span className="text-[0.7rem] text-muted-foreground">
            Vinyl flake blend — not a photograph of a completed floor
          </span>
        </figcaption>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          What goes on your slab
        </p>
        <p className="mt-2.5 font-serif text-lg leading-snug text-foreground text-pretty">
          Four layers, bottom to top
        </p>

        {/* Cross-section. Ordered list because sequence is the actual content. */}
        <ol className="mt-6 flex flex-col gap-3.5">
          {layers.map((l) => (
            <li key={l.n} className="flex items-stretch gap-4">
              {/* The band — visual stand-in for the layer itself. */}
              <div
                aria-hidden="true"
                className={`${l.depth} relative w-16 shrink-0 overflow-hidden border border-border ${l.band}`}
              >
                {l.textured ? (
                  <Image
                    src="/images/materials/vinyl-flake-chip-blend-black-red-material-sample.jpg"
                    alt=""
                    fill
                    sizes="64px"
                    /* Decorative 64px band well below the fold. */
                    loading="lazy"
                    className="object-cover opacity-90"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[0.66rem] text-primary">{l.n}</span>
                  <span className="text-sm font-medium leading-snug text-foreground text-pretty">
                    {l.name}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">
                  {l.note}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  )
}
