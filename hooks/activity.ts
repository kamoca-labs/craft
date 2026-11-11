import { spawnSync } from 'node:child_process'
import { createHash, createHmac, randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export type Check = { kind: 'command' | 'review' | 'human', command?: string, expect?: string, exit?: number, timeoutSec?: number }
export type Item = {
  id: string
  title: string
  do: string
  needs: string[]
  observe: string
  accept: string
  check: Check
  watch?: string[]
  required?: boolean
  state?: 'in_progress' | 'implemented'
  blocked?: string
  file?: string
  detail?: boolean
}
export type Outcome = 'pass' | 'approved' | 'fail' | 'rejected' | 'error'
export type Evidence = { item: string, outcome: Outcome, signature: string, fingerprint: string, at: string, file: string, files?: string[], by?: string, quote?: string, seal: string }
export type Reason = 'blocked' | 'awaiting-human' | 'attempt-limit' | 'no-progress' | 'verifier-error'
export type Activity = {
  id: string
  goal: string
  session: string
  status: 'active' | 'complete' | 'incomplete'
  reason?: Reason
  stops: number
  maxStops: number
  total: number
  maxTotal: number
  noProgress: number
  evidenceSeen: number
  resumes: number
  lastSignature: string
  items: Item[]
  evidence: Evidence[]
  history: { at: string, event: string, reason?: string }[]
  links: Record<string, string>
  notes: string
}
export type ItemState = 'verified' | 'blocked' | 'implemented' | 'in_progress' | 'pending'
export type View = { item: Item, state: ItemState, stale?: string, last?: Evidence, errors: number, waitingHuman: boolean }

export const DEFAULT_MAX_STOPS = 8
export const DEFAULT_MAX_TOTAL = 40
export const VERIFIER_ERROR_LIMIT = 2
export const CLI_PATH = path.join(import.meta.dirname, '..', 'scripts', 'activity.ts')
const KINDS = ['command', 'review', 'human']
const SKIPPED = new Set(['.git', 'node_modules'])

export const projectRoot = (cwd?: string) => process.env.CLAUDE_PROJECT_DIR || cwd || process.cwd()
export const localDir = (root: string) => path.join(root, '.claude', 'local')
export const activitiesDir = (root: string) => path.join(localDir(root), 'activities')
const sha = (text: string | Buffer) => createHash('sha256').update(text).digest('hex')
const now = () => new Date().toISOString()
export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'activity'
const escape = (text: string) => text.replaceAll('\\', '\\\\').replaceAll('\n', '\\n')
const unescape = (text: string) => text.replace(/\\(n|\\)/g, (_, char) => (char === 'n' ? '\n' : '\\'))

const canonicalCheck = (check: Check): Check => ({ kind: check?.kind, command: check?.command?.trim(), expect: check?.expect, exit: check?.exit ?? 0, timeoutSec: check?.timeoutSec })

export function normalizeItems(raw: Partial<Item>[]): Item[] {
  const used = raw.map((item) => Number(/^T(\d+)$/.exec(item.id || '')?.[1] || 0))
  let next = Math.max(0, ...used)
  return raw.map((item) => {
    const given = (item as { check?: Check | string }).check
    const check = typeof given === 'string' ? ({ kind: 'command', command: given } as Check) : (given as Check)
    return {
      ...(item as Item),
      id: item.id || `T${++next}`,
      title: String(item.title || '').trim(),
      do: String(item.do || '').trim(),
      observe: String(item.observe || check?.command || '').trim(),
      accept: String(item.accept || '').trim(),
      needs: item.needs || [],
      check: canonicalCheck(check),
    }
  })
}

export function validatePlan(items: Item[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of items) {
    if (ids.has(item.id)) errors.push(`duplicate id ${item.id}`)
    ids.add(item.id)
    for (const field of ['title', 'do', 'observe', 'accept'] as const) if (!String(item[field] || '').trim()) errors.push(`item ${item.id}: ${field} is empty`)
    if (!KINDS.includes(item.check?.kind)) errors.push(`item ${item.id}: check.kind must be one of ${KINDS.join(', ')}`)
    else if (item.check.kind === 'command' && !item.check.command?.trim()) errors.push(`item ${item.id}: a command check needs a command`)
  }
  const position = new Map(items.map((item, index) => [item.id, index]))
  for (const item of items) {
    for (const need of item.needs) {
      if (!position.has(need)) errors.push(`${item.id} needs unknown item ${need}`)
      else if (need === item.id) errors.push(`${item.id} needs itself`)
      else if (position.get(need)! > position.get(item.id)!) errors.push(`${item.id} needs ${need}, which is later in the order. Move ${need} before ${item.id}`)
    }
  }
  const cycle = findCycle(items)
  if (cycle) errors.push(cycleError(cycle))
  return errors
}

const cycleError = (cycle: string[]) => `dependency cycle: ${cycle.join(' -> ')}. Fix it: extract a shared contract item, split the items into smaller deliveries, or merge them into one item that is verified as a unit`

function findCycle(items: Item[]): string[] | null {
  const needs = new Map(items.map((item) => [item.id, item.needs.filter((need) => need !== item.id)]))
  const state = new Map<string, 1 | 2>()
  const stack: string[] = []
  const visit = (id: string): string[] | null => {
    if (state.get(id) === 2 || !needs.has(id)) return null
    if (state.get(id) === 1) return [...stack.slice(stack.indexOf(id)), id]
    state.set(id, 1)
    stack.push(id)
    for (const need of needs.get(id)!) {
      const found = visit(need)
      if (found) return found
    }
    stack.pop()
    state.set(id, 2)
    return null
  }
  for (const item of items) {
    const found = visit(item.id)
    if (found) return found.reverse()
  }
  return null
}

// A stable topological sort: the written order is kept, and an item waits until what it needs is placed.
export function orderItems(items: Item[]): { items: Item[], errors: string[] } {
  const ids = new Set(items.map((item) => item.id))
  const errors = items.flatMap((item) => item.needs.filter((need) => !ids.has(need)).map((need) => `${item.id} needs unknown item ${need}`))
  const cycle = findCycle(items)
  if (cycle) errors.push(cycleError(cycle))
  if (errors.length) return { items, errors }
  const placed = new Set<string>()
  const ordered: Item[] = []
  const rest = [...items]
  while (rest.length) {
    const index = rest.findIndex((item) => item.needs.every((need) => placed.has(need) || need === item.id))
    const [item] = rest.splice(index, 1)
    placed.add(item.id)
    ordered.push(item)
  }
  return { items: ordered, errors }
}

export const signature = (item: Item) => sha(JSON.stringify([item.id, item.observe, item.accept, canonicalCheck(item.check)])).slice(0, 16)

export function fingerprint(root: string, watch?: string[]): string {
  if (!watch?.length) return ''
  const parts: string[] = []
  const walk = (absolute: string, relative: string) => {
    const stat = fs.statSync(absolute, { throwIfNoEntry: false })
    if (!stat) return parts.push(`${relative}:absent`)
    if (stat.isFile()) return parts.push(`${relative}:${sha(fs.readFileSync(absolute))}`)
    for (const name of fs.readdirSync(absolute).sort()) {
      if (SKIPPED.has(name) || (relative === '.claude' && name === 'local')) continue
      walk(path.join(absolute, name), path.posix.join(relative, name))
    }
  }
  for (const entry of [...watch].sort()) walk(path.resolve(root, entry), entry)
  return sha(parts.join('\n'))
}

const keyFile = (dir: string) => path.join(path.dirname(path.dirname(dir)), '.seal')
const readKey = (dir: string) => {
  try {
    return fs.readFileSync(keyFile(dir), 'utf8')
  } catch {
    return ''
  }
}
const seal = (key: string, dir: string, evidence: Omit<Evidence, 'seal'>) => {
  const output = path.join(dir, evidence.file)
  const outputHash = fs.existsSync(output) ? sha(fs.readFileSync(output)) : ''
  const filesHash = (evidence.files || []).map((name) => (fs.existsSync(path.join(dir, name)) ? sha(fs.readFileSync(path.join(dir, name))) : 'missing')).join(',')
  return createHmac('sha256', key).update([evidence.item, evidence.outcome, evidence.signature, evidence.fingerprint, evidence.at, outputHash, filesHash].join('|')).digest('hex')
}
const sealValid = (dir: string, evidence: Evidence) => Boolean(readKey(dir)) && evidence.seal === seal(readKey(dir), dir, evidence)

export function derive(activity: Activity, root: string, dir: string): View[] {
  const views: View[] = activity.items.map((item) => {
    const mine = activity.evidence.filter((evidence) => evidence.item === item.id && sealValid(dir, evidence))
    const last = mine.at(-1)
    const current = last?.signature === signature(item)
    let state: ItemState = item.blocked ? 'blocked' : item.state || 'pending'
    let stale: string | undefined
    if (last && !current) stale = 'the criterion or the check changed after the evidence'
    if (last && current && (last.outcome === 'pass' || last.outcome === 'approved')) {
      if (last.fingerprint === fingerprint(root, item.watch)) state = 'verified'
      else {
        stale = 'watched files changed after the evidence'
        state = item.blocked ? 'blocked' : 'implemented'
      }
    }
    let errors = 0
    for (const evidence of [...mine].reverse()) {
      if (evidence.signature !== signature(item) || evidence.outcome !== 'error') break
      errors++
    }
    return { item, state, stale, last: current ? last : undefined, errors, waitingHuman: false }
  })
  const verifiedAt = new Map<string, string>()
  for (const view of views) {
    if (view.state === 'verified') {
      const notVerified = view.item.needs.some((need) => !verifiedAt.has(need))
      const older = view.item.needs.some((need) => (verifiedAt.get(need) || '') > (view.last?.at || ''))
      if (notVerified || older) {
        view.state = 'implemented'
        view.stale = notVerified ? 'a prerequisite is not verified' : 'a prerequisite was verified again after this evidence'
      }
    }
    if (view.state === 'verified') verifiedAt.set(view.item.id, view.last?.at || '')
    view.waitingHuman = view.state === 'implemented' && view.item.check.kind === 'human'
  }
  return views
}

const isRequired = (view: View) => view.item.required !== false
export const progress = (views: View[]) => ({ done: views.filter((view) => isRequired(view) && view.state === 'verified').length, total: views.filter(isRequired).length })
export const isComplete = (views: View[]) => progress(views).done === progress(views).total

export function actionable(views: View[]): View[] {
  const verified = new Set(views.filter((view) => view.state === 'verified').map((view) => view.item.id))
  return views.filter((view) => view.state !== 'verified' && view.state !== 'blocked' && !view.waitingHuman && view.item.needs.every((need) => verified.has(need)))
}

// The only items a command may touch: the next line, or a human approval that waits on it.
export function workable(views: View[]): string[] {
  const verified = new Set(views.filter((view) => view.state === 'verified').map((view) => view.item.id))
  const next = actionable(views)[0]
  const waiting = views.filter((view) => view.waitingHuman && view.item.needs.every((need) => verified.has(need)))
  return [...(next ? [next.item.id] : []), ...waiting.map((view) => view.item.id)]
}

const field = (key: string, value: string | undefined) => (value ? [`- ${key}: ${escape(value)}`] : [])
export const evidenceFolder = (item: Item) => (item.file ? item.file.replace(/\.md$/, '') : 'evidence')

function itemFields(item: Item, links: Record<string, string>, evidence: Evidence[], view?: View): string[] {
  const check = canonicalCheck(item.check)
  return [
    `- State: ${item.state || 'pending'}`,
    `- Needs: ${item.needs.join(', ') || 'none'}`,
    `- Do: ${escape(item.do)}`,
    `- Observe: ${escape(item.observe)}`,
    `- Accept: ${escape(item.accept)}`,
    `- Check: ${check.kind}`,
    ...field('Command', check.command),
    ...field('Expect', check.expect),
    `- Exit: ${check.exit}`,
    ...(check.timeoutSec ? [`- Timeout: ${check.timeoutSec}`] : []),
    ...(item.watch?.length ? [`- Watch: ${item.watch.join(', ')}`] : []),
    `- Required: ${item.required === false ? 'no' : 'yes'}`,
    ...field('Blocked', item.blocked),
    ...field('Card', links[item.id]),
    ...(view?.stale ? [`- Stale: ${view.stale}`] : []),
    ...(view?.last ? [`- Evidence: ${view.last.outcome} at ${view.last.at}, ${view.last.file}${view.last.by ? `, by ${view.last.by}` : ''}`] : []),
    ...(view?.last?.files?.length ? [`- Files: ${view.last.files.map((name) => `${/\.(png|jpe?g|gif|webp)$/i.test(name) ? '!' : ''}[${path.posix.basename(name)}](${name})`).join(' ')}`] : []),
    ...evidence.map((entry) => `<!-- evidence ${JSON.stringify(entry)} -->`),
  ]
}

function summary(activity: Activity, views: View[]) {
  const { done, total } = progress(views)
  const next = actionable(views)[0]
  const open = views.filter((view) => view.state !== 'verified')
  const skipped = next ? open.slice(0, open.indexOf(next)) : []
  const blocked = views.filter((view) => view.state === 'blocked' || view.waitingHuman)
  const nextLine = next ? `${next.item.id} ${next.item.title}${skipped.length ? ` (skips ${skipped.map((view) => view.item.id).join(', ')}: ${skipped.map((view) => view.item.blocked || 'waits for a human approval').join('; ')})` : ''}` : activity.status === 'complete' ? 'none, complete' : 'none'
  const blockedLine = blocked.length ? blocked.map((view) => `${view.item.id} (${view.item.blocked || 'waits for a human approval'})`).join('; ') : 'none'
  return { done, total, next, nextLine, blockedLine, stale: views.filter((view) => view.stale) }
}

// The short text that every CLI command prints, so the session does not read the whole file again.
export function brief(activity: Activity, views: View[], long = false): string {
  const { done, total, nextLine, blockedLine, stale } = summary(activity, views)
  if (!long) return `Next: ${nextLine} | Progress: ${done}/${total} | Blocked: ${blockedLine}`
  return [`Status: ${activity.status}${activity.reason ? ` (${activity.reason})` : ''}`, `Next: ${nextLine}`, `Progress: ${done}/${total} required items verified`, `Blocked: ${blockedLine}`, ...stale.map((view) => `Stale: ${view.item.id} (${view.stale})`)].join('\n')
}

export function render(activity: Activity, views: View[]): { index: string, children: Record<string, string> } {
  const { done, total, next, nextLine, blockedLine } = summary(activity, views)
  const frontmatter = [
    `activity: ${activity.id}`,
    `goal: ${escape(activity.goal)}`,
    `session: ${activity.session}`,
    `status: ${activity.status}`,
    `reason: ${activity.reason || ''}`,
    `stops: ${activity.stops}`,
    `max_stops: ${activity.maxStops}`,
    `total: ${activity.total}`,
    `max_total: ${activity.maxTotal}`,
    `no_progress: ${activity.noProgress}`,
    `evidence_seen: ${activity.evidenceSeen}`,
    `resumes: ${activity.resumes}`,
    `last_signature: ${activity.lastSignature}`,
  ]
  const lines = [
    '---', ...frontmatter, '---',
    `# Activity: ${activity.goal}`,
    '',
    `Status: ${activity.status}${activity.reason ? ` (${activity.reason})` : ''}`,
    `Next: ${nextLine}`,
    `Progress: ${done}/${total} required items verified`,
    `Blocked: ${blockedLine}`,
    '',
    '## Sequence',
    '',
    ...views.map((view, index) => `- [${view.state === 'verified' ? 'x' : ' '}] ${index + 1}. ${view.item.id} ${view.item.title}${view.item === next?.item ? '  <- next' : ''}`),
    '',
    '## Items',
    '',
  ]
  const children: Record<string, string> = {}
  views.forEach((view, index) => {
    const { item } = view
    const mark = view.state === 'verified' ? 'x' : ' '
    const mine = activity.evidence.filter((entry) => entry.item === item.id)
    lines.push(`### [${mark}] ${index + 1}. ${item.id} ${item.title}`)
    if (item.file) {
      lines.push(`- File: ${item.file}`, '')
      children[item.file] = ['---', `item: ${item.id}`, `activity: ${activity.id}`, '---', `# ${item.id} ${item.title}`, '', `State: ${view.state}`, '', ...itemFields(item, activity.links, mine, view), ''].join('\n')
    } else lines.push(...itemFields(item, activity.links, mine, view), '')
  })
  lines.push('## Notes', '', activity.notes.trim(), '', '## History', '', ...activity.history.map((entry) => `- ${entry.at} ${entry.event}${entry.reason ? ` | ${entry.reason}` : ''}`), '')
  return { index: lines.join('\n'), children }
}

const frontmatterOf = (text: string): Record<string, string> => {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text)
  return Object.fromEntries((match?.[1] || '').split('\n').flatMap((line) => {
    const at = line.indexOf(': ')
    return at < 0 ? (line.endsWith(':') ? [[line.slice(0, -1), '']] : []) : [[line.slice(0, at), line.slice(at + 2)]]
  }))
}

