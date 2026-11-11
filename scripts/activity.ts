import fs from 'node:fs'
import path from 'node:path'
import {
  type Activity, type Item, actionable, activitiesDir, brief, prepareAttempt, DEFAULT_MAX_STOPS, DEFAULT_MAX_TOTAL, derive, load, logEvent, makeId, normalizeItems, orderItems,
  progress, projectRoot, record, runCheck, save, signature, slugify, validatePlan, workable,
} from '../hooks/activity.ts'

const USAGE = `usage: node scripts/activity.ts <command> [arguments] --session <id>
  start --plan <file> [--goal <text>] [--max-stops N] [--max-total N]   create the activity from a plan (json: goal, items)
  status | show                                                          the short state | the whole markdown (both rewrite the derived parts)
  begin|done <id>                                                        mark the next item in progress or implemented
  verify <id>                                                            run the check of the next item and record the evidence
  approve <id> --by user --quote <words> | --by claude|evaluator:<name> --note <what you saw> [--attach f1,f2] [--verdict fail]
  reopen <id> --reason <why> [--by user --quote <words>]               reject a verified item: it comes back as the next item
  block <id> --reason <why> | unblock <id>
  replan --plan <file> --reason <why>                                    change the plan, keep ids and valid evidence
  split <id>                                                             move an item to its own child file and folder
  resume [--from <old session>]                                          bind a stopped activity to this session
  link <id> <card ref> | export [--publish]                              cards (dry run only)
  goal-line                                                              the /goal condition for the user to type`

const args = process.argv.slice(2)
const positional: string[] = []
const flags: Record<string, string> = {}
for (let index = 0; index < args.length; index++) {
  if (!args[index].startsWith('--')) positional.push(args[index])
  else if (args[index + 1] === undefined || args[index + 1].startsWith('--')) flags[args[index].slice(2)] = 'true'
  else flags[args[index].slice(2)] = args[++index]
}
const [command, ...rest] = positional
const root = projectRoot()
const session = flags.session || process.env.CLAUDE_SESSION_ID || ''

function fail(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

const readPlan = (file: string | undefined): { goal?: string, items: Partial<Item>[] } => {
  if (!file) fail('--plan <file> is required')
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    return fail(`cannot read the plan ${file}: ${(error as Error).message}`)
  }
}

function open() {
  if (!session) fail('--session <id> is required')
  const found = load(root, session)
  if (!found) fail(`no activity for the session ${session}`)
  return found
}

function prepare(raw: Partial<Item>[]): Item[] {
  const items = normalizeItems(raw.map((item) => ({ ...item, needs: item.needs || [] })))
  const ordered = orderItems(items)
  if (ordered.errors.length) fail(`the plan is invalid:\n- ${ordered.errors.join('\n- ')}`)
  const errors = validatePlan(ordered.items)
  if (errors.length) fail(`the plan is invalid:\n- ${errors.join('\n- ')}`)
  return ordered.items.map((item) => (item.detail && !item.file ? { ...item, file: `${item.id}-${slugify(item.title)}.md` } : item))
}

function findItem(activity: Activity, id: string | undefined): Item {
  const item = activity.items.find((entry) => entry.id === id)
  return item || fail(`unknown item ${id}`)
}

function assertWorkable(activity: Activity, root: string, dir: string, id: string) {
  const views = derive(activity, root, dir)
  if (workable(views).includes(id)) return views
  const next = actionable(views)[0]
  return fail(next ? `${id} is not the next item. The next item is ${next.item.id}. Finish it first.` : `${id} cannot be worked on: there is no next item (the others are blocked or verified).`)
}

function print(activity: Activity, dir: string, head = '') {
  save(root, dir, activity)
  process.stdout.write(`${head}${brief(activity, derive(activity, root, dir))}\n`)
}

