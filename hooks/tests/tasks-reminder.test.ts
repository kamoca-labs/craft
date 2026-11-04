import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { test } from 'node:test'
import { injected, sandbox, userPromptCommands } from './helpers.ts'

const REMINDER_LIMIT = 300

test('every prompt gets the tasks reminder as UserPromptSubmit context', () => {
  const result = sandbox().prompt('tasks-reminder', 'compare craft and ponytail')

  assert.strictEqual(result.status, 0, result.stderr)
  const { hookEventName, additionalContext } = JSON.parse(result.stdout).hookSpecificOutput
  assert.strictEqual(hookEventName, 'UserPromptSubmit')
  assert.match(additionalContext, /TaskCreate/)
})

test('the reminder has 300 characters or fewer', () => {
  const reminder = injected(sandbox().prompt('tasks-reminder', 'compare craft and ponytail'))

  assert.ok(reminder!.length <= REMINDER_LIMIT, `${reminder!.length} characters`)
})

test('an empty stdin does not block the prompt and still gets the same reminder', () => {
  const expected = injected(sandbox().prompt('tasks-reminder', 'compare craft and ponytail'))

  const result = spawnSync('node', [path.join(import.meta.dirname, '..', 'rules', 'tasks-reminder.ts')], { input: '', encoding: 'utf8' })

  assert.strictEqual(injected(result), expected)
})

test('hooks.json runs the reminder on every UserPromptSubmit', () => {
  const commands = userPromptCommands()

  assert.ok(commands.some((command: string) => command.includes('rules/tasks-reminder.ts')), JSON.stringify(commands))
})
