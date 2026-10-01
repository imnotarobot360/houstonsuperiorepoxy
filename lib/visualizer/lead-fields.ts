import type { EstimateResult } from '@/lib/estimate-calc'

/*
  Builds the Floor Designer's contribution to a lead, as plain data.

  WHY IT IS ITS OWN MODULE: this used to be a template literal inside the
  submit handler in floor-designer.tsx, which meant the only way to find out
  what reached the office was to submit a lead. It is the sentence the person
  who answers the phone actually reads, so it is worth being able to test.

  It returns FIELD NAMES THE EXISTING ACTION ALREADY UNDERSTANDS. No column was
  added for this feature: `details` is free text that already carries the blend,
  and the estimate fields already drive the customer email. The visualization
  reference joins the same `details` line rather than becoming a schema change
  nobody approved.
*/

export type DesignerLeadContext = {
  blendName: string
  blendFamily: string
  blendTone: string
  finish: string
  lighting: 'bright' | 'one-bulb'
  garageSize: string | null
  slabCondition: string | null
  estimate: EstimateResult | null
  /*
    Private-blob pathname of the generated visualization, when one was made.
    A PATHNAME, NOT AN IMAGE and not a public URL: the office looks it up
    through the same private storage the estimator photos already use.
  */
  visualizationPathname?: string | null
  /* True when the visitor uploaded a photo but generation did not produce one. */
  visualizationAttempted?: boolean
}

export type DesignerLeadFields = Record<string, string>

/*
  The estimate's STATUS, in the words the estimator itself uses.

  Never re-derives a price and never invents one. `computeEstimate` is the only
  thing that decides whether a number exists, and in gated mode (which is the
  shipped state — see calculatorEnabled in lib/pricing-config.ts) the honest
  answer is the headline it produced, which may well be "priced after
  inspection". Reporting that verbatim is the point.
*/
export function describeEstimate(estimate: EstimateResult | null): string {
  if (!estimate) return 'No estimate shown (size or slab condition not answered)'
  const mode = estimate.mode === 'calculated' ? 'calculated' : 'gated'
  const sqft =
    estimate.squareFeet != null
      ? `${estimate.squareFeet} sq ft${estimate.squareFeetApproximate ? ' (approx.)' : ''}`
      : 'square footage not established'
  return `${estimate.headline} — ${mode}, ${sqft}`
}

export function buildDesignerLeadFields(ctx: DesignerLeadContext): DesignerLeadFields {
  const lightingLabel = ctx.lighting === 'one-bulb' ? 'dim/one-bulb' : 'bright'

  const parts = [
    `Floor Designer — leaning toward the "${ctx.blendName}" flake blend (${ctx.blendFamily}, ${ctx.blendTone}-tone).`,
    `Finish: ${ctx.finish}.`,
    `Viewed in ${lightingLabel} lighting.`,
    `Garage: ${ctx.garageSize ?? 'not answered'}.`,
    `Slab: ${ctx.slabCondition ?? 'not answered'}.`,
    `Estimate: ${describeEstimate(ctx.estimate)}.`,
  ]

  /*
    Three distinct states, because "no photo" and "photo failed" mean different
    things to whoever calls this person back. Somebody whose preview failed has
    already tried to show us their garage and should not be asked from scratch.
  */
  if (ctx.visualizationPathname) {
    parts.push(`Garage photo preview: ${ctx.visualizationPathname} (AI visualization, private storage).`)
  } else if (ctx.visualizationAttempted) {
    parts.push('Garage photo preview: customer uploaded a photo but the preview could not be generated.')
  }

  const fields: DesignerLeadFields = { details: parts.join(' ') }

  /*
    The estimate fields the existing customer email reads. Written only when an
    estimate exists, so a missing one stays missing rather than becoming an
    empty string the email would render as a blank headline.
  */
  if (ctx.estimate) {
    fields.estimate_headline = ctx.estimate.headline
    fields.finish_label = ctx.estimate.finishLabel
    if (ctx.estimate.squareFeet != null) fields.estimate_sqft = String(ctx.estimate.squareFeet)
  }

  return fields
}
