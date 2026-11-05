import { execFileSync, spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { writeFiles, type Task } from './task.ts'

const BENCH = import.meta.dirname
const CRAFT_ROOT = path.resolve(BENCH, '..')
const CELL_TIMEOUT_MS = 15 * 60_000
const CHECK_TIMEOUT_MS = 30_000
const TEST_PATH = /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[a-z]+$/
const MODELS: Record<string, string> = { haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5', opus: 'claude-opus-5-5' }
const UNATTENDED = 'You work unattended: nobody can answer a question or approve a plan. Make the decisions yourself, finish the change in this repo, and stop.'
const ALLOWED_TOOLS = 'Read,Edit,Write,Glob,Grep,Skill,TaskCreate,TaskUpdate,TaskList,Bash(node --test:*),Bash(npm test:*),Bash(git diff:*),Bash(git status:*),Bash(git rm:*)'
const WEB_TOOLS = ',WebSearch,WebFetch'
const SOURCE_PATH = /\.(ts|tsx|js|jsx|mjs|cjs|vue|css)$/
const FAILED_RUN = /\b[1-9]\d* (failed|failing)\b|^(#|\u2139) fail [1-9]|^not ok \d+|^\u2716 /m
let allowedTools = ALLOWED_TOOLS
const USAGE_LIMIT = /hit your .*limit|usage limit|rate limit/i
let stopped = ''
function latestPlugin(name: string): string {
  const base = path.join(os.homedir(), '.claude', 'plugins', 'cache', name, name)
  const versions = fs.existsSync(base) ? fs.readdirSync(base).sort() : []
  return process.env[`${name.toUpperCase()}_PLUGIN_DIR`] || (versions.length ? path.join(base, versions.at(-1)!) : '')
}
function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`set ${name} to a craft checkout`)
  return value
}
const ARMS: Record<string, () => string[]> = {
  baseline: () => [],
  craft: () => ['--plugin-dir', process.env.CRAFT_PLUGIN_DIR || CRAFT_ROOT],
  'craft-head': () => ['--plugin-dir', required('CRAFT_HEAD_DIR')],
  'craft-lean': () => ['--plugin-dir', required('CRAFT_LEAN_DIR')],
  ponytail: () => {
    const dir = latestPlugin('ponytail')
    if (!dir) throw new Error('ponytail is not in ~/.claude/plugins/cache; set PONYTAIL_PLUGIN_DIR')
    return ['--plugin-dir', dir]
  },
}

type Cell = { task: string, arm: string, run: number, model: string }
type Result = Cell & {
  passed: boolean
  failures: string[]
  srcAdded: number
  srcDeleted: number
  testAdded: number
  costUsd: number
  outputTokens: number
  durationMs: number
  turns: number
  tools: string[]
  testFirst: boolean
  redRun: boolean
  error?: string
}

async function loadTasks(): Promise<Task[]> {
  const files = fs.readdirSync(path.join(BENCH, 'tasks')).filter((file) => file.endsWith('.ts')).sort()
  return Promise.all(files.map(async (file) => (await import(path.join(BENCH, 'tasks', file))).default as Task))
}

function git(dir: string, ...args: string[]): string {
  return execFileSync('git', ['-c', 'user.name=bench', '-c', 'user.email=bench@example.com', ...args], { cwd: dir, encoding: 'utf8' })
}

function seedWorkspace(task: Task, overlay: Task['seed'] = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `craft-bench-${task.id}-`))
  writeFiles(dir, task.seed)
  git(dir, 'init', '-q')
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', 'seed')
  writeFiles(dir, overlay)
  return dir
}

function runCheck(task: Task, dir: string): string[] {
  const result = spawnSync('node', [path.join(BENCH, 'check.ts'), task.id, dir], { encoding: 'utf8', timeout: CHECK_TIMEOUT_MS })
  if (result.status !== 0) return [`check crashed: ${(result.stderr || result.error?.message || '').trim().split('\n').slice(-3).join(' ')}`]
  return JSON.parse(result.stdout)
}