if (command === 'start') {
  if (!session) fail('--session <id> is required')
  const existing = load(root, session)
  if (existing?.activity.status === 'active') fail(`the session already has the active activity ${existing.activity.id}. Change it with replan.`)
  const plan = readPlan(flags.plan)
  const goal = (flags.goal || plan.goal || '').trim()
  if (!goal) fail('the plan needs a goal')
  const activity: Activity = {
    id: makeId(goal), goal, session, status: 'active', stops: 0, maxStops: Number(flags['max-stops'] || DEFAULT_MAX_STOPS), total: 0, maxTotal: Number(flags['max-total'] || DEFAULT_MAX_TOTAL),
    noProgress: 0, evidenceSeen: 0, resumes: 0, lastSignature: '', items: prepare(plan.items || []), evidence: [], history: [], links: {}, notes: '',
  }
  logEvent(activity, 'start')
  const dir = path.join(activitiesDir(root), activity.id)
  print(activity, dir, `Started ${activity.id} with ${activity.items.length} items. File: ${path.relative(root, path.join(dir, 'index.md'))}\n`)
} else if (command === 'status') {
  const { activity, dir } = open()
  save(root, dir, activity)
  process.stdout.write(`${brief(activity, derive(activity, root, dir), true)}\n`)
} else if (command === 'show') {
  const { activity, dir } = open()
  save(root, dir, activity)
  process.stdout.write(fs.readFileSync(path.join(dir, 'index.md'), 'utf8'))
} else if (command === 'begin' || command === 'done') {
  const { activity, dir } = open()
  const item = findItem(activity, rest[0])
  assertWorkable(activity, root, dir, item.id)
  item.state = command === 'begin' ? 'in_progress' : 'implemented'
  print(activity, dir)
} else if (command === 'verify') {
  const { activity, dir } = open()
  const item = findItem(activity, rest[0])
  if (item.check.kind !== 'command') fail(`${item.id} has a ${item.check.kind} check. Use approve.`)
  assertWorkable(activity, root, dir, item.id)
  const attempt = prepareAttempt(dir, activity, item)
  const result = runCheck(root, item.check, attempt.abs)
  const evidence = record(dir, activity, item, root, result.outcome, result.body, attempt)
  item.state = 'implemented'
  save(root, dir, activity)
  const files = evidence.files?.length ? `, ${evidence.files.length} files` : ''
  process.stdout.write(`${item.id}: ${result.outcome} (${evidence.file}${files})\n${result.outcome === 'pass' ? `${brief(activity, derive(activity, root, dir))}\n` : `${result.body.slice(-500)}\n`}`)
  process.exit(result.outcome === 'pass' ? 0 : 1)
} else if (command === 'approve') {
  const { activity, dir } = open()
  const item = findItem(activity, rest[0])
  const { by, quote, note } = flags
  if (item.check.kind === 'command') fail(`${item.id} has a command check. Use verify.`)
  if (!by) fail('--by is required')
  if (item.check.kind === 'human' && (by !== 'user' || !quote)) fail(`${item.id} needs the approval of the user: --by user --quote "<the words of the user>". Never approve it yourself.`)
  if (item.check.kind === 'review' && (by === 'user' || !note)) fail(`${item.id} needs the verdict of a separate evaluator: --by evaluator:<name> --note "<verdict>".`)
  const attach = (flags.attach || '').split(',').map((entry) => entry.trim()).filter(Boolean)
  for (const source of attach) if (!fs.existsSync(source)) fail(`cannot attach ${source}: the file does not exist`)
  assertWorkable(activity, root, dir, item.id)
  const outcome = flags.verdict === 'fail' ? 'rejected' : 'approved'
  const attempt = prepareAttempt(dir, activity, item)
  const evidence = record(dir, activity, item, root, outcome, `${outcome} by ${by}\n${quote ? `quote: ${quote}\n` : ''}${note ? `note: ${note}\n` : ''}`, attempt, { by, ...(quote ? { quote } : {}), attach })
  item.state = 'implemented'
  save(root, dir, activity)
  process.stdout.write(`${item.id}: ${outcome} (${evidence.file}${evidence.files?.length ? `, ${evidence.files.length} files` : ''})\n${brief(activity, derive(activity, root, dir))}\n`)
} else if (command === 'reopen') {
  const { activity, dir } = open()
  const item = findItem(activity, rest[0])
  const reason = (flags.reason || '').replace(/\s+/g, ' ').trim()
  if (!reason || reason === 'true') fail('--reason is required: say what is wrong')
  if (flags.by === 'user' && !flags.quote) fail('--by user needs --quote "<the words of the user>"')
  const who = flags.by === 'user' ? `user: "${(flags.quote || '').replace(/\s+/g, ' ').trim()}"` : 'claude'
  const attempt = prepareAttempt(dir, activity, item)
  record(dir, activity, item, root, 'rejected', `rejected by ${who}\nreason: ${reason}\n`, attempt, { by: flags.by || 'claude', ...(flags.quote ? { quote: flags.quote } : {}) })
  item.state = 'in_progress'
  delete item.blocked
  logEvent(activity, `reopen ${item.id}`, `${reason} (${who})`)
  if (activity.status !== 'active') {
    activity.status = 'active'
    delete activity.reason
    activity.stops = 0
    activity.noProgress = 0
  }
  print(activity, dir)
} else if (command === 'block') {
  const { activity, dir } = open()
  const item = findItem(activity, rest[0])
  if (!flags.reason || flags.reason === 'true') fail('--reason is required')
  item.blocked = flags.reason
  logEvent(activity, `block ${item.id}`, flags.reason)
  print(activity, dir)
} else if (command === 'unblock') {
  const { activity, dir } = open()
  const item = findItem(activity, rest[0])
  delete item.blocked
  logEvent(activity, `unblock ${item.id}`)
  print(activity, dir)
} else if (command === 'replan') {
  const { activity, dir } = open()
  if (!flags.reason || flags.reason === 'true') fail('--reason is required: say why the plan changes')
  const plan = readPlan(flags.plan)
  const before = new Map(activity.items.map((item) => [item.id, item]))
  const verifiedBefore = derive(activity, root, dir).filter((view) => view.state === 'verified').map((view) => view.item.id)
  const next = prepare(plan.items || []).map((item) => ({ ...item, state: before.get(item.id)?.state, blocked: before.get(item.id)?.blocked, file: before.get(item.id)?.file ?? item.file }))
  const kept = new Set(next.map((item) => item.id))
  for (const item of next) if (!before.has(item.id)) logEvent(activity, `add ${item.id}`, flags.reason)
  for (const id of before.keys()) if (!kept.has(id)) logEvent(activity, `remove ${id}`, flags.reason)
  for (const id of verifiedBefore) {
    const item = next.find((entry) => entry.id === id)
    if (item && signature(item) !== signature(before.get(id)!)) logEvent(activity, `reopen ${id}`, flags.reason)
  }
  activity.items = next
  if (plan.goal) activity.goal = plan.goal
  logEvent(activity, 'replan', flags.reason)
  if (activity.status !== 'active') {
    activity.status = 'active'
    delete activity.reason
    activity.stops = 0
    activity.noProgress = 0
  }
  print(activity, dir)
} else if (command === 'split') {
  const { activity, dir } = open()
  const item = findItem(activity, rest[0])
  item.file ||= `${item.id}-${slugify(item.title)}.md`
  logEvent(activity, `split ${item.id}`)
  print(activity, dir)
} else if (command === 'resume') {
  if (!session) fail('--session <id> is required')
  const from = flags.from || session
  const found = load(root, from)
  if (!found) fail(`no activity for the session ${from}`)
  if (from !== session && load(root, session)?.activity.status === 'active') fail(`the session ${session} already has an active activity`)
  const { activity, dir } = found
  activity.session = session
  activity.status = 'active'
  delete activity.reason
  activity.stops = 0
  activity.noProgress = 0
  activity.lastSignature = ''
  activity.resumes++
  logEvent(activity, `resume (from session ${from})`)
  print(activity, dir)
} else if (command === 'link') {
  const { activity, dir } = open()
  const item = findItem(activity, rest[0])
  if (!rest[1]) fail('a card reference is required, for example jira:PROJ-12')
  activity.links[item.id] = rest[1]
  save(root, dir, activity)
  process.stdout.write(`${item.id} linked to ${rest[1]}\n`)
} else if (command === 'export') {
  if (flags.publish) fail('publishing cards needs an explicit request from the user, and this build only exports. Run export without --publish.')
  const { activity, dir } = open()
  const cards = activity.items.map((item, index) => ({
    key: `${activity.id}/${item.id}`,
    position: index + 1,
    itemId: item.id,
    title: `${index + 1}. ${item.title}`,
    link: activity.links[item.id] || null,
    description: [
      `Activity: ${activity.goal}`, `Position: ${index + 1} of ${activity.items.length}`, `ID: ${item.id}`, `Needs: ${item.needs.join(', ') || 'none'}`,
      `Do: ${item.do}`, `Observe: ${item.observe}`, `Accept: ${item.accept}`, `Verify: ${item.check.kind}${item.check.command ? ` \`${item.check.command}\`` : ''}`, `Key: ${activity.id}/${item.id}`,
    ].join('\n'),
  }))
  const output = { mode: 'dry-run', activity: activity.id, cards }
  fs.writeFileSync(path.join(dir, 'cards.json'), `${JSON.stringify(output, null, 2)}\n`)
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
} else if (command === 'goal-line') {
  const { activity, dir } = open()
  const { total } = progress(derive(activity, root, dir))
  process.stdout.write(`/goal the reply shows the line "ACTIVITY COMPLETE: ${activity.id}, ${total}/${total} verified" with the evidence of each item, or stop after 20 turns\n`)
} else {
  process.stderr.write(`${USAGE}\n`)
  process.exit(command ? 1 : 0)
}