function parseFields(lines: string[], item: Partial<Item>, links: Record<string, string>, evidence: Evidence[]) {
  const check: Partial<Check> = {}
  for (const line of lines) {
    const comment = /^<!-- evidence (\{.*\}) -->$/.exec(line)
    if (comment) {
      try {
        evidence.push(JSON.parse(comment[1]))
      } catch {}
      continue
    }
    const match = /^- ([A-Za-z]+): ?(.*)$/.exec(line)
    if (!match) continue
    const [, key, raw] = match
    const value = unescape(raw)
    if (key === 'State') item.state = value === 'in_progress' || value === 'implemented' ? value : undefined
    else if (key === 'Needs') item.needs = value === 'none' ? [] : value.split(',').map((need) => need.trim()).filter(Boolean)
    else if (key === 'Do') item.do = value
    else if (key === 'Observe') item.observe = value
    else if (key === 'Accept') item.accept = value
    else if (key === 'Check') check.kind = value as Check['kind']
    else if (key === 'Command') check.command = value
    else if (key === 'Expect') check.expect = value
    else if (key === 'Exit') check.exit = Number(value)
    else if (key === 'Timeout') check.timeoutSec = Number(value)
    else if (key === 'Watch') item.watch = value.split(',').map((entry) => entry.trim()).filter(Boolean)
    else if (key === 'Required') item.required = value !== 'no'
    else if (key === 'Blocked') item.blocked = value
    else if (key === 'Card' && item.id) links[item.id] = value
  }
  item.check = canonicalCheck(check as Check)
}

