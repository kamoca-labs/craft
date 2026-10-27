import assert from 'node:assert'
import { test } from 'node:test'
import { assistantText, bashRun, codeEdit, runRule, taskCreate, userText } from './transcript.ts'

const COMMAND = 'pnpm vitest run tests/unit/attachment'
const META = taskCreate('META: os 3 cenários passam', `Verificação: \`${COMMAND}\` sai com código 0.\nLimite: 2 bloqueios.`)
const FEEDBACK = userText('Stop hook feedback: [craft:meta-goal] A meta não fechou.')

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
  assert.match(answer.reason, /Rode `pnpm vitest run tests\/unit\/attachment`/)
})

test('blocks when the verification command failed', () => {
  assert.match(stop([META, codeEdit('src/upload.ts'), bashRun(COMMAND, true)]).reason, /Rode/)
})

test('asks for the closure when the verification passed after the last edit', () => {
  assert.match(stop([META, codeEdit('src/upload.ts'), bashRun(COMMAND)]).reason, /Meta atendida/)
})

test('a goal declared as assistant text works like the task', () => {
  const text = assistantText(`META: tudo passa\nVerificação: \`${COMMAND}\` sai com 0.`)
  assert.match(stop([text, bashRun(COMMAND)]).reason, /Meta atendida/)
})

test('allows the stop after the closure', () => {
  assert.strictEqual(stop([META, bashRun(COMMAND), assistantText('META ENCERRADA: atendida.')]), null)
})

test('a new goal after a closed one blocks again', () => {
  const closed = [META, assistantText('META ENCERRADA: atendida.'), taskCreate('META: outra coisa', 'Verificação: `pnpm build` sai com 0.')]
  assert.match(stop(closed).reason, /Rode `pnpm build`/)
})

test('allows the stop when the answer asks the user something', () => {
  assert.strictEqual(stop([META], 'Qual caminho você prefere?'), null)
})

test('allows the stop when the block limit was reached', () => {
  assert.strictEqual(stop([META, FEEDBACK, FEEDBACK]), null)
  assert.strictEqual(stop([META, FEEDBACK]).decision, 'block')
})
