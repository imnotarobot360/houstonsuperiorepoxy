import Image from 'next/image'
import { ImageIcon } from 'lucide-react'

/*
  A slot for REAL project photography.

  Pass `src` + `alt` and it renders the photograph. Omit them and it renders a
  labeled empty frame at the correct aspect ratio, stating that photography is
  being added. That means a real photo drops into any of these slots by adding
  two props — no refactor at the call site.

  WHAT MAY GO IN `src`:
  Only a genuine photograph of a Houston Superior Epoxy job. Stock imagery and
  AI-generated renders must never be presented as our completed work; that is a
  trust problem and, for a licensed contractor making representations to
  consumers, a legal one.

  Material and finish SAMPLES are a different category of image and are handled
  by components/material-sample.tsx, which stamps a visible "sample" label on
  each one. Do not route a sample through this component — an unlabeled sample
  sitting in a slot captioned "Completed garage floor" is the exact
  misrepresentation both components exist to prevent.

  `w` and `h` stay required even when a photo is supplied: they are the real
  intrinsic pixel dimensions, so the browser reserves layout space and the page
  does not shift as images load.
*/
export function ImageSlot({
  label,
  w,
  h,
  src,
  alt,
  /* Optional visible caption, e.g. "Cypress, TX — March 2026". City level only. */
  caption,
  priority = false,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  className = '',
}: {
  label: string
  w: number
  h: number
  src?: string
  alt?: string
  caption?: string
  priority?: boolean
  sizes?: string
  className?: string
}) {
  /*
    A photo without alt text is not publishable — it fails accessibility and
    image SEO both. Treat a missing alt as an unfilled slot rather than
    silently shipping an undescribed image.
  */
  if (src && alt) {
    return (
      <figure className={`relative overflow-hidden border border-border ${className}`}>
        <Image
          src={src}
          alt={alt}
          /*
            Real intrinsic dimensions, always. next/image writes them onto the
            element as width/height, so the browser computes the aspect ratio
            and reserves the box before a single byte of image arrives — which
            is what keeps this out of CLS.
          */
          width={w}
          height={h}
          priority={priority}
          /*
            Everything below the fold defers. `priority` already implies eager
            + fetchpriority=high, so passing `loading` alongside it would be a
            contradiction React warns about — hence the conditional.
          */
          loading={priority ? undefined : 'lazy'}
          /*
            next/image emits a responsive srcset and negotiates WebP/AVIF from
            the Accept header, so `sizes` is what decides which candidate the
            browser actually downloads. Getting it wrong is the usual reason a
            correctly-configured image still ships far too many pixels.
          */
          sizes={sizes}
          className="h-auto w-full object-cover"
        />
        {caption ? (
          <figcaption className="absolute inset-x-0 bottom-0 bg-background/80 px-3.5 py-2 text-[0.68rem] text-muted-foreground backdrop-blur-sm">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    )
  }

  /*
    WORDING, DELIBERATELY CHOSEN.

    The empty frame itself is correct and stays — an honest reserved box beats a
    stock photo passed off as our work, and the reserved aspect ratio keeps this
    out of CLS when the real photo lands.

    What changed is the language. "Awaiting real project photography" and a
    "Placeholder:" aria-label describe the state of our CMS, which is not
    something a homeowner or a crawler has any reason to care about. Both read
    as an unfinished site rather than a deliberate one. The replacement states
    the same truth as a fact about the business — photography is being added —
    and the word "Placeholder" appears in no user-visible string or aria-label.

    The dimensions line is dev-facing scaffolding, so it is also gone from the
    visible frame; `w`/`h` still drive the reserved box and the aria-label no
    longer recites a pixel count to a screen-reader user.
  */
  return (
    <div
      role="img"
      aria-label={`${label}. Project photography from recent Houston-area installations is being added.`}
      style={{ aspectRatio: `${w} / ${h}` }}
      className={`flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card/60 p-6 text-center ${className}`}
    >
      <ImageIcon size={22} className="text-primary/70" aria-hidden="true" />
      <p className="text-[0.7rem] uppercase tracking-[0.16em] text-foreground/70">{label}</p>
      <p className="max-w-[20rem] text-[0.65rem] leading-relaxed text-muted-foreground text-pretty">
        Project photography from recent Houston-area installations is being added.
      </p>
    </div>
  )
}
