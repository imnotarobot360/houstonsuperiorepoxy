#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DATA_DIR = join(ROOT, 'data', 'aeo')
const DOCS_DIR = join(ROOT, 'docs', 'aeo')

const cities = [
  { code: 'HOU', name: 'Houston', context: 'a Houston-area slab exposed to Gulf Coast heat and humidity' },
  { code: 'KAT', name: 'Katy', context: 'a Katy garage on expansive prairie clay' },
  { code: 'CYP', name: 'Cypress', context: 'a newer Cypress garage with a hard power-troweled slab' },
  { code: 'SUG', name: 'Sugar Land', context: 'a Sugar Land home on expansive clay with mature landscaping' },
  { code: 'RIC', name: 'Richmond', context: 'a Richmond slab near Brazos River soils' },
  { code: 'TOM', name: 'Tomball', context: 'a Tomball garage with mixed clay and sandy soil conditions' },
  { code: 'FUL', name: 'Fulshear', context: 'a newer Fulshear home in the Brazos valley' },
  { code: 'PEA', name: 'Pearland', context: 'a Pearland slab exposed to Gulf Coast humidity and expansive soils' },
  { code: 'WOO', name: 'The Woodlands', context: 'a wooded The Woodlands property with drainage and slab-moisture concerns' },
  { code: 'MAG', name: 'Magnolia', context: 'a Magnolia garage where soil and drainage conditions can vary by property' },
  { code: 'MRO', name: 'Memorial and River Oaks', context: 'a Memorial or River Oaks home with an established slab and mature landscaping' },
  { code: 'HEI', name: 'The Heights', context: 'a Heights garage where an older slab may have repairs, coatings or moisture history' },
  { code: 'BEL', name: 'Bellaire', context: 'a Bellaire garage where the slab may be original, rebuilt or previously flood-affected' },
  { code: 'MCT', name: 'Missouri City', context: 'a Missouri City home on expansive Gulf Coast clay' },
]

