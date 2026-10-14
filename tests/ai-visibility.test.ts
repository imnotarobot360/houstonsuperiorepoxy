import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { join } from 'node:path'

type Prompt = {
  id: string
  city: string
  service: string
  intent: string
  prompt: string
  branded: boolean
}

const catalog = JSON.parse(
  readFileSync(join(process.cwd(), 'data', 'aeo', 'prompts.json'), 'utf8'),
) as { version: number; prompts: Prompt[] }

test('the AI visibility catalog contains 210 discovery and 10 branded prompts', () => {
  assert.equal(catalog.prompts.filter((prompt) => !prompt.branded).length, 210)
  assert.equal(catalog.prompts.filter((prompt) => prompt.branded).length, 10)
})

test('prompt IDs are stable and unique', () => {
  const ids = catalog.prompts.map((prompt) => prompt.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const id of ids) assert.match(id, /^(AEO-[A-Z]{3}-[A-Z]{3}-[A-Z]+|BRAND-\d{3})$/)
})

test('unbranded prompts do not name the company', () => {
  for (const prompt of catalog.prompts.filter((item) => !item.branded)) {
    assert.doesNotMatch(prompt.prompt, /Houston Superior Epoxy/i, prompt.id)
  }
})

test('every discovery city-service pair covers all five intents', () => {
  const discovery = catalog.prompts.filter((prompt) => !prompt.branded)
  const groups = new Map<string, Set<string>>()
  for (const prompt of discovery) {
    const key = `${prompt.city}|${prompt.service}`
    const intents = groups.get(key) ?? new Set<string>()
    intents.add(prompt.intent)
    groups.set(key, intents)
  }

  assert.equal(groups.size, 42)
  for (const [key, intents] of groups) assert.equal(intents.size, 5, key)
})
