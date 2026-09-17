# Project photography

One folder per completed job. Drop the photos in `public/images/projects/`,
write a `project.json` here, and the floor appears on `/projects/`, on its own
project page, and — where the system matches — on the homepage.

Nothing renders until a folder exists. An empty `content/projects/` is a valid
state and leaves every page exactly as it is today.

**Only real Houston Superior Epoxy jobs go in here.** No stock photography, no
manufacturer images, nothing generated. A project page is indexed and crawled;
a label saying "example" does not travel with it.

---

## The shot list

Five photographs per job. Shoot all five — the set is what makes the page worth
publishing, because anyone can show a finished floor and almost nobody shows
what the slab looked like first.

| Stage | What it is |
|---|---|
| `before` | The slab as you found it. **Same camera position as the finished-wide shot** — that pairing is the whole argument. |
| `grind` | Mid-grind, with the machine and the exposed aggregate visible. The preparation is what the customer is actually buying. |
| `finished-wide` | The finished floor, **from the driveway, at standing height**. This is the card cover on `/projects/`. |
| `finished-detail` | The finish at **standing height — not a macro close-up**. A reader wants to know what it looks like walking in, not what a flake chip looks like through a lens. |
| `finished-car` | The finished floor with a car parked on it. Gives scale, and answers the hot-tyre question before it is asked. |

### How to shoot them

- **Phone camera is fine.** A current phone in daylight beats a DSLR indoors.
- **Hold it horizontal** (landscape). Every frame on the site is wide; a
  vertical photo gets cropped and you lose the floor.
- **Garage door open**, shooting in. Closed-door shots are lit by one bulb and
  the blend reads nothing like it does in life.
- **Daylight.** Overcast is better than direct sun — hard sun blows out the
  topcoat into a white stripe.
- **Stand in the same spot for `before` and `finished-wide`.** Take the before
  shot, and note where your feet are. It takes ten seconds and it is the
  difference between a portfolio and a pile of photos.
- Do not include **house numbers, street signs, licence plates or neighbours'
  property**. Crop them out before the photo goes in the repo.

---

## Folder layout

```
content/projects/
  garage-floor-coating-cypress-tx-530sf/
    project.json
public/images/projects/
  garage-floor-coating-cypress-tx-before.jpg
  garage-floor-coating-cypress-tx-grind.jpg
  garage-floor-coating-cypress-tx-finished-wide.jpg
  ...
```

The folder name should match the `slug`. Photos live in
`public/images/projects/`, not in the project folder — that is what `src` points
at.

**Slug convention — `[service]-[city]-[identifier]`**, e.g.
`garage-floor-coating-cypress-tx-530sf`. Service first so the URL leads with the
commercial term, city second, short identifier last. Never a counter
(`project-1` advertises how few there are) and **never a street address**.

---

## `project.json`

```json
{
  "slug": "garage-floor-coating-cypress-tx-530sf",
  "title": "Two-Car Garage Floor Coating in Cypress",
  "city": "Cypress",
  "neighborhood": "Bridgeland",
  "blend": "Coyote",
  "system": "Full-broadcast vinyl flake",
  "sqft": 530,
  "installedOn": "2026-08-14",
  "scope": [
    "Diamond ground to CSP-2",
    "Two control joints chased and filled",
    "Full-broadcast flake to refusal, scraped and sealed"
  ],
  "images": [
    {
      "src": "/images/projects/garage-floor-coating-cypress-tx-before.jpg",
      "alt": "Bare concrete garage slab with grey tyre marks and a hairline crack running from the centre joint toward the door.",
      "stage": "before",
      "w": 1600,
      "h": 1200
    }
  ]
}
```

### Fields

| Field | Notes |
|---|---|
| `slug` | See the convention above. Must be unique. |
| `title` | Reads as a page heading, not a filename. |
| `city` | City only. |
| `neighborhood` | **Area level only** — "Memorial", "Cypress", "Bridgeland". Never a subdivision a single street could be picked out of, never a street. Optional; shown as "Installed — Memorial" beside a blend on `/colors/`. |
| `blend` | The flake blend name, spelled as on `/colors/`. This is what links a project to a blend. |
| `system` | Keep the wording identical between jobs — "Full-broadcast vinyl flake", "Metallic epoxy". It is a filter, and a typo splits it into two one-entry buckets. It is also what matches a project to a homepage finish card. |
| `sqft` | `530` or `"530 sq ft"` — both work. |
| `installedOn` | `"2026-08-14"` or `"August 2026"`. Use the full date **only if you know the day** — an invented day ends up in structured data as a fact. |
| `scope` | Short lines, what was actually done. This is the page's substance when there is no written case study. |
| `images` | The five shots. `stage` must be one of the five names above. |

### `alt` text

Describe **what is visibly in the frame**, factually, in a sentence. It is read
aloud to someone who cannot see the photo — it is not a keyword slot.

- Good: *"Ground concrete slab showing exposed aggregate and a filled crack
  along the centre joint."*
- Bad: *"best cheap garage epoxy Houston Texas garage floor coating"*

Minimum 25 characters, and the build warns below that.

### `w` and `h`

The photo's real pixel dimensions. Optional, but supply them: they let the page
reserve the exact space before the image loads, so nothing jumps as the photos
come in. Without them the page assumes 3:2 and any photo that is not 3:2 will
shift. Your phone reports both in the file's properties.

---

## If a project does not appear

A malformed `project.json` is **skipped, not fatal** — the site keeps building
without it. The reason is printed in the build log, naming the folder and the
field:

```
[projects] content/projects/garage-cypress — images.0.alt: alt text is too short to describe the frame
[projects] content/projects/garage-cypress was skipped and will not appear on the site
```

Check the build output first if a floor you added is missing.
