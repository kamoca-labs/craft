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

test('the tasks skill has no exception that lets a request skip the tasks', () => {
  const additionalContext = JSON.parse(sandbox().start('tasks', 'startup').stdout).hookSpecificOutput.additionalContext

  assert.doesNotMatch(additionalContext, /purely informative/)
  assert.doesNotMatch(additionalContext, /If the request has more than one activity/)
})

test('the ATDD flow keeps one task per scenario and the goal, even for one request', () => {
  const additionalContext = JSON.parse(sandbox().start('tasks', 'startup').stdout).hookSpecificOutput.additionalContext
  assert.match(additionalContext, /The ATDD flow is the exception/)
  assert.match(additionalContext, /one task per scenario/)
})