export function parse(dir: string, text: string): Activity {
  const meta = frontmatterOf(text)
  const sections = text.replace(/^---\n[\s\S]*?\n---\n/, '').split(/^## /m)
  const section = (name: string) => sections.find((part) => part.startsWith(`${name}\n`))?.slice(name.length + 1) || ''
  const links: Record<string, string> = {}
  const evidence: Evidence[] = []
  const items: Item[] = []
  for (const block of section('Items').split(/^### /m).slice(1)) {
    const [header, ...rest] = block.split('\n')
    const match = /^\[[ x]\] \d+\. (\S+) (.*)$/.exec(header)
    if (!match) continue
    const item: Partial<Item> = { id: match[1], title: match[2].trim() }
    const file = /^- File: (.+)$/m.exec(block)?.[1]
    let lines = rest
    if (file) {
      item.file = file
      lines = (fs.existsSync(path.join(dir, file)) ? fs.readFileSync(path.join(dir, file), 'utf8') : '').split('\n')
    }
    parseFields(lines, item, links, evidence)
    items.push({ needs: [], do: '', observe: '', accept: '', ...item } as Item)
  }
  const history = section('History').split('\n').flatMap((line) => {
    const entry = /^- (\S+) (.*?)(?: \| (.*))?$/.exec(line)
    return entry ? [{ at: entry[1], event: entry[2], ...(entry[3] ? { reason: entry[3] } : {}) }] : []
  })
  return {
    id: meta.activity || '',
    goal: unescape(meta.goal || ''),
    session: meta.session || '',
    status: (meta.status as Activity['status']) || 'active',
    reason: (meta.reason as Reason) || undefined,
    stops: Number(meta.stops || 0),
    maxStops: Number(meta.max_stops || DEFAULT_MAX_STOPS),
    total: Number(meta.total || 0),
    maxTotal: Number(meta.max_total || DEFAULT_MAX_TOTAL),
    noProgress: Number(meta.no_progress || 0),
    evidenceSeen: Number(meta.evidence_seen || 0),
    resumes: Number(meta.resumes || 0),
    lastSignature: meta.last_signature || '',
    items,
    evidence,
    history,
    links,
    notes: section('Notes').split(/\n## /)[0].trim(),
  }
}

export function locate(root: string, session: string): string | null {
  const base = activitiesDir(root)
  let entries: string[] = []
  try {
    entries = fs.readdirSync(base)
  } catch {
    return null
  }
  const found = entries.flatMap((name) => {
    const file = path.join(base, name, 'index.md')
    try {
      const meta = frontmatterOf(fs.readFileSync(file, 'utf8'))
      return meta.session === session ? [{ dir: path.join(base, name), active: meta.status === 'active', time: fs.statSync(file).mtimeMs }] : []
    } catch {
      return []
    }
  })
  found.sort((a, b) => Number(b.active) - Number(a.active) || b.time - a.time)
  return found[0]?.dir || null
}

export function load(root: string, session: string): { activity: Activity, dir: string } | null {
  const dir = locate(root, session)
  if (!dir) return null
  return { activity: parse(dir, fs.readFileSync(path.join(dir, 'index.md'), 'utf8')), dir }
}

export const readActivity = (root: string, session: string): Activity | null => load(root, session)?.activity ?? null

export function save(root: string, dir: string, activity: Activity) {
  const base = localDir(root)
  fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(path.join(base, '.gitignore'))) fs.writeFileSync(path.join(base, '.gitignore'), '*\n')
  if (!fs.existsSync(path.join(base, '.seal'))) fs.writeFileSync(path.join(base, '.seal'), randomBytes(32).toString('hex'), { mode: 0o600 })
  const { index, children } = render(activity, derive(activity, root, dir))
  for (const [file, content] of Object.entries(children)) {
    fs.mkdirSync(path.join(dir, evidenceFolder({ file } as Item)), { recursive: true })
    fs.writeFileSync(path.join(dir, file), content)
  }
  fs.writeFileSync(path.join(dir, 'index.md'), index)
}

export const makeId = (goal: string) => `${slugify(goal)}-${randomBytes(2).toString('hex')}`

export type Attempt = { count: number, abs: string, rel: string }

// One folder per attempt: the files that a check writes there, or that approve attaches, become sealed evidence.
export function prepareAttempt(dir: string, activity: Activity, item: Item): Attempt {
  const count = activity.evidence.filter((evidence) => evidence.item === item.id).length + 1
  const rel = path.posix.join(evidenceFolder(item), `${item.id}-${count}`)
  fs.mkdirSync(path.join(dir, rel), { recursive: true })
  return { count, abs: path.join(dir, rel), rel }
}

export function record(dir: string, activity: Activity, item: Item, root: string, outcome: Outcome, body: string, attempt: Attempt, extra: { by?: string, quote?: string, attach?: string[] } = {}): Evidence {
  const { attach = [], ...meta } = extra
  const file = `${attempt.rel}.txt`
  fs.writeFileSync(path.join(dir, file), body)
  for (const source of attach) fs.copyFileSync(source, path.join(attempt.abs, path.basename(source)))
  const files = fs.readdirSync(attempt.abs).sort().map((name) => path.posix.join(attempt.rel, name))
  if (!files.length) fs.rmdirSync(attempt.abs)
  const base = { item: item.id, outcome, signature: signature(item), fingerprint: fingerprint(root, item.watch), at: now(), file, ...(files.length ? { files } : {}), ...meta }
  const evidence = { ...base, seal: seal(readKey(dir), dir, base) }
  activity.evidence.push(evidence)
  return evidence
}

export function runCheck(root: string, check: Check, evidenceDir = ''): { outcome: Outcome, body: string } {
  const result = spawnSync('sh', ['-c', check.command || ''], { cwd: root, env: { ...process.env, ACTIVITY_EVIDENCE_DIR: evidenceDir }, encoding: 'utf8', timeout: (check.timeoutSec || 120) * 1000, maxBuffer: 10 * 1024 * 1024 })
  const output = `${result.stdout || ''}${result.stderr || ''}`
  const crashed = Boolean(result.error) || Boolean(result.signal) || result.status === 126 || result.status === 127
  const matched = !check.expect || new RegExp(check.expect).test(output)
  const outcome: Outcome = crashed ? 'error' : result.status === (check.exit ?? 0) && matched ? 'pass' : 'fail'
  const reason = crashed ? `verifier error: ${result.error?.message || result.signal || `exit ${result.status}`}` : `exit ${result.status}${matched ? '' : `, output does not match /${check.expect}/`}`
  return { outcome, body: `$ ${check.command}\n[${reason}]\n${output.slice(-20000)}` }
}

export const logEvent = (activity: Activity, event: string, reason?: string) => activity.history.push({ at: now(), event, ...(reason ? { reason } : {}) })

const REASONS: Record<Reason, string> = {
  blocked: 'every remaining item is blocked',
  'awaiting-human': 'the remaining items wait for a human approval',
  'attempt-limit': 'the stop limit was reached',
  'no-progress': 'there was no progress between two stops',
  'verifier-error': 'the verifier crashed more than once',
}

type GateOutput = { decision: 'block', reason: string } | { systemMessage: string } | null

const excerpt = (dir: string, evidence?: Evidence) => {
  try {
    return fs.readFileSync(path.join(dir, evidence?.file || ''), 'utf8').slice(-600).trim()
  } catch {
    return ''
  }
}

export function runGate(root: string, session: string, lastMessage: string): GateOutput {
  const found = load(root, session)
  if (!found || found.activity.status !== 'active') return null
  const { activity, dir } = found
  if (lastMessage.trim().endsWith('?')) return null
  const where = path.relative(root, dir)
  const cli = `node ${CLI_PATH} --session ${session} <command>`
  const cmd = (sub: string) => sub
  const finish = (output: GateOutput) => {
    save(root, dir, activity)
    return output
  }
  const errors = validatePlan(activity.items)
  if (errors.length) {
    activity.stops++
    activity.total++
    return finish({ decision: 'block', reason: `[craft:activity] The plan is invalid:\n- ${errors.join('\n- ')}\nFix it with \`${cmd('replan --plan <file> --reason <why>')}\` (the file is ${path.join(where, 'index.md')}), then continue.\nCLI: ${cli}` })
  }
  const views = derive(activity, root, dir)
  if (isComplete(views)) {
    const { done, total } = progress(views)
    activity.status = 'complete'
    delete activity.reason
    logEvent(activity, 'complete')
    const lines = views.filter((view) => view.state === 'verified').map((view) => `- ${view.item.id} ${view.item.title}: ${view.last?.outcome}, ${view.last?.file}`)
    return finish({ decision: 'block', reason: `[craft:activity] The activity is complete: every required item is verified. Present the result to the user. Start the reply with this line: ACTIVITY COMPLETE: ${activity.id}, ${done}/${total} verified. Then give the evidence (files in ${where}):\n${lines.join('\n')}` })
  }
  const stop = (reason: Reason): GateOutput => {
    activity.status = 'incomplete'
    activity.reason = reason
    logEvent(activity, `incomplete: ${reason}`)
    const pending = views.filter((view) => view.state !== 'verified' && isRequired(view))
    const lines = pending.map((view) => `- ${view.item.id} ${view.item.title}: ${view.item.blocked ? `blocked (${view.item.blocked})` : view.waitingHuman ? 'waits for a human approval' : view.state}`)
    const unblock = reason === 'awaiting-human' ? 'Get the human approval and record it with approve, then resume' : 'Remove the cause, then resume'
    return finish({ systemMessage: `[craft:activity] The activity is incomplete: ${REASONS[reason]}.\nPending:\n${lines.join('\n')}\nThe state is saved in ${path.join(where, 'index.md')}. ${unblock} with \`node ${CLI_PATH} resume --from ${session} --session <new session>\`.` })
  }
  const next = actionable(views)[0]
  if (!next) return stop(views.some((view) => view.waitingHuman) ? 'awaiting-human' : 'blocked')
  if (next.errors >= VERIFIER_ERROR_LIMIT) return stop('verifier-error')
  if (activity.evidence.length > activity.evidenceSeen) {
    activity.stops = 0
    activity.evidenceSeen = activity.evidence.length
  }
  if (activity.total >= activity.maxTotal || activity.stops >= activity.maxStops) return stop('attempt-limit')
  const sig = sha(JSON.stringify([next.item.id, views.map((view) => [view.state, view.last?.at]), activity.evidence.length]))
  activity.noProgress = sig === activity.lastSignature ? activity.noProgress + 1 : 0
  activity.lastSignature = sig
  if (activity.noProgress >= 2) return stop('no-progress')
  activity.stops++
  activity.total++
  const { item } = next
  const { done, total } = progress(views)
  const head = `[craft:activity] ${done}/${total} items verified. Next item: ${item.id} "${item.title}" (one item at a time, in the order of ${path.join(where, 'index.md')}).`
  const criteria = `Accept: ${item.accept}\nObserve: ${item.observe}`
  const redo = item.check.kind === 'command' ? `verify ${item.id}` : `approve ${item.id} --by claude --note <what you saw> [--attach <files>]`
  let todo: string
  if (next.errors > 0) todo = `The verifier crashed (a crash is not a failed criterion). Output:\n${excerpt(dir, next.last)}\nFix the check command with replan, or run \`${cmd(`verify ${item.id}`)}\` again.`
  else if (next.last && (next.last.outcome === 'fail' || next.last.outcome === 'rejected')) todo = `${item.id} was ${next.last.outcome === 'rejected' ? 'rejected' : 'failed its check'} (${next.last.file}):\n${excerpt(dir, next.last)}\nAdjust the work, then run \`${cmd(redo)}\`.`
  else if (next.state === 'implemented' && item.check.kind === 'command') todo = `${item.id} is implemented and has no valid evidence${next.stale ? ` (stale: ${next.stale})` : ''}. Run \`${cmd(`verify ${item.id}`)}\`.`
  else if (next.state === 'implemented') todo = `${item.id} is implemented. Collect the evidence (look at each capture once), then run \`${cmd(redo)}\`.`
  else todo = `Do: ${item.do}\nThen run \`${cmd(`done ${item.id}`)}\` and \`${cmd(redo)}\`.`
  return finish({ decision: 'block', reason: `${head}\n${criteria}\n${todo}\nCLI: ${cli}` })
}
