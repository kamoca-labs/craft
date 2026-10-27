import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const HOOKS_DIR = path.join(import.meta.dirname, '..')
const rules = fs.readdirSync(path.join(HOOKS_DIR, 'rules')).map((file) => path.basename(file, '.ts'))
const hooksJson = fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf8')
const wired = [...hooksJson.matchAll(/rules\/([\w-]+)\.ts/g)].map((match) => match[1])
const SKILLS_DIR = path.join(HOOKS_DIR, '..', 'skills')
const ALWAYS_ON = ['ste']
const STEPS = ['acceptance-criteria']
const PRINCIPLES = fs.readdirSync(SKILLS_DIR).filter((skill) => !['craft', 'atdd', 'tasks', 'style', 'setup', 'hook', 'memory', ...ALWAYS_ON, ...STEPS].includes(skill)).sort()

test('every rule has a dedicated hook in hooks.json', () => {
  assert.deepStrictEqual(rules.filter((rule) => !wired.includes(rule)), [])
})

test('every hook in hooks.json points to an existing rule', () => {
  assert.deepStrictEqual(wired.filter((rule) => !rules.includes(rule)), [])
})

test('each rule appears only once in hooks.json', () => {
  assert.strictEqual(new Set(wired).size, wired.length)
})

test('every rule has its own test', () => {
  const missing = rules.filter((rule) => !fs.existsSync(path.join(import.meta.dirname, `${rule}.test.ts`)))
  assert.deepStrictEqual(missing, [])
})

test('the craft triage lists exactly the principle skills', () => {
  const hub = fs.readFileSync(path.join(SKILLS_DIR, 'craft', 'SKILL.md'), 'utf8')
  const listed = [...hub.matchAll(/^\| `craft:([\w-]+)`/gm)].map((match) => match[1]).sort()
  assert.deepStrictEqual(listed, PRINCIPLES)
})

test('principle, always-on and step skills stay out of the / menu; only the hub and the flows show up', () => {
  const hidden = fs.readdirSync(SKILLS_DIR)
    .filter((skill) => /^user-invocable: false$/m.test(fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8')))
    .sort()
  assert.deepStrictEqual(hidden, [...PRINCIPLES, ...ALWAYS_ON, ...STEPS].sort())
})
