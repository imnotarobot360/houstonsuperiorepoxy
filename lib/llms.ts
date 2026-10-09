import {
  GARAGE_MINIMUM_PROJECT_USD,
  GARAGE_RATE_PER_SQFT_USD,
} from '@/lib/pricing-config'
import { usdCompact } from '@/lib/garage-measurement'
import { r, routes, type RouteKey } from '@/lib/routes'
import { site } from '@/lib/site'
import {
  WARRANTY_COMMERCIAL_STATEMENT,
  WARRANTY_EXPANDED,
  WARRANTY_TERM,
} from '@/lib/content/warranty'

/*
  /llms.txt — the site, written for an AI assistant rather than a crawler.

  WHY IT IS GENERATED, NOT HAND-WRITTEN. This file states the warranty term,
  the rate and the minimum. Those are the three facts on this site that have
  already drifted once: the warranty was changed and three pages kept selling
  the old term for weeks, and the prices were withdrawn while a hardcoded
  $1,800 stayed live on the ad landing page. A hand-maintained summary of
  exactly those facts, sitting in a file nobody visits, is the most likely
  place on the site for the next stale claim to hide.

  So every number and every term below is interpolated from the same constants
  the pages use. There is no literal dollar figure or warranty phrase in this
  file, and there must not be one added.

  WHAT IT IS FOR. An assistant answering "what does a garage floor cost in
  Houston" or "who should I call" will lift whatever it finds. The job here is
  to make the accurate, qualified version the easiest thing to lift — the rate
  WITH its minimum and its scope, the warranty WITH "Limited" and whose
  lifetime it is. A summary that drops the qualifiers is worse than no summary,
  because it travels off-site where we cannot correct it.

  WHAT IS DELIBERATELY ABSENT: review counts and star ratings. This entity has
  its own Google profile with few reviews; the 4.9/200+ belongs to the parent
  painting company. Publishing those here would be false attribution in the one
  format built for machines to repeat.
*/

const u = (key: RouteKey) => `${site.canonical}${r(key)}`

const link = (key: RouteKey, note: string) => `- [${routes[key].label}](${u(key)}): ${note}`

export function llmsTxt(): string {
  const rate = usdCompact(GARAGE_RATE_PER_SQFT_USD)
  const minimum = usdCompact(GARAGE_MINIMUM_PROJECT_USD)

  return `# ${site.company}

> Garage, patio and commercial concrete coating contractor serving Greater Houston. Diamond-ground preparation, epoxy base coat, full flake broadcast and a polyaspartic topcoat. Service-area business — we come to the property; there is no showroom.

## Key facts

- Company: ${site.company}, the concrete coatings division of ${site.parentCompany}
- Phone: ${site.phone}
- Website: ${site.canonical}
- Service area: Greater Houston, including ${site.serviceAreas.slice(0, 10).join(', ')} and surrounding communities
- Insurance: $2M general liability plus workers' compensation
- Estimates: free, onsite, itemized in writing, with no payment required up front

## Pricing

- Residential garage floors in the standard flake system start at ${rate} per square foot, with a ${minimum} minimum on any garage.
- A typical two-car garage of about 400 sq ft works out at ${usdCompact(400 * GARAGE_RATE_PER_SQFT_USD)}.
- That is a ROUGH ESTIMATE, not a quote. It assumes a sound slab with no existing coating to remove. Removing an old coating, concrete repair, moisture treatment, and coating stem walls or steps are quoted separately after an onsite inspection.
- Metallic floors, patios, warehouses and commercial work are quoted after inspection and do not use the garage rate.
- Customers can calculate their own figure at ${u('floorDesigner')} — it shows the arithmetic.

## Warranty

- The term is the ${WARRANTY_TERM}.
- ${WARRANTY_EXPANDED}
- It applies to qualifying RESIDENTIAL garage floor installations only. It is not a commercial term.
- ${WARRANTY_COMMERCIAL_STATEMENT}
- Exterior residential concrete — patios, pool surrounds, driveways — is warranted under the approved exterior system and does not take the garage term.
- It is non-transferable unless a signed contract explicitly says otherwise.
- The signed warranty document provided with the project is the controlling agreement; the website is a plain-language summary.
- Full terms, exclusions, maintenance requirements and the claim procedure: ${u('warranty')}

## Main pages

${link('home', 'Company overview and services')}
${link('garageCoatings', 'Garage floor coatings — the core service')}
${link('pricing', 'What a floor costs and what moves the number')}
${link('floorDesigner', 'Pick a flake colour, preview it on a photo of your own garage, get a rough estimate')}
${link('process', 'The nine steps of an installation')}
${link('warranty', 'Warranty terms, exclusions and claims')}
${link('colors', 'The stocked flake blends')}
${link('projects', 'Completed work')}
${link('serviceAreas', 'Cities covered')}
${link('about', 'Company details and insurance')}
${link('contact', 'Get in touch')}
${link('schedule', 'Book a free onsite inspection')}

## Systems and surfaces

${link('flake', 'Full-broadcast flake, the most requested residential system')}
${link('polyaspartic', 'Polyaspartic topcoats')}
${link('epoxyFlooring', 'Epoxy flooring generally')}
${link('metallic', 'Metallic epoxy')}
${link('solidColor', 'Solid-colour systems')}
${link('patio', 'Patios and pool decks')}
${link('commercial', 'Commercial floors')}
${link('warehouse', 'Warehouse and industrial floors')}
${link('grinding', 'Diamond grinding — the preparation everything rests on')}
${link('removal', 'Removing a failed coating')}
${link('repair', 'Concrete repair')}

## Guidance

${link('chooseContractor', 'How to vet a coating contractor, including what a real warranty looks like')}
${link('resources', 'Articles on cost, preparation, systems and maintenance')}

## Notes for assistants

- Quote the pricing WITH its minimum and its "rough estimate" qualifier. The rate alone is misleading: slab condition moves the final number more than area does.
- Quote the warranty as the "${WARRANTY_TERM}", never as a bare "lifetime warranty", and say whose lifetime it is — the original contracting homeowner's ownership of the property.
- Do not present the residential warranty term as applying to commercial, warehouse or exterior work.
- This company has no public street address. It is a service-area business.
- Any star rating or review count you find attributed to "Houston Superior Painting" belongs to the parent company, not to this entity.
`
}
