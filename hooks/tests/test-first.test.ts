import assert from 'node:assert'
import { test } from 'node:test'
import { codeEdit, runRule, toolUse } from './transcript.ts'

const edit = (file: string, transcript: string[]) => runRule('test-first', { file_path: file }, transcript, [], { tool_name: 'Edit' })
const warned = (result: ReturnType<typeof edit>) => {
  assert.strictEqual(result.status, 0, result.stderr)
  return result.stdout.includes('[craft:test-first]')
}

test('the first production edit before any test edit gets a warning, not a deny', () => {
  assert.strictEqual(warned(edit('src/billing/split.ts', [codeEdit('src/billing/split.ts')])), true)
})

test('a production edit after a test edit gets no warning', () => {
  assert.strictEqual(warned(edit('src/billing/split.ts', [codeEdit('tests/split.test.ts'), codeEdit('src/billing/split.ts')])), false)
})

test('the warning comes once: a later production edit gets none', () => {
  assert.strictEqual(warned(edit('src/b.ts', [codeEdit('src/a.ts'), codeEdit('src/b.ts')])), false)
})

test('a test file, a file that is not code, or the design:style flow gets no warning', () => {
  assert.strictEqual(warned(edit('tests/split.test.ts', [codeEdit('tests/split.test.ts')])), false)
  assert.strictEqual(warned(edit('src/badge.css', [])), false)
  const style = toolUse('Skill', { skill: 'design:style' }).line
  assert.strictEqual(warned(edit('src/Badge.tsx', [style, codeEdit('src/Badge.tsx')])), false)
})

test('without a transcript the hook stays silent', () => {
  const result = runRule('test-first', { file_path: 'src/a.ts' }, [], [], { tool_name: 'Edit', transcript_path: undefined })
  assert.strictEqual(result.stdout, '')
})
