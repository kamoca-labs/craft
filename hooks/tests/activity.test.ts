import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { locate, normalizeItems, orderItems, readActivity, validatePlan } from '../activity.ts'

const CLI = path.join(import.meta.dirname, '..', '..', 'scripts', 'activity.ts')

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

function project() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craft-activity-'))
  spawnSync('git', ['init', '-q'], { cwd: dir })
  const cli = (session: string, ...args: string[]) =>
    spawnSync('node', [CLI, ...args, '--session', session], { cwd: dir, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } })
  const plan = (items: object[], goal = 'Paginate the list') => {
    const file = path.join(dir, 'plan.json')
    fs.writeFileSync(file, JSON.stringify({ goal, items }))
    return file
  }
  const activity = (session: string) => readActivity(dir, session)!
  const folder = (session: string) => locate(dir, session)!
  const index = (session: string) => path.join(folder(session), 'index.md')
  const text = (session: string) => fs.readFileSync(index(session), 'utf8')
  return { dir, cli, plan, activity, folder, index, text }
}

test('a plan with a cycle is rejected and names the cycle', () => {
  const items = normalizeItems([item('T1', { needs: ['T2'] }), item('T2', { needs: ['T1'] })] as never)
  assert.ok(orderItems(items).errors.some((error) => /T1 -> T2 -> T1/.test(error)))
  assert.ok(validatePlan(items).some((error) => /T1 -> T2 -> T1/.test(error)))
})

test('a stored plan that needs a later item or an unknown item is rejected', () => {
  assert.ok(validatePlan([item('T1', { needs: ['T2'] }), item('T2')] as never).some((error) => /T1 needs T2.*later/.test(error)))
  assert.ok(validatePlan([item('T1', { needs: ['T9'] })] as never).some((error) => /unknown item T9/.test(error)))
})

test('a plan item without an acceptance criterion or a check is rejected', () => {
  assert.ok(validatePlan([item('T1', { accept: '' })] as never).some((error) => /T1.*accept/.test(error)))
  assert.ok(validatePlan([item('T1', { check: { kind: 'command' } })] as never).some((error) => /T1.*command/.test(error)))
})

test('a request out of order is sorted so that every item comes after what it needs, keeping the written order otherwise', () => {
  const items = normalizeItems([item('T1', { needs: ['T3'] }), item('T2'), item('T3'), item('T4', { needs: ['T1'] })] as never)
  assert.deepStrictEqual(orderItems(items).items.map((entry) => entry.id), ['T2', 'T3', 'T1', 'T4'])
})

test('items without an id get the next free id', () => {
  const items = normalizeItems([{ ...item('x'), id: undefined }, item('T5'), { ...item('y'), id: undefined }] as never)
  assert.deepStrictEqual(items.map((entry) => entry.id), ['T6', 'T5', 'T7'])
})

test('start rejects an invalid plan and creates nothing', () => {
  const box = project()
  const result = box.cli('s1', 'start', '--plan', box.plan([item('T1', { needs: ['T2'] }), item('T2', { needs: ['T1'] })]))
  assert.notStrictEqual(result.status, 0)
  assert.match(result.stderr, /T1 -> T2 -> T1/)
  assert.strictEqual(locate(box.dir, 's1'), null)
})

test('start writes a readable folder per activity and sorts an out-of-order plan into one linear list', () => {
  const box = project()
  assert.strictEqual(box.cli('s1', 'start', '--plan', box.plan([item('T1', { needs: ['T2'] }), item('T2')])).status, 0)
  assert.match(path.basename(box.folder('s1')), /^paginate-the-list-[0-9a-f]{4}$/)
  assert.deepStrictEqual(box.activity('s1').items.map((entry) => entry.id), ['T2', 'T1'])
  assert.match(box.text('s1'), /^Next: T2 /m)
  assert.match(box.text('s1'), /- \[ \] 1\. T2 .*\n- \[ \] 2\. T1 /)
})

