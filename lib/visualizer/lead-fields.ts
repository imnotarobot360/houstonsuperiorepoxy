import type { MeasurementMode, RoughEstimate } from '@/lib/garage-measurement'
import { sqft as formatSqft, usd } from '@/lib/garage-measurement'

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
  /* How the customer described the garage, in their own terms — a preset
     label, or the dimensions they measured. */
  garageSize: string | null
  /* Which of the three ways they answered, so the office knows whether the
     square footage is a measurement or this site's assumption. */
  measuredBy: MeasurementMode
  squareFeet: number
  squareFeetApproximate: boolean
  slabCondition: string | null
  estimate: RoughEstimate
  /* The arithmetic as one line, identical to the one on screen. */
  mathLine: string
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
  How the square footage was arrived at, in one phrase for whoever calls back.

  WHY IT IS ON THE LEAD AT ALL. The difference between "they measured 24 x 24"
  and "they tapped the 2-Car button" is the difference between a number to
  trust and a number to re-check on site, and the estimator who turns up has no
  other way to tell. An approximate figure is labelled approximate every time.
*/
export function describeMeasurement(ctx: {
  measuredBy: MeasurementMode
  squareFeet: number
  squareFeetApproximate: boolean
}): string {
  const area = formatSqft(ctx.squareFeet)
  if (ctx.measuredBy === 'dimensions') return `${area}, from the customer's own length x width`
  if (ctx.measuredBy === 'area') return `${area}, square footage entered by the customer`
  return `${area}, APPROXIMATE — from the garage-size preset, not measured`
}

export function buildDesignerLeadFields(ctx: DesignerLeadContext): DesignerLeadFields {
  const parts = [
    `Floor Designer — leaning toward the "${ctx.blendName}" flake blend (${ctx.blendFamily}, ${ctx.blendTone}-tone).`,
    `Finish: ${ctx.finish}.`,
    `Garage: ${ctx.garageSize ?? 'not answered'} — ${describeMeasurement(ctx)}.`,
    `Slab: ${ctx.slabCondition ?? 'not answered'}.`,
    `Rough estimate: ${usd(ctx.estimate.totalUsd)} (${ctx.mathLine}).`,
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
  /*
    The estimate fields the existing customer email reads. The headline is now
    a real dollar figure rather than "priced after inspection", so it is always
    present — but it is written as the ROUGH estimate, with the word in it,
    because this string lands in an email the customer keeps.
  */
  fields.estimate_headline = `Rough estimate ${usd(ctx.estimate.totalUsd)}`
  fields.finish_label = ctx.finish
  fields.estimate_sqft = String(ctx.estimate.squareFeet)

  /*
    THE RATE, THE TOTAL AND THE MINIMUM FLAG ARE NOT SEPARATE FIELDS.

    They are in `details`, which is a real column and is what the office reads.
    Adding estimate_rate / estimate_total / estimate_minimum_applied as form
    fields would look thorough and do nothing: app/actions/estimate.ts reads
    three named fields off the FormData for the customer email and ignores
    everything else, and estimate_leads has no column for any of them. They
    would travel the wire and be dropped on the floor.

    Giving them columns of their own is a schema change. Worth doing if the
    office ever wants to sort leads by value — and a decision for the owner,
    not a side effect of this feature.
  */

  return fields
}
