import assert from 'node:assert'
import { test } from 'node:test'
import { codeEdit, runRule, toolUse, userText } from './transcript.ts'

const START = userText('fix the split of the bill')
const edit = (file: string, transcript: string[]) => runRule('test-first', { file_path: file }, [START, ...transcript], [], { tool_name: 'Edit' })

test('a production edit before any test edit is denied', () => {
  const result = edit('src/billing/split.ts', [])
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /\[craft:test-first\] write the failing test/)
})

test('a production edit after a test edit passes', () => {
  assert.strictEqual(edit('src/billing/split.ts', [codeEdit('tests/split.test.ts')]).status, 0)
})

test('a test file, a translation file or a file that is not code passes', () => {
  for (const file of ['tests/split.test.ts', 'src/locales/es.ts', 'src/i18n/en.ts', 'src/badge.css', 'package.json']) {
    assert.strictEqual(edit(file, []).status, 0, file)
  }
})

test('the craft or the style flow, loaded by Claude or typed by the user, lets the edit pass', () => {
  for (const loaded of [toolUse('Skill', { skill: 'craft:craft' }).line, toolUse('Skill', { skill: 'design:style' }).line, userText('<command-name>/craft:craft</command-name>'), userText('<command-name>/design:style</command-name>')]) {
    assert.strictEqual(edit('src/Badge.tsx', [loaded]).status, 0, loaded)
  }
})

test('without a transcript the hook lets the edit pass', () => {
  const result = runRule('test-first', { file_path: 'src/a.ts' }, [], [], { tool_name: 'Edit', transcript_path: undefined })
  assert.strictEqual(result.status, 0)
})

test('a denied test edit does not let production code pass', () => {
  const use = toolUse('Edit', { file_path: 'tests/split.test.ts' })
  const denied = JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: use.id, is_error: true, content: 'Edit denied' }] } })
  assert.strictEqual(edit('src/split.ts', [use.line, denied]).status, 2)
})

test('mentioning a flow in text or tool output does not load it', () => {
  for (const line of [userText('Example: <command-name>/craft:craft</command-name>'), userText('Use {"skill":"craft:craft"}'), JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: '<command-name>/craft:craft</command-name>' }] } })]) {
    assert.strictEqual(edit('src/split.ts', [line]).status, 2, line)
  }
})

test('a denied flow invocation does not let production code pass', () => {
  const use = toolUse('Skill', { skill: 'craft:craft' })
  const denied = JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: use.id, is_error: true }] } })
  assert.strictEqual(edit('src/split.ts', [use.line, denied]).status, 2)
})

test('a partial final transcript line does not discard the user request', () => {
  assert.strictEqual(edit('src/split.ts', ['{"type":']).status, 2)
})
