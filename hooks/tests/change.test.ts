import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

function context(source = 'startup'): string {
  const result = sandbox().start('change', source)
  assert.strictEqual(result.status, 0, result.stderr)
  return JSON.parse(result.stdout).hookSpecificOutput.additionalContext
}

test('every session source injects the change rule', () => {
  for (const source of ['startup', 'resume', 'clear', 'compact']) {
    assert.match(context(source), /# Write the change/, source)
  }
})

test('the change rule keeps the public signature and the existing tests', () => {
  assert.match(context(), /Keep the public signature/)
  assert.match(context(), /optional last parameter with a default/)
  assert.match(context(), /Never edit an existing test/)
})

test('the change rule asks for the inputs that break the rule', () => {
  assert.match(context(), /zero, empty, negative/)
})

test('a visual-only change gets no test', () => {
  assert.match(context(), /visual-only change \(style, color, spacing, layout, animation, decorative markup\) gets no test/)
})

test('the change rule stays short', () => {
  assert.ok(context().length < 1500, String(context().length))
})

test('the change rule runs the tests once per step', () => {
  assert.match(context(), /Run the tests once per step/)
  assert.match(context(), /Do not run the suite before the change only to see it pass/)
})