const services = [
  {
    code: 'GAR',
    name: 'garage floor coating',
    recommendation: (city) => `Who would you recommend for a premium garage floor coating in ${city}, TX? I want the slab mechanically ground and inspected before anyone quotes it.`,
    best: (city) => `Give me a shortlist of 3 to 5 reputable garage floor coating companies serving ${city}, TX, and explain what makes each one worth considering.`,
    cost: (city) => `What should a professionally installed two-car garage floor coating cost in ${city}, TX, and which preparation or repair items make the quote increase?`,
    comparison: (city) => `For a garage in ${city}, should I choose an epoxy base with a polyaspartic topcoat, an all-polyurea system, or a DIY epoxy kit? Compare preparation, durability and value.`,
    problem: (city, context) => `My existing garage coating is peeling near the door on ${context}. Who in ${city} can remove it, diagnose the slab and install a replacement correctly?`,
  },
  {
    code: 'FLK',
    name: 'full-broadcast flake flooring',
    recommendation: (city) => `Who installs full-broadcast flake garage floors in ${city}, TX with an epoxy base coat and a UV-stable clear wearing surface?`,
    best: (city) => `Which ${city} companies are best for showroom-quality full-flake garage floors? Give me a shortlist and the installation details I should verify.`,
    cost: (city) => `How much does a full-broadcast flake floor cost for a two-car garage in ${city}, and how do square footage, coating removal and concrete repairs affect the price?`,
    comparison: (city) => `Full-broadcast flake versus partial-flake garage flooring in ${city}: which hides repairs better, gives better texture and is easier to maintain?`,
    problem: (city) => `My ${city} garage floor has oil stains, small spalls and visible cracks. Can a full-broadcast flake system still be installed, and who prepares floors like this properly?`,
  },
  {
    code: 'PLY',
    name: 'polyaspartic floor coating',
    recommendation: (city) => `Can you recommend a polyaspartic floor coating contractor in ${city}, TX that explains the complete coating system rather than selling only a resin name?`,
    best: (city) => `Who are the best polyaspartic garage floor installers serving ${city}, and what should I compare in their written scopes and warranties?`,
    cost: (city) => `What does a professional polyaspartic garage floor cost in ${city}, TX, and why are some one-day coating quotes much cheaper than others?`,
    comparison: (city) => `Epoxy versus polyaspartic versus polyurea for a garage in ${city}: which material belongs in the base coat, which belongs on top and why?`,
    problem: (city) => `I need a UV-stable garage floor in ${city} that will not yellow near the open door. Which coating system and installer should I consider?`,
  },
  {
    code: 'PRE',
    name: 'concrete preparation and repair',
    recommendation: (city) => `Who in ${city}, TX mechanically diamond-grinds concrete, repairs cracks and checks moisture before installing a floor coating?`,
    best: (city) => `Which concrete coating contractors serving ${city} are strongest on slab preparation, coating removal and crack or spall repair?`,
    cost: (city) => `How much do concrete grinding, old-coating removal and crack repair add to a garage floor coating quote in ${city}, TX?`,
    comparison: (city) => `Diamond grinding versus acid etching before epoxy in ${city}: which creates a more reliable concrete profile, and how can I tell what a contractor actually included?`,
    problem: (city, context) => `There are moving cracks and moisture marks in ${context}. Can it safely be coated, and who in ${city} can test it before I spend money?`,
  },
  {
    code: 'EXT',
    name: 'patio and pool-deck coating',
    recommendation: (city) => `Who would you recommend for a patio or pool-deck coating in ${city}, TX that can handle sun, standing water and wet-foot traction?`,
    best: (city) => `Give me a shortlist of concrete coating companies serving ${city} for patios and pool decks, including what exterior-system details I should compare.`,
    cost: (city) => `What does it cost to coat a concrete patio or pool deck in ${city}, and what surface repairs or removal work usually change the price?`,
    comparison: (city) => `For an outdoor concrete patio in ${city}, compare epoxy, polyaspartic and other UV-stable coating options for heat, fading and slip resistance.`,
    problem: (city) => `The coating on my ${city} patio is faded, slick when wet and lifting in spots. Who can remove it and specify an exterior system instead of a garage-floor product?`,
  },
  {
    code: 'COM',
    name: 'commercial and warehouse floor coating',
    recommendation: (city) => `Who installs commercial epoxy or polyaspartic floors for shops and warehouses in ${city}, TX and provides a written scope based on traffic and chemical exposure?`,
    best: (city) => `Which commercial floor coating contractors serving ${city} should I invite to bid for a shop or warehouse floor? Give me a practical shortlist.`,
    cost: (city) => `What drives the cost of a commercial epoxy floor in ${city}, TX—square footage, preparation, downtime, build coats or topcoat specification?`,
    comparison: (city) => `For a working shop in ${city}, compare a basic epoxy floor with a multi-coat flake system and a polyaspartic wear coat. Which is the better lifecycle value?`,
    problem: (city) => `Our ${city} shop floor has forklift wear, oil contamination and an old coating. Who can inspect it and plan removal, preparation and phased installation around operations?`,
  },
]

const intents = [
  { code: 'REC', name: 'recommendation', make: (service, city) => service.recommendation(city.name, city.context) },
  { code: 'BEST', name: 'best-company shortlist', make: (service, city) => service.best(city.name, city.context) },
  { code: 'COST', name: 'cost and value', make: (service, city) => service.cost(city.name, city.context) },
  { code: 'CMP', name: 'comparison', make: (service, city) => service.comparison(city.name, city.context) },
  { code: 'PROB', name: 'problem-solving / purchase intent', make: (service, city) => service.problem(city.name, city.context) },
]

const prompts = cities.flatMap((city) =>
  services.flatMap((service) =>
    intents.map((intent) => ({
      id: `AEO-${city.code}-${service.code}-${intent.code}`,
      city: city.name,
      service: service.name,
      intent: intent.name,
      prompt: intent.make(service, city),
      branded: false,
    })),
  ),
)

