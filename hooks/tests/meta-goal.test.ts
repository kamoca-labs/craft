import assert from 'node:assert'
import { test } from 'node:test'
import { assistantText, bashRun, codeEdit, runRule, taskCreate, userText } from './transcript.ts'

const COMMAND = 'pnpm vitest run tests/unit/attachment'
const META = taskCreate('META: the 3 scenarios pass', `Verification: \`${COMMAND}\` exits with code 0.\nLimit: 2 blocks.`)
const FEEDBACK = userText('Stop hook feedback: [craft:meta-goal] The goal is not closed.')

function stop(transcript: string[], lastMessage = 'Feito.') {
  const result = runRule('meta-goal', {}, transcript, [], { last_assistant_message: lastMessage })
  assert.strictEqual(result.status, 0, result.stderr)
  return result.stdout ? JSON.parse(result.stdout) : null
}

test('allows the stop when no goal was declared', () => {
  assert.strictEqual(stop([assistantText('Resposta simples.')]), null)
})

test('blocks when the verification command did not run after the last code edit', () => {
  const answer = stop([META, bashRun(COMMAND), codeEdit('src/upload.ts')])
  assert.strictEqual(answer.decision, 'block')
  assert.match(answer.reason, /Run `pnpm vitest run tests\/unit\/attachment`/)
})

test('blocks when the verification command failed', () => {
  assert.match(stop([META, codeEdit('src/upload.ts'), bashRun(COMMAND, true)]).reason, /Run/)
})

test('asks for the closure when the verification passed after the last edit', () => {
  assert.match(stop([META, codeEdit('src/upload.ts'), bashRun(COMMAND)]).reason, /Goal met/)
})

test('a goal declared as assistant text works like the task', () => {
  const text = assistantText(`META: everything passes\nVerification: \`${COMMAND}\` exits with 0.`)
  assert.match(stop([text, bashRun(COMMAND)]).reason, /Goal met/)
})

test('allows the stop after the closure', () => {
  assert.strictEqual(stop([META, bashRun(COMMAND), assistantText('META CLOSED: met.')]), null)
})

test('a new goal after a closed one blocks again', () => {
  const closed = [META, assistantText('META CLOSED: met.'), taskCreate('META: something else', 'Verification: `pnpm build` exits with 0.')]
  assert.match(stop(closed).reason, /Run `pnpm build`/)
})

test('allows the stop when the answer asks the user something', () => {
  assert.strictEqual(stop([META], 'Which path do you prefer?'), null)
})

test('allows the stop when the block limit was reached', () => {
  assert.strictEqual(stop([META, FEEDBACK, FEEDBACK]), null)
  assert.strictEqual(stop([META, FEEDBACK]).decision, 'block')
})
