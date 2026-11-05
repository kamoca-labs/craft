import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const HOOKS_DIR = path.join(import.meta.dirname, '..')
const rules = fs.readdirSync(path.join(HOOKS_DIR, 'rules')).map((file) => path.basename(file, '.ts'))
const hooksJson = fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf8')
const wired = [...hooksJson.matchAll(/rules\/([\w-]+)\.ts/g)].map((match) => match[1])
const SKILLS_DIR = path.join(HOOKS_DIR, '..', 'skills')
const RULES_DIR = path.join(HOOKS_DIR, '..', 'rules')
const ENTRY = ['atdd', 'audit', 'craft', 'hook', 'setup']
const USER_ONLY = ['memory', 'tasks']
const ALWAYS_ON = ['challenge', 'state-of-the-art', 'ste', 'tool', 'verify']
const DESCRIPTION_LIMIT = 300
const skills = fs.readdirSync(SKILLS_DIR).sort()
const skillText = (skill: string) => fs.readFileSync(path.join(SKILLS_DIR, skill, 'SKILL.md'), 'utf8')
const references = skills.flatMap((skill) => {
  const dir = path.join(SKILLS_DIR, skill, 'references')
  return fs.existsSync(dir) ? fs.readdirSync(dir).map((file) => ({ skill, file, text: fs.readFileSync(path.join(dir, file), 'utf8') })) : []
})

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

test('the craft triage lists exactly the principle references', () => {
  const hub = skillText('craft')
  const listed = [...hub.matchAll(/^\| `references\/([\w-]+)\.md`/gm)].map((match) => match[1]).sort()
  const principles = references.filter((reference) => reference.skill === 'craft' && !['clean-tests', 'unit-tests', 'e2e-tests', 'english-code', 'i18n-layout'].includes(reference.file.replace(/\.md$/, ''))).map((reference) => reference.file.replace(/\.md$/, '')).sort()
  assert.deepStrictEqual(listed.filter((name) => principles.includes(name)), principles)
})

test('only the entry skills are visible to Claude', () => {
  const visible = skills.filter((skill) => !/^disable-model-invocation: true$/m.test(skillText(skill)))
  assert.deepStrictEqual(visible, ENTRY)
})

test('the user-only commands are hidden from Claude, not from the user', () => {
  for (const skill of USER_ONLY) {
    assert.match(skillText(skill), /^disable-model-invocation: true$/m, skill)
    assert.doesNotMatch(skillText(skill), /^user-invocable: false$/m, skill)
  }
})

test('no skill uses user-invocable: false without disable-model-invocation: true', () => {
  const wrong = skills.filter((skill) => /^user-invocable: false$/m.test(skillText(skill)) && !/^disable-model-invocation: true$/m.test(skillText(skill)))
  assert.deepStrictEqual(wrong, [])
})

test('every description has 300 characters or fewer', () => {
  for (const skill of skills) {
    const description = skillText(skill).match(/^description: (.*)$/m)?.[1] ?? ''
    assert.ok(description.length <= DESCRIPTION_LIMIT, `${skill}: ${description.length}`)
    assert.doesNotMatch(description, /: /, `${skill}: a colon with a space breaks the YAML of the frontmatter`)
  }
})

test('the always-on rules live in rules/, not in skills/', () => {
  for (const rule of ALWAYS_ON) {
    assert.ok(fs.existsSync(path.join(RULES_DIR, `${rule}.md`)), rule)
    assert.ok(!skills.includes(rule), rule)
  }
})

test('every reference is linked from a SKILL.md and links no other reference', () => {
  const skillFiles = skills.map(skillText).join('\n')
  for (const reference of references) {
    assert.ok(skillFiles.includes(`references/${reference.file}`), `${reference.skill}/${reference.file} is not linked`)
    assert.doesNotMatch(reference.text, /\]\([^)]*references\/[\w-]+\.md/, `${reference.skill}/${reference.file} links a reference`)
  }
})

test('a reference with more than 100 lines starts with a table of contents', () => {
  for (const reference of references.filter((item) => item.text.split('\n').length > 100)) {
    assert.match(reference.text.slice(0, 600), /^## Contents$/m, `${reference.skill}/${reference.file}`)
  }
})

test('no file names a skill that no longer exists', () => {
  const moved = references.map((reference) => reference.file.replace(/\.md$/, '')).concat(ALWAYS_ON)
  const files = [...skills.map(skillText), ...references.map((reference) => reference.text), ...fs.readdirSync(RULES_DIR).map((file) => fs.readFileSync(path.join(RULES_DIR, file), 'utf8')), fs.readFileSync(path.join(HOOKS_DIR, 'locales', 'en.json'), 'utf8')]
  for (const name of moved) {
    for (const text of files) assert.doesNotMatch(text, new RegExp(`craft:${name}\\b(?!-)`), name)
  }
})

test('every plugin path in a hook message resolves to a file that exists', () => {
  const root = path.join(HOOKS_DIR, '..')
  const messages = JSON.parse(fs.readFileSync(path.join(HOOKS_DIR, 'locales', 'en.json'), 'utf8')) as Record<string, string>
  const keys = Object.keys(messages).filter((key) => messages[key].includes('${CLAUDE_PLUGIN_ROOT}'))
  assert.ok(keys.length > 0)
  const script = `import { message } from ${JSON.stringify(path.join(HOOKS_DIR, 'lib.ts'))}; console.log(JSON.stringify(${JSON.stringify(keys)}.map((key) => message(key))))`
  const result = spawnSync('node', ['--input-type=module', '-e', script], { encoding: 'utf8', env: { ...process.env, CLAUDE_PLUGIN_ROOT: root } })
  assert.strictEqual(result.status, 0, result.stderr)
  for (const text of JSON.parse(result.stdout) as string[]) {
    assert.doesNotMatch(text, /undefined|\$\{CLAUDE_PLUGIN_ROOT\}/, text)
    for (const file of text.match(/\/\S+?\.md/g) ?? []) assert.ok(fs.existsSync(file), file)
  }
})
