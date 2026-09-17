import Image from 'next/image'
import { ImageSlot } from '@/components/image-slot'
import type { ProjectPhoto as ProjectPhotoData } from '@/lib/content/projects'

/*
  Renders a real project photo when one exists, and the honest placeholder
  when it does not.

  Building the optimised path now — rather than when the first photo lands —
  means the image SEO requirements are structurally satisfied and cannot be
  forgotten later:

   - next/image emits a responsive `srcset` plus `sizes`, and serves WebP or
     AVIF automatically based on the request's Accept header. Hand-writing
     `<picture>` blocks would duplicate work the framework already does.
   - `width` and `height` are always passed through, so the browser reserves
     layout space and the photo cannot cause layout shift.
   - Everything defaults to lazy loading. `priority` is opt-in and should be
     set on at most one image per page — the above-the-fold hero — because
     preloading several images competes for the same bandwidth as the LCP
     element and makes the metric worse rather than better.
*/
export function ProjectPhoto({
  photo,
  priority = false,
  /*
    The rendered width of this photo at each breakpoint. Wrong `sizes` is the
    most common way a correctly-configured next/image still ships a 2x-too-big
    file, so it is a prop rather than a fixed value — the caller knows its own
    grid and this component does not.
  */
  sizes = '(min-width: 1024px) 60vw, 100vw',
  className = '',
}: {
  /*
    Takes the ProjectPhoto union directly, rather than a loose structural type
    with `src?` and `alt?` both optional.

    That matters because of what it removes. The old signature accepted a photo
    that had a `src` and no `alt`, and the render below papered over it with
    `alt={photo.alt ?? photo.label}`. A caption and an alt attribute do
    different jobs — the caption adds context a sighted reader cannot get from
    the frame, the alt describes the frame to someone who cannot see it — so
    that fallback produced pages which looked correct and described nothing.
    With the union, narrowing on `src` below is what makes `alt` available, and
    a shot photo cannot exist without its own alt text.
  */
  photo: ProjectPhotoData
  priority?: boolean
  sizes?: string
  className?: string
}) {
  if (!photo.src) {
    return (
      <ImageSlot label={photo.label} w={photo.w} h={photo.h} className={className} sizes={sizes} />
    )
  }

  return (
    <Image
      src={photo.src}
      /* Guaranteed present by ShotPhoto — see the note on the prop above. */
      alt={photo.alt}
      width={photo.w}
      height={photo.h}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      sizes={sizes}
      className={`h-auto w-full border border-border ${className}`}
    />
  )
}