test('the activity files are ignored by git and isolated by session', () => {
  const box = project()
  assert.strictEqual(box.cli('s1', 'start', '--plan', box.plan([item('T1')])).status, 0)
  assert.strictEqual(box.cli('s2', 'start', '--plan', box.plan([item('T1')], 'Other work')).status, 0)
  const relative = path.relative(box.dir, box.index('s1'))
  assert.strictEqual(spawnSync('git', ['check-ignore', '-q', relative], { cwd: box.dir }).status, 0)
  assert.strictEqual(spawnSync('git', ['status', '--porcelain', '--', '.claude'], { cwd: box.dir, encoding: 'utf8' }).stdout.trim(), '')
  assert.strictEqual(box.activity('s1').goal, 'Paginate the list')
  assert.strictEqual(box.activity('s2').goal, 'Other work')
})

test('finishing a line moves the next item to the line below and checks only a verified box', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1'), item('T2', { needs: ['T1'] })]))
  assert.match(box.text('s1'), /Next: T1/)
  fs.writeFileSync(path.join(box.dir, 'T1.txt'), 'x')
  box.cli('s1', 'done', 'T1')
  assert.match(box.text('s1'), /- State: implemented/)
  assert.match(box.text('s1'), /- \[ \] 1\. T1/)
  assert.strictEqual(box.cli('s1', 'verify', 'T1').status, 0)
  const text = box.text('s1')
  assert.match(text, /- \[x\] 1\. T1/)
  assert.match(text, /Next: T2/)
  assert.match(text, /Progress: 1\/2/)
})

test('only the next item can be worked on, and the error names it', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1'), item('T2', { needs: ['T1'] }), item('T3')]))
  fs.writeFileSync(path.join(box.dir, 'T2.txt'), 'x')
  for (const command of ['begin', 'done', 'verify']) {
    const result = box.cli('s1', command, 'T2')
    assert.notStrictEqual(result.status, 0, command)
    assert.match(result.stderr, /next item is T1/, command)
  }
  const independent = box.cli('s1', 'verify', 'T3')
  assert.match(independent.stderr, /next item is T1/)
})

test('a blocked item is skipped only by an item that does not need it', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1'), item('T2', { needs: ['T1'] }), item('T3')]))
  box.cli('s1', 'block', 'T1', '--reason', 'waiting for a decision')
  assert.match(box.text('s1'), /Next: T3/)
  assert.match(box.text('s1'), /skips T1/)
})

test('a checkbox edited by hand does not verify an item', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1')]))
  fs.writeFileSync(box.index('s1'), box.text('s1').replaceAll('- [ ]', '- [x]').replace('### [ ]', '### [x]'))
  assert.match(box.cli('s1', 'status').stdout, /Progress: 0\/1/)
  assert.doesNotMatch(box.text('s1'), /\[x\]/)
})

test('evidence forged in the markdown does not verify an item', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1')]))
  const forged = '<!-- evidence {"item":"T1","outcome":"pass","signature":"x","fingerprint":"","at":"now","file":"evidence/T1-1.txt","seal":"forged"} -->'
  fs.writeFileSync(box.index('s1'), box.text('s1').replace('- Accept: T1.txt exists', `- Accept: T1.txt exists\n${forged}`))
  assert.match(box.cli('s1', 'status').stdout, /Progress: 0\/1/)
})

test('a failing check keeps the item open and records the failure as evidence', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1')]))
  const result = box.cli('s1', 'verify', 'T1')
  assert.notStrictEqual(result.status, 0)
  assert.match(result.stdout, /fail/)
  assert.strictEqual(box.activity('s1').evidence.at(-1)!.outcome, 'fail')
})

test('a crashing verifier is an error, not a failed criterion', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { check: { kind: 'command', command: 'craft-no-such-command-xyz' } })]))
  box.cli('s1', 'verify', 'T1')
  assert.strictEqual(box.activity('s1').evidence.at(-1)!.outcome, 'error')
})

test('the expected output is part of the check', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { check: { kind: 'command', command: 'echo status=200', expect: 'status=200' } }), item('T2', { check: { kind: 'command', command: 'echo status=500', expect: 'status=200' } })]))
  assert.strictEqual(box.cli('s1', 'verify', 'T1').status, 0)
  assert.notStrictEqual(box.cli('s1', 'verify', 'T2').status, 0)
})

