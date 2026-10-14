#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const catalogPath = join(ROOT, 'data', 'aeo', 'prompts.json')
const defaultResultsPath = join(ROOT, 'data', 'aeo', 'results.json')

function usage(message) {
  if (message) console.error(message)
  console.error(`
Usage:
  npm run aeo:record -- add --prompt AEO-HOU-GAR-REC --platform ChatGPT --mentioned yes [options]
  npm run aeo:record -- summary [--file path]

Add options:
  --date YYYY-MM-DD          defaults to today
  --model TEXT               model/version if visible
  --position NUMBER          recommendation position, if named
  --cited-url URL            exact cited Houston Superior Epoxy URL
  --competitors TEXT         semicolon-separated names
  --accuracy accurate|mixed|incorrect|unknown
  --source-types TEXT        website;GBP;directory;reviews;other
  --notes TEXT
  --file PATH                alternate results JSON
`)
  process.exit(1)
}

function argsToObject(args) {
  const out = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (!arg.startsWith('--')) out._.push(arg)
    else {
      const key = arg.slice(2)
      const value = args[i + 1]
      if (!value || value.startsWith('--')) usage(`Missing value for --${key}`)
      out[key] = value
      i += 1
    }
  }
  return out
}

function readResults(path) {
  if (!existsSync(path)) return { version: 1, results: [] }
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(parsed.results)) throw new Error(`${path} does not contain a results array`)
  return parsed
}

function list(value = '') {
  return value.split(';').map((item) => item.trim()).filter(Boolean)
}

const args = argsToObject(process.argv.slice(2))
const command = args._[0]
const resultsPath = resolve(args.file ?? defaultResultsPath)
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')).prompts

if (command === 'add') {
  const prompt = catalog.find((item) => item.id === args.prompt)
  if (!prompt) usage(`Unknown prompt id: ${args.prompt ?? '(missing)'}`)
  if (!args.platform) usage('--platform is required')
  if (!['yes', 'no'].includes(args.mentioned)) usage('--mentioned must be yes or no')
  if (args.accuracy && !['accurate', 'mixed', 'incorrect', 'unknown'].includes(args.accuracy)) {
    usage('--accuracy must be accurate, mixed, incorrect or unknown')
  }

  const position = args.position === undefined ? null : Number(args.position)
  if (position !== null && (!Number.isInteger(position) || position < 1)) usage('--position must be a positive integer')
  if (args.mentioned === 'no' && position !== null) usage('A non-mention cannot have a position')

  const store = readResults(resultsPath)
  store.results.push({
    promptId: prompt.id,
    prompt: prompt.prompt,
    branded: prompt.branded,
    date: args.date ?? new Date().toISOString().slice(0, 10),
    platform: args.platform,
    model: args.model ?? null,
    mentioned: args.mentioned === 'yes',
    position,
    citedUrl: args['cited-url'] ?? null,
    competitors: list(args.competitors),
    accuracy: args.accuracy ?? 'unknown',
    sourceTypes: list(args['source-types']),
    notes: args.notes ?? '',
  })
  mkdirSync(dirname(resultsPath), { recursive: true })
  writeFileSync(resultsPath, JSON.stringify(store, null, 2) + '\n')
  console.log(`Recorded ${prompt.id} on ${args.platform}.`)
} else if (command === 'summary') {
  const { results } = readResults(resultsPath)
  if (!results.length) {
    console.log('No AI-visibility results recorded yet.')
    process.exit(0)
  }

  const groups = new Map()
  for (const result of results) {
    const key = `${result.platform} (${result.branded ? 'branded' : 'unbranded'})`
    const group = groups.get(key) ?? { runs: 0, mentions: 0, citations: 0, positions: [] }
    group.runs += 1
    if (result.mentioned) group.mentions += 1
    if (result.citedUrl) group.citations += 1
    if (result.position) group.positions.push(result.position)
    groups.set(key, group)
  }

  console.log('Platform\tRuns\tMentions\tMention rate\tCitations\tAverage position')
  for (const [key, group] of groups) {
    const rate = `${Math.round((group.mentions / group.runs) * 100)}%`
    const average = group.positions.length
      ? (group.positions.reduce((sum, value) => sum + value, 0) / group.positions.length).toFixed(1)
      : '—'
    console.log(`${key}\t${group.runs}\t${group.mentions}\t${rate}\t${group.citations}\t${average}`)
  }
} else usage()
