import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { test } from 'node:test'
import { injected, sandbox, userPromptCommands } from './helpers.ts'

const REMINDER_LIMIT = 200
const reminder = () => injected(sandbox().prompt('reminder', 'compare craft and ponytail'))!

test('every prompt gets one reminder as UserPromptSubmit context', () => {
  const result = sandbox().prompt('reminder', 'create the Dockerfile of the API')
  assert.strictEqual(result.status, 0, result.stderr)
  assert.strictEqual(JSON.parse(result.stdout).hookSpecificOutput.hookEventName, 'UserPromptSubmit')
})

test('the reminder has 200 characters or fewer', () => {
  assert.ok(reminder().length <= REMINDER_LIMIT, `${reminder().length} characters`)
})

test('the reminder covers tasks and research with reuse, not memory', () => {
  assert.match(reminder(), /TaskCreate/)
  assert.match(reminder(), /expert practice/)
  assert.match(reminder(), /native or vetted package/)
  assert.doesNotMatch(reminder(), /memory/i)
})

test('an empty stdin does not block the prompt and still gets the same reminder', () => {
  const result = spawnSync('node', [path.join(import.meta.dirname, '..', 'rules', 'reminder.ts')], { input: '', encoding: 'utf8' })
  assert.strictEqual(injected(result), reminder())
})

test('hooks.json runs only one reminder on every UserPromptSubmit', () => {
  const commands = userPromptCommands()
  assert.deepStrictEqual(commands.filter((command: string) => command.includes('reminder')).length, 1, JSON.stringify(commands))
})