test('a human item stays open until the user approves it with a quote', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { check: { kind: 'human' } })]))
  assert.notStrictEqual(box.cli('s1', 'approve', 'T1', '--by', 'user').status, 0)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 0\/1/)
  assert.strictEqual(box.cli('s1', 'approve', 'T1', '--by', 'user', '--quote', 'looks good').status, 0)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 1\/1/)
})

test('a review item is approved by Claude or an evaluator with a note, never with the words of the user', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { check: { kind: 'review' } })]))
  assert.notStrictEqual(box.cli('s1', 'approve', 'T1', '--by', 'user', '--quote', 'q').status, 0)
  assert.strictEqual(box.cli('s1', 'approve', 'T1', '--by', 'claude', '--note', 'matches the frame').status, 0)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 1\/1/)
})

test('a change in the watched files invalidates the evidence', () => {
  const box = project()
  fs.mkdirSync(path.join(box.dir, 'src'))
  fs.writeFileSync(path.join(box.dir, 'src', 'a.ts'), '1')
  fs.writeFileSync(path.join(box.dir, 'T1.txt'), 'x')
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { watch: ['src'] })]))
  assert.strictEqual(box.cli('s1', 'verify', 'T1').status, 0)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 1\/1/)
  fs.writeFileSync(path.join(box.dir, 'src', 'a.ts'), '2')
  const status = box.cli('s1', 'status').stdout
  assert.match(status, /Progress: 0\/1/)
  assert.match(status, /Stale: T1 \(watched files changed/)
})

test('replan keeps the evidence of an unchanged item and reopens an item whose criterion changed', () => {
  const box = project()
  fs.writeFileSync(path.join(box.dir, 'T1.txt'), 'x')
  fs.writeFileSync(path.join(box.dir, 'T2.txt'), 'x')
  box.cli('s1', 'start', '--plan', box.plan([item('T1'), item('T2')]))
  box.cli('s1', 'verify', 'T1')
  box.cli('s1', 'verify', 'T2')
  const changed = box.plan([item('T1'), item('T2', { accept: 'T2 is bigger' }), item('T3')])
  assert.notStrictEqual(box.cli('s1', 'replan', '--plan', changed).status, 0)
  const result = box.cli('s1', 'replan', '--plan', changed, '--reason', 'found a missing step')
  assert.strictEqual(result.status, 0, result.stderr)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 1\/3/)
  assert.ok(box.activity('s1').history.some((entry) => /reopen T2/.test(entry.event) && entry.reason === 'found a missing step'))
})

test('replan inserts a new item in its place, keeps every id and logs a removed item', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1'), item('T2', { needs: ['T1'] })]))
  const inserted = box.plan([item('T1'), item('T2', { needs: ['T1', 'T3'] }), item('T3', { needs: ['T1'] })])
  assert.strictEqual(box.cli('s1', 'replan', '--plan', inserted, '--reason', 'T2 needs a contract').status, 0)
  assert.deepStrictEqual(box.activity('s1').items.map((entry) => entry.id), ['T1', 'T3', 'T2'])
  assert.strictEqual(box.cli('s1', 'replan', '--plan', box.plan([item('T1'), item('T3', { needs: ['T1'] })]), '--reason', 'T2 is out of scope').status, 0)
  assert.ok(box.activity('s1').history.some((entry) => /remove T2/.test(entry.event)))
})