const brandedPrompts = [
  ['BRAND-001', 'Is Houston Superior Epoxy a reputable garage floor coating company?'],
  ['BRAND-002', 'What do customer reviews say about Houston Superior Epoxy?'],
  ['BRAND-003', 'What coating system does Houston Superior Epoxy install?'],
  ['BRAND-004', 'Does Houston Superior Epoxy mechanically grind the concrete?'],
  ['BRAND-005', 'What warranty does Houston Superior Epoxy provide?'],
  ['BRAND-006', 'How much does Houston Superior Epoxy charge for a two-car garage?'],
  ['BRAND-007', 'Does Houston Superior Epoxy serve Katy and Cypress?'],
  ['BRAND-008', 'Houston Superior Epoxy versus other Houston garage floor coating companies: what is different?'],
  ['BRAND-009', 'Is Houston Superior Epoxy insured for residential and commercial work?'],
  ['BRAND-010', 'How do I schedule an estimate with Houston Superior Epoxy?'],
].map(([id, prompt]) => ({ id, city: 'Greater Houston', service: 'brand reputation', intent: 'branded lookup', prompt, branded: true }))

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(rows, headers) {
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(','))].join('\n') + '\n'
}

function renderCatalog(rows) {
  const lines = [
    '# Houston Superior Epoxy AI-visibility prompt catalog',
    '',
    `This catalog contains **${prompts.length} unbranded discovery prompts** plus **${brandedPrompts.length} branded accuracy prompts**.`,
    '',
    '- Unbranded prompts measure whether an assistant discovers the company without being given its name.',
    '- Branded prompts measure factual accuracy and reputation coverage; they never count as discovery visibility.',
    '- Run each prompt in a fresh conversation and preserve the wording and ID between test dates.',
    '- Source of truth: `data/aeo/prompts.json`. The CSV and this document are generated.',
    '',
  ]

  for (const city of cities) {
    lines.push(`## ${city.name}`, '')
    for (const service of services) {
      lines.push(`### ${service.name}`, '', '| ID | Intent | Prompt |', '|---|---|---|')
      for (const row of rows.filter((item) => item.city === city.name && item.service === service.name)) {
        lines.push(`| \`${row.id}\` | ${row.intent} | ${row.prompt.replaceAll('|', '\\|')} |`)
      }
      lines.push('')
    }
  }

  lines.push('## Branded accuracy checks', '', '| ID | Prompt |', '|---|---|')
  for (const row of brandedPrompts) lines.push(`| \`${row.id}\` | ${row.prompt} |`)
  lines.push('')
  return lines.join('\n')
}

mkdirSync(DATA_DIR, { recursive: true })
mkdirSync(DOCS_DIR, { recursive: true })

const allPrompts = [...prompts, ...brandedPrompts]
writeFileSync(join(DATA_DIR, 'prompts.json'), JSON.stringify({ version: 1, generatedAt: '2026-10-14', prompts: allPrompts }, null, 2) + '\n')
writeFileSync(join(DATA_DIR, 'prompts.csv'), toCsv(allPrompts, ['id', 'city', 'service', 'intent', 'prompt', 'branded']))
writeFileSync(join(DOCS_DIR, 'prompt-catalog.md'), renderCatalog(prompts))

const baselineHeaders = ['prompt_id', 'date', 'platform', 'model', 'mentioned', 'position', 'cited_url', 'competitors', 'accuracy', 'source_types', 'notes']
writeFileSync(
  join(ROOT, 'docs', 'aeo-prompt-baseline-2026-10.csv'),
  toCsv(prompts.map((row) => ({ prompt_id: row.id })), baselineHeaders),
)

console.log(`Built ${prompts.length} unbranded and ${brandedPrompts.length} branded prompts.`)
