import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED_DURATION = `const UNIT_MS: Record<string, number> = { h: 3_600_000, m: 60_000, s: 1000 }

export function parseDuration(text: string): number {
  const match = text.match(/(\\d+)([hms])$/)
  if (!match) throw new Error(\`invalid duration: \${text}\`)
  return Number(match[1]) * UNIT_MS[match[2]]
}
`

const SCHEDULER = `import { parseDuration } from '../lib/duration.ts'

export type Job = { name: string, every: string }

export function nextRun(job: Job, lastRun: Date): Date {
  return new Date(lastRun.getTime() + parseDuration(job.every))
}
`

const TIMEOUT = `import { parseDuration } from '../lib/duration.ts'

export function requestTimeoutMs(config: { timeout?: string }): number {
  return parseDuration(config.timeout ?? '30s')
}
`

const GOOD_DURATION = `const UNIT_MS: Record<string, number> = { h: 3_600_000, m: 60_000, s: 1000 }

export function parseDuration(text: string): number {
  if (!/^(\\d+[hms])+$/.test(text)) throw new Error(\`invalid duration: \${text}\`)
  return [...text.matchAll(/(\\d+)([hms])/g)].reduce((total, [, value, unit]) => total + Number(value) * UNIT_MS[unit], 0)
}
`

const task: Task = {
  id: 'duration-callers',
  summary: 'fix the shared duration parser, not only the caller in the ticket',
  prompt: "Ticket OPS-88: a job configured with every: '1h30m' runs every 30 minutes instead of every 90 minutes. Fix it.",
  seed: {
    'package.json': PACKAGE_JSON,
    'src/lib/duration.ts': SEED_DURATION,
    'src/jobs/scheduler.ts': SCHEDULER,
    'src/http/timeout.ts': TIMEOUT,
    'tests/scheduler.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { nextRun } from '../src/jobs/scheduler.ts'

test('a job every 15 minutes runs 15 minutes after the last run', () => {
  const last = new Date('2026-01-01T10:00:00Z')
  assert.strictEqual(nextRun({ name: 'sync', every: '15m' }, last).toISOString(), '2026-01-01T10:15:00.000Z')
})
`,
  },
  good: { 'src/lib/duration.ts': GOOD_DURATION },
  bad: {
    'src/jobs/scheduler.ts': SCHEDULER.replace('parseDuration(job.every)', "job.every.split(/(?<=[hms])/).reduce((total, part) => total + parseDuration(part), 0)"),
  },
  async check(dir) {
    const failures: string[] = []
    const { nextRun } = await load<{ nextRun: (job: object, last: Date) => Date }>(dir, 'src/jobs/scheduler.ts')
    const { requestTimeoutMs } = await load<{ requestTimeoutMs: (config: object) => number }>(dir, 'src/http/timeout.ts')
    const last = new Date('2026-01-01T10:00:00Z')
    expectEqual(failures, "job every '1h30m'", nextRun({ name: 'a', every: '1h30m' }, last).toISOString(), '2026-01-01T11:30:00.000Z')
    expectEqual(failures, "job every '2h'", nextRun({ name: 'a', every: '2h' }, last).toISOString(), '2026-01-01T12:00:00.000Z')
    expectEqual(failures, "the other caller: timeout '1m30s'", requestTimeoutMs({ timeout: '1m30s' }), 90_000)
    expectEqual(failures, 'the other caller: default timeout', requestTimeoutMs({}), 30_000)
    return failures
  },
}

export default task
