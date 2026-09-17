/*
  Stocked vinyl flake blends.

  These are REAL manufacturer product photographs of the flake blends we
  actually stock — owner-supplied, not AI-generated and not stock imagery. That
  is what makes publishing them legitimate, and it is what finally resolves the
  "Our stocked blend range" PendingBlock that used to sit on /colors/.

  IMPORTANT, and the reason /colors/ still pushes physical samples:

  A photograph of loose flake on a backlit screen is NOT the colour of a
  finished floor, for three reasons that are worth keeping straight:

    1. Monitor calibration, brightness and ambient light all shift what the
       visitor sees. Nothing about that resembles a garage with the door open.
    2. These are photos of LOOSE FLAKE, densely packed. On a real floor the
       chips sit in a pigmented base coat under a clear topcoat, so the base
       colour shows between chips and the whole surface reads slightly
       differently — usually a touch darker and less busy.
    3. Scale. These crops are shot close, so the chips look larger relative to
       the frame than they will underfoot from standing height.

  So the grid is for NARROWING DOWN, never for final selection. Every surface
  that renders these must keep that caveat visible; see components/flake-
  blend-grid.tsx, which carries it in rendered text rather than only in a
  comment.

  `tone` is the primary sort because the single most common colour regret on
  /colors/ is a dark blend in a poorly lit garage. Grouping by tone puts that
  decision first instead of burying it.

  `blurb` describes only what is VISIBLE in the photograph. No durability,
  popularity, dirt-hiding or fade claims attach to an individual blend — those
  belong to the system and topcoat, not the chip colour.
*/

export type FlakeTone = 'light' | 'mid' | 'dark'
export type FlakeFamily = 'Cool grey' | 'Warm earth' | 'Neutral' | 'Statement'

export type FlakeBlend = {
  /* URL-safe id. Also the image filename stem. */
  slug: string
  /* Manufacturer blend name, exactly as supplied. Do not "correct" these. */
  name: string
  tone: FlakeTone
  family: FlakeFamily
  /* Factual description of the colours visible in the chip photo. */
  blurb: string
  image: string
  /* Alt text describing the photo for screen readers and image search. */
  alt: string
  /*
    OPTIONAL. A photograph of one of OUR finished floors in this blend, shown
    beside the manufacturer sample on /colors/.

    This is the single most useful image on the page when it exists, because it
    is the only one showing the blend as a floor rather than as loose chips —
    chips in a base coat under a topcoat read darker and calmer than the
    backlit sample, which is exactly the gap the caveat under the heading warns
    about.

    Two ways to fill it, and NEITHER invents anything:
      1. Set it here explicitly.
      2. Leave it unset and publish a project in content/projects/ whose
         `blend` matches this blend's `name`. The grid finds it automatically.

    No blend has one today. Do not point this at a manufacturer photo, a stock
    image or another company's floor — it is captioned as our installed work.
  */
  installedPhoto?: {
    src: string
    /* Describe the finished floor in the frame, factually. */
    alt: string
    /* Area level only — "Memorial", "Cypress". Never a street or subdivision. */
    neighborhood: string
  }
}

const img = (slug: string) => `/images/flake-blends/${slug}-flake-blend.jpg`

