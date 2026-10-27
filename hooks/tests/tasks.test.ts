import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const CONTEXT_LIMIT = 10_000

test('every session source injects the tasks skill as SessionStart context', () => {
  for (const source of ['startup', 'resume', 'clear', 'compact']) {
    const result = sandbox().start('tasks', source)
    assert.strictEqual(result.status, 0, result.stderr)
    const { hookEventName, additionalContext } = JSON.parse(result.stdout).hookSpecificOutput
    assert.strictEqual(hookEventName, 'SessionStart', source)
    assert.match(additionalContext, /META CLOSED:/, source)
    assert.doesNotMatch(additionalContext, /^---/, source)
    assert.ok(additionalContext.length < CONTEXT_LIMIT, source)
  }
})
