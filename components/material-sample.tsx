import Image from 'next/image'

/*
  A labeled MATERIAL / FINISH SAMPLE image.

  This component exists to keep one rule enforceable in one place: any image on
  this site that is not real project photography must be visibly labeled as a
  sample. The label is rendered text, not just an alt attribute, because the
  point is that a visitor can tell — not only a screen reader.

  Two categories belong here:

   1. The PRODUCT we install — loose flake, finish coupons. Same category of
      image as a paint chip card or a countertop sample.
   2. A PROCESS or a material PROPERTY — what mechanical grinding does to a
      slab, how a finished surface reads under light. Depicts a method or a
      characteristic, not a particular job.

  What this component must never be used for is an image that implies a
  finished installation we performed, or that depicts people presented as our
  crew. Both are claims about this specific company rather than about a
  material or a method, and both require real photography — a completed floor
  belongs in lib/content/projects.ts with a before/after pair and a city.

  The line to hold when adding a category-2 image: it may show equipment, a
  surface, a boundary between two surface states. It may not show a
  recognisable person, a recognisable property, or anything a reader would
  reasonably take as "this is a job they did".
*/
export function MaterialSample({
  src,
  alt,
  /* Short kind label, e.g. "Finish sample" or "Material sample". */
  kind = 'Finish sample',
  /* The clarifying half of the caption. Must not overstate what is shown. */
  caption,
  /*
    Frame shape, as a Tailwind aspect-ratio value. Defaults to the 4/3 every
    finish coupon uses, so existing callers are unaffected — it exists because
    not every legitimate sample is a coupon. A process illustration shot square
    or portrait would otherwise be centre-cropped by `object-cover` below,
    which on an image whose whole point is a visible boundary between two
    surface states can crop away the thing being illustrated.
  */
  aspect = '4/3',
  priority = false,
  sizes = '(min-width: 640px) 46vw, 100vw',
  className = '',
}: {
  src: string
  alt: string
  kind?: string
  caption: string
  aspect?: string
  priority?: boolean
  sizes?: string
  className?: string
}) {
  return (
    <figure
      className={`relative overflow-hidden border border-border ${className}`}
      /*
        Inline rather than a template-literal Tailwind class: `aspect-[${x}]`
        cannot be statically extracted by the compiler, so the class would be
        purged from the production stylesheet and the box would collapse.
      */
      style={{ aspectRatio: aspect.replace('/', ' / ') }}
    >
      {/*
        `fill` inside the fixed aspect-[4/3] figure above, so the box is
        reserved by CSS and this cannot shift anything as it loads. Defers
        unless the caller marks it as sitting above the fold.
      */}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        sizes={sizes}
        className="object-cover"
      />
      <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 bg-background/80 px-3.5 py-2 backdrop-blur-sm">
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-primary">
          {kind}
        </span>
        <span className="text-[0.68rem] leading-snug text-muted-foreground text-pretty">
          {caption}
        </span>
      </figcaption>
    </figure>
  )
}
