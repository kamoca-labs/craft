import { expectEqual, load, PACKAGE_JSON, type Task } from '../task.ts'

const SEED = `export type User = { email: string, password: string }
export type LoginResult = { ok: true } | { ok: false, reason: 'invalid' | 'locked' }

export function createLoginService(users: User[], now: () => number = Date.now) {
  return {
    login(email: string, password: string): LoginResult {
      const user = users.find((candidate) => candidate.email === email)
      if (!user || user.password !== password) return { ok: false, reason: 'invalid' }
      return { ok: true }
    },
  }
}
`

const GOOD = `export type User = { email: string, password: string }
export type LoginResult = { ok: true } | { ok: false, reason: 'invalid' | 'locked' }

const MAX_FAILURES = 5
const WINDOW_MS = 15 * 60_000

export function createLoginService(users: User[], now: () => number = Date.now) {
  const failures = new Map<string, number[]>()
  return {
    login(email: string, password: string): LoginResult {
      const recent = (failures.get(email) ?? []).filter((time) => now() - time < WINDOW_MS)
      failures.set(email, recent)
      if (recent.length >= MAX_FAILURES) return { ok: false, reason: 'locked' }
      const user = users.find((candidate) => candidate.email === email)
      if (!user || user.password !== password) {
        recent.push(now())
        return { ok: false, reason: 'invalid' }
      }
      failures.delete(email)
      return { ok: true }
    },
  }
}
`

const BAD = GOOD.replace('const failures = new Map<string, number[]>()', 'const failures = new Map<string, number[]>()\n  const key = (_email: string) => \'all\'')
  .replaceAll('failures.get(email)', 'failures.get(key(email))').replaceAll('failures.set(email', 'failures.set(key(email)').replaceAll('failures.delete(email)', 'failures.delete(key(email))')

const task: Task = {
  id: 'login-lockout',
  summary: 'lock an account after 5 failed logins in 15 minutes',
  prompt: "Ticket SEC-41: brute force attacks hit the login without any limit. After 5 failed attempts in 15 minutes, the account must be locked (login returns reason 'locked') until the 15 minutes pass.",
  seed: {
    'package.json': PACKAGE_JSON,
    'src/auth/login.ts': SEED,
    'tests/login.test.ts': `import assert from 'node:assert'
import { test } from 'node:test'
import { createLoginService } from '../src/auth/login.ts'

test('a wrong password is invalid', () => {
  const service = createLoginService([{ email: 'a@x.com', password: 'secret' }])
  assert.deepStrictEqual(service.login('a@x.com', 'nope'), { ok: false, reason: 'invalid' })
})
`,
  },
  good: { 'src/auth/login.ts': GOOD },
  bad: { 'src/auth/login.ts': BAD },
  async check(dir) {
    const failures: string[] = []
    const { createLoginService } = await load<{ createLoginService: (users: object[], now: () => number) => { login: (email: string, password: string) => { ok: boolean, reason?: string } } }>(dir, 'src/auth/login.ts')
    let clock = 1_000_000
    const service = createLoginService([{ email: 'a@x.com', password: 'secret' }, { email: 'b@x.com', password: 'pass' }], () => clock)
    for (let attempt = 0; attempt < 5; attempt++) service.login('a@x.com', 'wrong')
    expectEqual(failures, 'right password after 5 failures is locked', service.login('a@x.com', 'secret'), { ok: false, reason: 'locked' })
    expectEqual(failures, 'another account still logs in', service.login('b@x.com', 'pass'), { ok: true })
    clock += 15 * 60_000 + 1
    expectEqual(failures, 'after 15 minutes the account logs in again', service.login('a@x.com', 'secret'), { ok: true })
    const fresh = createLoginService([{ email: 'c@x.com', password: 'pw' }], () => clock)
    for (let attempt = 0; attempt < 4; attempt++) fresh.login('c@x.com', 'wrong')
    expectEqual(failures, '4 failures do not lock', fresh.login('c@x.com', 'pw'), { ok: true })
    return failures
  },
}

export default task
