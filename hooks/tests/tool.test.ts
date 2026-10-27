import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const CONTEXT_LIMIT = 10_000

test('every session source injects the tool skill as SessionStart context', () => {
  for (const source of ['startup', 'resume', 'clear', 'compact']) {
    const result = sandbox().start('tool', source)
    assert.strictEqual(result.status, 0, result.stderr)
    const { hookEventName, additionalContext } = JSON.parse(result.stdout).hookSpecificOutput
    assert.strictEqual(hookEventName, 'SessionStart', source)
    assert.match(additionalContext, /Claude is the user's tool/, source)
    assert.doesNotMatch(additionalContext, /^---/, source)
    assert.ok(additionalContext.length < CONTEXT_LIMIT, source)
  }
})
