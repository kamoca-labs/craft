import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { locate, readActivity } from '../activity.ts'

const ROOT = path.join(import.meta.dirname, '..', '..')
const CLI = path.join(ROOT, 'scripts', 'activity.ts')

const item = (id: string, over: object = {}) => ({
  id,
  title: `Deliver ${id}`,
  do: `Do ${id}`,
  needs: [],
  observe: `test -f ${id}.txt`,
  accept: `${id}.txt exists`,
  check: { kind: 'command', command: `test -f ${id}.txt` },
  ...over,
})

function project(items: object[] = [item('T1'), item('T2', { needs: ['T1'] })]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-gate-'))
  spawnSync('git', ['init', '-q'], { cwd: dir })
  const env = { ...process.env, CLAUDE_PROJECT_DIR: dir, HOOK_CASES_LOG: path.join(dir, 'cases.jsonl'), CLAUDE_PLUGIN_ROOT: ROOT }
  const cli = (...args: string[]) => spawnSync('node', [CLI, ...args, '--session', 's1'], { cwd: dir, encoding: 'utf8', env })
  const stop = (lastMessage = 'Done.', session = 's1') => {
    const result = spawnSync('node', [path.join(ROOT, 'hooks', 'rules', 'activity-gate.ts')], {
      input: JSON.stringify({ hook_event_name: 'Stop', session_id: session, cwd: dir, last_assistant_message: lastMessage }),
      encoding: 'utf8',
      env,
    })
    assert.strictEqual(result.status, 0, result.stderr)
    return result.stdout ? JSON.parse(result.stdout) : null
  }
  const plan = path.join(dir, 'plan.json')
  fs.writeFileSync(plan, JSON.stringify({ goal: 'Paginate the list', items }))
  const state = () => readActivity(dir, 's1')!
  const index = () => path.join(locate(dir, 's1')!, 'index.md')
  const write = (file: string) => fs.writeFileSync(path.join(dir, file), 'x')
  return { dir, cli, stop, plan, state, write, index }
}

test('without an activity the session ends normally', () => {
  assert.strictEqual(project().stop(), null)
})

test('an activity of another session does not hold this session', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  assert.strictEqual(box.stop('Done.', 'other-session'), null)
})

test('the stop returns the next executable item with its criterion and observation', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  const answer = box.stop()
  assert.strictEqual(answer.decision, 'block')
  assert.match(answer.reason, /T1/)
  assert.match(answer.reason, /T1\.txt exists/)
  assert.match(answer.reason, /test -f T1\.txt/)
  assert.doesNotMatch(answer.reason, /Next item: T2/)
})

test('an item done without evidence stays pending and the stop asks for the verification', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  box.write('T1.txt')
  box.cli('done', 'T1')
  const answer = box.stop()
  assert.strictEqual(answer.decision, 'block')
  assert.match(answer.reason, /Run `verify T1`/)
})

test('a failed check is reported as the specific pending item, and the activity completes only after the verification', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  box.cli('verify', 'T1')
  assert.match(box.stop().reason, /T1.*failed|failed.*T1/s)
  box.write('T1.txt')
  assert.strictEqual(box.cli('verify', 'T1').status, 0)
  assert.match(box.stop().reason, /T2/)
  box.write('T2.txt')
  assert.strictEqual(box.cli('verify', 'T2').status, 0)
  const close = box.stop()
  assert.strictEqual(close.decision, 'block')
  assert.match(close.reason, /complete/i)
  assert.match(close.reason, /T1.*T2/s)
  assert.ok(close.reason.includes(`ACTIVITY COMPLETE: ${box.state().id}, 2/2 verified`))
  assert.strictEqual(box.stop(), null)
  assert.strictEqual(box.state().status, 'complete')
})

test('a hand-checked markdown box does not release the stop', () => {
  const box = project([item('T1')])
  box.cli('start', '--plan', box.plan)
  fs.writeFileSync(box.index(), fs.readFileSync(box.index(), 'utf8').replaceAll('[ ]', '[x]'))
  assert.strictEqual(box.stop().decision, 'block')
})

test('a question to the user releases the stop and keeps the activity active', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  assert.strictEqual(box.stop('Which table do you want?'), null)
  assert.strictEqual(box.state().status, 'active')
})