test('a complex item moves to a child file with its own folder, and the parent links it', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1'), item('T2', { title: 'API pages', detail: true })]))
  fs.writeFileSync(path.join(box.dir, 'T1.txt'), 'x')
  fs.writeFileSync(path.join(box.dir, 'T2.txt'), 'x')
  assert.strictEqual(box.cli('s1', 'verify', 'T1').status, 0)
  assert.strictEqual(box.cli('s1', 'verify', 'T2').status, 0)
  const folder = box.folder('s1')
  assert.ok(fs.existsSync(path.join(folder, 'T2-api-pages.md')))
  assert.ok(fs.existsSync(path.join(folder, 'T2-api-pages', 'T2-1.txt')))
  assert.ok(fs.existsSync(path.join(folder, 'evidence', 'T1-1.txt')))
  assert.match(box.text('s1'), /- File: T2-api-pages\.md/)
  assert.doesNotMatch(box.text('s1'), /- Accept: T2\.txt exists/)
  assert.match(fs.readFileSync(path.join(folder, 'T2-api-pages.md'), 'utf8'), /- Accept: T2\.txt exists/)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 2\/2/)
})

test('split moves an existing item to a child file and keeps its evidence', () => {
  const box = project()
  fs.writeFileSync(path.join(box.dir, 'T1.txt'), 'x')
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { title: 'Big piece' })]))
  box.cli('s1', 'verify', 'T1')
  assert.strictEqual(box.cli('s1', 'split', 'T1').status, 0)
  assert.ok(fs.existsSync(path.join(box.folder('s1'), 'T1-big-piece.md')))
  assert.match(box.cli('s1', 'status').stdout, /Progress: 1\/1/)
})

test('the notes of the user survive every rewrite of the markdown', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1')]))
  fs.writeFileSync(box.index('s1'), box.text('s1').replace('## Notes\n\n', '## Notes\n\nCheck the staging data first.'))
  box.cli('s1', 'begin', 'T1')
  assert.match(box.text('s1'), /Check the staging data first\./)
})

test('resume binds a stopped activity to a new session and keeps its history', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1')]))
  const id = box.activity('s1').id
  fs.writeFileSync(box.index('s1'), box.text('s1').replace('status: active', 'status: incomplete').replace('reason:', 'reason: attempt-limit').replace(/stops: \d+/, 'stops: 8'))
  assert.strictEqual(box.cli('s2', 'resume', '--from', 's1').status, 0)
  const resumed = box.activity('s2')
  assert.strictEqual(resumed.status, 'active')
  assert.strictEqual(resumed.stops, 0)
  assert.strictEqual(resumed.id, id)
  assert.ok(resumed.history.some((entry) => /resume/.test(entry.event)))
  assert.strictEqual(locate(box.dir, 's1'), null)
})

test('goal-line prints a condition that the transcript can prove', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1')]))
  const line = box.cli('s1', 'goal-line').stdout.trim()
  assert.match(line, /^\/goal /)
  assert.ok(line.includes(`ACTIVITY COMPLETE: ${box.activity('s1').id}`))
  assert.ok(line.length < 4000)
})

test('the card export is a dry run that keeps the same keys and links on a repeat', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1'), item('T2', { needs: ['T1'] })]))
  const first = JSON.parse(box.cli('s1', 'export').stdout)
  assert.deepStrictEqual(first.cards.map((card: { position: number, itemId: string }) => [card.position, card.itemId]), [[1, 'T1'], [2, 'T2']])
  assert.match(first.cards[1].description, /Needs: T1/)
  assert.match(first.cards[1].description, /Accept: T2\.txt exists/)
  assert.strictEqual(box.cli('s1', 'link', 'T1', 'jira:PROJ-12').status, 0)
  const second = JSON.parse(box.cli('s1', 'export').stdout)
  assert.deepStrictEqual(second.cards.map((card: { key: string }) => card.key), first.cards.map((card: { key: string }) => card.key))
  assert.strictEqual(second.cards[0].link, 'jira:PROJ-12')
  assert.notStrictEqual(box.cli('s1', 'export', '--publish').status, 0)
})