function diffLines(dir: string) {
  git(dir, 'add', '-A')
  const lines = git(dir, 'diff', '--cached', '--numstat', 'HEAD').trim().split('\n').filter(Boolean)
  const totals = { srcAdded: 0, srcDeleted: 0, testAdded: 0 }
  for (const line of lines) {
    const [added, deleted, file] = line.split('\t')
    if (TEST_PATH.test(file)) totals.testAdded += Number(added) || 0
    else if (!file.endsWith('.json') && !file.endsWith('.md')) {
      totals.srcAdded += Number(added) || 0
      totals.srcDeleted += Number(deleted) || 0
    }
  }
  return totals
}

function runClaude(cell: Cell, task: Task, dir: string, logDir: string): Promise<Record<string, any>> {
  const args = ['-p', `${task.prompt}\n\n${UNATTENDED}`, '--output-format', 'stream-json', '--verbose', '--model', MODELS[cell.model] ?? cell.model,
    '--setting-sources', 'project,local', '--strict-mcp-config', '--permission-mode', 'acceptEdits', '--allowedTools', allowedTools, ...ARMS[cell.arm]()]
  const env = { ...process.env, CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1', CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1', HOOK_CASES_LOG: path.join(logDir, 'hook-cases.jsonl') }
  return new Promise((resolve) => {
    const child = spawn('claude', args, { cwd: dir, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => (stdout += chunk))
    child.stderr.on('data', (chunk) => (stderr += chunk))
    const timer = setTimeout(() => process.kill(-child.pid!, 'SIGKILL'), CELL_TIMEOUT_MS)
    child.on('close', () => {
      clearTimeout(timer)
      fs.writeFileSync(path.join(logDir, 'transcript.jsonl'), stdout || stderr)
      const events = stdout.split('\n').filter(Boolean).map((line) => { try { return JSON.parse(line) } catch { return {} } })
      const result = events.find((event) => event.type === 'result')
      const tools = events.filter((event) => event.type === 'assistant').flatMap((event) => event.message?.content ?? []).filter((block: any) => block.type === 'tool_use')
      const order = testOrder(events, dir)
      resolve(result ? { ...result, ...order, tools: tools.map((block: any) => block.name === 'Skill' ? `Skill:${block.input?.skill}` : block.name) } : { is_error: true, result: `no result event: ${stderr.slice(-500)}` })
    })
  })
}

function testOrder(events: Record<string, any>[], dir: string) {
  const outputs = new Map<string, { failed: boolean }>()
  for (const event of events.filter((item) => item.type === 'user')) {
    for (const block of event.message?.content ?? []) {
      if (block.type === 'tool_result') outputs.set(block.tool_use_id, { failed: Boolean(block.is_error) || FAILED_RUN.test(JSON.stringify(block.content)) })
    }
  }
  let testEdit = -1
  let sourceEdit = -1
  let redRun = false
  const blocks = events.filter((event) => event.type === 'assistant').flatMap((event) => event.message?.content ?? []).filter((block: any) => block.type === 'tool_use')
  blocks.forEach((block: any, index: number) => {
    const file = path.relative(dir, path.resolve(dir, block.input?.file_path || ''))
    if (/^(Edit|MultiEdit|Write)$/.test(block.name) && TEST_PATH.test(file) && testEdit < 0) testEdit = index
    else if (/^(Edit|MultiEdit|Write)$/.test(block.name) && SOURCE_PATH.test(file) && !TEST_PATH.test(file) && sourceEdit < 0) sourceEdit = index
    const runsTests = block.name === 'Bash' && /--test|\btest\b/.test(block.input?.command || '')
    if (runsTests && testEdit >= 0 && sourceEdit < 0 && outputs.get(block.id)?.failed) redRun = true
  })
  return { testFirst: testEdit >= 0 && (sourceEdit < 0 || testEdit < sourceEdit), redRun }
}

async function runCell(cell: Cell, task: Task, stampDir: string): Promise<Result> {
  if (stopped) return { ...cell, passed: false, failures: [], srcAdded: 0, srcDeleted: 0, testAdded: 0, costUsd: 0, outputTokens: 0, durationMs: 0, turns: 0, tools: [], testFirst: false, redRun: false, error: `not run: ${stopped}` }
  const logDir = path.join(stampDir, cell.task, `${cell.arm}-${cell.run}`)
  fs.mkdirSync(logDir, { recursive: true })
  const dir = seedWorkspace(task)
  const output = await runClaude(cell, task, dir, logDir)
  if (output.is_error && USAGE_LIMIT.test(String(output.result))) {
    stopped = String(output.result).slice(0, 120)
    fs.rmSync(dir, { recursive: true, force: true })
    fs.rmSync(logDir, { recursive: true, force: true })
    console.log(`STOP ${cell.task} ${cell.arm}#${cell.run}: ${stopped}`)
    return { ...cell, passed: false, failures: [], srcAdded: 0, srcDeleted: 0, testAdded: 0, costUsd: 0, outputTokens: 0, durationMs: 0, turns: 0, tools: [], testFirst: false, redRun: false, error: `not run: ${stopped}` }
  }
  const failures = runCheck(task, dir)
  const result: Result = {
    ...cell,
    passed: failures.length === 0,
    failures,
    ...diffLines(dir),
    costUsd: output.total_cost_usd ?? 0,
    outputTokens: output.usage?.output_tokens ?? 0,
    durationMs: output.duration_ms ?? 0,
    turns: output.num_turns ?? 0,
    tools: output.tools ?? [],
    testFirst: output.testFirst ?? false,
    redRun: output.redRun ?? false,
    error: output.is_error ? String(output.result).slice(0, 300) : undefined,
  }
  fs.writeFileSync(path.join(logDir, 'diff.patch'), git(dir, 'diff', '--cached', 'HEAD'))
  fs.writeFileSync(path.join(logDir, 'cell.json'), JSON.stringify(result, null, 2))
  fs.cpSync(dir, path.join(logDir, 'workspace'), { recursive: true, filter: (source) => !source.includes(`${path.sep}.git`) })
  fs.rmSync(dir, { recursive: true, force: true })
  console.log(`${result.passed ? 'PASS' : 'FAIL'} ${cell.task} ${cell.arm}#${cell.run} src +${result.srcAdded}/-${result.srcDeleted} test +${result.testAdded} $${result.costUsd.toFixed(3)} ${Math.round(result.durationMs / 1000)}s${result.error ? ` ERROR ${result.error}` : ''}`)
  return result
}

async function pool<T, R>(items: T[], workers: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  let next = 0
  await Promise.all(Array.from({ length: Math.min(workers, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await work(items[index])
    }
  }))
  return results
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)
const percent = (value: number, base: number) => (base ? `${value >= base ? '+' : ''}${Math.round(((value - base) / base) * 100)}%` : 'n/a')

function totalsTable(results: Result[], arms: string[]): string[] {
  const totals = arms.map((arm) => {
    const cells = results.filter((result) => result.arm === arm)
    return {
      arm,
      passed: cells.filter((cell) => cell.passed).length,
      cells: cells.length,
      src: sum(cells.map((cell) => cell.srcAdded + cell.srcDeleted)),
      wroteTest: cells.filter((cell) => cell.testAdded > 0).length,
      tokens: sum(cells.map((cell) => cell.outputTokens)),
      cost: sum(cells.map((cell) => cell.costUsd)),
      time: sum(cells.map((cell) => cell.durationMs)),
      turns: median(cells.map((cell) => cell.turns)),
      testFirst: cells.filter((cell) => cell.testFirst).length,
      redRun: cells.filter((cell) => cell.redRun).length,
    }
  })
  const base = totals.find((total) => total.arm === 'baseline')
  const lines = ['| arm | hidden checks passed | source lines changed | wrote a test | test before code | red run | output tokens | cost (USD) | time | median turns |',
    '|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|']
  for (const total of totals) {
    const versus = (value: number, key: 'src' | 'tokens' | 'cost' | 'time') => (base && total.arm !== 'baseline' ? ` (${percent(value, base[key])})` : '')
    lines.push(`| ${total.arm} | ${total.passed}/${total.cells} | ${total.src}${versus(total.src, 'src')} | ${total.wroteTest}/${total.cells} | ${total.testFirst}/${total.cells} | ${total.redRun}/${total.cells} | ${total.tokens}${versus(total.tokens, 'tokens')} | ${total.cost.toFixed(2)}${versus(total.cost, 'cost')} | ${Math.round(total.time / 1000)}s${versus(total.time, 'time')} | ${total.turns} |`)
  }
  return lines
}

function report(all: Result[], tasks: Task[], meta: string): string {
  const results = all.filter((result) => !result.error?.startsWith('not run'))
  const notRun = all.length - results.length
  const arms = [...new Set(results.map((result) => result.arm))]
  const byArm = (arm: string) => results.filter((result) => result.arm === arm)
  const heldOut = new Set(tasks.filter((task) => task.heldOut).map((task) => task.id))
  const lines = [`# Craft benchmark ${meta}`, '', ...(notRun ? [`${notRun} cells did not run (usage limit) and are left out.`, ''] : []), '## Totals', '', ...totalsTable(results, arms)]
  if (heldOut.size && results.some((result) => heldOut.has(result.task))) {
    lines.push('', '## Held-out tasks', '', 'No craft change was tuned on these tasks.', '', ...totalsTable(results.filter((result) => heldOut.has(result.task)), arms))
  }
  lines.push('', '## Per task', '', `| task | ${arms.map((arm) => `${arm}: checks, src lines, test lines, cost`).join(' | ')} |`, `|---|${arms.map(() => '---').join('|')}|`)
  for (const task of tasks) {
    const cells = arms.map((arm) => byArm(arm).filter((cell) => cell.task === task.id))
    if (!cells.some((list) => list.length)) continue
    lines.push(`| ${task.id} | ${cells.map((list) => `${list.filter((cell) => cell.passed).length}/${list.length}, ${median(list.map((cell) => cell.srcAdded + cell.srcDeleted))}, ${median(list.map((cell) => cell.testAdded))}, ${sum(list.map((cell) => cell.costUsd)).toFixed(2)}`).join(' | ')} |`)
  }
  const failed = results.filter((result) => !result.passed)
  if (failed.length) {
    lines.push('', '## Failed checks', '')
    for (const result of failed) lines.push(`- ${result.task} ${result.arm}#${result.run}: ${result.failures.join('; ') || result.error}`)
  }
  return `${lines.join('\n')}\n`
}

function compare(stampDir: string, tasks: Task[]) {
  const outDir = path.join(stampDir, 'compare')
  fs.mkdirSync(outDir, { recursive: true })
  for (const task of tasks) {
    const taskDir = path.join(stampDir, task.id)
    if (!fs.existsSync(taskDir)) continue
    const cells = fs.readdirSync(taskDir).sort()
    const sections = [`# ${task.id}`, '', `**Ticket**: ${task.prompt}`, '', `**Hidden check**: ${task.summary}`, '']
    for (const cellName of cells) {
      const cellFile = path.join(taskDir, cellName, 'cell.json')
      if (!fs.existsSync(cellFile)) continue
      const cell = JSON.parse(fs.readFileSync(cellFile, 'utf8')) as Result
      const diff = fs.readFileSync(path.join(taskDir, cellName, 'diff.patch'), 'utf8')
      sections.push(`## ${cellName}`, '',
        `- hidden check: ${cell.passed ? 'passed' : `failed (${cell.failures.join('; ')})`}`,
        `- source lines: +${cell.srcAdded} / -${cell.srcDeleted}, test lines: +${cell.testAdded}`,
        `- cost: $${cell.costUsd.toFixed(3)}, output tokens: ${cell.outputTokens}, time: ${Math.round(cell.durationMs / 1000)}s, turns: ${cell.turns}`,
        ...(cell.tools?.length ? [`- tools: ${cell.tools.join(', ')}`] : []),
        '', '```diff', diff.trimEnd(), '```', '')
    }
    fs.writeFileSync(path.join(outDir, `${task.id}.md`), sections.join('\n'))
  }
  return outDir
}

async function selftest(tasks: Task[]) {
  let broken = 0
  for (const task of tasks) {
    const problems: string[] = []
    const seeded = seedWorkspace(task)
    if (spawnSync('node', ['--test', 'tests/'], { cwd: seeded }).status !== 0) problems.push('the seed tests fail')
    if (!runCheck(task, seeded).length) problems.push('the seed already passes the check')
    const good = seedWorkspace(task, task.good)
    const goodFailures = runCheck(task, good)
    if (goodFailures.length) problems.push(`the good reference fails: ${goodFailures.join('; ')}`)
    if (spawnSync('node', ['--test', 'tests/'], { cwd: good }).status !== 0) problems.push('the seed tests fail on the good reference')
    if (!runCheck(task, seedWorkspace(task, task.bad)).length) problems.push('the bad reference passes the check')
    console.log(`${problems.length ? 'BROKEN' : 'ok    '} ${task.id}${problems.length ? `: ${problems.join(' | ')}` : ''}`)
    broken += problems.length ? 1 : 0
  }
  process.exit(broken ? 1 : 0)
}

const { values } = parseArgs({
  options: {
    selftest: { type: 'boolean' },
    task: { type: 'string' },
    arms: { type: 'string', default: 'baseline,craft' },
    model: { type: 'string', default: 'sonnet' },
    runs: { type: 'string', default: '1' },
    workers: { type: 'string', default: '4' },
    report: { type: 'string' },
    compare: { type: 'string' },
    web: { type: 'boolean' },
  },
})

if (values.web) allowedTools += WEB_TOOLS
const allTasks = await loadTasks()
const tasks = values.task ? allTasks.filter((task) => values.task!.split(',').includes(task.id)) : allTasks

if (values.selftest) await selftest(tasks)

if (values.compare) {
  console.log(compare(path.resolve(values.compare), allTasks))
  process.exit(0)
}

if (values.report) {
  const stampDir = path.resolve(values.report)
  const results = (fs.readdirSync(stampDir, { recursive: true }) as string[]).filter((file) => file.endsWith('cell.json') && !file.includes('workspace'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(stampDir, file), 'utf8')) as Result)
  process.stdout.write(report(results, allTasks, path.basename(stampDir)))
  process.exit(0)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const stampDir = path.join(BENCH, 'runs', stamp)
const cells: Cell[] = []
for (let run = 1; run <= Number(values.runs); run++) {
  for (const task of tasks) for (const arm of values.arms!.split(',')) cells.push({ task: task.id, arm, run, model: values.model! })
}
const byId = new Map(tasks.map((task) => [task.id, task]))
const results = await pool(cells, Number(values.workers), (cell) => runCell(cell, byId.get(cell.task)!, stampDir))
const markdown = report(results, tasks, `${stamp} (${values.model}, ${values.runs} run per cell${values.web ? ', web tools on' : ''})`)
fs.mkdirSync(path.join(BENCH, 'results'), { recursive: true })
fs.writeFileSync(path.join(BENCH, 'results', `${stamp}.md`), markdown)
fs.writeFileSync(path.join(stampDir, 'results.md'), markdown)
compare(stampDir, tasks)
process.stdout.write(markdown)
