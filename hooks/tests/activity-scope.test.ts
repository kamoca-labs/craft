import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const SCOPED = ['test-first', 'test-skip', 'english-code', 'test-id', 'e2e-container', 'filtered-tests', 'push-gate', 'research-first', 'memory-outside-project', 'refactor-on-green']
const FOCUSED_TEST = `${'it'}.only('splits', () => {})`
const rule = (name: string) => fs.readFileSync(path.join(import.meta.dirname, '..', 'rules', `${name}.ts`), 'utf8')

test('every scoped rule reads its input only while an activity is active', () => {
  for (const name of SCOPED) assert.match(rule(name), /readActiveInput\(\)/, name)
})

test('an E2E run on the host is denied during an activity and allowed outside one', () => {
  const command = { command: 'npx playwright test' }
  assert.strictEqual(sandbox().pre('e2e-container', 'Bash', command).status, 2)
  assert.strictEqual(sandbox({ activity: false }).pre('e2e-container', 'Bash', command).status, 0)
})

test('a focused test is denied during an activity and allowed outside one', () => {
  const edit = { file_path: 'src/split.test.ts', new_string: FOCUSED_TEST }
  assert.strictEqual(sandbox().pre('test-skip', 'Edit', edit).status, 2)
  assert.strictEqual(sandbox({ activity: false }).pre('test-skip', 'Edit', edit).status, 0)
})

test('a complete activity does not keep the hooks on', () => {
  const box = sandbox()
  const index = path.join(box.projectDir, '.claude', 'local', 'activities', 'test', 'index.md')
  fs.writeFileSync(index, fs.readFileSync(index, 'utf8').replace('status: active', 'status: complete'))
  assert.strictEqual(box.pre('e2e-container', 'Bash', { command: 'npx playwright test' }).status, 0)
})
