# Content policy — what may be published as what

This file is the authoritative record. Where a code comment and this file
disagree, this file is right and the comment is stale; fix the comment.

The site makes representations to consumers on behalf of a licensed contractor.
That is why these rules are written down rather than assumed, and why the
distinction below is drawn where it is.

---

## The two rules people confuse

There are two separate prohibitions in this codebase, and they are about
different things. Relaxing one does not relax the other.

**1. PROVENANCE — what a picture may be made of.**
Whether an image is a photograph, a render, or generated.

**2. REPRESENTATION — what a picture may be presented as.**
Whether the page claims it is a floor this company installed.

Rule 2 is the one with legal exposure. It has not moved, and nothing below
should be read as moving it.

---

## Current policy

### Installed-floor previews — AI-generated imagery PERMITTED

*Owner decision, 18 September 2026, overruling the previous prohibition.*

The floor designer's installed previews (`public/floor-previews/`) may be
AI-generated. Previously they could not be, under the original brief's rule of
"no AI-generated 'finished floor' images."

**Conditions that survive the change**, because they are Rule 2, not Rule 1:

- The preview carries a visible label. It currently reads
  `INSTALLED FLOOR PREVIEW`, and the caption beneath states that actual colour
  varies and final colour is confirmed against physical samples.
- It is never captioned, filed or linked as a completed Houston Superior Epoxy
  job. It does not get a city, a date, a slug, or an entry in `projects.ts`.
- A real photograph of a real job always takes precedence over it. See
  `installedPhoto` in `lib/content/flake-blends.ts` — when one exists the
  preview steps aside and the badge changes to `REAL HOUSTON INSTALLATION`.

**A generated preview may not be moved into the portfolio.** The path from
"preview" to "our work" runs through an actual camera, and nothing else.

### Flake sample photographs — REAL ONLY, unchanged

`public/images/flake-blends/*.jpg` must remain genuine manufacturer
photographs of blends actually stocked. Invented blend names, guessed hex
swatches and generated chip images all remain prohibited.

This is not the same question as the one above, and it is worth being explicit
about why the line sits here. The sample IS the product specification — it is
what the crew brings to the door on a board and what the customer is buying. A
preview shows one plausible way that product could look installed, under one
set of lights, in a garage that is not theirs. Generating the second is a
visualization. Generating the first is inventing the product.

### Completed-work imagery — REAL ONLY, unchanged

Anything presented as a finished Houston Superior Epoxy job must be a
photograph of that job. See `components/image-slot.tsx`.

Where the portfolio is empty, `components/gallery.tsx` and
`components/applications.tsx` render labelled illustrations stamped
`Illustration · not our work`. Those labels stay until a real photograph
replaces the image — they are the thing that makes showing a room-context
picture honest in the first place.

### Reviews and ratings — unchanged

No fabricated reviews, ratings, counts, certifications or credentials.

The 4.9 rating and 200+ review count belong to Houston Superior **Painting**, a
different business, and must never appear on this site. This business's profile
is `google.com/maps?cid=12278763065042880776` and carries under 25 reviews.
`content/reviews.ts` ships empty by design.

---

## If a generated preview ships

Whatever produces the image, the pipeline's existing guarantees are worth
keeping, because they are what stop 27 previews from quietly becoming 27
different garages:

- **The garage is locked.** Every preview composites onto one master
  photograph, and only floor pixels are written — verified losslessly at 0 of
  770,082 non-floor pixels altered. An image model regenerates every pixel and
  cannot make that promise; camera, cabinets, logo and steps will drift between
  colours unless something holds them fixed.
- **Colour is gated against the sample.** Exposure 0.94–1.07x, worst hue spread
  0.031. A preview that no longer looks like the blend the customer picked is a
  misrepresentation even when it is labelled.

Neither is a rule about provenance. Both are about the preview still being
true to the product, which is the point the label cannot carry on its own.
