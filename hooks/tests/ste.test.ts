import assert from 'node:assert'
import fs from 'node:fs'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const RULE = 'ste'
const CONTEXT_LIMIT = 10_000

function sessionContext(source: string) {
  const result = sandbox().start(RULE, source)
  assert.strictEqual(result.status, 0, result.stderr)
  return JSON.parse(result.stdout).hookSpecificOutput
}

test('every session source injects the ste skill as SessionStart context', () => {
  for (const source of ['startup', 'resume', 'clear', 'compact']) {
    const output = sessionContext(source)
    assert.strictEqual(output.hookEventName, 'SessionStart', source)
    assert.match(output.additionalContext, /ASD-STE100/, source)
    assert.doesNotMatch(output.additionalContext, /^---/, source)
  }
})

test('injected context stays under the Claude Code limit', () => {
  assert.ok(sessionContext('startup').additionalContext.length < CONTEXT_LIMIT)
})

test('session start is not logged as a use case', () => {
  const box = sandbox()
  box.start(RULE, 'startup')
  assert.strictEqual(fs.existsSync(box.casesLog), false)
})
