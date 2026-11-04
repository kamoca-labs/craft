import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { injected, sandbox } from './helpers.ts'

const REMINDER_LIMIT = 200

test('every prompt gets the research reminder as UserPromptSubmit context', () => {
  const result = sandbox().prompt('research-reminder', 'create the Dockerfile of the API')

  assert.strictEqual(result.status, 0, result.stderr)
  const { hookEventName, additionalContext } = JSON.parse(result.stdout).hookSpecificOutput
  assert.strictEqual(hookEventName, 'UserPromptSubmit')
  assert.match(additionalContext, /how experts do it/)
})

test('the research reminder has 200 characters or fewer', () => {
  const reminder = injected(sandbox().prompt('research-reminder', 'create the Dockerfile of the API'))

  assert.ok(reminder!.length <= REMINDER_LIMIT, `${reminder!.length} characters`)
})

test('hooks.json runs the research reminder on every UserPromptSubmit', () => {
  const hooks = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'hooks.json'), 'utf8')).hooks

  const commands = hooks.UserPromptSubmit.flatMap((group: { hooks: { command: string }[] }) => group.hooks.map((hook) => hook.command))

  assert.ok(commands.some((command: string) => command.includes('rules/research-reminder.ts')), JSON.stringify(commands))
})