test('commands print one short line and the next item, not the whole file', () => {
  const box = project()
  const started = box.cli('s1', 'start', '--plan', box.plan([item('T1'), item('T2', { needs: ['T1'] })]))
  fs.writeFileSync(path.join(box.dir, 'T1.txt'), 'x')
  for (const output of [started.stdout, box.cli('s1', 'begin', 'T1').stdout, box.cli('s1', 'done', 'T1').stdout, box.cli('s1', 'verify', 'T1').stdout]) {
    assert.ok(output.length < 400, output)
    assert.doesNotMatch(output, /## Items/)
  }
  assert.match(box.cli('s1', 'status').stdout, /Next: T2/)
  assert.match(box.cli('s1', 'show').stdout, /## Items/)
})

test('a plan may write the check as a command string and omit observe', () => {
  const box = project()
  const plan = box.plan([{ title: 'Deliver T1', do: 'Do T1', accept: 'T1.txt exists', check: 'test -f T1.txt' }])
  assert.strictEqual(box.cli('s1', 'start', '--plan', plan).status, 0)
  const entry = box.activity('s1').items[0]
  assert.strictEqual(entry.check.kind, 'command')
  assert.strictEqual(entry.observe, 'test -f T1.txt')
})

test('files that a check writes to the evidence folder are attached, sealed and shown in the markdown', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { check: { kind: 'command', command: 'echo shot > "$ACTIVITY_EVIDENCE_DIR/desktop.png" && echo body > "$ACTIVITY_EVIDENCE_DIR/response.json"' } })]))
  assert.strictEqual(box.cli('s1', 'verify', 'T1').status, 0)
  const evidence = box.activity('s1').evidence.at(-1)!
  assert.strictEqual(evidence.files?.length, 2)
  assert.ok(evidence.files!.every((file) => fs.existsSync(path.join(box.folder('s1'), file))))
  assert.match(box.text('s1'), /!\[desktop\.png\]\(evidence\/T1-1\/desktop\.png\)/)
  assert.match(box.text('s1'), /\[response\.json\]\(evidence\/T1-1\/response\.json\)/)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 1\/1/)
  fs.writeFileSync(path.join(box.folder('s1'), evidence.files![0]), 'edited')
  assert.match(box.cli('s1', 'status').stdout, /Progress: 0\/1/)
})

test('approve attaches files to the evidence of a review item', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { check: { kind: 'review' } })]))
  const shot = path.join(box.dir, 'mobile.png')
  fs.writeFileSync(shot, 'png')
  assert.strictEqual(box.cli('s1', 'approve', 'T1', '--by', 'claude', '--note', 'looks right at 390px', '--attach', shot).status, 0)
  const evidence = box.activity('s1').evidence.at(-1)!
  assert.deepStrictEqual(evidence.files, ['evidence/T1-1/mobile.png'])
  assert.match(box.text('s1'), /!\[mobile\.png\]\(evidence\/T1-1\/mobile\.png\)/)
})

test('the user can reject a verified item, which reopens it and every item that depends on it', () => {
  const box = project()
  box.cli('s1', 'start', '--plan', box.plan([item('T1', { check: { kind: 'review' } }), item('T2', { needs: ['T1'] })]))
  fs.writeFileSync(path.join(box.dir, 'T2.txt'), 'x')
  box.cli('s1', 'approve', 'T1', '--by', 'claude', '--note', 'ok')
  assert.strictEqual(box.cli('s1', 'verify', 'T2').status, 0)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 2\/2/)
  assert.notStrictEqual(box.cli('s1', 'reopen', 'T1').status, 0)
  assert.strictEqual(box.cli('s1', 'reopen', 'T1', '--reason', 'the layout is not good', '--by', 'user', '--quote', 'ficou feio no celular').status, 0)
  const status = box.cli('s1', 'status').stdout
  assert.match(status, /Progress: 0\/2/)
  assert.match(status, /Next: T1/)
  assert.ok(box.activity('s1').history.some((entry) => /reopen T1/.test(entry.event) && /ficou feio/.test(entry.reason || '')))
  assert.strictEqual(box.cli('s1', 'approve', 'T1', '--by', 'claude', '--note', 'adjusted the layout').status, 0)
  const again = box.cli('s1', 'status').stdout
  assert.match(again, /Next: T2/)
  assert.match(again, /Stale: T2 \(a prerequisite was verified again/)
  assert.strictEqual(box.cli('s1', 'verify', 'T2').status, 0)
  assert.match(box.cli('s1', 'status').stdout, /Progress: 2\/2/)
})
