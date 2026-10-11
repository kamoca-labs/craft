import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const HOOKS_DIR = path.join(import.meta.dirname, '..')
const rules = fs.readdirSync(path.join(HOOKS_DIR, 'rules')).map((file) => path.basename(file, '.ts'))
const hooksJson = fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf8')
const wired = [...hooksJson.matchAll(/rules\/([\w-]+)\.ts/g)].map((match) => match[1])
const SKILLS_DIR = path.join(HOOKS_DIR, '..', 'skills')
const PRINCIPLES = fs.readdirSync(SKILLS_DIR).filter((skill) => !['craft', 'atdd', 'setup'].includes(skill)).sort()

test('toda regra tem hook dedicado no hooks.json', () => {
  assert.deepStrictEqual(rules.filter((rule) => !wired.includes(rule)), [])
})

test('todo hook do hooks.json aponta para uma regra que existe', () => {
  assert.deepStrictEqual(wired.filter((rule) => !rules.includes(rule)), [])
})

test('cada regra aparece uma vez só no hooks.json', () => {
  assert.strictEqual(new Set(wired).size, wired.length)
})

test('toda regra tem teste próprio', () => {
  const missing = rules.filter((rule) => !fs.existsSync(path.join(import.meta.dirname, `${rule}.test.ts`)))
  assert.deepStrictEqual(missing, [])
})

test('a triagem do craft lista exatamente as skills de princípio', () => {
  const hub = fs.readFileSync(path.join(SKILLS_DIR, 'craft', 'SKILL.md'), 'utf8')
  const listed = [...hub.matchAll(/^\| `craft:([\w-]+)`/gm)].map((match) => match[1]).sort()
  assert.deepStrictEqual(listed, PRINCIPLES)
})

test('as skills de princípio ficam fora do menu de /; só o hub e os fluxos aparecem', () => {
  const hidden = fs.readdirSync(SKILLS_DIR)
    .filter((skill) => /^user-invocable: false$/m.test(fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8')))
    .sort()
  assert.deepStrictEqual(hidden, PRINCIPLES)
})
