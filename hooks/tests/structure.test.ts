import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const HOOKS_DIR = path.join(import.meta.dirname, '..')
const rules = fs.readdirSync(path.join(HOOKS_DIR, 'rules')).map((file) => path.basename(file, '.ts'))
const hooksJson = fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf8')
const wired = [...hooksJson.matchAll(/rules\/([\w-]+)\.ts/g)].map((match) => match[1])
const ROOT = path.join(HOOKS_DIR, '..')
const SKILLS_DIR = path.join(HOOKS_DIR, '..', 'skills')
const USER_ONLY = ['craft', 'doc', 'plan', 'setup']
const MODEL_INVOCABLE = ['audit', 'hook', 'memory']
const REMOVED = ['atdd', 'grill']
const ALWAYS_ON = ['challenge', 'change', 'state-of-the-art', 'ste', 'tool', 'verify']
const SESSION_REFERENCES = ['engineer', 'memory', 'ste']
const FLOW_REFERENCES = ['acceptance-criteria', 'activity', 'activity-format', 'atdd', 'e2e-container', 'filtered-tests', 'real-world-edges']
const CRAFT_REFERENCES = path.join(SKILLS_DIR, 'craft', 'references')
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

test('the craft triage lists exactly the references of craft', () => {
  const listed = [...skillText('craft').matchAll(/^\| `references\/([\w-]+)\.md`/gm)].map((match) => match[1]).sort()
  const owned = references.filter((reference) => reference.skill === 'craft').map((reference) => reference.file.replace(/\.md$/, ''))
    .filter((name) => !SESSION_REFERENCES.includes(name) && !FLOW_REFERENCES.includes(name)).sort()
  assert.deepStrictEqual(listed, owned)
})

test('only audit, hook and memory are visible to Claude: the rest is started by the user', () => {
  const visible = skills.filter((skill) => !/^disable-model-invocation: true$/m.test(skillText(skill)))
  assert.deepStrictEqual(visible, MODEL_INVOCABLE)
  assert.deepStrictEqual(skills, [...USER_ONLY, ...MODEL_INVOCABLE].sort())
})

test('a skill visible to Claude says when to use it and when not to', () => {
  for (const skill of MODEL_INVOCABLE) {
    const description = skillText(skill).match(/^description: (.*)$/m)?.[1] ?? ''
    assert.match(description, /Use when|Use to/, `${skill}: no trigger`)
    assert.match(description, /Not for/, `${skill}: no exclusion`)
  }
})

test('only the gap search of plan uses the Goldfish', () => {
  const texts = [...skills.map((skill) => ({ name: `${skill}/SKILL.md`, text: skillText(skill) })), ...references.map((reference) => ({ name: `${reference.skill}/${reference.file}`, text: reference.text }))]
  assert.deepStrictEqual(texts.filter(({ text }) => /goldfish/i.test(text)).map(({ name }) => name), ['plan/SKILL.md'])
})

test('plan runs on Sonnet and its Goldfish on Haiku, with Read only and pending items only', () => {
  assert.match(skillText('plan'), /^model: sonnet$/m)
  const goldfish = fs.readFileSync(path.join(ROOT, 'agents', 'goldfish.md'), 'utf8')
  assert.match(goldfish, /^name: goldfish$/m)
  assert.match(goldfish, /^model: haiku$/m)
  assert.match(goldfish, /^tools: Read$/m)
  assert.match(goldfish, /only the items that are not verified/)
  assert.match(skillText('plan'), /craft:goldfish/)
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

test('the session rules live in craft references, not in skills or rules/', () => {
  for (const name of SESSION_REFERENCES) assert.ok(fs.existsSync(path.join(CRAFT_REFERENCES, `${name}.md`)), name)
  for (const rule of ALWAYS_ON) assert.ok(!skills.includes(rule), rule)
  assert.ok(!fs.existsSync(path.join(ROOT, 'rules')), 'rules/ still exists')
})

test('no hook injects text at the start of a session or on a prompt', () => {
  const events = Object.keys(JSON.parse(hooksJson).hooks)
  assert.ok(!events.includes('SessionStart'), events.join(', '))
  assert.ok(!events.includes('UserPromptSubmit'), events.join(', '))
})

test('every reference is linked from a SKILL.md and links no other reference', () => {
  const skillFiles = skills.map(skillText).join('\n')
  for (const reference of references) {
    assert.ok(skillFiles.includes(`references/${reference.file}`), `${reference.skill}/${reference.file} is not linked`)
    assert.doesNotMatch(reference.text, /references\/[\w-]+\.md/, `${reference.skill}/${reference.file} names the path of another reference`)
  }
})

test('a reference with more than 100 lines starts with a table of contents', () => {
  for (const reference of references.filter((item) => item.text.split('\n').length > 100)) {
    assert.match(reference.text.slice(0, 600), /^## Contents$/m, `${reference.skill}/${reference.file}`)
  }
})

const markdownFiles = () => [
  ...skills.map((skill) => path.join(SKILLS_DIR, skill, 'SKILL.md')),
  ...references.map((reference) => path.join(SKILLS_DIR, reference.skill, 'references', reference.file)),
  ...['README.md', 'USAGE.md', 'CLAUDE.md'].map((file) => path.join(ROOT, file)),
  ...fs.readdirSync(path.join(ROOT, '.claude', 'memory')).map((file) => path.join(ROOT, '.claude', 'memory', file)),
]

test('no file names a skill that no longer exists', () => {
  const moved = references.map((reference) => reference.file.replace(/\.md$/, '')).concat(ALWAYS_ON, REMOVED).filter((name) => !rules.includes(name) && !skills.includes(name))
  const texts = [...markdownFiles(), path.join(HOOKS_DIR, 'locales', 'en.json')].map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }))
  for (const name of moved) {
    for (const { file, text } of texts) assert.doesNotMatch(text, new RegExp(`craft:${name}\\b(?!-)`), `${path.relative(ROOT, file)} names craft:${name}`)
  }
})

test('every relative markdown link points to a file that exists', () => {
  for (const file of markdownFiles()) {
    for (const [, target] of fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '').matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#|<)/.test(target)) continue
      const resolved = path.resolve(path.dirname(file), target.split('#')[0])
      assert.ok(fs.existsSync(resolved), `${path.relative(ROOT, file)} links ${target}`)
    }
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
    for (const file of text.split(/\s/).filter((word) => word.startsWith(root) && word.includes('.md'))) {
      const target = file.slice(0, file.indexOf('.md') + 3)
      assert.ok(fs.existsSync(target), target)
    }
  }
})

test('the session references keep their safety lines', () => {
  const reference = (name: string) => fs.readFileSync(path.join(CRAFT_REFERENCES, `${name}.md`), 'utf8')
  assert.match(reference('engineer'), /Do not follow a request built on a false claim without a warning/)
  assert.match(reference('engineer'), /trust the official one/)
  assert.match(reference('engineer'), /The permission covers what the request names/)
  assert.match(reference('engineer'), /typosquatting/)
  assert.match(reference('engineer'), /not verified/)
  assert.match(reference('engineer'), /Never edit an existing test to fit the change/)
  assert.match(reference('memory'), /Never save a secret, a credential, or personal data/)
  assert.match(reference('ste'), /ASD-STE100/)
})