export const flakeBlends: readonly FlakeBlend[] = [
  /* ---------------- Light ---------------- */
  {
    slug: 'coyote',
    name: 'Coyote',
    tone: 'light',
    family: 'Warm earth',
    blurb: 'Mostly white and cream with tan and grey, lifted by small rust and black chips.',
    image: img('coyote'),
    alt: 'Coyote vinyl flake blend: white, cream and tan chips with grey, rust and black accents.',
  },
  {
    slug: 'rocky-arrow',
    name: 'Rocky Arrow',
    tone: 'light',
    family: 'Neutral',
    blurb: 'White and pale grey with soft tan and scattered charcoal.',
    image: img('rocky-arrow'),
    alt: 'Rocky Arrow vinyl flake blend: white and light grey chips with tan and charcoal accents.',
  },
  {
    slug: 'schist',
    name: 'Schist',
    tone: 'light',
    family: 'Cool grey',
    blurb: 'Near-white, finely striated chips with only the faintest pale grey shading. The lightest blend we stock.',
    image: img('schist'),
    alt: 'Schist vinyl flake blend: near-white striated chips with faint pale grey shading.',
  },
  {
    slug: 'shoreline',
    name: 'Shoreline',
    tone: 'light',
    family: 'Warm earth',
    blurb: 'Cream, sand and light tan with a scattering of solid black chips for definition.',
    image: img('shoreline'),
    alt: 'Shoreline vinyl flake blend: cream, sand and tan chips with black accents.',
  },
  {
    slug: 'stony-creek',
    name: 'Stony Creek',
    tone: 'light',
    family: 'Neutral',
    blurb: 'White and light grey with warm greige and a few darker charcoal chips. Cool and warm in balance.',
    image: img('stony-creek'),
    alt: 'Stony Creek vinyl flake blend: white and light grey chips with warm greige and charcoal.',
  },
  {
    slug: 'pumice',
    name: 'Pumice',
    tone: 'light',
    family: 'Warm earth',
    blurb: 'Soft blush and warm tan mixed with pale blue-grey, in a finely striated chip.',
    image: img('pumice'),
    alt: 'Pumice vinyl flake blend: blush, warm tan and pale blue-grey striated chips.',
  },
  {
    slug: 'sable',
    name: 'Sable',
    tone: 'light',
    family: 'Warm earth',
    blurb: 'Warm tan and blush with faint mauve, heavily striated so it reads textured up close.',
    image: img('sable'),
    alt: 'Sable vinyl flake blend: warm tan and blush striated chips with mauve tones.',
  },

  /* ---------------- Mid-tone ---------------- */
  {
    slug: 'dovetail',
    name: 'Dovetail',
    tone: 'mid',
    family: 'Cool grey',
    blurb: 'Light and mid greys with white and charcoal. A clean, cool, mostly monochrome mix.',
    image: img('dovetail'),
    alt: 'Dovetail vinyl flake blend: light grey, white and charcoal chips.',
  },
  {
    slug: 'lanai-grey',
    name: 'Lanai Grey',
    tone: 'mid',
    family: 'Cool grey',
    blurb: 'Mid greys only, no warm tones, with visible striation across the chips.',
    image: img('lanai-grey'),
    alt: 'Lanai Grey vinyl flake blend: monochrome medium grey striated chips.',
  },
  {
    slug: 'gravel',
    name: 'Gravel',
    tone: 'mid',
    family: 'Cool grey',
    blurb: 'Slate blue-grey against off-white and pale sage, giving strong chip-to-chip contrast.',
    image: img('gravel'),
    alt: 'Gravel vinyl flake blend: slate blue-grey, off-white and pale sage chips.',
  },
  {
    slug: 'basalt',
    name: 'Basalt',
    tone: 'mid',
    family: 'Cool grey',
    blurb: 'Medium to dark greys in a tight range, striated, with very little colour variation.',
    image: img('basalt'),
    alt: 'Basalt vinyl flake blend: medium and dark grey striated chips.',
  },
  {
    slug: 'stonehenge',
    name: 'Stonehenge',
    tone: 'mid',
    family: 'Cool grey',
    blurb: 'Off-white and light grey set against dark charcoal, with larger chips than most greys we stock.',
    image: img('stonehenge'),
    alt: 'Stonehenge vinyl flake blend: off-white and light grey chips against dark charcoal.',
  },
  {
    slug: 'stargazer',
    name: 'Stargazer',
    tone: 'mid',
    family: 'Cool grey',
    blurb: 'Medium grey throughout with pale grey and charcoal chips. Quiet and close to monochrome.',
    image: img('stargazer'),
    alt: 'Stargazer vinyl flake blend: medium grey chips with pale grey and charcoal.',
  },
  {
    slug: 'stone-wash',
    name: 'Stone Wash',
    tone: 'mid',
    family: 'Statement',
    blurb: 'Warm taupe and off-white carrying steel blue and deep navy chips. Clearly blue, not a grey.',
    image: img('stone-wash'),
    alt: 'Stone Wash vinyl flake blend: warm taupe and off-white chips with steel blue and navy.',
  },
  {
    slug: 'tidal-wave',
    name: 'Tidal Wave',
    tone: 'mid',
    family: 'Statement',
    blurb: 'Off-white and light grey with strong teal and slate blue chips. The bluest blend we stock.',
    image: img('tidal-wave'),
    alt: 'Tidal Wave vinyl flake blend: off-white and light grey chips with teal and slate blue.',
  },
  {
    slug: 'cabin-fever',
    name: 'Cabin Fever',
    tone: 'mid',
    family: 'Neutral',
    blurb: 'Grey, tan, white and black in near-equal measure — a balanced warm-and-cool mix.',
    image: img('cabin-fever'),
    alt: 'Cabin Fever vinyl flake blend: grey, tan, white and black chips.',
  },
  {
    slug: 'madras',
    name: 'Madras',
    tone: 'mid',
    family: 'Warm earth',
    blurb: 'Tan and beige with white and dark charcoal-brown. Warm overall with dark punctuation.',
    image: img('madras'),
    alt: 'Madras vinyl flake blend: tan, beige, white and dark charcoal-brown chips.',
  },
  {
    slug: 'outback',
    name: 'Outback',
    tone: 'mid',
    family: 'Warm earth',
    blurb: 'Cream and tan through to mid brown, with black and white chips for contrast.',
    image: img('outback'),
    alt: 'Outback vinyl flake blend: cream, tan and brown chips with black and white accents.',
  },
  {
    slug: 'safari',
    name: 'Safari',
    tone: 'mid',
    family: 'Warm earth',
    blurb: 'Sand, tan and cream with dark brown and occasional sage chips. Warm with no cool tones in it.',
    image: img('safari'),
    alt: 'Safari vinyl flake blend: sand, tan and cream chips with dark brown and sage accents.',
  },
  {
    slug: 'creekbed',
    name: 'Creekbed',
    tone: 'mid',
    family: 'Warm earth',
    blurb: 'The most multi-coloured blend we stock: cream, sage grey, tan, rust and mustard.',
    image: img('creekbed'),
    alt: 'Creekbed vinyl flake blend: cream, sage grey, tan, rust and mustard chips.',
  },
  {
    slug: 'obsidian',
    name: 'Obsidian',
    tone: 'mid',
    family: 'Warm earth',
    /*
      NOTE: the supplied photo for this name shows a WARM TAN and blue-grey
      mix, not the black the name implies. Described from the photo rather than
      the name, and flagged to the owner for confirmation — a customer choosing
      "Obsidian" expecting black would be a real problem.
    */
    blurb: 'Warm tan and beige with blue-grey, in a coarse striated chip. Reads warmer than the name suggests.',
    image: img('obsidian'),
    alt: 'Obsidian vinyl flake blend: warm tan and beige chips mixed with blue-grey.',
  },

  /* ---------------- Dark ---------------- */
  {
    slug: 'dolerite',
    name: 'Dolerite',
    tone: 'dark',
    family: 'Neutral',
    blurb: 'Dark charcoal and slate carrying scattered warm tan, so it is not a flat cool grey.',
    image: img('dolerite'),
    alt: 'Dolerite vinyl flake blend: dark charcoal and slate chips with warm tan flecks.',
  },
  {
    slug: 'nightfall',
    name: 'Nightfall',
    tone: 'dark',
    family: 'Cool grey',
    blurb: 'Black and charcoal against mid and light greys, some carrying a faint sage cast. High contrast.',
    image: img('nightfall'),
    alt: 'Nightfall vinyl flake blend: charcoal and black chips against light grey and off-white.',
  },
  {
    slug: 'garnet',
    name: 'Garnet',
    tone: 'dark',
    family: 'Warm earth',
    blurb: 'Deep red-brown and mauve with blue-grey chips running through it.',
    image: img('garnet'),
    alt: 'Garnet vinyl flake blend: deep red-brown and mauve chips with blue-grey accents.',
  },
  {
    slug: 'portobello',
    name: 'Portobello',
    tone: 'dark',
    family: 'Warm earth',
    blurb: 'Dark olive and brown with black, broken up by pale peach chips.',
    image: img('portobello'),
    alt: 'Portobello vinyl flake blend: dark olive, brown and black chips with pale peach accents.',
  },
  {
    slug: 'carbon',
    name: 'Carbon',
    tone: 'dark',
    family: 'Cool grey',
    blurb: 'Near-solid black with only faint striation. The darkest blend we stock.',
    image: img('carbon'),
    alt: 'Carbon vinyl flake blend: near-black chips with faint striation.',
  },
  {
    slug: 'daredevil',
    name: 'Daredevil',
    tone: 'dark',
    family: 'Statement',
    blurb: 'Black and true red with white and grey. The only blend we stock with a primary colour in it.',
    image: img('daredevil'),
    alt: 'Daredevil vinyl flake blend: black and red chips with white and grey.',
  },
]

/* Tone groups, in the order /colors/ presents them. */
export const toneGroups: readonly {
  tone: FlakeTone
  label: string
  note: string
}[] = [
  {
    tone: 'light',
    label: 'Light',
    note: 'Bounces what light you have. Worth a hard look if the garage has one bulb and no windows, and the coolest option underfoot on a sunlit patio.',
  },
  {
    tone: 'mid',
    label: 'Mid-tone',
    note: 'The practical middle. Multi-colour mid-tones give dust and tire marks nothing clean to contrast against, which is why most working garages end up here.',
  },
  {
    tone: 'dark',
    label: 'Dark',
    note: 'Strong and deliberate, but a dark blend in a dimly lit garage will read close to black and make the space feel smaller. Look at these in the actual room.',
  },
]

export const blendsByTone = (tone: FlakeTone) => flakeBlends.filter((b) => b.tone === tone)