test('when every remaining path is blocked the activity ends incomplete and can be resumed', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  box.cli('block', 'T1', '--reason', 'no access to the staging API')
  const answer = box.stop()
  assert.strictEqual(answer.decision, undefined)
  assert.match(answer.systemMessage, /incomplete/i)
  assert.match(answer.systemMessage, /no access to the staging API/)
  assert.strictEqual(box.state().status, 'incomplete')
  assert.strictEqual(box.stop(), null)
})

test('a blocked item does not stop the work on an independent item', () => {
  const box = project([item('T1'), item('T2')])
  box.cli('start', '--plan', box.plan)
  box.cli('block', 'T1', '--reason', 'waiting for a decision')
  assert.match(box.stop().reason, /T2/)
})

test('the stop limit ends the activity as incomplete', () => {
  const box = project([item('T1')])
  box.cli('start', '--plan', box.plan, '--max-stops', '2')
  assert.strictEqual(box.stop().decision, 'block')
  box.write('T1.txt')
  box.cli('done', 'T1')
  assert.strictEqual(box.stop().decision, 'block')
  const answer = box.stop()
  assert.match(answer.systemMessage, /incomplete/i)
  assert.match(answer.systemMessage, /limit/i)
  assert.strictEqual(box.state().reason, 'attempt-limit')
})

test('two stops without progress end the activity as incomplete', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  assert.strictEqual(box.stop().decision, 'block')
  assert.strictEqual(box.stop().decision, 'block')
  const answer = box.stop()
  assert.match(answer.systemMessage, /no progress/i)
  assert.strictEqual(box.state().reason, 'no-progress')
})

test('a verifier that crashes twice ends the activity as incomplete with its own reason', () => {
  const box = project([item('T1', { check: { kind: 'command', command: 'craft-no-such-command-xyz' } })])
  box.cli('start', '--plan', box.plan)
  box.cli('verify', 'T1')
  assert.match(box.stop().reason, /verifier/i)
  box.cli('verify', 'T1')
  const answer = box.stop()
  assert.match(answer.systemMessage, /verifier/i)
  assert.strictEqual(box.state().reason, 'verifier-error')
})

test('a human item pending leaves nothing to do and ends incomplete with the approval to get', () => {
  const box = project([item('T1', { check: { kind: 'human' } })])
  box.cli('start', '--plan', box.plan)
  box.cli('done', 'T1')
  const answer = box.stop()
  assert.match(answer.systemMessage, /incomplete/i)
  assert.match(answer.systemMessage, /approval/i)
})

test('an invalid plan found at the stop is reported with where to fix it', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  const text = fs.readFileSync(box.index(), 'utf8')
  fs.writeFileSync(box.index(), text.replace('- Needs: none', '- Needs: T2'))
  assert.match(box.stop().reason, /T1 -> T2 -> T1/)
})

test('new evidence resets the count of stops without progress', () => {
  const box = project([item('T1'), item('T2'), item('T3')])
  box.cli('start', '--plan', box.plan, '--max-stops', '2')
  for (const id of ['T1', 'T2', 'T3']) {
    assert.strictEqual(box.stop().decision, 'block')
    box.write(`${id}.txt`)
    box.cli('done', id)
    assert.strictEqual(box.stop().decision, 'block')
    assert.strictEqual(box.cli('verify', id).status, 0)
  }
  assert.match(box.stop().reason, /complete/i)
})

test('a total limit ends a long activity even when it keeps making progress', () => {
  const box = project([item('T1'), item('T2')])
  box.cli('start', '--plan', box.plan, '--max-total', '1')
  assert.strictEqual(box.stop().decision, 'block')
  box.write('T1.txt')
  box.cli('verify', 'T1')
  assert.match(box.stop().systemMessage, /limit/i)
})

test('a rejected item comes back as the next item with the reason, and the gate names the command to approve it again', () => {
  const box = project([item('T1', { check: { kind: 'review' } })])
  box.cli('start', '--plan', box.plan)
  box.cli('approve', 'T1', '--by', 'claude', '--note', 'ok')
  box.cli('reopen', 'T1', '--reason', 'the spacing is wrong', '--by', 'user', '--quote', 'espaçamento errado')
  const answer = box.stop()
  assert.strictEqual(answer.decision, 'block')
  assert.match(answer.reason, /T1/)
  assert.match(answer.reason, /rejected/i)
  assert.match(answer.reason, /approve T1/)
})

test('a block message names the activity CLI once', () => {
  const box = project()
  box.cli('start', '--plan', box.plan)
  assert.strictEqual(box.stop().reason.split('activity.ts').length - 1, 1)
})
