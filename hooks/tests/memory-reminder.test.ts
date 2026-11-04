import assert from 'node:assert'
import { test } from 'node:test'
import { injected, sandbox, userPromptCommands } from './helpers.ts'

const REMINDER_LIMIT = 200

test('every prompt gets the memory reminder as UserPromptSubmit context', () => {
  const result = sandbox().prompt('memory-reminder', 'never use em dash in the replies')

  assert.strictEqual(result.status, 0, result.stderr)
  const { hookEventName, additionalContext } = JSON.parse(result.stdout).hookSpecificOutput
  assert.strictEqual(hookEventName, 'UserPromptSubmit')
  assert.match(additionalContext, /\.claude\/memory\//)
})

test('the memory reminder has 200 characters or fewer', () => {
  const reminder = injected(sandbox().prompt('memory-reminder', 'never use em dash in the replies'))

  assert.ok(reminder!.length <= REMINDER_LIMIT, `${reminder!.length} characters`)
})

test('hooks.json runs the memory reminder on every UserPromptSubmit', () => {
  const commands = userPromptCommands()

  assert.ok(commands.some((command: string) => command.includes('rules/memory-reminder.ts')), JSON.stringify(commands))
})
