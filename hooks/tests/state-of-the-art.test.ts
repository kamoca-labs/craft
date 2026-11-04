import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const CONTEXT_LIMIT = 10_000

test('every session source injects the state-of-the-art skill as SessionStart context', () => {
  for (const source of ['startup', 'resume', 'clear', 'compact']) {
    const result = sandbox().start('state-of-the-art', source)
    assert.strictEqual(result.status, 0, result.stderr)
    const { hookEventName, additionalContext } = JSON.parse(result.stdout).hookSpecificOutput
    assert.strictEqual(hookEventName, 'SessionStart', source)
    assert.match(additionalContext, /Implement the state of the art/, source)
    assert.doesNotMatch(additionalContext, /^---/, source)
    assert.ok(additionalContext.length < CONTEXT_LIMIT, source)
  }
})

test('the state-of-the-art skill asks for the expert practice and the linter of the subject', () => {
  const additionalContext = JSON.parse(sandbox().start('state-of-the-art', 'startup').stdout).hookSpecificOutput.additionalContext

  assert.match(additionalContext, /expert practice/)
  assert.match(additionalContext, /linter of the subject/)
})
